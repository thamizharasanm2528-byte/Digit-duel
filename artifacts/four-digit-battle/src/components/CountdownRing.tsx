// Circular countdown timer ring — SVG-based, color-shifts as time runs low.
interface CountdownRingProps {
  seconds: number; // remaining seconds
  total: number;   // total seconds (e.g. 60)
  size?: number;   // diameter in px (default 72)
}

export default function CountdownRing({ seconds, total, size = 72 }: CountdownRingProps) {
  const stroke = 5;
  const r = (size - stroke * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.max(0, seconds / total);
  const dashOffset = circumference * (1 - progress);

  // Color transitions: green → yellow → red
  let trackColor: string;
  let glowColor: string;
  let textColor: string;
  let urgent = false;

  if (progress > 0.5) {
    trackColor = "#4ade80"; // green
    glowColor = "rgba(74,222,128,0.5)";
    textColor = "#4ade80";
  } else if (progress > 0.25) {
    trackColor = "#fcd34d"; // yellow
    glowColor = "rgba(252,211,77,0.5)";
    textColor = "#fcd34d";
  } else {
    trackColor = "#f87171"; // red
    glowColor = "rgba(248,113,113,0.5)";
    textColor = "#f87171";
    urgent = seconds > 0;
  }

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size, animation: urgent ? "pulse 0.8s ease-in-out infinite" : "none" }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        {/* Countdown arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 1s linear, stroke 0.5s ease",
            filter: `drop-shadow(0 0 6px ${glowColor})`,
          }}
        />
      </svg>

      {/* Center number */}
      <span
        className="absolute font-black tabular-nums leading-none"
        style={{
          fontSize: size * 0.3,
          color: textColor,
          textShadow: `0 0 12px ${glowColor}`,
        }}
      >
        {seconds}
      </span>
    </div>
  );
}
