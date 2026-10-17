import { SystemMetrics, ProcessItem, SystemAlert, HistoryDataPoint, DeviceSettings, AIDiagnosis } from '../types';

export const INITIAL_METRICS: SystemMetrics = {
  cpuUsage: 67,
  memoryUsage: 72,
  memoryUsedGB: 11.5,
  memoryTotalGB: 16.0,
  diskUsage: 45,
  diskUsedGB: 230,
  diskTotalGB: 512,
  temperature: 63,
  batteryPercentage: 81,
  batteryStatus: 'Good',
  networkDownload: 10.3,
  networkUpload: 2.1,
  networkSpeedMbps: 12.4,
  networkUpMbps: 2.1,
  networkDownMbps: 10.3,
  uptime: 138600,
  uptimeHours: 38.5,
  updatedAt: new Date().toISOString(),
};

export const INITIAL_PROCESSES: ProcessItem[] = [
  { pid: 1402, name: 'Google Chrome', cpu: 24.2, memoryMB: 2457, memoryDisplay: '2.4 GB', status: 'Running', user: 'alex', threads: 48 },
  { pid: 2189, name: 'Code - OSS / VS Code', cpu: 12.4, memoryMB: 1126, memoryDisplay: '1.1 GB', status: 'Running', user: 'alex', threads: 32 },
  { pid: 3841, name: 'Node.js (dev server)', cpu: 8.1, memoryMB: 420, memoryDisplay: '420 MB', status: 'Running', user: 'alex', threads: 14 },
  { pid: 914, name: 'Docker Desktop Engine', cpu: 6.5, memoryMB: 1840, memoryDisplay: '1.8 GB', status: 'Running', user: 'root', threads: 64 },
  { pid: 489, name: 'Slack Desktop', cpu: 3.8, memoryMB: 680, memoryDisplay: '680 MB', status: 'Running', user: 'alex', threads: 22 },
  { pid: 112, name: 'WindowServer / Desktop GUI', cpu: 4.2, memoryMB: 390, memoryDisplay: '390 MB', status: 'Running', user: 'system', threads: 18 },
  { pid: 742, name: 'Spotify Music', cpu: 2.1, memoryMB: 285, memoryDisplay: '285 MB', status: 'Running', user: 'alex', threads: 16 },
  { pid: 1530, name: 'PostgreSQL Database', cpu: 1.5, memoryMB: 310, memoryDisplay: '310 MB', status: 'Running', user: 'postgres', threads: 12 },
  { pid: 88, name: 'System Kernel Core', cpu: 1.2, memoryMB: 512, memoryDisplay: '512 MB', status: 'Running', user: 'root', threads: 128 },
  { pid: 3144, name: 'Terminal / zsh session', cpu: 0.4, memoryMB: 64, memoryDisplay: '64 MB', status: 'Sleeping', user: 'alex', threads: 4 },
  { pid: 4120, name: 'DeviceWatch Agent (Python)', cpu: 0.8, memoryMB: 48, memoryDisplay: '48 MB', status: 'Running', user: 'alex', threads: 6 },
  { pid: 2011, name: 'Figma Desktop Helper', cpu: 1.9, memoryMB: 520, memoryDisplay: '520 MB', status: 'Idle', user: 'alex', threads: 15 },
];

export const INITIAL_ALERTS: SystemAlert[] = [
  {
    id: 'alt-1',
    title: 'High Memory Usage',
    description: 'Memory usage reached 89%.',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    timeAgo: '2 minutes ago',
    severity: 'Medium',
    metricType: 'memory',
    currentValue: '89%',
    acknowledged: false,
  },
  {
    id: 'alt-2',
    title: 'High CPU Temperature',
    description: 'Temperature reached 86°C.',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    timeAgo: '10 minutes ago',
    severity: 'Medium',
    metricType: 'temperature',
    currentValue: '86°C',
    acknowledged: false,
  },
  {
    id: 'alt-3',
    title: 'Background Process Spike',
    description: 'Chrome renderer exceeded 25% single-thread CPU threshold.',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    timeAgo: '42 minutes ago',
    severity: 'Low',
    metricType: 'cpu',
    currentValue: '28%',
    acknowledged: true,
  },
];

