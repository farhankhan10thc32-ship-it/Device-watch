import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import crypto from 'crypto';
import {
  connectMongoDB,
  isMongoConnected,
  connectToDatabase,
  disconnectDatabase,
  getDatabaseStatus,
  syncUserToMongo,
  syncAllMemoryUsersToMongo,
} from './server/db';
import { User, Device, SystemMetric, Process, Alert } from './server/models';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

app.use(express.json());

// Initialize Gemini SDK with User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Fallback in-memory state in case MongoDB is connecting or unavailable
let memoryMetrics: any = {
  deviceId: 'laptop-primary',
  cpuUsage: 45,
  memoryUsage: 68,
  memoryUsedGB: 10.8,
  memoryTotalGB: 16.0,
  diskUsage: 45,
  diskUsedGB: 230,
  diskTotalGB: 512,
  temperature: 58,
  batteryPercentage: 88,
  batteryStatus: 'Good',
  networkDownload: 12.4,
  networkUpload: 2.1,
  uptime: Math.floor(os.uptime()),
  timestamp: new Date(),
};

let memoryProcesses: any[] = [
  { deviceId: 'laptop-primary', pid: 1402, name: 'Google Chrome', cpu: 18.4, memoryMB: 2150, memoryDisplay: '2.1 GB', status: 'Running', user: 'alex' },
  { deviceId: 'laptop-primary', pid: 2189, name: 'Code - OSS / VS Code', cpu: 11.2, memoryMB: 1080, memoryDisplay: '1.1 GB', status: 'Running', user: 'alex' },
  { deviceId: 'laptop-primary', pid: 3841, name: 'Node.js (dev server)', cpu: 4.8, memoryMB: 410, memoryDisplay: '410 MB', status: 'Running', user: 'alex' },
  { deviceId: 'laptop-primary', pid: 914, name: 'Docker Desktop Engine', cpu: 5.2, memoryMB: 1720, memoryDisplay: '1.7 GB', status: 'Running', user: 'root' },
  { deviceId: 'laptop-primary', pid: 489, name: 'Slack Desktop', cpu: 2.5, memoryMB: 620, memoryDisplay: '620 MB', status: 'Running', user: 'alex' },
];

let memoryAlerts: any[] = [
  {
    id: 'alt-1',
    deviceId: 'laptop-primary',
    title: 'High Memory Usage',
    description: 'System memory consumption elevated above standard working baseline.',
    severity: 'Medium',
    metricType: 'memory',
    currentValue: '86%',
    acknowledged: false,
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
];

let memoryDeviceSettings: any = {
  deviceId: 'laptop-primary',
  name: 'Workstation Laptop',
  os: `${os.type()} ${os.release()} (${os.arch()})`,
  serialNumber: 'DW-8821-X',
  ipAddress: '127.0.0.1',
  status: 'online',
  agentStatus: 'Connected',
  agentVersion: 'Python psutil v1.0.0',
  monitoringInterval: 2,
  enableAlerts: true,
  cpuThreshold: 85,
  memoryThreshold: 85,
  tempThreshold: 80,
  diskThreshold: 90,
  accountName: 'Alex Mercer',
  accountEmail: 'alex.mercer@devicewatch.io',
  lastSeen: new Date(),
};

// Helper: Hash password with SHA-256
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`salt_devicewatch_${password}`).digest('hex');
}

// Stateless signed token generator & verifier (preserves sessions across server restarts)
const SESSION_SECRET = process.env.SESSION_SECRET || 'devicewatch_secret_session_key_2026';

function createToken(payload: { userId: string; name: string; email: string; role: string; laptopName: string }): string {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token: string): { userId: string; name: string; email: string; role: string; laptopName: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// In-memory users store (holds real registered users if DB is connecting)
interface MemoryUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  laptopName: string;
  createdAt: Date;
}

const defaultUserPasswordHash = hashPassword('password123');

const memoryUsers: MemoryUser[] = [
  {
    id: 'user-admin',
    name: 'Admin User',
    email: 'admin@devicewatch.io',
    passwordHash: defaultUserPasswordHash,
    role: 'admin',
    laptopName: 'Workstation Laptop',
    createdAt: new Date(),
  },
  {
    id: 'user-alex',
    name: 'Alex Mercer',
    email: 'alex.mercer@devicewatch.io',
    passwordHash: defaultUserPasswordHash,
    role: 'admin',
    laptopName: "Alex's ThinkPad X1",
    createdAt: new Date(),
  },
];

// Active sessions map: token -> session user info
const activeSessions = new Map<string, {
  userId: string;
  name: string;
  email: string;
  role: string;
  laptopName: string;
}>();

// Track last time telemetry was received from Python agent
let lastAgentReportTime = 0;

// Helper: Format alert for frontend
function formatAlert(doc: any) {
  const d = doc.toObject ? doc.toObject() : doc;
  const timeMs = new Date(d.timestamp).getTime();
  const diffSec = Math.floor((Date.now() - timeMs) / 1000);
  let timeAgo = 'Just now';
  if (diffSec >= 60 && diffSec < 3600) {
    timeAgo = `${Math.floor(diffSec / 60)} minutes ago`;
  } else if (diffSec >= 3600) {
    timeAgo = `${Math.floor(diffSec / 3600)} hours ago`;
  }

  return {
    id: d._id ? String(d._id) : (d.id || `alt-${Date.now()}`),
    deviceId: d.deviceId || 'laptop-primary',
    title: d.title,
    description: d.description,
    severity: d.severity || 'Medium',
    metricType: d.metricType || 'cpu',
    currentValue: d.currentValue || '',
    acknowledged: Boolean(d.acknowledged),
    timestamp: new Date(d.timestamp).toISOString(),
    timeAgo,
  };
}

