# 4 Digit Battle

A real-time multiplayer number guessing game (Bulls & Cows) built with React + Vite + Socket.IO.

## Game Modes

| Mode | Description |
|------|-------------|
| **Same Device** | Pass-and-play offline, one device |
| **Online Room Code** | Play with a friend anywhere via unique room code |
| **Local Hotspot** | Both devices on the same Wi-Fi / mobile hotspot |

## How to Play

1. Each player thinks of a secret 4-digit number (no repeated digits).
2. Take turns guessing the opponent's number.
3. After each guess, you'll see:
   - 🟢 **Found** — right digit, right position (Bull)
   - 🟡 **Present** — right digit, wrong position (Cow)
4. First player to get **4 Found** wins!

---

## Running Locally

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Setup

```bash
# Install all dependencies
pnpm install

# Start both the API server and frontend
# Terminal 1 — Backend (Socket.IO server)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (Vite dev server)
pnpm --filter @workspace/four-digit-battle run dev
```

The app will be at: **http://localhost:5173** (or the port shown in the terminal)

---

## Local Hotspot Multiplayer Setup

> Both devices must be on the **same Wi-Fi network or mobile hotspot**.

### Steps

1. **Start the servers** using the commands above.
2. **Find your local IP** — on the Local Hotspot page in the app, or run:
   ```bash
   # macOS / Linux
   ifconfig | grep "inet " | grep -v 127

   # Windows
   ipconfig
   ```
3. **Share the URL** with your friend — it looks like:
   ```
   http://192.168.x.x:5173
   ```
4. **Friend opens that URL** in their browser on the same network.
5. One player **Creates a Room**, the other **Joins** with the code.

### Vite host configuration

The Vite dev server is already configured to serve on all interfaces (`host: 0.0.0.0`), so LAN access works without extra config.

---

## Security

- Secret numbers are **never transmitted to the opponent** — only sent to the server for evaluation.
- The server validates all inputs (4 digits, correct turn, valid room) before processing.
- Each player only sees their own secret code on their own screen.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express 5 |
| Real-time | Socket.IO |
| Language | TypeScript |
| Monorepo | pnpm workspaces |
