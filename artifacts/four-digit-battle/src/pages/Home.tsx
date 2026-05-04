import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-7">

        {/* Logo + Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center text-5xl select-none"
              style={{ boxShadow: "0 0 30px rgba(6,214,240,0.25), 0 0 60px rgba(6,214,240,0.1)" }}>
              🎯
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white"
              style={{ textShadow: "0 0 30px rgba(6,214,240,0.4)" }}>
              4 Digit Battle
            </h1>
            <p className="mt-2 text-sm text-white/50 leading-relaxed">
              Think of a secret 4-digit number.<br />
              Crack your opponent's code first to win.
            </p>
          </div>
        </div>

        {/* How to play */}
        <div className="glass rounded-2xl p-4 space-y-2 text-sm">
          <p className="font-semibold text-white/80 mb-2">How to play</p>
          <div className="flex items-center gap-2.5">
            <span className="badge-found rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
            <span className="text-white/60"><span className="text-green-400 font-semibold">Found</span> — right digit, right position</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-xs text-white/30 shrink-0">✕</span>
            <span className="text-white/60">Nothing — digit not in the number</span>
          </div>
        </div>


        {/* Mode selection */}
        <div className="space-y-3">
          <p className="text-xs text-white/30 font-semibold uppercase tracking-widest text-center">Choose Mode</p>

          {/* Offline */}
          <ModeCard
            icon="🎮"
            title="Same Device"
            subtitle="Pass-and-play offline on one device"
            onClick={() => navigate("/setup")}
            color="p1"
          />

          {/* Online Room Code */}
          <ModeCard
            icon="🌐"
            title="Online — Room Code"
            subtitle="Play with a friend anywhere via room code"
            onClick={() => navigate("/online")}
            color="p2"
          />

          {/* Local Hotspot */}
          <ModeCard
            icon="📡"
            title="Local Hotspot"
            subtitle="Same Wi-Fi or mobile hotspot — show host IP"
            onClick={() => navigate("/hotspot")}
            color="gold"
          />
        </div>
      </div>
    </div>
  );
}

type CardColor = "p1" | "p2" | "gold";

function ModeCard({ icon, title, subtitle, onClick, color }: {
  icon: string; title: string; subtitle: string; onClick: () => void; color: CardColor;
}) {
  const styles: Record<CardColor, { bg: string; border: string; glow: string; text: string }> = {
    p1:   { bg: "rgba(6,214,240,0.06)",   border: "rgba(6,214,240,0.25)",   glow: "rgba(6,214,240,0.15)",   text: "#06d6f0" },
    p2:   { bg: "rgba(168,85,247,0.06)",  border: "rgba(168,85,247,0.25)",  glow: "rgba(168,85,247,0.15)",  text: "#c084fc" },
    gold: { bg: "rgba(251,191,36,0.06)",  border: "rgba(251,191,36,0.25)",  glow: "rgba(251,191,36,0.15)",  text: "#fcd34d" },
  };
  const s = styles[color];

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl p-4 text-left flex items-center gap-4 transition-all duration-200 active:scale-[0.97]"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: `0 0 20px ${s.glow}`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 35px ${s.glow}`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${s.glow}`; }}
    >
      <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-2xl shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-bold text-white text-sm">{title}</p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{subtitle}</p>
      </div>
      <span className="text-lg shrink-0" style={{ color: s.text }}>›</span>
    </button>
  );
}