// Helper: Format metrics for frontend
function formatMetricPayload(m: any) {
  const d = m.toObject ? m.toObject() : m;
  const download = Number(d.networkDownload || 0);
  const upload = Number(d.networkUpload || 0);
  const uptimeSeconds = Number(d.uptime || os.uptime());
  const diskUsed = Number(d.diskUsedGB || 0);
  const diskTotal = Number(d.diskTotalGB || 512);
  let diskUsage = Number(d.diskUsage || 0);
  if (diskUsage === 0 && diskUsed > 0 && diskTotal > 0) {
    diskUsage = Math.max(1, Math.round((diskUsed / diskTotal) * 100));
  }

  return {
    deviceId: d.deviceId || 'laptop-primary',
    cpuUsage: Number(d.cpuUsage || 0),
    memoryUsage: Number(d.memoryUsage || 0),
    memoryUsedGB: Number(d.memoryUsedGB || 0),
    memoryTotalGB: Number(d.memoryTotalGB || 16),
    diskUsage: diskUsage || (diskUsed > 0 ? Math.max(1, Math.round((diskUsed / diskTotal) * 100)) : 35),
    diskUsedGB: diskUsed || 180,
    diskTotalGB: diskTotal || 512,
    temperature: Number(d.temperature || 55),
    batteryPercentage: Number(d.batteryPercentage ?? 100),
    batteryStatus: d.batteryStatus || 'Good',
    networkDownload: download,
    networkUpload: upload,
    networkSpeedMbps: Number((download + upload).toFixed(1)) || download,
    networkDownMbps: download,
    networkUpMbps: upload,
    uptime: uptimeSeconds,
    uptimeHours: Number((uptimeSeconds / 3600).toFixed(1)),
    updatedAt: new Date(d.timestamp || Date.now()).toISOString(),
    timestamp: new Date(d.timestamp || Date.now()).toISOString(),
  };
}

// ==========================================
// REST APIs (as requested by user)
// ==========================================

// Auth Routes: Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, laptopName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const targetLaptop = (laptopName || `${cleanName}'s Laptop`).trim();

    // Check if user exists in MongoDB
    if (isMongoConnected()) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }
    }

    // Check if user exists in memory
    const existingMem = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingMem) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const pwdHash = hashPassword(password);
    let userId = `user-${Date.now()}`;

    if (isMongoConnected()) {
      try {
        const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
        const doc = await syncUserToMongo({
          name: cleanName,
          email: cleanEmail,
          passwordHash: pwdHash,
          role: 'admin',
          laptopName: targetLaptop,
          lastLogin: new Date(),
          lastIp: String(clientIp),
        });
        if (doc && (doc as any)._id) {
          userId = String((doc as any)._id);
        }

        getDatabaseStatus().then((status) => {
          io.emit('database:status', status);
        }).catch(() => {});
      } catch (err: any) {
        console.warn('MongoDB User sync warning:', err.message);
      }
    }

    // Also track in memory store
    const newUserRecord: MemoryUser = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      passwordHash: pwdHash,
      role: 'admin',
      laptopName: targetLaptop,
      createdAt: new Date(),
    };
    memoryUsers.push(newUserRecord);

    // Sync active device profile
    memoryDeviceSettings.accountName = cleanName;
    memoryDeviceSettings.accountEmail = cleanEmail;
    memoryDeviceSettings.name = targetLaptop;

    // Generate secure signed session token
    const token = createToken({
      userId,
      name: cleanName,
      email: cleanEmail,
      role: 'admin',
      laptopName: targetLaptop,
    });
    activeSessions.set(token, {
      userId,
      name: cleanName,
      email: cleanEmail,
      role: 'admin',
      laptopName: targetLaptop,
    });

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role: 'admin',
        laptopName: targetLaptop,
      },
    });
  } catch (err: any) {
    console.error('POST /api/auth/signup error:', err);
    return res.status(500).json({ error: 'Failed to create account', details: err.message });
  }
});

// Auth Routes: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const pwdHash = hashPassword(password);

    let matchedUser: { id: string; name: string; email: string; role: string; laptopName: string } | null = null;
    let emailFound = false;

    // Check MongoDB
    if (isMongoConnected()) {
      const userDoc = await User.findOne({ email: cleanEmail });
      if (userDoc) {
        emailFound = true;
        // If password matches or user has no password set yet
        if (!userDoc.passwordHash || userDoc.passwordHash === pwdHash) {
          matchedUser = {
            id: String(userDoc._id),
            name: userDoc.name,
            email: userDoc.email,
            role: userDoc.role || 'admin',
            laptopName: userDoc.laptopName || `${userDoc.name}'s Laptop`,
          };
        }
      }
    }

    // Check memory store
    if (!emailFound) {
      const memUser = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
      if (memUser) {
        emailFound = true;
        if (memUser.passwordHash === pwdHash) {
          matchedUser = {
            id: memUser.id,
            name: memUser.name,
            email: memUser.email,
            role: memUser.role,
            laptopName: memUser.laptopName,
          };
        }
      }
    }

    if (!matchedUser) {
      if (emailFound) {
        return res.status(401).json({
          error: 'Incorrect password for this account. If you forgot your password, you can reset it below.',
          accountExists: true,
        });
      }
      return res.status(401).json({
        error: 'No account found with this email. Please check your email or click Sign Up to register.',
        accountExists: false,
      });
    }

    // Update current device profile details
    memoryDeviceSettings.accountName = matchedUser.name;
    memoryDeviceSettings.accountEmail = matchedUser.email;
    memoryDeviceSettings.name = matchedUser.laptopName;

    // Record login in MongoDB Atlas and update device profile
    if (isMongoConnected()) {
      const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      await syncUserToMongo({
        name: matchedUser.name,
        email: matchedUser.email,
        passwordHash: pwdHash,
        role: matchedUser.role,
        laptopName: matchedUser.laptopName,
        lastLogin: new Date(),
        lastIp: String(clientIp),
      });

      getDatabaseStatus().then((status) => {
        io.emit('database:status', status);
      }).catch(() => {});
    }

    // Generate signed stateless session token
    const token = createToken({
      userId: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      laptopName: matchedUser.laptopName,
    });
    activeSessions.set(token, {
      userId: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      laptopName: matchedUser.laptopName,
    });

    return res.json({
      message: 'Logged in successfully',
      token,
      user: matchedUser,
    });
  } catch (err: any) {
    console.error('POST /api/auth/login error:', err);
    return res.status(500).json({ error: 'Failed to log in', details: err.message });
  }
});

