import { useState } from "react";
import { useOnline } from "@/context/OnlineContext";
import { validateSecret } from "@/lib/gameLogic";

export default function OnlineSetup() {
  const { state, actions } = useOnline();
  const [value, setValue]  = useState("");
  const [show, setShow]    = useState(false);
  const [error, setError]  = useState<string | null>(null);

  const myNum       = state.playerNum;
  const iSubmitted  = myNum ? state.secretsSubmitted.includes(myNum) : false;
  const oppNum: 1 | 2  = myNum === 1 ? 2 : 1;
  const oppSubmitted    = state.secretsSubmitted.includes(oppNum);

  const myName  = (myNum  ? state.playerNames[String(myNum)  as "1"|"2"] : null) ?? `Player ${myNum}`;
  const oppName = (oppNum ? state.playerNames[String(oppNum) as "1"|"2"] : null) ?? `Player ${oppNum}`;
  const len     = state.codeLength;

  const c = myNum === 1
    ? { card: "p1-card", badge: "p1-badge", btn: "btn-neon" }
    : { card: "p2-card", badge: "p2-badge", btn: "btn-neon-p2" };

  function handleInput(raw: string) {
    setValue(raw.replace(/\D/g, "").slice(0, len));
    setError(null);
  }

  function handleConfirm() {
    const err = validateSecret(value, len);
    if (err) { setError(err); return; }
    actions.submitSecret(value);
    setError(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-5">

        <div className="text-center space-y-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${c.badge}`}>
            Room: {state.roomCode}
          </span>
          <h2 className="text-2xl font-black text-white">Set Your Secret</h2>
          <p className="text-white/40 text-sm">
            Enter a <strong className="text-white">{len}-digit</strong> code privately. Your opponent cannot see this.
          </p>
        </div>

        {state.error && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
            {state.error}
          </div>
        )}

        {/* Ready chips */}
        <div className="flex gap-3">
          <ReadyChip label={`${myName} (You)`}  ready={iSubmitted}   isMe />
          <ReadyChip label={oppName}             ready={oppSubmitted} isMe={false} />
        </div>

        {!iSubmitted ? (
          <div className="glass-bright rounded-2xl p-5 space-y-4">
            <label className="block text-sm font-semibold text-white/70">
              Your secret {len}-digit number
            </label>

            <div className="relative">
              <input
                type={show ? "text" : "password"}
                inputMode="numeric"
                maxLength={len}
                value={value}
                onChange={e => handleInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && value.length === len && handleConfirm()}
                placeholder={`Enter ${len} digits`}
                autoFocus
                className={`input-neon w-full rounded-xl px-4 py-3 pr-12 text-2xl font-mono tracking-[0.3em] ${error ? "error" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors text-lg"
                tabIndex={-1}>
                {show ? "🙈" : "👁️"}
              </button>
            </div>

            {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

            <button
              onClick={handleConfirm}
              disabled={value.length !== len}
              className={`${c.btn} w-full py-3 rounded-xl font-bold text-sm`}>
              🔒 Lock In Secret
            </button>
          </div>
        ) : (
          <div className={`${c.card} rounded-2xl p-5 space-y-3 text-center`}>
            <div className="text-3xl">🔒</div>
            <p className="text-white font-bold">Secret Locked!</p>
            <div className="glass rounded-xl px-4 py-3">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Your Secret Code</p>
              <span className="font-mono text-3xl font-black tracking-[0.3em] text-white">{state.mySecret}</span>
            </div>
            {!oppSubmitted ? (
              <p className="text-white/40 text-sm animate-pulse">Waiting for {oppName} to set their number…</p>
            ) : (
              <p className="text-sm font-semibold" style={{ color: "#4ade80" }}>Both ready — starting!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReadyChip({ label, ready, isMe }: { label: string; ready: boolean; isMe: boolean }) {
  return (
    <div className={`flex-1 rounded-xl px-3 py-2 flex items-center justify-between ${isMe ? "glass-bright" : "glass"}`}>
      <span className="text-xs text-white/60 font-medium truncate">{label}</span>
      <span className={`text-xs font-bold ml-2 shrink-0 ${ready ? "text-green-400" : "text-white/30"}`}>
        {ready ? "✓" : "…"}
      </span>
    </div>
  );
}
