import { useState, useEffect, useRef } from "react";
import { useOnline } from "@/context/OnlineContext";
import type { OnlineGuessEntry } from "@/context/OnlineContext";
import type { DigitColor } from "@/lib/gameLogic";
import CountdownRing from "@/components/CountdownRing";
import DigitBoxInput from "@/components/DigitBoxInput";
import { playTick, playBuzzer, playWin } from "@/lib/sounds";

const TURN_SECONDS = 60;

const P_STYLES = {
  1: { card: "p1-card", badge: "p1-badge", btn: "btn-neon",    hex: "#06d6f0" },
  2: { card: "p2-card", badge: "p2-badge", btn: "btn-neon-p2", hex: "#c084fc" },
};

function getCrackedPositions(history: OnlineGuessEntry[], playerNum: 1 | 2): (string | null)[] {
  const myGuesses = history.filter(h => h.playerNum === playerNum);
  const len       = myGuesses[0]?.guess.length ?? 4;
  const cracked: (string | null)[] = Array(len).fill(null);
  for (const entry of myGuesses) {
    entry.colors.forEach((color, i) => {
      if (color === "found") cracked[i] = entry.guess[i];
    });
  }
  return cracked;
}

export default function OnlineGame() {
  const { state, actions } = useOnline();
  const [guess, setGuess]       = useState("");
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [skipping, setSkipping] = useState(false);
  const skippedRef = useRef(false);

  const myNum    = state.playerNum!;
  const isMyTurn = state.currentTurn === myNum;
  const len      = state.codeLength;

  const myStyle   = P_STYLES[myNum];
  const turnStyle = P_STYLES[state.currentTurn];

  const p1History = state.history.filter(h => h.playerNum === 1);
  const p2History = state.history.filter(h => h.playerNum === 2);
  const crackedPositions = getCrackedPositions(state.history, myNum);

  const myKey    = String(myNum) as "1" | "2";
  const oppNum: 1 | 2  = myNum === 1 ? 2 : 1;
  const oppKey   = String(oppNum) as "1" | "2";
  const turnKey  = String(state.currentTurn) as "1" | "2";
  const myName   = state.playerNames[myKey]   ?? `Player ${myNum}`;
  const oppName  = state.playerNames[oppKey]  ?? `Player ${oppNum}`;
  const turnName = state.playerNames[turnKey] ?? `Player ${state.currentTurn}`;

  useEffect(() => {
    setTimeLeft(TURN_SECONDS);
    setSkipping(false);
    skippedRef.current = false;
    const id = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1;
        if (next <= 0) { clearInterval(id); return 0; }
        if (next <= 10) playTick(next <= 5);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.currentTurn]);

  useEffect(() => {
    if (timeLeft === 0 && isMyTurn && !skippedRef.current && state.phase === "playing") {
      skippedRef.current = true;
      setSkipping(true);
      playBuzzer();
      actions.skipTurn();
    } else if (timeLeft === 0 && !isMyTurn) {
      playBuzzer();
    }
  }, [timeLeft, isMyTurn, state.phase, actions]);

  useEffect(() => { if (state.winner) playWin(); }, [state.winner]);

  function handleInput(val: string) { setGuess(val); actions.clearError(); }

  function handleSubmit() {
    if (guess.length !== len || !isMyTurn || skipping) return;
    actions.makeGuess(guess);
    setGuess("");
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-sm space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs text-white/30 font-mono block">Room {state.roomCode}</span>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${turnStyle.badge}`}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: turnStyle.hex }} />
              {isMyTurn ? "Your Turn — Guess!" : `${turnName} is guessing…`}
            </div>
            <p className="text-white/40 text-xs pl-1">
              You are <strong className="text-white">{myName}</strong>
              {" · "}guessing <strong className="text-white">{oppName}</strong>'s {len}-digit code
            </p>
          </div>
          <CountdownRing seconds={timeLeft} total={TURN_SECONDS} size={68} />
        </div>

        {skipping && (
          <div className="rounded-xl px-4 py-3 text-center font-bold text-sm"
            style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.35)", color: "#f87171" }}>
            ⏰ Time's up! Passing turn…
          </div>
        )}

        {/* Own secret */}
        {state.mySecret && (
          <div className={`${myStyle.card} rounded-xl px-4 py-3 flex items-center justify-between`}>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Your Secret Code</p>
              <span className="font-mono text-2xl font-black tracking-[0.25em] text-white">{state.mySecret}</span>
            </div>
            <span className="text-xl">🔒</span>
          </div>
        )}

        {/* Cracked positions */}
        <CrackedProgress crackedPositions={crackedPositions} player={myNum} codeLength={len} />

        {/* Guess input */}
        <div className={`rounded-2xl p-4 space-y-4 transition-opacity ${isMyTurn && !skipping ? "glass-bright" : "glass opacity-50"}`}>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
            {isMyTurn && !skipping ? `Enter your ${len}-digit guess` : "Wait for your turn…"}
          </label>
          {state.error && <p className="text-red-400 text-sm font-medium">{state.error}</p>}
          <DigitBoxInput
            value={guess}
            onChange={handleInput}
            codeLength={len}
            crackedPositions={crackedPositions}
            player={myNum}
            disabled={!isMyTurn || skipping}
            autoFocus={isMyTurn}
          />
          <button
            onClick={handleSubmit}
            disabled={!isMyTurn || guess.length !== len || skipping}
            className={`w-full py-3 rounded-xl font-bold text-sm ${myStyle.btn}`}>
            Submit Guess
          </button>
        </div>

        {/* Side-by-side histories */}
        <div className="grid grid-cols-2 gap-3">
          <HistoryCol label={state.playerNames["1"] ?? "Player 1"} history={p1History} isMe={myNum === 1} />
          <HistoryCol label={state.playerNames["2"] ?? "Player 2"} history={p2History} isMe={myNum === 2} />
        </div>

        <button onClick={() => actions.leaveRoom()} className="btn-ghost w-full py-3 rounded-2xl text-sm">
          Leave Room
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
  const boxSz  = codeLength <= 6 ? "w-11 h-11 text-lg" : codeLength <= 8 ? "w-9 h-9 text-base" : "w-7 h-7 text-sm";

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
                background: dim, border: `2px solid ${neon}`, color: neon, boxShadow: `0 0 12px ${glow}`,
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

function HistoryCol({ label, history, isMe }: { label: string; history: OnlineGuessEntry[]; isMe: boolean }) {
  return (
    <div className="space-y-2">
      <p className={`text-xs font-bold uppercase tracking-wider px-1 truncate max-w-full ${isMe ? "text-[#06d6f0]" : "text-[#c084fc]"}`}>
        {label}{isMe && " (You)"}
      </p>
      {history.length === 0 ? (
        <div className="glass rounded-xl px-3 py-4 text-center text-white/30 text-xs">No guesses</div>
      ) : (
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {history.map((e, i) => (
            <div key={i} className="glass rounded-xl px-2 py-2 space-y-1.5">
              <div className="flex gap-0.5 justify-center flex-wrap">
                {e.colors.map((color, pos) => (
                  <DigitColorBox key={pos} digit={e.guess[pos]} color={color} />
                ))}
              </div>
              <div className="text-center">
                <span className="badge-found inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold">
                  {e.found}✓
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DigitColorBox({ digit, color }: { digit: string; color: DigitColor }) {
  const found = color === "found";
  return (
    <div className="w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-black transition-all"
      style={found
        ? { background: "rgba(34,197,94,0.18)", border: "1.5px solid rgba(34,197,94,0.6)", color: "#4ade80", boxShadow: "0 0 6px rgba(34,197,94,0.4)" }
        : { background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
      }>
      {digit}
    </div>
  );
}
