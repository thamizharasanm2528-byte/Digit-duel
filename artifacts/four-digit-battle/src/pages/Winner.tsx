import { useLocation } from "wouter";

interface WinnerProps {
  winner: 1 | 2 | null;
  p1Secret: string;
  p2Secret: string;
  p1Name: string;
  p2Name: string;
  onRestart: () => void;
}

const W = {
  1: { glow: "rgba(6,214,240,0.4)",   card: "p1-card", badge: "p1-badge" },
  2: { glow: "rgba(192,132,252,0.4)", card: "p2-card", badge: "p2-badge" },
};

export default function Winner({ winner, p1Secret, p2Secret, p1Name, p2Name, onRestart }: WinnerProps) {
  const [, navigate] = useLocation();
  if (!winner) { navigate("/"); return null; }

  const c          = W[winner];
  const winnerName = winner === 1 ? p1Name : p2Name;
  const loserName  = winner === 1 ? p2Name : p1Name;

  function handleRestart() { onRestart(); navigate("/setup"); }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">

        <div className="flex justify-center">
          <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-6xl select-none glow-gold"
            style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.25)" }}>
            🏆
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Code Cracked!</p>
          <h1 className="text-5xl font-black tracking-tight text-white"
            style={{ textShadow: `0 0 40px ${c.glow}` }}>
            {winnerName} Wins!
          </h1>
          <p className="text-white/50 text-sm">
            {winnerName} cracked {loserName}'s secret code.
          </p>
        </div>

        <div className="glass rounded-2xl p-5 space-y-3 text-left">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Secrets Revealed</p>
          <SecretRow name={p1Name} secret={p1Secret} isWinner={winner === 1} card={W[1].card} badge={W[1].badge} />
          <SecretRow name={p2Name} secret={p2Secret} isWinner={winner === 2} card={W[2].card} badge={W[2].badge} />
        </div>

        <div className="space-y-3">
          <button onClick={handleRestart} className="btn-neon w-full py-4 rounded-2xl text-lg">
            🔄 Play Again
          </button>
          <button onClick={() => navigate("/")} className="btn-ghost w-full py-3 rounded-2xl text-sm">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

function SecretRow({ name, secret, isWinner, card, badge }: {
  name: string; secret: string; isWinner: boolean; card: string; badge: string;
}) {
  return (
    <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${isWinner ? card : "glass"}`}>
      <div className="flex items-center gap-2">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${badge}`}>
          {name[0]?.toUpperCase() ?? "?"}
        </span>
        <span className="text-sm text-white/70 font-medium">{name}</span>
        {isWinner && (
          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: "rgba(255,215,0,0.15)", color: "#fcd34d", border: "1px solid rgba(255,215,0,0.3)" }}>
            👑 Winner
          </span>
        )}
      </div>
      <span className="font-mono text-2xl font-black tracking-[0.2em] text-white">{secret}</span>
    </div>
  );
}
