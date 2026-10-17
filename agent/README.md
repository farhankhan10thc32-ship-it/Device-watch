# DeviceWatch Python Telemetry Agent

The **DeviceWatch Agent** is a lightweight daemon written in Python using `psutil`. It gathers real-time hardware metrics directly from the host operating system (CPU, RAM, Disk, Temperature, Battery, Network throughput, Uptime, and Processes) and streams them to the DeviceWatch Node.js/Express backend via `POST /api/metrics`.

## Architecture Flow

```
Laptop / Device 
  → Python psutil Agent 
  → Node.js / Express Backend 
  → MongoDB (Mongoose) 
  → Socket.IO 
  → React Dashboard
```

## Quick Start

### 1. Prerequisites
- Python 3.8+ installed
- Pip package manager

### 2. Installation

Inside this `agent/` folder:

```bash
cd agent
pip install -r requirements.txt
```

### 3. Configure Environment Variables (Optional)

Copy `.env.example` to `.env` or set environment variables directly:

```bash
cp .env.example .env
```

Available variables:
- `BACKEND_URL`: URL of the DeviceWatch backend (default: `http://localhost:3000`)
- `DEVICE_ID`: Unique device identifier (default: hostname, e.g. `laptop-primary`)
- `DEVICE_NAME`: Human-readable device display name (e.g. `MacBook Pro 16" Workstation`)
- `MONITORING_INTERVAL`: Telemetry polling rate in seconds (default: `2`)

### 4. Run the Agent

```bash
python agent.py
```

Or on Unix/macOS:
```bash
python3 agent.py
```

The agent will immediately start sampling hardware telemetry and posting to `/api/metrics`. The DeviceWatch React Dashboard will update automatically in real-time over Socket.IO without requiring page refreshes.
