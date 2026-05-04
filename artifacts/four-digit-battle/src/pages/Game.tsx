import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { evaluateGuess, validateSecret, type GuessResult, type DigitColor } from "@/lib/gameLogic";
import CountdownRing from "@/components/CountdownRing";
import DigitBoxInput from "@/components/DigitBoxInput";
import { playTick, playBuzzer, playWin } from "@/lib/sounds";

const TURN_SECONDS = 60;

interface GameProps {
  p1Secret: string;
  p2Secret: string;
  p1Name: string;
  p2Name: string;
  codeLength: number;
  onWin: (winner: 1 | 2) => void;
}

const P = {
  1: { card: "p1-card", badge: "p1-badge", btn: "btn-neon",    hex: "#06d6f0", glow: "rgba(6,214,240,0.3)"  },
  2: { card: "p2-card", badge: "p2-badge", btn: "btn-neon-p2", hex: "#c084fc", glow: "rgba(192,132,252,0.3)" },
};

function getCrackedPositions(history: GuessResult[]): (string | null)[] {
  const len = history[0]?.guess.length ?? 4;
  const cracked: (string | null)[] = Array(len).fill(null);
  for (const entry of history) {
    entry.colors.forEach((color, i) => {
      if (color === "found") cracked[i] = entry.guess[i];
    });
  }
  return cracked;
}

export default function Game({ p1Secret, p2Secret, p1Name, p2Name, codeLength, onWin }: GameProps) {
  const [, navigate]    = useLocation();
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [guess, setGuess]             = useState("");
  const [guessError, setGuessError]   = useState<string | null>(null);
  const [p1History, setP1History]     = useState<GuessResult[]>([]);
  const [p2History, setP2History]     = useState<GuessResult[]>([]);
  const [timeLeft, setTimeLeft]       = useState(TURN_SECONDS);
  const [timesUp, setTimesUp]         = useState(false);

  const mySecret     = currentTurn === 1 ? p1Secret : p2Secret;
  const targetSecret = currentTurn === 1 ? p2Secret : p1Secret;
  const history      = currentTurn === 1 ? p1History : p2History;
  const oppTurn: 1 | 2 = currentTurn === 1 ? 2 : 1;
  const c            = P[currentTurn];
  const currentName  = currentTurn === 1 ? p1Name : p2Name;
  const oppName      = currentTurn === 1 ? p2Name : p1Name;

  const crackedPositions = getCrackedPositions(history);

  const switchTurn = useCallback(() => {
    setGuess("");
    setGuessError(null);
    setCurrentTurn(t => t === 1 ? 2 : 1);
    setTimeLeft(TURN_SECONDS);
  }, []);

  useEffect(() => {
    setTimeLeft(TURN_SECONDS);
    setTimesUp(false);
    const id = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1;
        if (next <= 0) { clearInterval(id); setTimesUp(true); return 0; }
        if (next <= 10) playTick(next <= 5);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [currentTurn]);

  useEffect(() => {
    if (!timesUp) return;
    playBuzzer();
    const id = setTimeout(() => { setTimesUp(false); switchTurn(); }, 1200);
    return () => clearTimeout(id);
  }, [timesUp, switchTurn]);

  function handleInput(val: string) { setGuess(val); setGuessError(null); }

  function handleSubmit() {
    if (timesUp) return;
    const err = validateSecret(guess, codeLength);
    if (err) { setGuessError(err); return; }

    const result = evaluateGuess(targetSecret, guess);

    if (currentTurn === 1) {
      setP1History(h => [result, ...h]);
      if (result.found === codeLength) { playWin(); onWin(1); navigate("/winner"); return; }
    } else {
      setP2History(h => [result, ...h]);
      if (result.found === codeLength) { playWin(); onWin(2); navigate("/winner"); return; }
    }
    switchTurn();
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-sm space-y-4">

        {/* Turn header + timer */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm ${c.badge}`}
              style={{ boxShadow: `0 0 14px ${c.glow}` }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: c.hex }} />
              {currentName}'s Turn
            </div>
            <p className="text-white/40 text-xs pl-1">
              Guessing <strong className="text-white">{oppName}</strong>'s {codeLength}-digit code
            </p>
          </div>
          <CountdownRing seconds={timeLeft} total={TURN_SECONDS} size={68} />
        </div>

        {timesUp && (
          <div className="rounded-xl px-4 py-3 text-center font-bold text-sm"
            style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.35)", color: "#f87171" }}>
            ⏰ Time's up! Switching turns…
          </div>
        )}

        {/* Own secret */}
        <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${c.card}`}>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Your Secret Code</p>
            <span className="font-mono text-2xl font-black tracking-[0.25em] text-white">{mySecret}</span>
          </div>
          <span className="text-xl">🔒</span>
        </div>

        {/* Cracked positions */}
        <CrackedProgress crackedPositions={crackedPositions} player={currentTurn} codeLength={codeLength} />

        {/* 4-box guess input */}
        <div className="glass-bright rounded-2xl p-4 space-y-4">
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider">
            Enter your {codeLength}-digit guess
          </label>
          <DigitBoxInput
            value={guess}
            onChange={handleInput}
            codeLength={codeLength}
            crackedPositions={crackedPositions}
            player={currentTurn}
            disabled={timesUp}
            autoFocus
          />
          {guessError && <p className="text-red-400 text-sm text-center">{guessError}</p>}
          <button
            onClick={handleSubmit}
            disabled={guess.length !== codeLength || timesUp}
            className={`w-full py-3 rounded-xl font-bold text-sm ${c.btn}`}>
            Submit Guess
          </button>
        </div>

        {/* Guess history */}
        {history.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest px-1">
              {currentName}'s Guesses
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((entry, i) => (
                <ColoredGuessRow key={i} entry={entry} index={history.length - i} />
              ))}
            </div>
          </div>
        )}

        {/* Score chips */}
        <div className="flex gap-3">
          {([1, 2] as const).map(p => {
            const name  = p === 1 ? p1Name : p2Name;
            const count = (p === 1 ? p1History : p2History).length;
            return (
              <div key={p} className={`flex-1 rounded-xl px-3 py-2 flex items-center justify-between transition-all ${currentTurn === p ? P[p].card : "glass"}`}>
                <span className={`text-xs font-semibold truncate ${currentTurn === p ? "text-white" : "text-white/40"}`}>{name}</span>
                <span className={`text-xs font-bold ml-1 shrink-0 ${currentTurn === p ? "text-white" : "text-white/50"}`}>
                  {count}g
                </span>
              </div>
            );
          })}
        </div>

        <button onClick={() => navigate("/")} className="btn-ghost w-full py-3 rounded-2xl text-sm">
          ← Quit Game
        </button>
      </div>
    </div>
  );
}

