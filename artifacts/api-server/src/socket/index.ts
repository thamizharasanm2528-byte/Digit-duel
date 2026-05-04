// Socket.IO event handlers for 4 Digit Battle online multiplayer
import { Server, type Socket } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { logger } from "../lib/logger";
import * as RM from "./roomManager";

export function setupSocketIO(httpServer: HttpServer): void {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/socket.io",
  });

  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    // ── Create Room ──────────────────────────────────────────────────────────
    socket.on("createRoom", ({ name, codeLength }: { name?: string; codeLength?: number }) => {
      const safeName   = typeof name       === "string" ? name.trim().slice(0, 24)  : "Player 1";
      const safeLength = typeof codeLength === "number" ? Math.max(4, Math.min(10, codeLength)) : 4;
      const room = RM.createRoom(socket.id, safeName, safeLength);
      socket.join(room.roomCode);
      socket.emit("roomCreated", {
        roomCode: room.roomCode,
        playerNum: 1,
        codeLength: room.codeLength,
        playerNames: room.playerNames,
      });
      logger.info({ roomCode: room.roomCode, safeName, codeLength: safeLength }, "Room created");
    });

    // ── Join Room ─────────────────────────────────────────────────────────────
    socket.on("joinRoom", ({ roomCode, name }: { roomCode?: string; name?: string }) => {
      if (typeof roomCode !== "string") { socket.emit("joinError", "Invalid room code."); return; }
      const code     = roomCode.trim().toUpperCase();
      const safeName = typeof name === "string" ? name.trim().slice(0, 24) : "Player 2";
      const { room, error } = RM.joinRoom(code, socket.id, safeName);
      if (error || !room) { socket.emit("joinError", error ?? "Unknown error"); return; }
      socket.join(code);
      socket.emit("roomJoined", {
        roomCode: code,
        playerNum: 2,
        codeLength: room.codeLength,
        playerNames: room.playerNames,
      });
      io.to(code).emit("setupPhase", {
        playerNames: room.playerNames,
        codeLength: room.codeLength,
      });
      logger.info({ roomCode: code, safeName }, "Player 2 joined");
    });

    // ── Submit Secret ─────────────────────────────────────────────────────────
    socket.on("submitSecret", (secret: unknown) => {
      if (typeof secret !== "string") { socket.emit("secretError", "Invalid secret."); return; }
      const room = RM.getRoomBySocketId(socket.id);
      if (!room) { socket.emit("secretError", "Not in a room."); return; }
      if (!/^\d+$/.test(secret) || secret.length !== room.codeLength) {
        socket.emit("secretError", `Secret must be exactly ${room.codeLength} digits.`); return;
      }
      const playerNum = RM.getPlayerNum(room, socket.id);
      if (!playerNum) { socket.emit("secretError", "Player not found."); return; }

      const bothReady = RM.submitSecret(room, playerNum, secret);
      io.to(room.roomCode).emit("secretSubmitted", { playerNum });
      if (bothReady) {
        io.to(room.roomCode).emit("gameStart", {
          currentTurn: room.currentTurn,
          playerNames: room.playerNames,
          codeLength: room.codeLength,
        });
      }
      logger.info({ roomCode: room.roomCode, playerNum }, "Secret submitted");
    });

    // ── Make Guess ────────────────────────────────────────────────────────────
    socket.on("makeGuess", (guess: unknown) => {
      if (typeof guess !== "string") { socket.emit("guessError", "Invalid guess."); return; }
      const room = RM.getRoomBySocketId(socket.id);
      if (!room) { socket.emit("guessError", "Not in a room."); return; }
      if (!/^\d+$/.test(guess) || guess.length !== room.codeLength) {
        socket.emit("guessError", `Guess must be exactly ${room.codeLength} digits.`); return;
      }
      const playerNum = RM.getPlayerNum(room, socket.id);
      if (!playerNum) { socket.emit("guessError", "Player not found."); return; }
      if (room.currentTurn !== playerNum) { socket.emit("guessError", "It's not your turn."); return; }

      const result = RM.makeGuess(room, playerNum, guess);
      if (!result) { socket.emit("guessError", "Could not process guess."); return; }

      const publicHistory = room.history.map(h => ({
        playerNum: h.playerNum,
        guess:     h.guess,
        found:     h.found,
        colors:    h.colors,
      }));

      io.to(room.roomCode).emit("guessResult", {
        playerNum,
        guess,
        found: result.found,
        colors: result.colors,
        nextTurn: room.currentTurn,
        history: publicHistory,
        winner: room.winner,
        playerNames: room.playerNames,
      });

      logger.info({ roomCode: room.roomCode, playerNum, guess, found: result.found }, "Guess processed");
    });

    // ── Skip Turn (timer expired) ─────────────────────────────────────────────
    socket.on("skipTurn", () => {
      const room = RM.getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerNum = RM.getPlayerNum(room, socket.id);
      if (!playerNum || room.currentTurn !== playerNum) return;

      const nextTurn: 1 | 2 = playerNum === 1 ? 2 : 1;
      room.currentTurn = nextTurn;
      io.to(room.roomCode).emit("turnSkipped", { skippedPlayer: playerNum, nextTurn });
      logger.info({ roomCode: room.roomCode, playerNum }, "Turn skipped (timeout)");
    });

    // ── Restart Game ──────────────────────────────────────────────────────────
    socket.on("restartGame", () => {
      const room = RM.getRoomBySocketId(socket.id);
      if (!room) return;
      RM.restartGame(room);
      io.to(room.roomCode).emit("setupPhase", {
        playerNames: room.playerNames,
        codeLength: room.codeLength,
      });
      logger.info({ roomCode: room.roomCode }, "Game restarted");
    });

    // ── Leave / Disconnect ────────────────────────────────────────────────────
    socket.on("leaveRoom",  () => handleLeave(socket, io));
    socket.on("disconnect", () => { handleLeave(socket, io); logger.info({ socketId: socket.id }, "Socket disconnected"); });
  });
}

function handleLeave(socket: Socket, io: Server): void {
  const room = RM.getRoomBySocketId(socket.id);
  if (!room) return;
  const roomCode = room.roomCode;
  RM.removePlayer(room, socket.id);
  socket.leave(roomCode);
  io.to(roomCode).emit("playerLeft");
}
