import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Device, User, SystemMetric, Process, Alert } from './models';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_FILE_PATH = path.resolve(__dirname, '../.env');

export interface DatabaseStatus {
  connected: boolean;
  readyState: number; // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  stateText: 'Connected' | 'Disconnected' | 'Connecting' | 'Disconnecting';
  host?: string;
  dbName?: string;
  maskedUri?: string;
  collections?: { name: string; count: number }[];
  pingMs?: number;
  lastConnectedAt?: string;
  error?: string;
}

let lastConnectedAt: Date | null = null;
let currentMaskedUri: string | null = null;

// Helper: Mask sensitive credentials in URI for safe display
export function maskMongoUri(uri: string): string {
  try {
    // Format: mongodb+srv://username:password@cluster...
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/i, '$1••••••••$3');
  } catch {
    return 'mongodb+srv://••••••••@cluster...';
  }
}

// Helper: Persist MONGODB_URI to .env file
function persistUriToEnv(uri: string) {
  try {
    let content = '';
    if (fs.existsSync(ENV_FILE_PATH)) {
      content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    }

    if (content.includes('MONGODB_URI=')) {
      content = content.replace(/MONGODB_URI=.*/g, `MONGODB_URI="${uri}"`);
    } else {
      content = content ? `${content.trim()}\nMONGODB_URI="${uri}"\n` : `MONGODB_URI="${uri}"\n`;
    }

    fs.writeFileSync(ENV_FILE_PATH, content, 'utf-8');
    process.env.MONGODB_URI = uri;
    console.log('[MongoDB] Successfully persisted MONGODB_URI to .env file');
  } catch (err: any) {
    console.warn('[MongoDB] Could not persist to .env file:', err.message);
  }
}

// Connect dynamically to any MongoDB Atlas or standard URI
export async function connectToDatabase(uri: string): Promise<{ success: boolean; error?: string; host?: string; dbName?: string }> {
  const cleanUri = uri.trim();
  if (!cleanUri.startsWith('mongodb://') && !cleanUri.startsWith('mongodb+srv://')) {
    return {
      success: false,
      error: 'Invalid connection string format. MongoDB Atlas connection strings must start with "mongodb+srv://" or "mongodb://"',
    };
  }

  if (cleanUri.includes('<db_password>') || cleanUri.includes('<password>')) {
    return {
      success: false,
      error: 'The placeholder "<db_password>" was detected. Please replace it with your actual MongoDB Atlas database password for user "tiger".',
    };
  }

  try {
    // If currently connected, disconnect cleanly first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    console.log(`[MongoDB] Connecting to: ${maskMongoUri(cleanUri)}...`);

    await mongoose.connect(cleanUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      dbName: 'devicewatch',
    });

    lastConnectedAt = new Date();
    currentMaskedUri = maskMongoUri(cleanUri);
    process.env.MONGODB_URI = cleanUri;

    // Save to .env so server reloads retain this connection
    persistUriToEnv(cleanUri);

    const host = mongoose.connection.host || 'MongoDB Atlas Cluster';
    const dbName = mongoose.connection.name || 'devicewatch';

    console.log(`[MongoDB] Connected successfully to [${dbName}] at ${host}`);

    // Seed default baseline structures if new DB
    await seedInitialData();

    return {
      success: true,
      host,
      dbName,
    };
  } catch (error: any) {
    const rawError = error?.message || String(error);
    console.warn('[MongoDB] Connection notice:', rawError);

    // If connection failed, ensure failing URI is not kept in process.env
    if (process.env.MONGODB_URI === cleanUri && mongoose.connection.readyState !== 1) {
      delete process.env.MONGODB_URI;
    }

    let friendlyError = rawError;

    if (rawError.includes('bad auth') || rawError.includes('authentication failed')) {
      friendlyError = 'Authentication failed: Incorrect password for database user "tiger". Please check your password or reset it in cloud.mongodb.com under Security -> Database Access.';
    } else if (rawError.includes('querySrv ETIMEOUT') || rawError.includes('Server selection timed out')) {
      friendlyError = 'Connection timed out: In your MongoDB Atlas dashboard, ensure Network Access allows IP address 0.0.0.0/0 (or your server IP).';
    }

    return {
      success: false,
      error: friendlyError,
    };
  }
}

