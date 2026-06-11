import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./CobrinhaGame.css";

const BOARD_SIZE = 20;
const START_SNAKE = [
  { x: 9, y: 10 },
  { x: 8, y: 10 },
  { x: 7, y: 10 },
];

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1, name: "up" },
  ArrowDown: { x: 0, y: 1, name: "down" },
  ArrowLeft: { x: -1, y: 0, name: "left" },
  ArrowRight: { x: 1, y: 0, name: "right" },
  w: { x: 0, y: -1, name: "up" },
  W: { x: 0, y: -1, name: "up" },
  s: { x: 0, y: 1, name: "down" },
  S: { x: 0, y: 1, name: "down" },
  a: { x: -1, y: 0, name: "left" },
  A: { x: -1, y: 0, name: "left" },
  d: { x: 1, y: 0, name: "right" },
  D: { x: 1, y: 0, name: "right" },
};

const START_DIRECTION = { x: 1, y: 0, name: "right" };

const PHRASES = [
  "Docinho capturado.",
  "To fome funcionou.",
  "Vuxe pegou mais um.",
  "Mais um docinho pra conta.",
  "Essa voltinha rendeu.",
  "Sem ficar estessada agora.",
];

function samePosition(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isOpposite(current, next) {
  return current.x + next.x === 0 && current.y + next.y === 0;
}

function randomFood(snake) {
  const occupied = new Set(snake.map((part) => `${part.x}-${part.y}`));
  const emptyCells = [];

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (!occupied.has(`${x}-${y}`)) emptyCells.push({ x, y });
    }
  }

  return emptyCells[Math.floor(Math.random() * emptyCells.length)] || { x: 3, y: 3 };
}

function getSpeed(score) {
  return Math.max(82, 160 - score * 4);
}

