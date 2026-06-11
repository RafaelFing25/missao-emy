import { useMemo, useState } from "react";

const TOTAL_SWORDS = 16;

const PLAYERS = [
  {
    id: "rafa",
    name: "Rafa",
  },
  {
    id: "emily",
    name: "Emily",
  },
];

const SAFE_PHRASES = [
  "Ainda não foi dessa vez.",
  "Essa passou raspando.",
  "O pirata sobreviveu... por enquanto.",
  "Boa tentativa.",
  "Quase, quase.",
  "A tensão está aumentando.",
];

const HEART_PHRASES = [
  "Você me pegou em cheio.",
  "Essa foi direto no coração.",
  "O pirata pulou, e meu coração também.",
  "Eu sabia que você ia me acertar.",
];

const SWORD_POSITIONS = [
  // lado esquerdo, apontando para a direita
  { x: -106, y: -42, rotate: 8 },
  { x: -110, y: -14, rotate: 2 },
  { x: -110, y: 16, rotate: -4 },
  { x: -104, y: 44, rotate: -10 },

  // lado direito, apontando para a esquerda
  { x: 106, y: -42, rotate: 172 },
  { x: 110, y: -14, rotate: 178 },
  { x: 110, y: 16, rotate: 184 },
  { x: 104, y: 44, rotate: 190 },

  // diagonais superiores
  { x: -78, y: -64, rotate: 30 },
  { x: -42, y: -72, rotate: 48 },
  { x: 42, y: -72, rotate: 132 },
  { x: 78, y: -64, rotate: 150 },

  // diagonais inferiores
  { x: -78, y: 68, rotate: -30 },
  { x: -42, y: 76, rotate: -48 },
  { x: 42, y: 76, rotate: 228 },
  { x: 78, y: 68, rotate: 210 },
];

function getRandomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getEmilyJumpChance(emilyAttempts) {
  if (emilyAttempts <= 1) return 0.22;
  if (emilyAttempts === 2) return 0.34;
  if (emilyAttempts === 3) return 0.48;
  if (emilyAttempts === 4) return 0.68;
  return 0.9;
}

function PulaPirataGame({ onBack }) {
  const [usedSwords, setUsedSwords] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [startPlayerIndex, setStartPlayerIndex] = useState(0);
  const [emilyAttempts, setEmilyAttempts] = useState(0);
  const [hasPopped, setHasPopped] = useState(false);
  const [message, setMessage] = useState("Escolham as espadinhas em turnos.");
  const [heartPhrase, setHeartPhrase] = useState("");

  const currentPlayer = PLAYERS[currentPlayerIndex];

  const usedSwordIndexes = useMemo(() => {
    return usedSwords.map((sword) => sword.index);
  }, [usedSwords]);

  const remainingSwords = useMemo(() => {
    return TOTAL_SWORDS - usedSwords.length;
  }, [usedSwords]);

  function handleSwordClick(swordIndex) {
    if (hasPopped) return;
    if (usedSwordIndexes.includes(swordIndex)) return;

    const swordPosition = SWORD_POSITIONS[swordIndex];

    const insertedSword = {
      index: swordIndex,
      order: usedSwords.length,
      x: swordPosition.x,
      y: swordPosition.y,
      rotate: swordPosition.rotate,
    };

    const nextUsedSwords = [...usedSwords, insertedSword];
    const isEmilyTurn = currentPlayer.id === "emily";

    let shouldJump = false;

    if (isEmilyTurn) {
      const nextEmilyAttempts = emilyAttempts + 1;
      const chance = getEmilyJumpChance(nextEmilyAttempts);

      shouldJump =
        Math.random() < chance || nextUsedSwords.length >= TOTAL_SWORDS - 1;

      setEmilyAttempts(nextEmilyAttempts);
    }

    setUsedSwords(nextUsedSwords);

    if (shouldJump) {
      const finalPhrase = getRandomItem(HEART_PHRASES);

      setHasPopped(true);
      setHeartPhrase(finalPhrase);
      setMessage(finalPhrase);
      return;
    }

    setMessage(getRandomItem(SAFE_PHRASES));
    setCurrentPlayerIndex((current) => (current === 0 ? 1 : 0));
  }

  function playAgain() {
    const nextStarter = startPlayerIndex === 0 ? 1 : 0;

    setUsedSwords([]);
    setCurrentPlayerIndex(nextStarter);
    setStartPlayerIndex(nextStarter);
    setEmilyAttempts(0);
    setHasPopped(false);
    setHeartPhrase("");
    setMessage("Escolham as espadinhas em turnos.");
  }

  return (
    <section className="pirate-page">
      <header className="pirate-header">
        <button className="pirate-icon-button" onClick={onBack}>
          ‹
        </button>

        <div>
          <p>Pula Pirata</p>
          <h1>Escolham as espadinhas em turnos.</h1>
        </div>

        <button className="pirate-icon-button" onClick={playAgain}>
          ↻
        </button>
      </header>

      <div className="pirate-turn-card">
        {!hasPopped ? (
          <>
            <span>Vez de jogar</span>
            <strong>{currentPlayer.name}</strong>
          </>
        ) : (
          <>
            <span>O pirata pulou</span>
            <strong>Emily acertou</strong>
          </>
        )}
      </div>

      <div className={`pirate-stage ${hasPopped ? "popped" : ""}`}>
        <div className="pirate-character" aria-hidden="true">
          <div className="pirate-hat">☠</div>
          <div className="pirate-face">😳</div>
        </div>

        <div className="barrel">
          <div className="barrel-band barrel-band-top" />
          <div className="barrel-text">PIRATA</div>
          <div className="barrel-band barrel-band-bottom" />
        </div>

        <div className="inserted-swords-layer" aria-hidden="true">
          {usedSwords.map((sword) => (
            <span
              key={sword.index}
              className="inserted-sword"
              style={{
                "--sword-x": `${sword.x}px`,
                "--sword-y": `${sword.y}px`,
                "--sword-rotate": `${sword.rotate}deg`,
                "--sword-delay": `${sword.order * 25}ms`,
              }}
            >
              <span className="inserted-sword-blade" />
              <span className="inserted-sword-guard" />
              <span className="inserted-sword-handle" />
            </span>
          ))}
        </div>
      </div>

      <div className={`pirate-message ${hasPopped ? "final" : ""}`}>
        {hasPopped ? (
          <>
            <strong>{heartPhrase}</strong>
            <span>Era para acertar o barril, mas foi direto no coração.</span>
          </>
        ) : (
          <span>{message}</span>
        )}
      </div>

      <div className="swords-grid">
        {Array.from({ length: TOTAL_SWORDS }).map((_, index) => {
          const isUsed = usedSwordIndexes.includes(index);

          return (
            <button
              key={index}
              className={`sword-button ${isUsed ? "used" : ""}`}
              onClick={() => handleSwordClick(index)}
              disabled={isUsed || hasPopped}
            >
              <span>🗡️</span>
            </button>
          );
        })}
      </div>

      <footer className="pirate-footer">
        {!hasPopped ? (
          <span>Espadinhas restantes: {remainingSwords}</span>
        ) : (
          <button className="pirate-play-again" onClick={playAgain}>
            Jogar de novo
          </button>
        )}
      </footer>
    </section>
  );
}

export default PulaPirataGame;