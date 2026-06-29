import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useOnline } from "@/context/OnlineContext";

export default function WaitingRoom() {
  const [, navigate]       = useLocation();
  const { state, actions } = useOnline();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state.phase === "setup") navigate("/online/setup");
  }, [state.phase, navigate]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(state.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  }

  const myName = state.playerNames["1"] ?? "You";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-7 text-center">

        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center text-4xl"
            style={{ animation: "pulse 2s ease-in-out infinite", boxShadow: "0 10px 30px rgba(2, 132, 199, 0.15)" }}>
            ⏳
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Waiting for opponent…</h2>
          <p className="text-white/40 text-sm">Share the room code with your friend.</p>
          <p className="text-white/30 text-xs">
            Code: <span className="text-[#0284c7] font-bold">{state.codeLength} digits</span>
          </p>
        </div>

        {/* Room code */}
        <div className="p1-card rounded-2xl p-6 space-y-3"
          style={{ boxShadow: "0 8px 30px rgba(2, 132, 199, 0.08)" }}>
          <p className="text-xs text-white/40 uppercase tracking-widest">Room Code</p>
          <div className="font-mono text-5xl font-black tracking-[0.25em] text-white select-all">
            {state.roomCode}
          </div>
          <button
            onClick={handleCopy}
            className="text-sm font-semibold transition-colors"
            style={{ color: copied ? "#16a34a" : "#0284c7" }}>
            {copied ? "✓ Copied!" : "📋 Copy code"}
          </button>
        </div>

        {/* Player status */}
        <div className="flex gap-3 justify-center">
          <div className="flex items-center gap-2 glass rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full" style={{ background: "#0284c7" }} />
            <span className="text-xs text-white/70 font-medium">{myName} — connected</span>
          </div>
          <div className="flex items-center gap-2 glass rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse" />
            <span className="text-xs text-white/40">Opponent — waiting</span>
          </div>
        </div>

        <button onClick={() => { actions.leaveRoom(); navigate("/"); }}
          className="btn-ghost w-full py-3 rounded-2xl text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}
