import { useState } from "react";
import Intro from "./components/Intro";
import GameMenu from "./components/GameMenu";
import QuartetoTermo from "./games/QuartetoTermo";
import PulaPirataGame from "./games/PulaPirataGame";
import LudoGame from "./games/LudoGame";
import DominoGame from "./games/DominoGame";
import EscapeRoomGame from "./games/EscapeRoomGame";
import UnoGame from "./games/UnoGame";
import JogoDaVelhaGame from "./games/JogoDaVelhaGame";
import CobrinhaGame from "./games/CobrinhaGame";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("intro");

  return (
    <main className="app">
      {screen === "cobrinha" && (
  <CobrinhaGame onBack={() => setScreen("menu")} />
)}
      {screen === "uno" && (
  <UnoGame onBack={() => setScreen("menu")} />
)}
{screen === "jogo-da-velha" && (
  <JogoDaVelhaGame onBack={() => setScreen("menu")} />
)}
      {screen === "intro" && <Intro onStart={() => setScreen("menu")} />}

      {screen === "menu" && (
        <GameMenu onSelectGame={(gameId) => setScreen(gameId)} />
      )}

      {screen === "termo" && (
        <QuartetoTermo onBack={() => setScreen("menu")} />
      )}

      {screen === "pula-pirata" && (
        <PulaPirataGame onBack={() => setScreen("menu")} />
      )}

      {screen === "ludo" && (
        <LudoGame onBack={() => setScreen("menu")} />
      )}

      {screen === "domino" && (
        <DominoGame onBack={() => setScreen("menu")} />
      )}
      {screen === "escape-room" && (
  <EscapeRoomGame onBack={() => setScreen("menu")} />
)}
    </main>
  );
}

export default App;