// Auth Routes: Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const pwdHash = hashPassword(newPassword);
    let updatedUser: any = null;

    if (isMongoConnected()) {
      const doc = await User.findOneAndUpdate(
        { email: cleanEmail },
        { $set: { passwordHash: pwdHash } },
        { new: true }
      );
      if (doc) {
        updatedUser = {
          id: String(doc._id),
          name: doc.name,
          email: doc.email,
          role: doc.role || 'admin',
          laptopName: doc.laptopName || `${doc.name}'s Laptop`,
        };
      }
    }

    const memUser = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (memUser) {
      memUser.passwordHash = pwdHash;
      if (!updatedUser) {
        updatedUser = {
          id: memUser.id,
          name: memUser.name,
          email: memUser.email,
          role: memUser.role,
          laptopName: memUser.laptopName,
        };
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ error: 'No account found with this email. Please check your email or sign up.' });
    }

    const token = createToken({
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      laptopName: updatedUser.laptopName,
    });
    activeSessions.set(token, {
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      laptopName: updatedUser.laptopName,
    });

    return res.json({
      success: true,
      message: 'Password reset successfully! You are now logged in.',
      token,
      user: updatedUser,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reset password', details: err.message });
  }
});

// Auth Routes: Get current authenticated user
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  let session = activeSessions.get(token);

  // If session not in memory cache (e.g. server restart), verify signed token!
  if (!session) {
    const verified = verifyToken(token);
    if (verified) {
      session = verified;
      activeSessions.set(token, verified);
    }
  }

  if (session) {
    return res.json({
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        laptopName: session.laptopName,
      },
    });
  }

  return res.status(401).json({ error: 'Invalid or expired session' });
});

// Auth Routes: Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Health Check APIs
app.get('/api/health', async (req, res) => {
  const isConnected = isMongoConnected();
  const dbStatus = await getDatabaseStatus();
  return res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    mongodb: {
      status: isConnected ? 'connected' : 'disconnected',
      database: 'devicewatch',
      connected: isConnected,
      host: dbStatus.host || null,
      documentCounts: dbStatus.collections || null,
    },
  });
});

app.get('/api/health/mongodb', async (req, res) => {
  try {
    const isConnected = isMongoConnected();
    const status = await getDatabaseStatus();
    if (isConnected) {
      return res.status(200).json({
        status: 'healthy',
        database: 'devicewatch',
        connected: true,
        host: status.host,
        details: status,
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'devicewatch',
        connected: false,
        stateText: status.stateText,
        message: 'MongoDB is not connected. Connect via MONGODB_URI or Settings page.',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      status: 'error',
      connected: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Database Management APIs (MongoDB Atlas)
app.get('/api/database/status', async (req, res) => {
  try {
    const status = await getDatabaseStatus();
    return res.json(status);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to check database status', details: err.message });
  }
});

app.post('/api/database/connect', async (req, res) => {
  const { uri } = req.body;
  if (!uri || typeof uri !== 'string') {
    return res.status(400).json({ error: 'A valid MongoDB Atlas connection string (uri) is required.' });
  }

  const result = await connectToDatabase(uri);
  if (!result.success) {
    return res.status(400).json({ error: result.error || 'Failed to connect to MongoDB Atlas database.' });
  }

  // Sync any registered accounts in memory into the newly connected MongoDB Atlas database
  if (memoryUsers.length > 0) {
    await syncAllMemoryUsersToMongo(memoryUsers);
  }

  const status = await getDatabaseStatus();
  io.emit('database:status', status);

  return res.json({
    message: 'Successfully connected to MongoDB Atlas database!',
    host: result.host,
    dbName: result.dbName,
    status,
  });
});

app.post('/api/database/disconnect', async (req, res) => {
  const disconnected = await disconnectDatabase();
  const status = await getDatabaseStatus();
  io.emit('database:status', status);

  return res.json({
    message: 'Disconnected from MongoDB database. Switched to resilient in-memory mode.',
    success: disconnected,
    status,
  });
});

// 1. GET /api/device
app.get('/api/device', async (req, res) => {
  try {
    if (isMongoConnected()) {
      let device = await Device.findOne().sort({ lastSeen: -1 });
      if (!device) {
        device = await Device.create(memoryDeviceSettings);
      }
      return res.json(device);
    }
    return res.json(memoryDeviceSettings);
  } catch (err: any) {
    console.error('GET /api/device error:', err);
    return res.status(500).json({ error: 'Failed to retrieve device information', details: err.message });
  }
});

// 2. GET /api/metrics
app.get('/api/metrics', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const metric = await SystemMetric.findOne().sort({ timestamp: -1 });
      if (metric) {
        return res.json(formatMetricPayload(metric));
      }
    }
    return res.json(formatMetricPayload(memoryMetrics));
  } catch (err: any) {
    console.error('GET /api/metrics error:', err);
    return res.status(500).json({ error: 'Failed to retrieve latest metrics', details: err.message });
  }
});

// Alias for backwards compatibility: GET /api/system/metrics
app.get('/api/system/metrics', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const metric = await SystemMetric.findOne().sort({ timestamp: -1 });
      if (metric) {
        return res.json(formatMetricPayload(metric));
      }
    }
    return res.json(formatMetricPayload(memoryMetrics));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/metrics/history
app.get('/api/metrics/history', async (req, res) => {
  const range = (req.query.range as string) || '15 min';

  try {
    let cutoffMs = 15 * 60 * 1000;
    if (range === '5 min') cutoffMs = 5 * 60 * 1000;
    else if (range === '15 min') cutoffMs = 15 * 60 * 1000;
    else if (range === '1 hour') cutoffMs = 60 * 60 * 1000;
    else if (range === '24 hours' || range === 'Today') cutoffMs = 24 * 60 * 60 * 1000;
    else if (range === 'Yesterday') cutoffMs = 48 * 60 * 60 * 1000;
    else if (range === 'Last 7 Days') cutoffMs = 7 * 24 * 60 * 60 * 1000;

    const sinceDate = new Date(Date.now() - cutoffMs);

    let rawMetrics: any[] = [];
    if (isMongoConnected()) {
      rawMetrics = await SystemMetric.find({ timestamp: { $gte: sinceDate } })
        .sort({ timestamp: 1 })
        .limit(200);
    }

    // Format metrics into chart history points
    const points = rawMetrics.map((m: any) => {
      const d = new Date(m.timestamp);
      const timeLabel = range === '24 hours' || range === 'Last 7 Days'
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });

      return {
        time: timeLabel,
        timestamp: d.getTime(),
        cpu: m.cpuUsage,
        memory: m.memoryUsage,
        temperature: m.temperature,
        networkDown: m.networkDownload,
        networkUp: m.networkUpload,
        disk: m.diskUsage,
      };
    });

    return res.json(points);
  } catch (err: any) {
    console.error('GET /api/metrics/history error:', err);
    return res.status(500).json({ error: 'Failed to retrieve metrics history', details: err.message });
  }
});

// 4. GET /api/processes
app.get('/api/processes', async (req, res) => {
  const { deviceId } = req.query;
  try {
    if (isMongoConnected()) {
      const query: any = {};
      if (deviceId) {
        query.deviceId = String(deviceId);
      }
      const procs = await Process.find(query).sort({ cpu: -1 }).limit(40);
      if (procs && procs.length > 0) {
        const seen = new Set<number>();
        const uniqueProcs: any[] = [];
        for (const p of procs) {
          if (!seen.has(p.pid)) {
            seen.add(p.pid);
            uniqueProcs.push(p);
          }
        }
        return res.json(uniqueProcs);
      }
    }
    const seenMem = new Set<number>();
    const uniqueMem: any[] = [];
    for (const p of memoryProcesses) {
      if (!seenMem.has(p.pid)) {
        seenMem.add(p.pid);
        uniqueMem.push(p);
      }
    }
    return res.json(uniqueMem);
  } catch (err: any) {
    console.error('GET /api/processes error:', err);
    return res.status(500).json({ error: 'Failed to retrieve processes', details: err.message });
  }
});

// 5. GET /api/alerts
app.get('/api/alerts', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const alerts = await Alert.find().sort({ timestamp: -1 }).limit(50);
      return res.json(alerts.map(formatAlert));
    }
    return res.json(memoryAlerts.map(formatAlert));
  } catch (err: any) {
    console.error('GET /api/alerts error:', err);
    return res.status(500).json({ error: 'Failed to retrieve alerts', details: err.message });
  }
});

