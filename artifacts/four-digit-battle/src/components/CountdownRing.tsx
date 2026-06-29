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
    trackColor = "#16a34a"; // green
    glowColor = "rgba(22,163,74,0.2)";
    textColor = "#16a34a";
  } else if (progress > 0.25) {
    trackColor = "#d97706"; // amber
    glowColor = "rgba(217,119,6,0.2)";
    textColor = "#d97706";
  } else {
    trackColor = "#dc2626"; // red
    glowColor = "rgba(220,38,38,0.2)";
    textColor = "#dc2626";
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
          stroke="rgba(15,23,42,0.08)"
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
