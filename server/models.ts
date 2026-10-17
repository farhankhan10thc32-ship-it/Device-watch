import mongoose, { Schema, Document } from 'mongoose';

// User Model
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: string;
  laptopName?: string;
  createdAt: Date;
  lastLogin?: Date;
  loginCount?: number;
  lastIp?: string;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  role: { type: String, default: 'admin' },
  laptopName: { type: String, default: 'Personal Laptop' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },
  lastIp: { type: String },
});

// Device Model
export interface IDevice extends Document {
  deviceId: string;
  name: string;
  os: string;
  serialNumber: string;
  ipAddress: string;
  status: 'online' | 'offline';
  agentStatus: 'Connected' | 'Disconnected';
  agentVersion: string;
  monitoringInterval: number;
  enableAlerts: boolean;
  cpuThreshold: number;
  memoryThreshold: number;
  tempThreshold: number;
  diskThreshold: number;
  accountName: string;
  accountEmail: string;
  lastSeen: Date;
}

const DeviceSchema = new Schema<IDevice>({
  deviceId: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: 'Primary Workstation' },
  os: { type: String, default: 'Linux / macOS' },
  serialNumber: { type: String, default: 'DW-8821-X' },
  ipAddress: { type: String, default: '127.0.0.1' },
  status: { type: String, enum: ['online', 'offline'], default: 'online' },
  agentStatus: { type: String, enum: ['Connected', 'Disconnected'], default: 'Connected' },
  agentVersion: { type: String, default: 'Python psutil v1.0.0' },
  monitoringInterval: { type: Number, default: 2 },
  enableAlerts: { type: Boolean, default: true },
  cpuThreshold: { type: Number, default: 85 },
  memoryThreshold: { type: Number, default: 85 },
  tempThreshold: { type: Number, default: 80 },
  diskThreshold: { type: Number, default: 90 },
  accountName: { type: String, default: 'Alex Mercer' },
  accountEmail: { type: String, default: 'alex.mercer@devicewatch.io' },
  lastSeen: { type: Date, default: Date.now },
});

// SystemMetric Model
export interface ISystemMetric extends Document {
  deviceId: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryUsedGB: number;
  memoryTotalGB: number;
  diskUsage: number;
  diskUsedGB?: number;
  diskTotalGB?: number;
  temperature: number;
  batteryPercentage: number;
  batteryStatus?: string;
  networkDownload: number;
  networkUpload: number;
  uptime: number;
  timestamp: Date;
}

const SystemMetricSchema = new Schema<ISystemMetric>({
  deviceId: { type: String, required: true, index: true },
  cpuUsage: { type: Number, required: true },
  memoryUsage: { type: Number, required: true },
  memoryUsedGB: { type: Number, required: true },
  memoryTotalGB: { type: Number, required: true },
  diskUsage: { type: Number, required: true },
  diskUsedGB: { type: Number },
  diskTotalGB: { type: Number },
  temperature: { type: Number, required: true },
  batteryPercentage: { type: Number, required: true },
  batteryStatus: { type: String, default: 'Good' },
  networkDownload: { type: Number, required: true },
  networkUpload: { type: Number, required: true },
  uptime: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

// Process Model
export interface IProcess extends Document {
  deviceId: string;
  pid: number;
  name: string;
  cpu: number;
  memoryMB: number;
  memoryDisplay: string;
  status: string;
  user: string;
  threads?: number;
  timestamp: Date;
}

const ProcessSchema = new Schema<IProcess>({
  deviceId: { type: String, required: true, index: true },
  pid: { type: Number, required: true },
  name: { type: String, required: true },
  cpu: { type: Number, required: true },
  memoryMB: { type: Number, required: true },
  memoryDisplay: { type: String, required: true },
  status: { type: String, default: 'Running' },
  user: { type: String, default: 'user' },
  threads: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now },
});

// Alert Model
export interface IAlert extends Document {
  deviceId: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  metricType: 'cpu' | 'memory' | 'temperature' | 'disk' | 'network' | 'battery';
  currentValue: string;
  acknowledged: boolean;
  timestamp: Date;
}

const AlertSchema = new Schema<IAlert>({
  deviceId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  metricType: { type: String, enum: ['cpu', 'memory', 'temperature', 'disk', 'network', 'battery'], required: true },
  currentValue: { type: String, required: true },
  acknowledged: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now, index: true },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Device = mongoose.models.Device || mongoose.model<IDevice>('Device', DeviceSchema);
export const SystemMetric = mongoose.models.SystemMetric || mongoose.model<ISystemMetric>('SystemMetric', SystemMetricSchema);
export const Process = mongoose.models.Process || mongoose.model<IProcess>('Process', ProcessSchema);
export const Alert = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
