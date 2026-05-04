// Online game context — manages socket connection and all multiplayer state.
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import type { DigitColor } from "@/lib/gameLogic";

export interface OnlineGuessEntry {
  playerNum: 1 | 2;
  guess: string;
  found: number;
  colors: DigitColor[];
}

export interface OnlineState {
  roomCode: string;
  playerNum: 1 | 2 | null;
  playerNames: { "1"?: string; "2"?: string };   // string keys survive JSON round-trip
  codeLength: number;
  mySecret: string;          // stored locally only — NEVER sent to opponent
  phase: "lobby" | "waiting" | "setup" | "playing" | "finished";
  secretsSubmitted: (1 | 2)[];
  currentTurn: 1 | 2;
  history: OnlineGuessEntry[];
  winner: 1 | 2 | null;
  error: string | null;
}

interface OnlineActions {
  createRoom: (name: string, codeLength: number) => void;
  joinRoom: (code: string, name: string) => void;
  submitSecret: (secret: string) => void;
  makeGuess: (guess: string) => void;
  skipTurn: () => void;
  restartGame: () => void;
  leaveRoom: () => void;
  clearError: () => void;
}

const defaultState: OnlineState = {
  roomCode: "", playerNum: null, playerNames: { "1": "Player 1", "2": "Player 2" }, codeLength: 4, mySecret: "",
  phase: "lobby", secretsSubmitted: [], currentTurn: 1,
  history: [], winner: null, error: null,
};

const OnlineContext = createContext<{ state: OnlineState; actions: OnlineActions } | null>(null);

export function OnlineProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OnlineState>(defaultState);
  const [, navigate]      = useLocation();
  const activeRef         = useRef(false);

  useEffect(() => {
    const socket = connectSocket();
    activeRef.current = true;

    socket.on("roomCreated", ({
      roomCode, playerNum, codeLength, playerNames,
    }: { roomCode: string; playerNum: 1 | 2; codeLength: number; playerNames: { "1"?: string; "2"?: string } }) => {
      setState(s => ({ ...s, roomCode, playerNum, codeLength, playerNames: playerNames ?? s.playerNames, phase: "waiting", error: null }));
      navigate("/online/waiting");
    });

    socket.on("roomJoined", ({
      roomCode, playerNum, codeLength, playerNames,
    }: { roomCode: string; playerNum: 1 | 2; codeLength: number; playerNames: { "1"?: string; "2"?: string } }) => {
      setState(s => ({ ...s, roomCode, playerNum, codeLength, playerNames: playerNames ?? s.playerNames, error: null }));
    });

    socket.on("setupPhase", ({
      playerNames, codeLength,
    }: { playerNames: { "1"?: string; "2"?: string }; codeLength: number }) => {
      setState(s => ({
        ...s, phase: "setup", secretsSubmitted: [], mySecret: "",
        history: [], winner: null, error: null, playerNames: playerNames ?? s.playerNames, codeLength,
      }));
      navigate("/online/setup");
    });

    socket.on("secretSubmitted", ({ playerNum }: { playerNum: 1 | 2 }) => {
      setState(s => ({
        ...s,
        secretsSubmitted: s.secretsSubmitted.includes(playerNum)
          ? s.secretsSubmitted
          : [...s.secretsSubmitted, playerNum],
      }));
    });

    socket.on("gameStart", ({
      currentTurn, playerNames, codeLength,
    }: { currentTurn: 1 | 2; playerNames: { "1"?: string; "2"?: string }; codeLength: number }) => {
      setState(s => ({ ...s, phase: "playing", currentTurn, playerNames: playerNames ?? s.playerNames, codeLength, error: null }));
      navigate("/online/game");
    });

    socket.on("guessResult", ({
      nextTurn, history, winner, playerNames,
    }: {
      playerNum: 1 | 2; guess: string; found: number; colors: DigitColor[];
      nextTurn: 1 | 2; history: OnlineGuessEntry[];
      winner: 1 | 2 | null; playerNames: { "1"?: string; "2"?: string };
    }) => {
      setState(s => ({
        ...s, currentTurn: nextTurn, history, winner, playerNames: playerNames ?? s.playerNames,
        phase: winner ? "finished" : "playing",
      }));
      if (winner) navigate("/online/winner");
    });

    socket.on("turnSkipped", ({ nextTurn }: { nextTurn: 1 | 2 }) => {
      setState(s => ({ ...s, currentTurn: nextTurn }));
    });

    socket.on("playerLeft", () => {
      setState(s => ({ ...s, error: "Your opponent left the game.", phase: "lobby" }));
      navigate("/online");
    });

    socket.on("joinError",     (msg: string) => setState(s => ({ ...s, error: msg })));
    socket.on("secretError",   (msg: string) => setState(s => ({ ...s, error: msg })));
    socket.on("guessError",    (msg: string) => setState(s => ({ ...s, error: msg })));
    socket.on("connect_error", () => setState(s => ({ ...s, error: "Connection error. Please try again." })));

    return () => {
      activeRef.current = false;
      ["roomCreated","roomJoined","setupPhase","secretSubmitted","gameStart",
       "guessResult","turnSkipped","playerLeft","joinError","secretError","guessError","connect_error"]
        .forEach(ev => socket.off(ev));
    };
  }, [navigate]);

  const createRoom   = useCallback((name: string, codeLength: number) => {
    setState(s => ({ ...s, error: null }));
    getSocket().emit("createRoom", { name, codeLength });
  }, []);

  const joinRoom     = useCallback((code: string, name: string) => {
    setState(s => ({ ...s, error: null }));
    getSocket().emit("joinRoom", { roomCode: code.trim().toUpperCase(), name });
  }, []);

  const submitSecret = useCallback((secret: string) => {
    setState(s => ({ ...s, error: null, mySecret: secret }));
    getSocket().emit("submitSecret", secret);
  }, []);

  const makeGuess    = useCallback((guess: string) => {
    setState(s => ({ ...s, error: null }));
    getSocket().emit("makeGuess", guess);
  }, []);

  const skipTurn     = useCallback(() => { getSocket().emit("skipTurn"); }, []);
  const restartGame  = useCallback(() => { getSocket().emit("restartGame"); }, []);

  const leaveRoom    = useCallback(() => {
    getSocket().emit("leaveRoom");
    disconnectSocket();
    setState(defaultState);
    navigate("/online");
    connectSocket();
  }, [navigate]);

  const clearError   = useCallback(() => setState(s => ({ ...s, error: null })), []);

  return (
    <OnlineContext.Provider value={{
      state,
      actions: { createRoom, joinRoom, submitSecret, makeGuess, skipTurn, restartGame, leaveRoom, clearError },
    }}>
      {children}
    </OnlineContext.Provider>
  );
}

export function useOnline() {
  const ctx = useContext(OnlineContext);
  if (!ctx) throw new Error("useOnline must be used inside <OnlineProvider>");
  return ctx;
}
