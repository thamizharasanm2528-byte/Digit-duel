// Variable-length digit box input (4-10 boxes).
// Auto-advances focus on entry; backspace navigates back.
import { useRef, useEffect } from "react";

interface DigitBoxInputProps {
  value: string;                     // 0..codeLength chars
  onChange: (val: string) => void;
  codeLength?: number;               // 4-10, default 4
  crackedPositions?: (string | null)[];
  player?: 1 | 2;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function DigitBoxInput({
  value,
  onChange,
  codeLength = 4,
  crackedPositions,
  player = 1,
  disabled = false,
  autoFocus = false,
}: DigitBoxInputProps) {
  const cracked = crackedPositions ?? Array(codeLength).fill(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(codeLength).fill(null));

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const firstEmpty = Array.from({ length: codeLength }, (_, i) => i).find(i => !value[i]);
    inputRefs.current[firstEmpty ?? 0]?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, disabled, codeLength]);

  const neonColor   = player === 1 ? "var(--p1)" : "var(--p2)";
  const crackColor  = player === 1 ? "var(--p1-dim)"  : "var(--p2-dim)";
  const crackBorder = player === 1 ? "var(--p1-border)"  : "var(--p2-border)";
  const glowShadow  = player === 1 ? "var(--p1-glow)" : "var(--p2-glow)";

  function handleChange(i: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const chars  = (value + " ".repeat(codeLength)).slice(0, codeLength).split("");
    chars[i]     = digit;
    onChange(chars.join("").replace(/ /g, ""));
    if (digit && i < codeLength - 1) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      const chars = (value + " ".repeat(codeLength)).slice(0, codeLength).split("");
      if (chars[i] !== " ") {
        chars[i] = " ";
        onChange(chars.join("").replace(/ /g, ""));
      } else if (i > 0) {
        chars[i - 1] = " ";
        onChange(chars.join("").replace(/ /g, ""));
        inputRefs.current[i - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft"  && i > 0)               inputRefs.current[i - 1]?.focus();
    else if   (e.key === "ArrowRight" && i < codeLength - 1)  inputRefs.current[i + 1]?.focus();
  }

  // Shrink box size for longer codes
  const boxClass = codeLength <= 5
    ? "w-14 h-16 text-2xl"
    : codeLength <= 7
    ? "w-11 h-14 text-xl"
    : "w-9  h-12 text-lg";

  return (
    <div className="flex gap-1.5 justify-center flex-wrap">
      {Array.from({ length: codeLength }, (_, i) => {
        const digit    = value[i] ?? "";
        const isCracked = cracked[i] !== null && cracked[i] !== undefined;

        return (
          <div key={i} className="relative">
            <input
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={disabled}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onFocus={e => e.target.select()}
              className={`${boxClass} rounded-xl text-center font-black font-mono outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40`}
              style={{
                background: isCracked && !digit
                  ? crackColor
                  : digit
                  ? "var(--digit-box-filled-bg)"
                  : "var(--digit-box-empty-bg)",
                border: `2px solid ${
                  isCracked && !digit ? crackBorder : digit ? neonColor : "var(--digit-box-empty-border)"
                }`,
                color: "hsl(var(--foreground))",
                boxShadow: digit
                  ? `0 4px 12px ${glowShadow}`
                  : isCracked
                  ? `0 2px 6px ${crackBorder}`
                  : "none",
                caretColor: neonColor,
              }}
            />
            {isCracked && !digit && (
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                style={{ background: neonColor }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