export const INITIAL_SETTINGS: DeviceSettings = {
  deviceName: 'MacBook Pro 16" (Workstation)',
  os: 'macOS Sonoma 14.5 (Apple Silicon)',
  serialNumber: 'C02GK990MD6R',
  ipAddress: '192.168.1.142',
  agentStatus: 'Connected',
  agentVersion: 'v1.4.2 (psutil 5.9.8)',
  monitoringInterval: 2,
  enableAlerts: true,
  cpuThreshold: 85,
  memoryThreshold: 85,
  tempThreshold: 80,
  diskThreshold: 90,
  accountName: 'Alex Mercer',
  accountEmail: 'alex.mercer@devicewatch.io',
};

// Generates time-series data for the performance chart
export function generatePerformanceSeries(range: '5 min' | '15 min' | '1 hour' | '24 hours'): HistoryDataPoint[] {
  const points: HistoryDataPoint[] = [];
  let count = 20;
  let intervalSec = 15;

  if (range === '5 min') {
    count = 20; // every 15s
    intervalSec = 15;
  } else if (range === '15 min') {
    count = 30; // every 30s
    intervalSec = 30;
  } else if (range === '1 hour') {
    count = 30; // every 2 min
    intervalSec = 120;
  } else {
    count = 24; // every hour
    intervalSec = 3600;
  }

  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    const timeMs = now - i * intervalSec * 1000;
    const date = new Date(timeMs);
    let timeLabel = '';
    if (range === '24 hours') {
      timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      timeLabel = date.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
    }

    // Realistic wave pattern with jitter
    const wave = Math.sin(i * 0.4);
    const cpu = Math.min(95, Math.max(20, Math.round(62 + wave * 18 + (Math.sin(i * 1.5) * 6))));
    const memory = Math.min(96, Math.max(45, Math.round(71 + (wave * 5) + (i % 3 === 0 ? 3 : -2))));
    const temperature = Math.min(92, Math.max(40, Math.round(62 + (cpu / 100) * 12 + wave * 4)));
    const networkDown = Math.max(0.5, Number((8.5 + wave * 5.2 + (Math.random() * 3)).toFixed(1)));
    const networkUp = Math.max(0.2, Number((1.8 + (Math.random() * 1.4)).toFixed(1)));
    const disk = 45;

    points.push({
      time: timeLabel,
      timestamp: timeMs,
      cpu,
      memory,
      temperature,
      networkDown,
      networkUp,
      disk,
    });
  }

  return points;
}

// Generates long-range history data for History page
export function generateHistoryData(filter: 'Today' | 'Yesterday' | 'Last 7 Days'): {
  points: HistoryDataPoint[];
  avgCpu: number;
  peakCpu: number;
  avgMemory: number;
  peakMemory: number;
  avgTemp: number;
  peakTemp: number;
  totalAlerts: number;
} {
  const points: HistoryDataPoint[] = [];
  const count = filter === 'Last 7 Days' ? 28 : 24;
  const now = Date.now();
  const timeStep = filter === 'Last 7 Days' ? 6 * 3600 * 1000 : 3600 * 1000;

  let sumCpu = 0;
  let maxCpu = 0;
  let sumMem = 0;
  let maxMem = 0;
  let sumTemp = 0;
  let maxTemp = 0;

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = now - i * timeStep;
    const d = new Date(timestamp);
    const timeLabel = filter === 'Last 7 Days' 
      ? `${d.toLocaleDateString([], { weekday: 'short' })} ${d.getHours()}:00` 
      : `${d.getHours()}:00`;

    const cycle = Math.sin((i / count) * Math.PI * 2);
    const cpu = Math.min(98, Math.max(18, Math.round(55 + cycle * 22 + (Math.sin(i * 3) * 8))));
    const memory = Math.min(94, Math.max(50, Math.round(68 + cycle * 8 + (Math.random() * 4))));
    const temperature = Math.min(91, Math.max(45, Math.round(58 + (cpu * 0.15) + (cycle * 5))));
    const networkDown = Math.max(1, Number((14 + cycle * 8 + (Math.random() * 4)).toFixed(1)));
    const networkUp = Math.max(0.5, Number((3.2 + (Math.random() * 2)).toFixed(1)));

    sumCpu += cpu;
    maxCpu = Math.max(maxCpu, cpu);
    sumMem += memory;
    maxMem = Math.max(maxMem, memory);
    sumTemp += temperature;
    maxTemp = Math.max(maxTemp, temperature);

    points.push({
      time: timeLabel,
      timestamp,
      cpu,
      memory,
      temperature,
      networkDown,
      networkUp,
      disk: 45,
    });
  }

  return {
    points,
    avgCpu: Math.round(sumCpu / count),
    peakCpu: maxCpu,
    avgMemory: Math.round(sumMem / count),
    peakMemory: maxMem,
    avgTemp: Math.round(sumTemp / count),
    peakTemp: maxTemp,
    totalAlerts: filter === 'Last 7 Days' ? 14 : filter === 'Yesterday' ? 5 : 3,
  };
}