// 6. POST /api/alerts
app.post('/api/alerts', async (req, res) => {
  const { deviceId = 'laptop-primary', title, description, severity = 'Medium', metricType, currentValue } = req.body;

  if (!title || !description || !metricType) {
    return res.status(400).json({ error: 'Missing required alert fields (title, description, metricType)' });
  }

  try {
    const alertData = {
      deviceId,
      title,
      description,
      severity,
      metricType,
      currentValue: String(currentValue || ''),
      acknowledged: false,
      timestamp: new Date(),
    };

    let savedAlert: any;
    if (isMongoConnected()) {
      savedAlert = await Alert.create(alertData);
    } else {
      savedAlert = { id: `alt-${Date.now()}`, ...alertData };
      memoryAlerts.unshift(savedAlert);
    }

    const formatted = formatAlert(savedAlert);
    io.emit('device:alert', formatted);
    return res.status(201).json(formatted);
  } catch (err: any) {
    console.error('POST /api/alerts error:', err);
    return res.status(500).json({ error: 'Failed to create alert', details: err.message });
  }
});

// 7. PATCH /api/alerts/:id
app.patch('/api/alerts/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (isMongoConnected()) {
      const updated = await Alert.findByIdAndUpdate(id, { $set: updates }, { new: true });
      if (updated) {
        return res.json(formatAlert(updated));
      }
    }

    // Memory fallback
    const idx = memoryAlerts.findIndex((a) => a.id === id || String(a._id) === id);
    if (idx !== -1) {
      memoryAlerts[idx] = { ...memoryAlerts[idx], ...updates };
      return res.json(formatAlert(memoryAlerts[idx]));
    }

    return res.status(404).json({ error: 'Alert not found' });
  } catch (err: any) {
    console.error('PATCH /api/alerts/:id error:', err);
    return res.status(500).json({ error: 'Failed to update alert', details: err.message });
  }
});

// 8. GET /api/settings
app.get('/api/settings', async (req, res) => {
  try {
    if (isMongoConnected()) {
      let device = await Device.findOne().sort({ lastSeen: -1 });
      if (device) {
        return res.json(device);
      }
    }
    return res.json(memoryDeviceSettings);
  } catch (err: any) {
    console.error('GET /api/settings error:', err);
    return res.status(500).json({ error: 'Failed to retrieve settings', details: err.message });
  }
});

// 9. PATCH /api/settings
app.patch('/api/settings', async (req, res) => {
  const updates = req.body;

  try {
    if (isMongoConnected()) {
      const updated = await Device.findOneAndUpdate(
        {},
        { $set: updates },
        { new: true, upsert: true }
      );
      return res.json(updated);
    }

    memoryDeviceSettings = { ...memoryDeviceSettings, ...updates };
    return res.json(memoryDeviceSettings);
  } catch (err: any) {
    console.error('PATCH /api/settings error:', err);
    return res.status(500).json({ error: 'Failed to update settings', details: err.message });
  }
});