// Disconnect from database
export async function disconnectDatabase(): Promise<boolean> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    lastConnectedAt = null;
    currentMaskedUri = null;
    delete process.env.MONGODB_URI;
    return true;
  } catch (err: any) {
    console.warn('[MongoDB] Disconnect notice:', err?.message || err);
    return false;
  }
}

// Get comprehensive status of MongoDB Atlas connection
export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const readyState = mongoose.connection.readyState;
  let stateText: DatabaseStatus['stateText'] = 'Disconnected';
  if (readyState === 1) stateText = 'Connected';
  else if (readyState === 2) stateText = 'Connecting';
  else if (readyState === 3) stateText = 'Disconnecting';

  if (readyState !== 1) {
    return {
      connected: false,
      readyState,
      stateText,
      maskedUri: currentMaskedUri || (process.env.MONGODB_URI ? maskMongoUri(process.env.MONGODB_URI) : undefined),
    };
  }

  let collections: { name: string; count: number }[] = [];
  let pingMs: number | undefined;

  try {
    const startTime = Date.now();
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      pingMs = Date.now() - startTime;

      const [userCount, deviceCount, metricCount, alertCount, procCount] = await Promise.all([
        User.countDocuments().catch(() => 0),
        Device.countDocuments().catch(() => 0),
        SystemMetric.countDocuments().catch(() => 0),
        Alert.countDocuments().catch(() => 0),
        Process.countDocuments().catch(() => 0),
      ]);

      collections = [
        { name: 'users', count: userCount },
        { name: 'devices', count: deviceCount },
        { name: 'systemmetrics', count: metricCount },
        { name: 'alerts', count: alertCount },
        { name: 'processes', count: procCount },
      ];
    }
  } catch (err) {
    console.warn('[MongoDB] Status check ping failed:', err);
  }

  return {
    connected: true,
    readyState,
    stateText: 'Connected',
    host: mongoose.connection.host || 'MongoDB Atlas Cluster',
    dbName: mongoose.connection.name || 'devicewatch',
    maskedUri: currentMaskedUri || (process.env.MONGODB_URI ? maskMongoUri(process.env.MONGODB_URI) : undefined),
    collections,
    pingMs,
    lastConnectedAt: lastConnectedAt ? lastConnectedAt.toISOString() : undefined,
  };
}

