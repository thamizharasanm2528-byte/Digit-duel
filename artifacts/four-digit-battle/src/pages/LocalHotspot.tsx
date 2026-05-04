// Local Hotspot Multiplayer — shows connection info for same Wi-Fi / mobile hotspot play.
// The game mechanics use the same Socket.IO server as Online mode.
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { connectSocket } from "@/lib/socket";
import { useOnline } from "@/context/OnlineContext";

interface LocalIP { name: string; address: string; }

export default function LocalHotspot() {
  const [, navigate] = useLocation();
  const { state, actions } = useOnline();
  const [localIPs, setLocalIPs] = useState<LocalIP[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [tab, setTab] = useState<"info" | "create" | "join">("info");
  const [copied, setCopied] = useState("");

  // Fetch local IPs from the server
  useEffect(() => {
    fetch("/api/local-ip")
      .then(r => r.json())
      .then(d => setLocalIPs(d.addresses ?? []))
      .catch(() => {});
  }, []);

  async function handleCopyURL(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(""), 2000);
    } catch { /* silent */ }
  }

  function handleCreate() {
    connectSocket();
    actions.createRoom();
  }

  function handleJoin() {
    if (joinCode.trim().length < 4) return;
    connectSocket();
    actions.joinRoom(joinCode);
  }

  // Current app URL (what the friend should open)
  const appURL = window.location.origin;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-5">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-4xl mb-2">📡</div>
          <h2 className="text-2xl font-black text-white">Local Hotspot Mode</h2>
          <p className="text-white/40 text-sm">
            Both devices on the same Wi-Fi or mobile hotspot.
          </p>
        </div>

        {/* Error */}
        {state.error && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
            {state.error}
          </div>
        )}

        {/* Tab switcher */}
        <div className="glass rounded-2xl p-1 flex gap-1">
          {(["info","create","join"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); actions.clearError(); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
                tab === t ? "glass-bright text-white" : "text-white/40 hover:text-white/70"
              }`}>
              {t === "info" ? "📡 Setup" : t === "create" ? "Host" : "Join"}
            </button>
          ))}
        </div>

        {/* INFO tab — connection instructions */}
        {tab === "info" && (
          <div className="space-y-4">
            {/* Step-by-step instructions */}
            <div className="glass-bright rounded-2xl p-5 space-y-4">
              <p className="text-sm font-bold text-white">How to play on the same network</p>
              <div className="space-y-3 text-sm text-white/60">
                <Step n={1} text="Connect both devices to the same Wi-Fi or mobile hotspot." />
                <Step n={2} text="On this device, go to Create Room tab and host the game." />
                <Step n={3} text="Friend opens this URL in their browser:" />
              </div>

              {/* App URL (what friend should open) */}
              <div className="glass rounded-xl p-4 space-y-2">
                <p className="text-xs text-white/40 uppercase tracking-wider">Share this link</p>
                <div className="font-mono text-sm text-[#06d6f0] break-all">{appURL}</div>
                <button
                  onClick={() => handleCopyURL(appURL)}
                  className="text-xs font-semibold transition-colors"
                  style={{ color: copied === appURL ? "#4ade80" : "#06d6f0" }}
                >
                  {copied === appURL ? "✓ Copied!" : "📋 Copy link"}
                </button>
              </div>

              {/* Local network IPs (useful for local dev / non-Replit) */}
              {localIPs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-white/40 uppercase tracking-wider">Local network addresses</p>
                  {localIPs.map(({ name, address }) => {
                    const url = `http://${address}:5173`;
                    return (
                      <div key={address} className="glass rounded-xl p-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-white/40">{name}</p>
                          <p className="font-mono text-sm text-[#fcd34d]">{url}</p>
                        </div>
                        <button
                          onClick={() => handleCopyURL(url)}
                          className="text-xs font-semibold shrink-0"
                          style={{ color: copied === url ? "#4ade80" : "#06d6f0" }}
                        >
                          {copied === url ? "✓" : "Copy"}
                        </button>
                      </div>
                    );
                  })}
                  <p className="text-xs text-white/30">
                    Note: Local addresses only work when running the app locally (not on Replit).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CREATE tab */}
        {tab === "create" && (
          <div className="glass-bright rounded-2xl p-5 space-y-4">
            <p className="text-sm text-white/50">
              Host the room. Share the code with your friend so they can join.
            </p>
            <button onClick={handleCreate} className="btn-neon w-full py-4 rounded-2xl">
              🚀 Create Room
            </button>
          </div>
        )}

        {/* JOIN tab */}
        {tab === "join" && (
          <div className="glass-bright rounded-2xl p-5 space-y-4">
            <p className="text-sm text-white/50">Enter the room code from the host device.</p>
            <input
              type="text"
              maxLength={8}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              onKeyDown={e => e.key === "Enter" && handleJoin()}
              placeholder="ROOM CODE"
              className="input-neon w-full rounded-xl px-4 py-3 text-2xl font-mono tracking-[0.3em] text-center uppercase"
            />
            <button
              onClick={handleJoin}
              disabled={joinCode.trim().length < 4}
              className="btn-neon w-full py-4 rounded-2xl"
            >
              Join Room
            </button>
          </div>
        )}

        <button onClick={() => navigate("/")} className="btn-ghost w-full py-3 rounded-2xl text-sm">
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
        style={{ background: "rgba(6,214,240,0.15)", color: "#06d6f0", border: "1px solid rgba(6,214,240,0.3)" }}>
        {n}
      </span>
      <span>{text}</span>
    </div>
  );
}
