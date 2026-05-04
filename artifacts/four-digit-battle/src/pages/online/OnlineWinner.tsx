import { useOnline } from "@/context/OnlineContext";
import { useLocation } from "wouter";

export default function OnlineWinner() {
  const { state, actions } = useOnline();
  const [, navigate]       = useLocation();

  const myNum  = state.playerNum;
  const winner = state.winner;
  const iWon   = winner === myNum;

  const myName     = (myNum  ? state.playerNames[String(myNum)  as "1"|"2"] : null) ?? `Player ${myNum}`;
  const winnerName = (winner ? state.playerNames[String(winner) as "1"|"2"] : null) ?? `Player ${winner}`;

  const p1Count = state.history.filter(h => h.playerNum === 1).length;
  const p2Count = state.history.filter(h => h.playerNum === 2).length;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">

        <div className="flex justify-center">
          <div
            className={`w-28 h-28 rounded-3xl flex items-center justify-center text-6xl select-none ${iWon ? "glow-gold" : "glass"}`}
            style={iWon ? { background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.25)" } : undefined}>
            {iWon ? "🏆" : "😔"}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">
            {iWon ? "You cracked the code!" : "Better luck next time!"}
          </p>
          <h1 className="text-5xl font-black tracking-tight text-white"
            style={{ textShadow: iWon ? "0 0 40px rgba(255,215,0,0.5)" : "none" }}>
            {iWon ? "You Win!" : `${winnerName} Wins!`}
          </h1>
          <p className="text-white/40 text-sm">
            {iWon
              ? `You cracked the code, ${myName}!`
              : `${winnerName} cracked your code.`}
          </p>
        </div>

        {/* Score summary */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-widest">Final Scores</p>
          <div className="flex gap-3">
            {([1, 2] as const).map(pNum => {
              const count    = pNum === 1 ? p1Count : p2Count;
              const isWinner = winner === pNum;
              const pName    = state.playerNames[String(pNum) as "1"|"2"] ?? `Player ${pNum}`;
              return (
                <div key={pNum}
                  className={`flex-1 rounded-xl px-3 py-3 text-center ${isWinner ? (pNum === 1 ? "p1-card" : "p2-card") : "glass"}`}>
                  <p className="text-xs text-white/50 mb-0.5 truncate">{pName}</p>
                  {pNum === myNum && <p className="text-xs text-white/30 mb-1">(You)</p>}
                  <p className="text-2xl font-black text-white">{count}</p>
                  <p className="text-xs text-white/40">guess{count !== 1 ? "es" : ""}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={() => actions.restartGame()} className="btn-neon w-full py-4 rounded-2xl text-lg">
            🔄 Play Again
          </button>
          <button onClick={() => { actions.leaveRoom(); navigate("/"); }} className="btn-ghost w-full py-3 rounded-2xl text-sm">
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