// Initial connection on boot
export async function connectMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<db_password>') || uri.includes('<password>')) {
    console.log('[MongoDB] Running in resilient in-memory mode. Connect via Settings when your MongoDB Atlas credentials are ready.');
    return false;
  }

  const result = await connectToDatabase(uri);
  return result.success;
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function seedInitialData() {
  try {
    const deviceCount = await Device.countDocuments();
    if (deviceCount === 0) {
      await Device.create({
        deviceId: 'laptop-primary',
        name: 'Workstation Laptop',
        os: 'macOS / Linux 64-bit',
        serialNumber: 'DW-8821-X',
        ipAddress: '192.168.1.142',
        status: 'online',
        agentStatus: 'Connected',
        agentVersion: 'Python psutil v1.0.0',
        monitoringInterval: 2,
        enableAlerts: true,
        cpuThreshold: 85,
        memoryThreshold: 85,
        tempThreshold: 80,
        diskThreshold: 90,
        accountName: 'Personal Account',
        accountEmail: 'user@devicewatch.io',
        lastSeen: new Date(),
      });
      console.log('[MongoDB] Seeded default Device document');
    }

    const metricCount = await SystemMetric.countDocuments();
    if (metricCount === 0) {
      await SystemMetric.create({
        deviceId: 'laptop-primary',
        cpuUsage: 42,
        memoryUsage: 64,
        memoryUsedGB: 10.2,
        memoryTotalGB: 16.0,
        diskUsage: 45,
        diskUsedGB: 230,
        diskTotalGB: 512,
        temperature: 58,
        batteryPercentage: 88,
        batteryStatus: 'Good',
        networkDownload: 14.2,
        networkUpload: 2.8,
        uptime: 138600,
        timestamp: new Date(),
      });
      console.log('[MongoDB] Seeded initial baseline SystemMetric');
    }

    const processCount = await Process.countDocuments();
    if (processCount === 0) {
      await Process.insertMany([
        { deviceId: 'laptop-primary', pid: 1402, name: 'Google Chrome', cpu: 18.2, memoryMB: 2150, memoryDisplay: '2.1 GB', status: 'Running', user: 'user' },
        { deviceId: 'laptop-primary', pid: 2189, name: 'Code - OSS / VS Code', cpu: 11.4, memoryMB: 1080, memoryDisplay: '1.1 GB', status: 'Running', user: 'user' },
        { deviceId: 'laptop-primary', pid: 3841, name: 'Node.js (Server)', cpu: 4.8, memoryMB: 410, memoryDisplay: '410 MB', status: 'Running', user: 'user' },
        { deviceId: 'laptop-primary', pid: 914, name: 'Docker Desktop Engine', cpu: 5.2, memoryMB: 1720, memoryDisplay: '1.7 GB', status: 'Running', user: 'root' },
        { deviceId: 'laptop-primary', pid: 489, name: 'Slack Desktop', cpu: 2.5, memoryMB: 620, memoryDisplay: '620 MB', status: 'Running', user: 'user' },
      ]);
      console.log('[MongoDB] Seeded initial Process documents');
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const defaultPasswordHash = crypto.createHash('sha256').update('salt_devicewatch_password123').digest('hex');
      await User.create({
        name: 'Admin User',
        email: 'admin@devicewatch.io',
        passwordHash: defaultPasswordHash,
        role: 'admin',
        laptopName: 'Workstation Laptop',
      });
      console.log('[MongoDB] Seeded default Admin user (admin@devicewatch.io / password123)');
    }
  } catch (err: any) {
    console.warn('[MongoDB] Seed error:', err?.message || err);
  }
}

// Sync user to MongoDB Atlas on login, signup, or reconnect
export async function syncUserToMongo(userData: {
  name: string;
  email: string;
  passwordHash?: string;
  role?: string;
  laptopName?: string;
  lastLogin?: Date;
  lastIp?: string;
}) {
  if (!isMongoConnected()) return null;
  try {
    const cleanEmail = userData.email.toLowerCase().trim();
    const updatePayload: any = {
      name: userData.name,
      email: cleanEmail,
      role: userData.role || 'admin',
      laptopName: userData.laptopName || `${userData.name}'s Laptop`,
      lastLogin: userData.lastLogin || new Date(),
    };
    if (userData.passwordHash) {
      updatePayload.passwordHash = userData.passwordHash;
    }
    if (userData.lastIp) {
      updatePayload.lastIp = userData.lastIp;
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: cleanEmail },
      {
        $set: updatePayload,
        $inc: { loginCount: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Also update Device document with the active user account details
    await Device.findOneAndUpdate(
      { deviceId: 'laptop-primary' },
      {
        $set: {
          accountName: userData.name,
          accountEmail: cleanEmail,
          name: userData.laptopName || `${userData.name}'s Laptop`,
          lastSeen: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    console.log(`[MongoDB] Successfully synced & recorded login for user: ${cleanEmail}`);
    return updatedUser;
  } catch (err: any) {
    console.warn('[MongoDB] syncUserToMongo warning:', err.message);
    return null;
  }
}

// Sync all in-memory users to MongoDB when connection is established
export async function syncAllMemoryUsersToMongo(users: Array<{
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  laptopName: string;
}>) {
  if (!isMongoConnected() || !users || users.length === 0) return;
  try {
    for (const u of users) {
      await User.findOneAndUpdate(
        { email: u.email.toLowerCase().trim() },
        {
          $set: {
            name: u.name,
            email: u.email.toLowerCase().trim(),
            passwordHash: u.passwordHash,
            role: u.role || 'admin',
            laptopName: u.laptopName,
          },
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`[MongoDB] Synced ${users.length} registered user(s) to MongoDB Atlas.`);
  } catch (err: any) {
    console.warn('[MongoDB] Sync memory users error:', err.message);
  }
}