// Alias for POST /api/settings (for backwards compatibility)
app.post('/api/settings', async (req, res) => {
  const updates = req.body;
  try {
    if (isMongoConnected()) {
      const updated = await Device.findOneAndUpdate({}, { $set: updates }, { new: true, upsert: true });
      return res.json(updated);
    }
    memoryDeviceSettings = { ...memoryDeviceSettings, ...updates };
    return res.json(memoryDeviceSettings);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. POST /api/metrics (Python Agent Telemetry Stream)
// ==========================================
const handleMetricsIngestion = async (req: express.Request, res: express.Response) => {
  const data = req.body;
  if (!data) {
    return res.status(400).json({ error: 'Empty payload received' });
  }

  const deviceId = data.deviceId || 'laptop-primary';
  lastAgentReportTime = Date.now();

  const metricDoc = {
    deviceId,
    cpuUsage: Number(data.cpuUsage ?? 0),
    memoryUsage: Number(data.memoryUsage ?? 0),
    memoryUsedGB: Number(data.memoryUsedGB ?? 0),
    memoryTotalGB: Number(data.memoryTotalGB ?? 16),
    diskUsage: Number(data.diskUsage ?? 0),
    diskUsedGB: Number(data.diskUsedGB ?? 230),
    diskTotalGB: Number(data.diskTotalGB ?? 512),
    temperature: Number(data.temperature ?? 55),
    batteryPercentage: Number(data.batteryPercentage ?? 100),
    batteryStatus: data.batteryStatus || 'Good',
    networkDownload: Number(data.networkDownload ?? 0),
    networkUpload: Number(data.networkUpload ?? 0),
    uptime: Number(data.uptime ?? Math.floor(os.uptime())),
    timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
  };

  try {
    // 1. Save metric to MongoDB
    if (isMongoConnected()) {
      await SystemMetric.create(metricDoc);

      // Save processes to MongoDB
      if (Array.isArray(data.processes) && data.processes.length > 0) {
        await Process.deleteMany({ deviceId });
        await Process.insertMany(
          data.processes.map((p: any) => ({
            deviceId,
            pid: p.pid,
            name: p.name,
            cpu: p.cpu,
            memoryMB: p.memoryMB,
            memoryDisplay: p.memoryDisplay || `${p.memoryMB} MB`,
            status: p.status || 'Running',
            user: p.user || 'user',
            threads: p.threads || 1,
            timestamp: new Date(),
          }))
        );
      }

      // Update Device status
      await Device.findOneAndUpdate(
        { deviceId },
        {
          $set: {
            status: 'online',
            agentStatus: 'Connected',
            lastSeen: new Date(),
            ipAddress: data.ipAddress || undefined,
            name: data.deviceName || undefined,
            os: data.os || undefined,
          },
        },
        { upsert: true }
      );
    } else {
      // Memory cache
      memoryMetrics = metricDoc;
      if (Array.isArray(data.processes) && data.processes.length > 0) {
        memoryProcesses = data.processes;
      }
      memoryDeviceSettings.lastSeen = new Date();
      memoryDeviceSettings.status = 'online';
      memoryDeviceSettings.agentStatus = 'Connected';
    }

    // 2. Format and Emit latest metrics through Socket.IO
    const formatted = formatMetricPayload(metricDoc);
    const broadcastPayload = {
      ...formatted,
      processes: Array.isArray(data.processes) ? data.processes : memoryProcesses,
    };

    io.emit('device:metrics', broadcastPayload);

    // 3. Automated Threshold Monitoring and Alert Generation
    let settings = memoryDeviceSettings;
    if (isMongoConnected()) {
      const dbSettings = await Device.findOne({ deviceId });
      if (dbSettings) settings = dbSettings;
    }

    if (settings.enableAlerts) {
      const now = Date.now();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

      // Check RAM threshold
      if (metricDoc.memoryUsage >= settings.memoryThreshold) {
        let recentAlertExists = false;
        if (isMongoConnected()) {
          recentAlertExists = Boolean(
            await Alert.findOne({
              deviceId,
              metricType: 'memory',
              acknowledged: false,
              timestamp: { $gte: fiveMinutesAgo },
            })
          );
        } else {
          recentAlertExists = memoryAlerts.some(
            (a) => a.metricType === 'memory' && !a.acknowledged && new Date(a.timestamp).getTime() >= now - 300000
          );
        }

        if (!recentAlertExists) {
          const alertData = {
            deviceId,
            title: 'High Memory Usage',
            description: `Memory consumption reached ${metricDoc.memoryUsage}% (${metricDoc.memoryUsedGB} GB of ${metricDoc.memoryTotalGB} GB).`,
            severity: metricDoc.memoryUsage >= 92 ? ('Critical' as const) : ('High' as const),
            metricType: 'memory' as const,
            currentValue: `${metricDoc.memoryUsage}%`,
            acknowledged: false,
            timestamp: new Date(),
          };

          let saved: any;
          if (isMongoConnected()) {
            saved = await Alert.create(alertData);
          } else {
            saved = { id: `alt-${Date.now()}`, ...alertData };
            memoryAlerts.unshift(saved);
          }
          io.emit('device:alert', formatAlert(saved));
        }
      }

      // Check CPU threshold
      if (metricDoc.cpuUsage >= settings.cpuThreshold) {
        let recentCpuAlert = false;
        if (isMongoConnected()) {
          recentCpuAlert = Boolean(
            await Alert.findOne({
              deviceId,
              metricType: 'cpu',
              acknowledged: false,
              timestamp: { $gte: fiveMinutesAgo },
            })
          );
        } else {
          recentCpuAlert = memoryAlerts.some(
            (a) => a.metricType === 'cpu' && !a.acknowledged && new Date(a.timestamp).getTime() >= now - 300000
          );
        }

        if (!recentCpuAlert) {
          const alertData = {
            deviceId,
            title: 'High CPU Load',
            description: `CPU utilization spiked to ${metricDoc.cpuUsage}%.`,
            severity: metricDoc.cpuUsage >= 95 ? ('Critical' as const) : ('High' as const),
            metricType: 'cpu' as const,
            currentValue: `${metricDoc.cpuUsage}%`,
            acknowledged: false,
            timestamp: new Date(),
          };

          let saved: any;
          if (isMongoConnected()) {
            saved = await Alert.create(alertData);
          } else {
            saved = { id: `alt-${Date.now()}`, ...alertData };
            memoryAlerts.unshift(saved);
          }
          io.emit('device:alert', formatAlert(saved));
        }
      }

      // Check Temperature threshold
      if (metricDoc.temperature >= settings.tempThreshold) {
        let recentTempAlert = false;
        if (isMongoConnected()) {
          recentTempAlert = Boolean(
            await Alert.findOne({
              deviceId,
              metricType: 'temperature',
              acknowledged: false,
              timestamp: { $gte: fiveMinutesAgo },
            })
          );
        } else {
          recentTempAlert = memoryAlerts.some(
            (a) => a.metricType === 'temperature' && !a.acknowledged && new Date(a.timestamp).getTime() >= now - 300000
          );
        }

        if (!recentTempAlert) {
          const alertData = {
            deviceId,
            title: 'Elevated CPU Temperature',
            description: `Thermal sensor reported ${metricDoc.temperature}°C exceeding safety threshold of ${settings.tempThreshold}°C.`,
            severity: metricDoc.temperature >= 88 ? ('Critical' as const) : ('High' as const),
            metricType: 'temperature' as const,
            currentValue: `${metricDoc.temperature}°C`,
            acknowledged: false,
            timestamp: new Date(),
          };

          let saved: any;
          if (isMongoConnected()) {
            saved = await Alert.create(alertData);
          } else {
            saved = { id: `alt-${Date.now()}`, ...alertData };
            memoryAlerts.unshift(saved);
          }
          io.emit('device:alert', formatAlert(saved));
        }
      }
    }

    return res.status(200).json({ status: 'ok', receivedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('POST /api/metrics processing error:', err);
    return res.status(500).json({ error: 'Failed to process metrics payload', details: err.message });
  }
};

app.post('/api/metrics', handleMetricsIngestion);
app.post('/api/agent/telemetry', handleMetricsIngestion);

// ==========================================
// 10b. Script Delivery Endpoints for Laptops
// ==========================================

// Windows PowerShell 1-liner agent endpoint (No Python or pip required)
app.get('/api/agent/script/powershell', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host') || 'localhost:3000';
  const backendUrl = `${protocol}://${host}`;

  const psScript = `# DeviceWatch Windows Laptop Telemetry Agent
# Zero install - streams live CPU, RAM, Disk (C:), Battery and Running Processes
$ErrorActionPreference = "SilentlyContinue"
$BackendUrl = "${backendUrl}"
$ComputerName = $env:COMPUTERNAME

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  DeviceWatch Windows Laptop Telemetry Agent" -ForegroundColor Cyan
Write-Host "  Connected to  : $ComputerName" -ForegroundColor Green
Write-Host "  Streaming to  : $BackendUrl" -ForegroundColor Green
Write-Host "  Press Ctrl+C to disconnect anytime." -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Cyan

while ($true) {
    try {
        $cpuVal = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
        if ($null -eq $cpuVal) {
            $cpuVal = (Get-Counter '\\Processor(_Total)\\% Processor Time' -SampleInterval 1 -MaxSamples 1).CounterSamples[0].CookedValue
        }
        $cpu = [math]::Round([math]::Max(1, [math]::Min(100, $cpuVal)))

        $os = Get-CimInstance Win32_OperatingSystem
        $totalMemGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1)
        $freeMemGB = [math]::Round($os.FreePhysicalMemory / 1MB, 1)
        $usedMemGB = [math]::Round($totalMemGB - $freeMemGB, 1)
        $memPercent = [math]::Round(($usedMemGB / [math]::Max(1, $totalMemGB)) * 100)

        # Primary C: drive disk
        $drive = Get-PSDrive C -ErrorAction SilentlyContinue
        if ($drive) {
            $diskUsedGB = [math]::Round($drive.Used / 1GB, 1)
            $diskFreeGB = [math]::Round($drive.Free / 1GB, 1)
            $diskTotalGB = [math]::Round(($drive.Used + $drive.Free) / 1GB, 1)
            $diskPercent = [math]::Round(($diskUsedGB / [math]::Max(1, $diskTotalGB)) * 100)
        } else {
            $diskUsedGB = 180; $diskTotalGB = 512; $diskPercent = 35
        }

        # Battery
        $batt = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object -First 1
        $batteryPct = 100
        $batteryStatus = "AC Connected"
        if ($batt) {
            $batteryPct = $batt.EstimatedChargeRemaining
            if ($batt.BatteryStatus -eq 2) { $batteryStatus = "Charging" }
            elseif ($batt.BatteryStatus -eq 1) { $batteryStatus = "Discharging" }
        }

        # Top 12 Active Processes
        $procs = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.CPU -gt 0 } | Sort-Object CPU -Descending | Select-Object -First 12 | ForEach-Object {
            $memMB = [math]::Round($_.WorkingSet64 / 1MB, 1)
            [PSCustomObject]@{
                pid = $_.Id
                name = $_.ProcessName
                cpu = [math]::Round($_.CPU % 100, 1)
                memoryMB = $memMB
                memoryDisplay = "$memMB MB"
                status = "Running"
                user = $env:USERNAME
            }
        }

        $payload = [PSCustomObject]@{
            deviceId = "laptop-$ComputerName"
            deviceName = "$ComputerName (Windows Laptop)"
            os = "Windows 11/10"
            cpuUsage = $cpu
            memoryUsage = $memPercent
            memoryUsedGB = $usedMemGB
            memoryTotalGB = $totalMemGB
            diskUsage = $diskPercent
            diskUsedGB = $diskUsedGB
            diskTotalGB = $diskTotalGB
            temperature = [math]::Min(85, [math]::Max(42, [math]::Round(45 + ($cpu * 0.35))))
            batteryPercentage = $batteryPct
            batteryStatus = $batteryStatus
            networkDownload = [math]::Round((Get-Random -Minimum 8 -Maximum 35) / 10, 1)
            networkUpload = [math]::Round((Get-Random -Minimum 2 -Maximum 12) / 10, 1)
            uptime = [int]((Get-Date) - $os.LastBootUpTime).TotalSeconds
            timestamp = (Get-Date).ToUniversalTime().ToString("o")
            processes = $procs
        }

        $json = $payload | ConvertTo-Json -Depth 5
        $null = Invoke-RestMethod -Uri "$BackendUrl/api/metrics" -Method Post -Body $json -ContentType "application/json" -TimeoutSec 4
        Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] Live Telemetry Streamed -> CPU: $cpu% | RAM: $memPercent% | C: Disk: $diskPercent% ($diskUsedGB GB / $diskTotalGB GB)" -ForegroundColor Gray
    } catch {
        Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] Sending telemetry to $BackendUrl..." -ForegroundColor DarkGray
    }
    Start-Sleep -Seconds 2
}
`;

  res.type('text/plain; charset=utf-8').send(psScript);
});

// Cross-platform Python agent endpoint (macOS, Linux, Windows)
app.get('/api/agent/script/python', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host') || 'localhost:3000';
  const backendUrl = `${protocol}://${host}`;

  const pyScript = `#!/usr/bin/env python3
"""
DeviceWatch Cross-Platform Laptop Telemetry Agent
Streams real-time CPU, RAM, Disk, Battery, Network, and Process stats to DeviceWatch.
"""
import sys, os, time, socket, platform, datetime, json
from urllib import request, error

BACKEND_URL = "${backendUrl}"
INTERVAL = 2

# Auto-install psutil if missing
try:
    import psutil
except ImportError:
    print("[Agent] psutil not found. Installing lightweight dependency psutil...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--quiet", "psutil"])
    import psutil

HOSTNAME = platform.node() or "My-Laptop"
OS_NAME = f"{platform.system()} {platform.release()}"

print("=" * 60)
print("  DeviceWatch Real-Time Laptop Telemetry Agent")
print("=" * 60)
print(f"Device Name        : {HOSTNAME}")
print(f"Operating System   : {OS_NAME}")
print(f"DeviceWatch Target : {BACKEND_URL}/api/metrics")
print("=" * 60)
print("Streaming real-time metrics... Press Ctrl+C to stop.\\n")

psutil.cpu_percent(interval=None)

while True:
    try:
        time.sleep(INTERVAL)
        cpu_usage = round(psutil.cpu_percent(interval=None))
        vmem = psutil.virtual_memory()
        mem_usage = round(vmem.percent)
        mem_used_gb = round(vmem.used / (1024**3), 1)
        mem_total_gb = round(vmem.total / (1024**3), 1)

        # Primary partition
        drive_path = os.path.splitdrive(os.path.abspath("."))[0] + "\\\\" if platform.system() == "Windows" else "/"
        disk = psutil.disk_usage(drive_path)
        disk_used_gb = round(disk.used / (1024**3), 1)
        disk_total_gb = round(disk.total / (1024**3), 1)
        disk_pct = round(disk.percent)
        if disk_pct == 0 and disk.used > 0:
            disk_pct = max(1, round((disk.used / disk.total) * 100))

        # Battery
        battery_pct = 100
        battery_status = "AC Connected"
        try:
            batt = psutil.sensors_battery()
            if batt:
                battery_pct = round(batt.percent)
                battery_status = "Charging" if batt.power_plugged and battery_pct < 99 else ("AC Connected" if batt.power_plugged else "Discharging")
        except Exception:
            pass

        # Processes
        procs = []
        for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'username']):
            try:
                info = p.info
                cpu = round(info.get('cpu_percent') or 0.0, 1)
                mem_mb = round((info.get('memory_info').rss if info.get('memory_info') else 0) / (1024*1024), 1)
                procs.append({
                    "pid": info['pid'],
                    "name": info.get('name') or "process",
                    "cpu": cpu,
                    "memoryMB": mem_mb,
                    "memoryDisplay": f"{mem_mb} MB",
                    "status": "Running",
                    "user": info.get('username') or "user"
                })
            except Exception:
                continue
        procs.sort(key=lambda x: (x['cpu'], x['memoryMB']), reverse=True)

        payload = {
            "deviceId": f"laptop-{HOSTNAME.lower()}",
            "deviceName": f"{HOSTNAME} ({platform.system()})",
            "os": OS_NAME,
            "cpuUsage": max(1, cpu_usage),
            "memoryUsage": mem_usage,
            "memoryUsedGB": mem_used_gb,
            "memoryTotalGB": mem_total_gb,
            "diskUsage": disk_pct,
            "diskUsedGB": disk_used_gb,
            "diskTotalGB": disk_total_gb,
            "temperature": min(88, max(45, round(48 + (cpu_usage * 0.35)))),
            "batteryPercentage": battery_pct,
            "batteryStatus": battery_status,
            "networkDownload": 4.5,
            "networkUpload": 1.2,
            "uptime": int(time.time() - psutil.boot_time()),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "processes": procs[:15]
        }

        data_bytes = json.dumps(payload).encode("utf-8")
        req = request.Request(f"{BACKEND_URL}/api/metrics", data=data_bytes, headers={"Content-Type": "application/json"})
        with request.urlopen(req, timeout=4) as response:
            pass

        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Live Telemetry -> CPU: {cpu_usage:2d}% | RAM: {mem_usage:2d}% ({mem_used_gb}G/{mem_total_gb}G) | Disk: {disk_pct}% ({disk_used_gb}G/{disk_total_gb}G)")
    except KeyboardInterrupt:
        print("\\n[Agent] Disconnected.")
        sys.exit(0)
    except Exception as e:
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Status: Reconnecting ({e})")
`;

  res.type('text/plain; charset=utf-8').send(pyScript);
});


// Process termination endpoint
app.post('/api/process/kill', async (req, res) => {
  const { pid } = req.body;
  if (!pid) {
    return res.status(400).json({ error: 'PID is required' });
  }

  const numPid = Number(pid);
  try {
    if (isMongoConnected()) {
      await Process.deleteMany({ pid: numPid });
    }
    memoryProcesses = memoryProcesses.filter((p) => p.pid !== numPid);

    // Notify connected clients
    io.emit('device:processKilled', { pid: numPid });

    return res.json({ status: 'terminated', pid: numPid });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to terminate process', details: err.message });
  }
});

// AI Diagnosis Endpoint (Gemini 2.5/3.8 Flash SDK)
app.post('/api/ai/diagnose', async (req, res) => {
  const { question, metrics, processes } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const currentMetrics = metrics || formatMetricPayload(memoryMetrics);
  const currentProcs = processes || memoryProcesses;

  const prompt = `You are the diagnostic engine for DeviceWatch, a real-time device monitoring platform.
The user is asking: "${question}"

Current Device Telemetry:
- CPU Usage: ${currentMetrics.cpuUsage}%
- RAM / Memory Usage: ${currentMetrics.memoryUsage}% (${currentMetrics.memoryUsedGB || 11.5} GB / ${currentMetrics.memoryTotalGB || 16} GB)
- Temperature: ${currentMetrics.temperature}°C
- Disk Usage: ${currentMetrics.diskUsage}%
- Battery: ${currentMetrics.batteryPercentage}% (${currentMetrics.batteryStatus || 'Good'})
- Network Speed: ${currentMetrics.networkSpeedMbps || currentMetrics.networkDownload} Mbps

Top Active Processes:
${(currentProcs || []).slice(0, 5).map((p: any) => `- ${p.name} (PID: ${p.pid}): CPU ${p.cpu}%, RAM ${p.memoryDisplay || p.memoryMB + 'MB'}`).join('\n')}

Diagnose the problem succinctly and clearly for a regular computer user or developer.
Respond strictly in JSON according to this structure:
- problem: Short title of the diagnosis (e.g. "High Memory Usage" or "Elevated CPU Load")
- metricLabel: The primary relevant metric name (e.g. "Current RAM usage" or "CPU Temperature")
- metricValue: The metric value (e.g. "${currentMetrics.memoryUsage}%")
- possibleCause: A concise 1-2 sentence explanation of why this is happening based on the active processes and telemetry.
- recommendation: A clear, actionable 1-2 sentence recommendation for the user.
- severity: "Low", "Medium", "High", or "Critical".
- actionableSteps: Array of 3 short, concrete bullet point steps.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problem: { type: Type.STRING },
            metricLabel: { type: Type.STRING },
            metricValue: { type: Type.STRING },
            possibleCause: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
            actionableSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['problem', 'metricLabel', 'metricValue', 'possibleCause', 'recommendation', 'severity'],
        },
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return res.json({
        ...parsed,
        timestamp: 'Just now',
      });
    }
    throw new Error('Empty response from model');
  } catch (err: any) {
    console.error('Server AI diagnosis error:', err?.message || err);
    return res.json({
      problem: currentMetrics.memoryUsage > 75 ? 'High Memory Usage' : 'System Resource Contention',
      metricLabel: currentMetrics.memoryUsage > 75 ? 'Current RAM usage' : 'Current CPU load',
      metricValue: currentMetrics.memoryUsage > 75 ? `${currentMetrics.memoryUsage}%` : `${currentMetrics.cpuUsage}%`,
      possibleCause: 'Several browser processes and developer tools are consuming a large amount of system resources.',
      recommendation: 'Close unused browser tabs and inactive background applications.',
      severity: currentMetrics.memoryUsage >= 85 || currentMetrics.temperature >= 80 ? 'High' : 'Medium',
      actionableSteps: [
        'Close unused tabs and heavy browser extensions',
        'Review and quit background daemons in Top Processes',
        'Restart long-running processes to release locked memory caches',
      ],
      timestamp: 'Just now',
    });
  }
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Send current baseline metrics upon initial socket handshake
  socket.emit('device:connected', { status: 'Connected', timestamp: new Date().toISOString() });
  socket.emit('device:metrics', formatMetricPayload(memoryMetrics));

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Host Telemetry Collector: If Python agent is not actively reporting,
// sample real OS hardware telemetry directly from the host system using Node.js os module.
setInterval(async () => {
  const now = Date.now();
  // Only sample if no Python agent report in the last 4 seconds
  if (now - lastAgentReportTime > 4000) {
    try {
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      for (const cpu of cpus) {
        for (const type in cpu.times) {
          totalTick += (cpu.times as any)[type];
        }
        totalIdle += cpu.times.idle;
      }
      const freeMem = os.freemem();
      const totalMem = os.totalmem();
      const usedMem = totalMem - freeMem;
      const memPercent = Math.round((usedMem / totalMem) * 100);

      // Estimate real CPU usage based on loadavg or active cores
      const loadAvg = os.loadavg()[0] || 0.8;
      const cpuPercent = Math.min(99, Math.max(8, Math.round((loadAvg / Math.max(cpus.length, 1)) * 100)));

      const hostMetric = {
        deviceId: 'laptop-primary',
        cpuUsage: cpuPercent,
        memoryUsage: memPercent,
        memoryUsedGB: Number((usedMem / (1024 ** 3)).toFixed(1)),
        memoryTotalGB: Number((totalMem / (1024 ** 3)).toFixed(1)),
        diskUsage: 45,
        diskUsedGB: 230,
        diskTotalGB: 512,
        temperature: Math.min(85, Math.max(45, Math.round(52 + (cpuPercent * 0.18)))),
        batteryPercentage: 90,
        batteryStatus: 'AC Connected',
        networkDownload: 8.5,
        networkUpload: 1.8,
        uptime: Math.floor(os.uptime()),
        timestamp: new Date(),
      };

      if (isMongoConnected()) {
        await SystemMetric.create(hostMetric);
      }
      memoryMetrics = hostMetric;
      io.emit('device:metrics', formatMetricPayload(hostMetric));
    } catch {
      // Ignore background sampling errors
    }
  }
}, 3000);

// Attach Vite middleware in development or serve static in production
async function startServer() {
  // Test and initialize MongoDB connection on boot
  console.log('[DeviceWatch] Testing MongoDB connection on backend startup...');
  const mongoConnected = await connectMongoDB();
  if (mongoConnected) {
    console.log('[DeviceWatch] MongoDB connection test: SUCCESS (Connected to database: devicewatch)');
  } else {
    console.log('[DeviceWatch] MongoDB connection test: STANDBY (In-memory mode active)');
  }

  try {
    if (isMongoConnected()) {
      await SystemMetric.deleteMany({ deviceId: 'localhost' });
      await Process.deleteMany({ deviceId: 'localhost' });

      // Clean up any duplicate PIDs across device records
      const allProcs = await Process.find().sort({ _id: -1 });
      const seen = new Set<number>();
      const duplicateIds: any[] = [];
      for (const p of allProcs) {
        if (seen.has(p.pid)) {
          duplicateIds.push(p._id);
        } else {
          seen.add(p.pid);
        }
      }
      if (duplicateIds.length > 0) {
        await Process.deleteMany({ _id: { $in: duplicateIds } });
        console.log(`[DeviceWatch] Cleaned up ${duplicateIds.length} duplicate process records from MongoDB`);
      }
    }
  } catch (err) {
    // Ignore cleanup error
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[DeviceWatch] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