function CrackedProgress({ crackedPositions, player, codeLength }: {
  crackedPositions: (string | null)[];
  player: 1 | 2;
  codeLength: number;
}) {
  const hasAny = crackedPositions.some(p => p !== null);
  const neon   = player === 1 ? "#06d6f0" : "#c084fc";
  const glow   = player === 1 ? "rgba(6,214,240,0.4)"  : "rgba(192,132,252,0.4)";
  const dim    = player === 1 ? "rgba(6,214,240,0.12)" : "rgba(192,132,252,0.12)";
  const boxSz  = codeLength <= 6 ? "w-12 h-12 text-xl" : codeLength <= 8 ? "w-10 h-10 text-lg" : "w-8 h-8 text-base";

  return (
    <div className="glass rounded-xl px-4 py-3 space-y-2">
      <p className="text-xs text-white/40 uppercase tracking-wider">
        Cracked {hasAny ? `(${crackedPositions.filter(Boolean).length}/${codeLength})` : ""}
      </p>
      <div className="flex gap-1.5 justify-center flex-wrap">
        {Array.from({ length: codeLength }, (_, i) => {
          const digit = crackedPositions[i];
          return (
            <div key={i}
              className={`${boxSz} rounded-xl flex items-center justify-center font-mono font-black transition-all duration-300`}
              style={digit ? {
                background: dim, border: `2px solid ${neon}`, color: neon, boxShadow: `0 0 16px ${glow}`,
              } : {
                background: "rgba(255,255,255,0.03)",
                border: "2px solid rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.15)",
              }}>
              {digit ?? "·"}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ColoredGuessRow({ entry, index }: { entry: GuessResult; index: number }) {
  return (
    <div className="glass rounded-xl px-3 py-3 flex items-center gap-3">
      <span className="text-xs text-white/30 w-5 text-right shrink-0">#{index}</span>
      <div className="flex gap-1 flex-1 flex-wrap">
        {entry.colors.map((color, i) => (
          <DigitColorBox key={i} digit={entry.guess[i]} color={color} />
        ))}
      </div>
      <span className="badge-found inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-bold shrink-0">
        {entry.found}✓
      </span>
    </div>
  );
}

function DigitColorBox({ digit, color }: { digit: string; color: DigitColor }) {
  const found = color === "found";
  return (
    <div className="w-9 h-9 rounded-lg flex items-center justify-center font-mono text-sm font-black transition-all"
      style={found
        ? { background: "rgba(34,197,94,0.18)", border: "1.5px solid rgba(34,197,94,0.6)", color: "#4ade80", boxShadow: "0 0 10px rgba(34,197,94,0.4)" }
        : { background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
      }>
      {digit}
    </div>
  );
}
