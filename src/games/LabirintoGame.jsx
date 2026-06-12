import { useEffect, useMemo, useState } from "react";
import "./LabirintoGame.css";

const OBSTACLES = [
  { name: "Sono", symbol: "😴" },
  { name: "Fome", symbol: "🍟" },
  { name: "Drama", symbol: "😤" },
  { name: "Chuva", symbol: "🌧️" },
  { name: "Cone", symbol: "🚧" },
];

const PLAYER = "🏍️";
const GOAL = "💗";
const WALL = "🧱";
const CANDY = "🍬";

const MESSAGES = {
  start: "Emily pegou a moto. Agora é só chegar no coração final.",
  wall: "Não dá pra passar por aí, tonta.",
  candy: "Emily pegou um docinho no caminho.",
  win: "Emily chegou no destino final. Missão concluída com amor.",
};

const LEVELS = [
  {
    title: "Passeio tranquilo",
    subtitle: "Primeira volta da motoca.",
    map: [
      "##########",
      "#S..C...G#",
      "#..##..O.#",
      "#........#",
      "#.O.##...#",
      "#........#",
      "#..C..O..#",
      "#........#",
      "#....C...#",
      "##########",
    ],
  },
  {
    title: "Fome, sono e drama",
    subtitle: "Agora o caminho começou a tentar atrapalhar.",
    map: [
      "##########",
      "#S......O#",
      "#.####.#.#",
      "#....#.#.#",
      "#.##O#.#.#",
      "#....#...#",
      "#.######.#",
      "#C.......#",
      "#.O..C..G#",
      "##########",
    ],
  },
  {
    title: "Última volta até o coração",
    subtitle: "Nada impede a Emily de chegar no destino final.",
    map: [
      "##########",
      "#S..O....#",
      "#.######.#",
      "#.#....#.#",
      "#.#.##.#.#",
      "#...##...#",
      "###.##.###",
      "#C..O...G#",
      "#....C...#",
      "##########",
    ],
  },
];

function findStart(map) {
  for (let row = 0; row < map.length; row += 1) {
    const col = map[row].indexOf("S");

    if (col !== -1) {
      return { row, col };
    }
  }

  return { row: 1, col: 1 };
}

function getObstacle(levelIndex, row, col) {
  const obstacleIndex = (levelIndex + row + col) % OBSTACLES.length;
  return OBSTACLES[obstacleIndex];
}

