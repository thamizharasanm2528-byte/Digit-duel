// Room manager — stores all game rooms in memory.

export type DigitColor = "found" | "none";

export interface Player {
  socketId: string;
  playerNum: 1 | 2;
}

export interface GuessEntry {
  playerNum: 1 | 2;
  guess: string;
  found: number;
  colors: DigitColor[];
}

// Use plain string keys "1"/"2" so JSON round-trip stays consistent
export type PlayerNames = { "1"?: string; "2"?: string };

export interface Room {
  roomCode: string;
  players: Player[];
  playerNames: PlayerNames;
  codeLength: number;   // 4-10
  secrets: Partial<Record<1 | 2, string>>;
  currentTurn: 1 | 2;
  history: GuessEntry[];
  status: "waiting" | "setup" | "playing" | "finished";
  winner: 1 | 2 | null;
}

const rooms = new Map<string, Room>();

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function createRoom(socketId: string, name: string, codeLength: number): Room {
  let roomCode: string;
  do { roomCode = generateCode(); } while (rooms.has(roomCode));

  const room: Room = {
    roomCode,
    players: [{ socketId, playerNum: 1 }],
    playerNames: { "1": name || "Player 1" },
    codeLength: Math.max(4, Math.min(10, codeLength)),
    secrets: {},
    currentTurn: 1,
    history: [],
    status: "waiting",
    winner: null,
  };
  rooms.set(roomCode, room);
  return room;
}

export function joinRoom(
  roomCode: string,
  socketId: string,
  name: string
): { room: Room | null; error?: string } {
  const room = rooms.get(roomCode);
  if (!room) return { room: null, error: "Room not found. Check the code and try again." };
  if (room.players.length >= 2) return { room: null, error: "Room is already full." };
  if (room.status !== "waiting") return { room: null, error: "Game already started." };

  room.players.push({ socketId, playerNum: 2 });
  room.playerNames["2"] = name || "Player 2";
  room.status = "setup";
  return { room };
}

export function getRoom(roomCode: string): Room | undefined {
  return rooms.get(roomCode);
}

export function getRoomBySocketId(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.socketId === socketId)) return room;
  }
  return undefined;
}

export function getPlayerNum(room: Room, socketId: string): 1 | 2 | null {
  return room.players.find(p => p.socketId === socketId)?.playerNum ?? null;
}

export function submitSecret(room: Room, playerNum: 1 | 2, secret: string): boolean {
  room.secrets[playerNum] = secret;
  const bothReady = !!(room.secrets[1] && room.secrets[2]);
  if (bothReady) room.status = "playing";
  return bothReady;
}

/**
 * Per-digit color — only "found" (right position) or "none".
 * No "present"/yellow: we removed that feedback mode.
 */
function computeColors(secret: string, guess: string): DigitColor[] {
  return Array.from({ length: secret.length }, (_, i) =>
    guess[i] === secret[i] ? "found" : "none"
  );
}

export function makeGuess(
  room: Room,
  playerNum: 1 | 2,
  guess: string
): { found: number; colors: DigitColor[] } | null {
  if (room.currentTurn !== playerNum) return null;
  if (room.status !== "playing") return null;

  const opponentNum: 1 | 2 = playerNum === 1 ? 2 : 1;
  const secret = room.secrets[opponentNum];
  if (!secret) return null;

  const colors = computeColors(secret, guess);
  const found  = colors.filter(c => c === "found").length;

  room.history.push({ playerNum, guess, found, colors });

  if (found === room.codeLength) {
    room.status = "finished";
    room.winner = playerNum;
  } else {
    room.currentTurn = opponentNum;
  }

  return { found, colors };
}

export function restartGame(room: Room): void {
  room.secrets     = {};
  room.currentTurn = 1;
  room.history     = [];
  room.status      = "setup";
  room.winner      = null;
}

export function removePlayer(room: Room, socketId: string): void {
  room.players = room.players.filter(p => p.socketId !== socketId);
  if (room.players.length === 0) rooms.delete(room.roomCode);
}
