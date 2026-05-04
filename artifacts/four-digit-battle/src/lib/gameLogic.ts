// Game logic for 4 Digit Battle (Bulls and Cows)

// Only two states: digit is in the RIGHT position, or it's not useful
export type DigitColor = "found" | "none";

export interface GuessResult {
  guess: string;
  found: number;  // digits in the correct position (Bulls)
  colors: DigitColor[];
}

/**
 * Validates a secret number string.
 * codeLength is 4-10.
 */
export function validateSecret(value: string, codeLength = 4): string | null {
  if (value.length !== codeLength || !/^\d+$/.test(value)) {
    return `Please enter exactly ${codeLength} digits (0–9, repeats allowed).`;
  }
  return null;
}

/**
 * Evaluates a guess against the secret.
 * Only "found" (right digit, right position) feedback — no "present" (cow) indicator.
 */
export function evaluateGuess(secret: string, guess: string): GuessResult {
  const len = secret.length;
  const colors: DigitColor[] = Array(len).fill("none") as DigitColor[];

  for (let i = 0; i < len; i++) {
    if (guess[i] === secret[i]) colors[i] = "found";
  }

  const found = colors.filter(c => c === "found").length;
  return { guess, found, colors };
}