// Fallback rule-based AI diagnosis when backend / API key isn't active
export function getLocalDiagnosis(question: string, metrics: SystemMetrics, processes: ProcessItem[]): AIDiagnosis {
  const q = question.toLowerCase();

  if (q.includes('ram') || q.includes('memory') || metrics.memoryUsage > 80) {
    const topMem = processes.slice().sort((a, b) => b.memoryMB - a.memoryMB)[0];
    return {
      problem: 'High Memory Usage',
      metricLabel: 'Current RAM usage',
      metricValue: `${metrics.memoryUsage}% (${metrics.memoryUsedGB.toFixed(1)} GB of ${metrics.memoryTotalGB} GB)`,
      possibleCause: `Several browser processes and ${topMem ? topMem.name : 'applications'} are consuming a large amount of memory. Active applications are accumulating cached heaps.`,
      recommendation: 'Close unused browser tabs and quit inactive background background services to free working memory.',
      severity: metrics.memoryUsage >= 88 ? 'High' : 'Medium',
      actionableSteps: [
        'Close background browser tabs (especially media and dashboard streams)',
        `Review high memory process: ${topMem ? topMem.name : 'Web Browser'} (${topMem ? topMem.memoryDisplay : '2.4 GB'})`,
        'Purge system standby memory if swap file growth continues',
      ],
      timestamp: 'Just now',
    };
  }

  if (q.includes('heat') || q.includes('temperature') || q.includes('hot') || metrics.temperature > 75) {
    return {
      problem: 'Elevated CPU Temperature',
      metricLabel: 'Current CPU Temperature',
      metricValue: `${metrics.temperature}°C`,
      possibleCause: 'Continuous sustained compute load combined with restricted chassis airflow or thermal throttling threshold.',
      recommendation: 'Ensure vents are unobstructed, elevate the laptop base for airflow, and throttle intensive background compiler or render tasks.',
      severity: metrics.temperature >= 85 ? 'High' : 'Medium',
      actionableSteps: [
        'Place the device on a hard flat surface for proper fan intake',
        'Identify runaway threads utilizing continuous compute (>20% CPU)',
        'Check cooling fan profile in system power settings',
      ],
      timestamp: 'Just now',
    };
  }

  if (q.includes('cpu') || metrics.cpuUsage > 80) {
    const topCpu = processes.slice().sort((a, b) => b.cpu - a.cpu)[0];
    return {
      problem: 'High CPU Utilization',
      metricLabel: 'Current CPU Load',
      metricValue: `${metrics.cpuUsage}%`,
      possibleCause: `Foreground process '${topCpu ? topCpu.name : 'Chrome'}' is demanding active thread time, preventing CPU cores from entering low-power C-states.`,
      recommendation: 'Check the Top Processes tab, pause demanding build watchers or video renderers, and terminate unresponsive threads.',
      severity: metrics.cpuUsage >= 85 ? 'High' : 'Medium',
      actionableSteps: [
        `Inspect process PID ${topCpu ? topCpu.pid : '1402'} (${topCpu ? topCpu.name : 'Chrome'})`,
        'Pause active dev compilers or local Docker containers if not currently in use',
        'Restart long-running developer tool daemons',
      ],
      timestamp: 'Just now',
    };
  }

  // Default: "Why is my laptop slow?"
  return {
    problem: metrics.memoryUsage > 75 ? 'Memory Pressure Bottleneck' : 'Elevated Background Workload',
    metricLabel: 'Primary Bottleneck',
    metricValue: `RAM: ${metrics.memoryUsage}% | CPU: ${metrics.cpuUsage}% | Temp: ${metrics.temperature}°C`,
    possibleCause: 'Simultaneous running processes (Chrome, VS Code, dev daemons) are competing for RAM and CPU scheduling time slices.',
    recommendation: 'Close unused browser tabs and applications to free system memory and lower thermal pressure.',
    severity: 'Medium',
    actionableSteps: [
      'Restart applications running longer than 24 hours to reclaim leaked RAM',
      'Disable unnecessary launch-at-login background items in Settings',
      'Verify free disk space is at least 15% (currently 55% free)',
    ],
    timestamp: 'Just now',
  };
}
