import { useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";

// Offline pages
import Home        from "@/pages/Home";
import PlayerSetup from "@/pages/PlayerSetup";
import Game        from "@/pages/Game";
import Winner      from "@/pages/Winner";

// Online pages
import Lobby       from "@/pages/online/Lobby";
import WaitingRoom from "@/pages/online/WaitingRoom";
import OnlineSetup from "@/pages/online/OnlineSetup";
import OnlineGame  from "@/pages/online/OnlineGame";
import OnlineWinner from "@/pages/online/OnlineWinner";

// Local Hotspot page
import LocalHotspot from "@/pages/LocalHotspot";

// Shared online context
import { OnlineProvider } from "@/context/OnlineContext";

interface OfflineState {
  p1Secret: string;
  p2Secret: string;
  p1Name: string;
  p2Name: string;
  codeLength: number;
  winner: 1 | 2 | null;
}

const initialOffline: OfflineState = {
  p1Secret: "", p2Secret: "", p1Name: "Player 1", p2Name: "Player 2", codeLength: 4, winner: null,
};

function AppRoutes() {
  const [offline, setOffline] = useState<OfflineState>(initialOffline);
  const [, navigate] = useLocation();

  function handleStart(p1Secret: string, p2Secret: string, p1Name: string, p2Name: string, codeLength: number) {
    setOffline({ p1Secret, p2Secret, p1Name: p1Name || "Player 1", p2Name: p2Name || "Player 2", codeLength, winner: null });
  }

  function handleWin(winner: 1 | 2) {
    setOffline(prev => ({ ...prev, winner }));
  }

  function handleRestart() {
    setOffline(initialOffline);
  }

  return (
    <Switch>
      {/* ── Offline ── */}
      <Route path="/" component={Home} />
      <Route path="/setup">
        <PlayerSetup onStart={handleStart} />
      </Route>
      <Route path="/game">
        <Game
          p1Secret={offline.p1Secret}
          p2Secret={offline.p2Secret}
          p1Name={offline.p1Name}
          p2Name={offline.p2Name}
          codeLength={offline.codeLength}
          onWin={handleWin}
        />
      </Route>
      <Route path="/winner">
        <Winner
          winner={offline.winner}
          p1Secret={offline.p1Secret}
          p2Secret={offline.p2Secret}
          p1Name={offline.p1Name}
          p2Name={offline.p2Name}
          onRestart={handleRestart}
        />
      </Route>

      {/* ── Online (room code) ── */}
      <Route path="/online"         component={Lobby} />
      <Route path="/online/waiting" component={WaitingRoom} />
      <Route path="/online/setup"   component={OnlineSetup} />
      <Route path="/online/game"    component={OnlineGame} />
      <Route path="/online/winner"  component={OnlineWinner} />

      {/* ── Local Hotspot ── */}
      <Route path="/hotspot" component={LocalHotspot} />
    </Switch>
  );
}

export default function App() {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

  return (
    <WouterRouter base={base}>
      <OnlineProvider>
        <AppRoutes />
      </OnlineProvider>
    </WouterRouter>
  );
}
