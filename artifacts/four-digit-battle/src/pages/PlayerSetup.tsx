import { useState } from "react";
import { useLocation } from "wouter";
import { validateSecret } from "@/lib/gameLogic";

const CODE_LENGTHS = [4, 5, 6, 7, 8, 9, 10];

interface PlayerSetupProps {
  onStart: (p1Secret: string, p2Secret: string, p1Name: string, p2Name: string, codeLength: number) => void;
}

interface FieldState {
  name: string;
  value: string;
  show: boolean;
  error: string | null;
  locked: boolean;
}

const defaultField = (name: string): FieldState => ({ name, value: "", show: false, error: null, locked: false });

export default function PlayerSetup({ onStart }: PlayerSetupProps) {
  const [, navigate]  = useLocation();
  const [codeLength,  setCodeLength]  = useState(4);
  const [p1, setP1]   = useState<FieldState>(defaultField(""));
  const [p2, setP2]   = useState<FieldState>(defaultField(""));

  const step = p1.locked ? (p2.locked ? 2 : 1) : 0;

  function handleInput(setter: React.Dispatch<React.SetStateAction<FieldState>>, raw: string) {
    setter(prev => ({ ...prev, value: raw.replace(/\D/g, "").slice(0, codeLength), error: null }));
  }

  function confirmPlayer(state: FieldState, setter: React.Dispatch<React.SetStateAction<FieldState>>) {
    const err = validateSecret(state.value, codeLength);
    if (err) { setter(prev => ({ ...prev, error: err ?? null })); return; }
    setter(prev => ({ ...prev, locked: true, show: false, error: null }));
  }

  function handleBegin() {
    onStart(p1.value, p2.value, p1.name || "Player 1", p2.name || "Player 2", codeLength);
    navigate("/game");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-5">

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-white">Player Setup</h2>
          <p className="text-white/50 text-sm">Each player sets a secret code privately.</p>
        </div>

        {/* Code length selector — only before anyone locks in */}
        {step === 0 && (
          <div className="glass-bright rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
              Code length — <span className="text-[#06d6f0] font-black">{codeLength} digits</span>
            </label>
            <div className="flex gap-1.5">
              {CODE_LENGTHS.map(n => (
                <button key={n}
                  onClick={() => setCodeLength(n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                    codeLength === n ? "p1-badge text-white" : "glass text-white/50 hover:text-white/80"
                  }`}>
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30 text-center">
              {codeLength === 4 ? "Classic mode" : codeLength <= 6 ? "Medium challenge" : "Expert mode"}
            </p>
          </div>
        )}

        {/* Progress */}
        <div className="flex gap-2">
          {[0, 1].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              (i === 0 && p1.locked) || (i === 1 && p2.locked)
                ? i === 0 ? "bg-[var(--p1)]" : "bg-[var(--p2)]"
                : i === step ? "bg-white/20" : "bg-white/8"
            }`} />
          ))}
        </div>

        {/* Player 1 */}
        <SetupCard
          player={1}
          state={p1}
          codeLength={codeLength}
          active={step === 0}
          onNameChange={name => setP1(p => ({ ...p, name }))}
          onInput={val => handleInput(setP1, val)}
          onToggleShow={() => setP1(p => ({ ...p, show: !p.show }))}
          onConfirm={() => confirmPlayer(p1, setP1)}
        />

        {step >= 1 && (
          <SetupCard
            player={2}
            state={p2}
            codeLength={codeLength}
            active={step === 1}
            onNameChange={name => setP2(p => ({ ...p, name }))}
            onInput={val => handleInput(setP2, val)}
            onToggleShow={() => setP2(p => ({ ...p, show: !p.show }))}
            onConfirm={() => confirmPlayer(p2, setP2)}
          />
        )}

        {step === 2 && (
          <button onClick={handleBegin} className="btn-neon w-full py-4 rounded-2xl text-lg">
            ⚔️ Begin Battle!
          </button>
        )}

        <button onClick={() => navigate("/")} className="btn-ghost w-full py-3 rounded-2xl text-sm">
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

interface SetupCardProps {
  player: 1 | 2;
  state: FieldState;
  codeLength: number;
  active: boolean;
  onNameChange: (val: string) => void;
  onInput: (val: string) => void;
  onToggleShow: () => void;
  onConfirm: () => void;
}

const P_COLORS = {
  1: { card: "p1-card", badge: "p1-badge", defaultName: "Player 1", btn: "btn-neon" },
  2: { card: "p2-card", badge: "p2-badge", defaultName: "Player 2", btn: "btn-neon-p2" },
};

function SetupCard({ player, state, codeLength, active, onNameChange, onInput, onToggleShow, onConfirm }: SetupCardProps) {
  const c = P_COLORS[player];
  const displayName = state.name.trim() || c.defaultName;

  return (
    <div className={`rounded-2xl p-5 space-y-4 transition-all duration-300 ${
      state.locked ? c.card : active ? "glass-bright" : "glass opacity-50"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${c.badge}`}>
            {player}
          </span>
          <span className="font-bold text-white text-sm">{displayName}</span>
        </div>
        {state.locked && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.badge}`}>✓ Ready</span>
        )}
      </div>

      {state.locked ? (
        <div className="space-y-1">
          <p className="text-xs text-white/40 uppercase tracking-wider">Your Secret Code</p>
          <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${c.card}`}>
            <span className="font-mono text-3xl font-black tracking-[0.3em] text-white">{state.value}</span>
            <span className="text-xs text-white/40">🔒 locked</span>
          </div>
          <p className="text-xs text-white/30 mt-1">
            Hand device to {player === 1 ? "Player 2" : "your opponent"}.
          </p>
        </div>
      ) : (
        <>
          {/* Name input */}
          <div className="space-y-1">
            <label className="block text-xs text-white/40 uppercase tracking-wider">Name</label>
            <input
              type="text"
              maxLength={24}
              value={state.name}
              onChange={e => onNameChange(e.target.value)}
              placeholder={c.defaultName}
              className="input-neon w-full rounded-xl px-3 py-2 text-sm"
            />
          </div>

          {/* Secret input */}
          <div className="relative">
            <input
              type={state.show ? "text" : "password"}
              inputMode="numeric"
              maxLength={codeLength}
              value={state.value}
              onChange={e => onInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && state.value.length === codeLength && onConfirm()}
              placeholder={`Enter ${codeLength} digits`}
              autoFocus={active}
              className={`input-neon w-full rounded-xl px-4 py-3 pr-12 text-2xl font-mono tracking-[0.3em] ${state.error ? "error" : ""}`}
            />
            <button type="button" onClick={onToggleShow}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors text-lg"
              tabIndex={-1}>
              {state.show ? "🙈" : "👁️"}
            </button>
          </div>

          {state.error && <p className="text-red-400 text-sm font-medium">{state.error}</p>}

          <button
            onClick={onConfirm}
            disabled={state.value.length !== codeLength}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${c.btn}`}>
            Lock In Secret
          </button>
        </>
      )}
    </div>
  );
}
