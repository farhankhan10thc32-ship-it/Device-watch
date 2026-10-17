import { SystemMetrics, ProcessItem, AIDiagnosis, DeviceSettings, SystemAlert, HistoryDataPoint } from '../types';
import { getLocalDiagnosis } from '../utils/mockData';

// GET /api/device
export async function fetchDevice(): Promise<DeviceSettings | null> {
  try {
    const res = await fetch('/api/device', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      deviceId: data.deviceId,
      deviceName: data.name || data.deviceName || 'Primary Workstation',
      os: data.os || 'Linux / macOS',
      serialNumber: data.serialNumber || 'DW-8821-X',
      ipAddress: data.ipAddress || '127.0.0.1',
      status: data.status || 'online',
      agentStatus: data.agentStatus || 'Connected',
      agentVersion: data.agentVersion || 'Python psutil v1.0.0',
      monitoringInterval: data.monitoringInterval || 2,
      enableAlerts: data.enableAlerts ?? true,
      cpuThreshold: data.cpuThreshold || 85,
      memoryThreshold: data.memoryThreshold || 85,
      tempThreshold: data.tempThreshold || 80,
      diskThreshold: data.diskThreshold || 90,
      accountName: data.accountName || 'Alex Mercer',
      accountEmail: data.accountEmail || 'alex.mercer@devicewatch.io',
      lastSeen: data.lastSeen,
    };
  } catch {
    return null;
  }
}

// GET /api/metrics
export async function fetchSystemMetrics(): Promise<SystemMetrics | null> {
  try {
    const res = await fetch('/api/metrics', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// GET /api/metrics/history
export async function fetchMetricsHistory(range: string): Promise<HistoryDataPoint[]> {
  try {
    const res = await fetch(`/api/metrics/history?range=${encodeURIComponent(range)}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    const points = await res.json();
    return Array.isArray(points) ? points : [];
  } catch {
    return [];
  }
}

// GET /api/processes
export async function fetchProcesses(): Promise<ProcessItem[]> {
  try {
    const res = await fetch('/api/processes', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// GET /api/alerts
export async function fetchAlerts(): Promise<SystemAlert[]> {
  try {
    const res = await fetch('/api/alerts', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// POST /api/alerts
export async function createAlertOnServer(alert: Partial<SystemAlert>): Promise<SystemAlert | null> {
  try {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// PATCH /api/alerts/:id
export async function acknowledgeAlertOnServer(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/alerts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acknowledged: true }),
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return true;
  }
}

// GET /api/settings
export async function fetchSettings(): Promise<DeviceSettings | null> {
  try {
    const res = await fetch('/api/settings', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      deviceId: data.deviceId,
      deviceName: data.name || data.deviceName || 'Workstation Laptop',
      os: data.os || 'Linux / macOS',
      serialNumber: data.serialNumber || 'DW-8821-X',
      ipAddress: data.ipAddress || '127.0.0.1',
      status: data.status || 'online',
      agentStatus: data.agentStatus || 'Connected',
      agentVersion: data.agentVersion || 'Python psutil v1.0.0',
      monitoringInterval: data.monitoringInterval || 2,
      enableAlerts: data.enableAlerts ?? true,
      cpuThreshold: data.cpuThreshold || 85,
      memoryThreshold: data.memoryThreshold || 85,
      tempThreshold: data.tempThreshold || 80,
      diskThreshold: data.diskThreshold || 90,
      accountName: data.accountName || 'Alex Mercer',
      accountEmail: data.accountEmail || 'alex.mercer@devicewatch.io',
    };
  } catch {
    return null;
  }
}

// PATCH /api/settings
export async function saveDeviceSettingsToServer(settings: Partial<DeviceSettings>): Promise<boolean> {
  try {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return true;
  }
}

// POST /api/process/kill
export async function terminateProcessOnServer(pid: number): Promise<boolean> {
  try {
    const res = await fetch('/api/process/kill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pid }),
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return true;
  }
}

// POST /api/ai/diagnose
export async function requestAIDiagnosis(
  question: string,
  metrics: SystemMetrics,
  processes: ProcessItem[]
): Promise<AIDiagnosis> {
  try {
    const res = await fetch('/api/ai/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, metrics, processes }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.problem && data.recommendation) {
        return data as AIDiagnosis;
      }
    }
  } catch (err) {
    console.warn('Backend AI diagnose error or timeout, using local heuristic diagnosis:', err);
  }

  return getLocalDiagnosis(question, metrics, processes);
}
