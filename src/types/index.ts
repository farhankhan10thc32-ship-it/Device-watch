export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface SystemMetrics {
  deviceId?: string;
  cpuUsage: number; // percentage e.g. 67
  memoryUsage: number; // percentage e.g. 72
  memoryUsedGB: number;
  memoryTotalGB: number;
  diskUsage: number; // percentage e.g. 45
  diskUsedGB: number;
  diskTotalGB: number;
  temperature: number; // Celsius e.g. 63
  batteryPercentage: number; // e.g. 81
  batteryStatus: 'Charging' | 'Discharging' | 'AC Connected' | 'Good' | string;
  networkDownload: number;
  networkUpload: number;
  networkSpeedMbps: number; // e.g. 12.4
  networkUpMbps: number;
  networkDownMbps: number;
  uptime: number; // seconds
  uptimeHours: number;
  updatedAt: string; // ISO string
  timestamp?: string;
}

export interface ProcessItem {
  pid: number;
  name: string;
  cpu: number; // percentage
  memoryMB: number;
  memoryDisplay: string; // e.g. '2.4 GB' or '420 MB'
  status: 'Running' | 'Sleeping' | 'Idle' | 'High Usage' | string;
  user?: string;
  threads?: number;
}

export interface SystemAlert {
  id: string;
  deviceId?: string;
  title: string;
  description: string;
  timestamp: string; // ISO or relative
  timeAgo: string;
  severity: Severity;
  metricType: 'cpu' | 'memory' | 'temperature' | 'disk' | 'network' | 'battery';
  currentValue: string;
  acknowledged?: boolean;
}

export interface HistoryDataPoint {
  time: string;
  timestamp: number;
  cpu: number;
  memory: number;
  temperature: number;
  networkDown: number;
  networkUp: number;
  disk: number;
}

export interface AIDiagnosis {
  problem: string;
  metricLabel: string;
  metricValue: string;
  possibleCause: string;
  recommendation: string;
  severity: Severity;
  actionableSteps?: string[];
  timestamp: string;
}

export interface DeviceSettings {
  deviceId?: string;
  deviceName: string;
  os: string;
  serialNumber: string;
  ipAddress: string;
  status?: 'online' | 'offline';
  agentStatus: 'Connected' | 'Disconnected';
  agentVersion: string;
  monitoringInterval: number; // in seconds (1, 2, 5, 10)
  enableAlerts: boolean;
  cpuThreshold: number; // % e.g. 85
  memoryThreshold: number; // % e.g. 85
  tempThreshold: number; // °C e.g. 80
  diskThreshold: number; // % e.g. 90
  accountName: string;
  accountEmail: string;
  lastSeen?: string | Date;
}

export type TimeRange = '5 min' | '15 min' | '1 hour' | '24 hours';
export type HistoryDateFilter = 'Today' | 'Yesterday' | 'Last 7 Days';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  laptopName?: string;
}