export default function LabirintoGame({ onBack }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [position, setPosition] = useState(() => findStart(LEVELS[0].map));
  const [message, setMessage] = useState(MESSAGES.start);
  const [candies, setCandies] = useState(0);
  const [moves, setMoves] = useState(0);
  const [collectedCandies, setCollectedCandies] = useState([]);
  const [levelComplete, setLevelComplete] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const level = LEVELS[levelIndex];
  const map = level.map;

  const collectedSet = useMemo(
    () => new Set(collectedCandies),
    [collectedCandies],
  );

  function getCandyKey(row, col) {
    return `${levelIndex}-${row}-${col}`;
  }

  function restartLevel() {
    setPosition(findStart(map));
    setMessage(MESSAGES.start);
    setLevelComplete(false);
  }

  function restartGame() {
    setLevelIndex(0);
    setPosition(findStart(LEVELS[0].map));
    setMessage(MESSAGES.start);
    setCandies(0);
    setMoves(0);
    setCollectedCandies([]);
    setLevelComplete(false);
    setGameComplete(false);
  }

  function nextLevel() {
    const nextIndex = levelIndex + 1;

    setLevelIndex(nextIndex);
    setPosition(findStart(LEVELS[nextIndex].map));
    setMessage(MESSAGES.start);
    setLevelComplete(false);
  }

  function movePlayer(rowDelta, colDelta) {
    if (levelComplete || gameComplete) return;

    const nextRow = position.row + rowDelta;
    const nextCol = position.col + colDelta;
    const nextCell = map[nextRow]?.[nextCol];

    if (!nextCell || nextCell === "#") {
      setMessage(MESSAGES.wall);
      return;
    }

    if (nextCell === "O") {
      const obstacle = getObstacle(levelIndex, nextRow, nextCol);
      setMessage(`${obstacle.name} bloqueou o caminho. Desvia, tonta.`);
      return;
    }

    setPosition({ row: nextRow, col: nextCol });
    setMoves((current) => current + 1);

    if (nextCell === "C") {
      const candyKey = getCandyKey(nextRow, nextCol);

      if (!collectedSet.has(candyKey)) {
        setCollectedCandies((current) => [...current, candyKey]);
        setCandies((current) => current + 1);
        setMessage(MESSAGES.candy);
        return;
      }
    }

    if (nextCell === "G") {
      if (levelIndex === LEVELS.length - 1) {
        setGameComplete(true);
        setMessage(MESSAGES.win);
        return;
      }

      setLevelComplete(true);
      setMessage(`${MESSAGES.win} Próxima fase liberada.`);
      return;
    }

    setMessage("Continua pilotando. O coração tá logo ali.");
  }

  useEffect(() => {
    function handleKeyDown(event) {
      const movesByKey = {
        ArrowUp: [-1, 0],
        w: [-1, 0],
        W: [-1, 0],
        ArrowDown: [1, 0],
        s: [1, 0],
        S: [1, 0],
        ArrowLeft: [0, -1],
        a: [0, -1],
        A: [0, -1],
        ArrowRight: [0, 1],
        d: [0, 1],
        D: [0, 1],
      };

      const movement = movesByKey[event.key];

      if (!movement) return;

      event.preventDefault();
      movePlayer(movement[0], movement[1]);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <main className="labirinto-game">
      <div className="labirinto-topbar">
        <button className="labirinto-soft-button" type="button" onClick={onBack}>
          ← Voltar ao menu
        </button>

        <div className="labirinto-title-box">
          <span>Emily no comando</span>
          <h1>Labirinto da Moto</h1>
        </div>

        <button
          className="labirinto-soft-button"
          type="button"
          onClick={restartGame}
        >
          Reiniciar
        </button>
      </div>

      <section className="labirinto-layout">
        <aside className="labirinto-panel">
          <div className="labirinto-stage-card">
            <span>fase {levelIndex + 1} de {LEVELS.length}</span>
            <strong>{level.title}</strong>
            <p>{level.subtitle}</p>
          </div>

          <div className="labirinto-score-grid">
            <div>
              <span>Docinhos</span>
              <strong>{candies}</strong>
            </div>
            <div>
              <span>Movimentos</span>
              <strong>{moves}</strong>
            </div>
          </div>

          <div className="labirinto-obstacles">
            <strong>Obstáculos</strong>
            {OBSTACLES.map((obstacle) => (
              <span key={obstacle.name}>
                {obstacle.symbol} {obstacle.name}
              </span>
            ))}
          </div>
        </aside>

        <div className="labirinto-main">
          <div className="labirinto-message">
            <strong>{message}</strong>
          </div>

          <div className="labirinto-board">
            {map.map((row, rowIndex) =>
              row.split("").map((cell, colIndex) => {
                const isPlayer =
                  position.row === rowIndex && position.col === colIndex;
                const candyKey = getCandyKey(rowIndex, colIndex);
                const candyCollected = collectedSet.has(candyKey);
                const obstacle = getObstacle(levelIndex, rowIndex, colIndex);

                let content = "";

                if (isPlayer) {
                  content = PLAYER;
                } else if (cell === "#") {
                  content = WALL;
                } else if (cell === "G") {
                  content = GOAL;
                } else if (cell === "C" && !candyCollected) {
                  content = CANDY;
                } else if (cell === "O") {
                  content = obstacle.symbol;
                }

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={[
                      "labirinto-cell",
                      cell === "#" ? "wall" : "",
                      cell === "G" ? "goal" : "",
                      cell === "C" && !candyCollected ? "candy" : "",
                      cell === "O" ? "obstacle" : "",
                      isPlayer ? "player" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span>{content}</span>
                  </div>
                );
              }),
            )}
          </div>

          <div className="labirinto-controls">
            <button type="button" onClick={() => movePlayer(-1, 0)}>
              ↑
            </button>
            <div>
              <button type="button" onClick={() => movePlayer(0, -1)}>
                ←
              </button>
              <button type="button" onClick={() => movePlayer(1, 0)}>
                ↓
              </button>
              <button type="button" onClick={() => movePlayer(0, 1)}>
                →
              </button>
            </div>
          </div>

          <div className="labirinto-actions">
            <button type="button" onClick={restartLevel}>
              Reiniciar fase
            </button>

            {levelComplete && (
              <button type="button" onClick={nextLevel}>
                Próxima fase
              </button>
            )}

            {gameComplete && (
              <button type="button" onClick={restartGame}>
                Jogar de novo
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}