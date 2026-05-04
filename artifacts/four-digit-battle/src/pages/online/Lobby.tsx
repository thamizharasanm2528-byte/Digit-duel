import { useState } from "react";
import { useLocation } from "wouter";
import { useOnline } from "@/context/OnlineContext";
import { connectSocket } from "@/lib/socket";

const CODE_LENGTHS = [4, 5, 6, 7, 8, 9, 10];

export default function Lobby() {
  const [, navigate]     = useLocation();
  const { state, actions } = useOnline();
  const [tab, setTab]    = useState<"create" | "join">("create");

  // Create fields
  const [createName,   setCreateName]   = useState("");
  const [codeLength,   setCodeLength]   = useState(4);

  // Join fields
  const [joinName,     setJoinName]     = useState("");
  const [joinCode,     setJoinCode]     = useState("");

  function handleCreate() {
    connectSocket();
    actions.createRoom(createName.trim() || "Player 1", codeLength);
  }

  function handleJoin() {
    if (joinCode.trim().length < 4) return;
    connectSocket();
    actions.joinRoom(joinCode, joinName.trim() || "Player 2");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-1">
          <div className="text-4xl mb-3">🌐</div>
          <h2 className="text-2xl font-black text-white">Online Multiplayer</h2>
          <p className="text-white/40 text-sm">Play with a friend anywhere via room code.</p>
        </div>

        {state.error && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
            <span className="shrink-0">⚠️</span>
            <span>{state.error}</span>
          </div>
        )}

        {/* Tab switcher */}
        <div className="glass rounded-2xl p-1 flex gap-1">
          {(["create","join"] as const).map(t => (
            <button key={t}
              onClick={() => { setTab(t); actions.clearError(); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${
                tab === t ? "glass-bright text-white" : "text-white/40 hover:text-white/70"
              }`}>
              {t === "create" ? "Create Room" : "Join Room"}
            </button>
          ))}
        </div>

        {tab === "create" && (
          <div className="glass-bright rounded-2xl p-5 space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">Your name</label>
              <input
                type="text"
                maxLength={24}
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="Enter your name"
                className="input-neon w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>

            {/* Code length */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
                Code length — <span className="text-[#06d6f0]">{codeLength} digits</span>
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {CODE_LENGTHS.map(n => (
                  <button key={n}
                    onClick={() => setCodeLength(n)}
                    className={`flex-1 min-w-8 py-2 rounded-xl text-sm font-bold transition-all ${
                      codeLength === n
                        ? "p1-badge text-white"
                        : "glass text-white/50 hover:text-white/80"
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/30">
                {codeLength === 4 ? "Classic mode" : codeLength <= 6 ? "Medium challenge" : "Expert mode"}
              </p>
            </div>

            <button onClick={handleCreate} className="btn-neon w-full py-4 rounded-2xl">
              🚀 Create Room
            </button>
          </div>
        )}

        {tab === "join" && (
          <div className="glass-bright rounded-2xl p-5 space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">Your name</label>
              <input
                type="text"
                maxLength={24}
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                placeholder="Enter your name"
                className="input-neon w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>

            {/* Room code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">Room code</label>
              <input
                type="text"
                maxLength={8}
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                placeholder="XXXXXX"
                className="input-neon w-full rounded-xl px-4 py-3 text-2xl font-mono tracking-[0.3em] text-center uppercase"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={joinCode.trim().length < 4}
              className="btn-neon w-full py-4 rounded-2xl">
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