export default function CobrinhaGame({ onBack }) {
  const [snake, setSnake] = useState(START_SNAKE);
  const [food, setFood] = useState(() => randomFood(START_SNAKE));
  const [direction, setDirection] = useState(START_DIRECTION);
  const [nextDirection, setNextDirection] = useState(START_DIRECTION);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = Number(localStorage.getItem("cobrinha-docinho-recorde") || 0);
    return Number.isFinite(saved) ? saved : 0;
  });
  const [status, setStatus] = useState("ready");
  const [message, setMessage] = useState("Use as setas ou WASD para guiar a cobrinha até os docinhos.");
  const [lastEaten, setLastEaten] = useState(false);
  const boardRef = useRef(null);

  const speed = useMemo(() => getSpeed(score), [score]);

  const resetGame = useCallback(() => {
    const initialSnake = START_SNAKE.map((part) => ({ ...part }));
    setSnake(initialSnake);
    setFood(randomFood(initialSnake));
    setDirection(START_DIRECTION);
    setNextDirection(START_DIRECTION);
    setScore(0);
    setStatus("ready");
    setLastEaten(false);
    setMessage("Use as setas ou WASD para guiar a cobrinha até os docinhos.");
  }, []);

  const startGame = useCallback(() => {
    if (status === "gameover") resetGame();
    setStatus("playing");
    setMessage("Vai com calma. Docinho demais também dá trabalho.");
    setTimeout(() => boardRef.current?.focus(), 60);
  }, [resetGame, status]);

  const pauseGame = useCallback(() => {
    setStatus((current) => {
      if (current === "playing") {
        setMessage("Pausado. Respira e volta para os docinhos.");
        return "paused";
      }
      if (current === "paused") {
        setMessage("Voltando para a caça aos docinhos.");
        return "playing";
      }
      return current;
    });
  }, []);

  const changeDirection = useCallback(
    (dir) => {
      if (!dir) return;
      setNextDirection((currentNext) => {
        const currentBase = currentNext || direction;
        if (isOpposite(currentBase, dir)) return currentNext;
        return dir;
      });
      if (status === "ready") setStatus("playing");
    },
    [direction, status]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (status === "ready" || status === "gameover") startGame();
        else pauseGame();
        return;
      }

      const dir = DIRECTIONS[event.key];
      if (!dir) return;
      event.preventDefault();
      changeDirection(dir);
    },
    [changeDirection, pauseGame, startGame, status]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (status !== "playing") return undefined;

    const timer = window.setInterval(() => {
      setSnake((currentSnake) => {
        const appliedDirection = nextDirection;
        setDirection(appliedDirection);

        const head = currentSnake[0];
        const nextHead = {
          x: head.x + appliedDirection.x,
          y: head.y + appliedDirection.y,
        };

        const hitWall =
          nextHead.x < 0 ||
          nextHead.x >= BOARD_SIZE ||
          nextHead.y < 0 ||
          nextHead.y >= BOARD_SIZE;

        const hitSelf = currentSnake.some((part, index) => index > 0 && samePosition(part, nextHead));

        if (hitWall || hitSelf) {
          setStatus("gameover");
          setMessage(hitWall ? "Bateu na parede. A voltinha foi longe demais." : "A cobrinha se enrolou toda. Muito docinho dá nisso.");
          setLastEaten(false);
          return currentSnake;
        }

        const ateFood = samePosition(nextHead, food);
        const nextSnake = [nextHead, ...currentSnake];

        if (ateFood) {
          const nextScore = score + 1;
          const nextMessage = PHRASES[(nextScore - 1) % PHRASES.length];
          setScore(nextScore);
          setLastEaten(true);
          setMessage(nextMessage);
          setFood(randomFood(nextSnake));

          if (nextScore > bestScore) {
            setBestScore(nextScore);
            localStorage.setItem("cobrinha-docinho-recorde", String(nextScore));
          }

          window.setTimeout(() => setLastEaten(false), 180);
          return nextSnake;
        }

        nextSnake.pop();
        setLastEaten(false);
        return nextSnake;
      });
    }, speed);

    return () => window.clearInterval(timer);
  }, [bestScore, food, nextDirection, score, speed, status]);

  const cells = useMemo(() => {
    const snakeMap = new Map(snake.map((part, index) => [`${part.x}-${part.y}`, index]));
    const foodKey = `${food.x}-${food.y}`;

    return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
      const x = index % BOARD_SIZE;
      const y = Math.floor(index / BOARD_SIZE);
      const key = `${x}-${y}`;
      const snakeIndex = snakeMap.get(key);
      const isSnake = snakeIndex !== undefined;
      const isHead = snakeIndex === 0;
      const isFood = key === foodKey;

      return {
        key,
        isSnake,
        isHead,
        isFood,
        snakeIndex,
      };
    });
  }, [food, snake]);

  return (
    <main className="snake-screen">
      <div className="snake-bg-orb snake-bg-orb-one" />
      <div className="snake-bg-orb snake-bg-orb-two" />

      <header className="snake-topbar">
        <button className="snake-ghost-button" onClick={onBack} type="button">
          ← Voltar ao menu
        </button>

        <div className="snake-title-box">
          <span>Cobrinha</span>
          <h1>Caça aos docinhos</h1>
        </div>

        <div className="snake-actions-top">
          <button className="snake-ghost-button" onClick={pauseGame} type="button" disabled={status === "ready" || status === "gameover"}>
            {status === "paused" ? "Continuar" : "Pausar"}
          </button>
          <button className="snake-ghost-button" onClick={resetGame} type="button">
            Reiniciar
          </button>
        </div>
      </header>

      <section className="snake-layout">
        <aside className="snake-panel snake-panel-left">
          <div className="snake-player-card">
            <div className="snake-avatar">🍬</div>
            <div>
              <strong>Docinhos</strong>
              <span>pegos na voltinha</span>
            </div>
          </div>

          <div className="snake-stat-grid">
            <div className="snake-stat">
              <small>Pontos</small>
              <strong>{score}</strong>
            </div>
            <div className="snake-stat">
              <small>Recorde</small>
              <strong>{bestScore}</strong>
            </div>
          </div>

          <p className="snake-message">{message}</p>
        </aside>

        <section className="snake-board-wrap">
          <div
            className={`snake-board ${lastEaten ? "snake-board-happy" : ""}`}
            ref={boardRef}
            tabIndex={0}
            role="application"
            aria-label="Tabuleiro da cobrinha pegando docinhos"
          >
            {cells.map((cell) => (
              <div
                className={[
                  "snake-cell",
                  cell.isSnake ? "snake-cell-body" : "",
                  cell.isHead ? `snake-cell-head snake-head-${direction.name}` : "",
                  cell.isFood ? "snake-cell-food" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={cell.key}
                style={cell.isSnake ? { "--snake-part": cell.snakeIndex } : undefined}
              >
                {cell.isFood && <span className="snake-food-emoji">🍬</span>}
              </div>
            ))}

            {status !== "playing" && (
              <div className="snake-overlay">
                <div className="snake-overlay-card">
                  <span>{status === "gameover" ? "Fim da voltinha" : status === "paused" ? "Pausado" : "Pronto?"}</span>
                  <h2>{status === "gameover" ? "A cobrinha ficou sem docinho." : "Pegue o máximo de docinhos."}</h2>
                  <button className="snake-primary-button" onClick={startGame} type="button">
                    {status === "gameover" ? "Jogar de novo" : "Começar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="snake-panel snake-panel-right">
          <div className="snake-hint-card">
            <strong>Controles</strong>
            <p>Setas ou WASD. Espaço pausa.</p>
          </div>

          <div className="snake-control-pad" aria-label="Controles na tela">
            <button onClick={() => changeDirection(DIRECTIONS.ArrowUp)} type="button">↑</button>
            <div>
              <button onClick={() => changeDirection(DIRECTIONS.ArrowLeft)} type="button">←</button>
              <button onClick={() => changeDirection(DIRECTIONS.ArrowDown)} type="button">↓</button>
              <button onClick={() => changeDirection(DIRECTIONS.ArrowRight)} type="button">→</button>
            </div>
          </div>

          <div className="snake-mini-note">
            <span>Meta secreta</span>
            <p>Não deixar a fome vencer.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
