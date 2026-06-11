import { useMemo, useState } from "react";
import "./JogoDaVelhaGame.css";

const PLAYERS = {
  O: {
    name: "Rafa",
    symbol: "O",
    className: "rafa",
    phrase: "azul",
  },
  X: {
    name: "Emily",
    symbol: "X",
    className: "emily",
    phrase: "rosa",
  },
};

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getResult(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a],
        line,
        draw: false,
      };
    }
  }

  if (board.every(Boolean)) {
    return {
      winner: null,
      line: [],
      draw: true,
    };
  }

  return {
    winner: null,
    line: [],
    draw: false,
  };
}

function createEmptyBoard() {
  return Array(9).fill(null);
}

export default function JogoDaVelhaGame({ onBack }) {
  const [board, setBoard] = useState(createEmptyBoard);
  const [turn, setTurn] = useState("X");
  const [starter, setStarter] = useState("X");
  const [score, setScore] = useState({ X: 0, O: 0, draws: 0 });

  const result = useMemo(() => getResult(board), [board]);
  const currentPlayer = PLAYERS[turn];
  const winnerPlayer = result.winner ? PLAYERS[result.winner] : null;

  function handleCellClick(index) {
    if (board[index] || result.winner || result.draw) return;

    const nextBoard = [...board];
    nextBoard[index] = turn;

    const nextResult = getResult(nextBoard);

    setBoard(nextBoard);

    if (nextResult.winner) {
      setScore((current) => ({
        ...current,
        [nextResult.winner]: current[nextResult.winner] + 1,
      }));
      return;
    }

    if (nextResult.draw) {
      setScore((current) => ({
        ...current,
        draws: current.draws + 1,
      }));
      return;
    }

    setTurn((current) => (current === "X" ? "O" : "X"));
  }

  function restartRound() {
    const nextStarter = starter === "X" ? "O" : "X";
    setStarter(nextStarter);
    setTurn(nextStarter);
    setBoard(createEmptyBoard());
  }

  function resetEverything() {
    setBoard(createEmptyBoard());
    setTurn("X");
    setStarter("X");
    setScore({ X: 0, O: 0, draws: 0 });
  }

  function getStatusText() {
    if (winnerPlayer) {
      return `${winnerPlayer.name} venceu essa rodada.`;
    }

    if (result.draw) {
      return "Deu velha. Ninguém ganhou, mas ninguém perdeu o charme.";
    }

    return `Vez de ${currentPlayer.name}.`;
  }

  return (
    <main className="velha-game">
      <div className="velha-topbar">
        <button className="velha-back" type="button" onClick={onBack}>
          ← Voltar ao menu
        </button>

        <div className="velha-title-box">
          <span>clássico rapidinho</span>
          <h1>Jogo da Velha</h1>
        </div>

        <button className="velha-reset-small" type="button" onClick={resetEverything}>
          Zerar placar
        </button>
      </div>

      <section className="velha-table">
        <aside className="velha-player-card rafa-card">
          <div className="velha-avatar">R</div>
          <div>
            <strong>Rafa</strong>
            <p>O azul</p>
          </div>
          <b>{score.O}</b>
        </aside>

        <div className="velha-board-wrap">
          <div className="velha-status">
            <strong>{getStatusText()}</strong>
            {!result.winner && !result.draw && (
              <span>
                {currentPlayer.symbol} · {currentPlayer.phrase}
              </span>
            )}
          </div>

          <div className="velha-board" aria-label="Tabuleiro do jogo da velha">
            {board.map((cell, index) => {
              const isWinningCell = result.line.includes(index);
              const player = cell ? PLAYERS[cell] : null;

              return (
                <button
                  key={index}
                  className={`velha-cell ${player ? player.className : ""} ${
                    isWinningCell ? "winner" : ""
                  }`}
                  type="button"
                  onClick={() => handleCellClick(index)}
                  aria-label={`Casa ${index + 1}`}
                >
                  {cell && <span>{cell}</span>}
                </button>
              );
            })}
          </div>

          <div className="velha-actions">
            <button type="button" onClick={restartRound}>
              Nova rodada
            </button>
          </div>

          
        </div>

        <aside className="velha-player-card emily-card">
          <div className="velha-avatar">E</div>
          <div>
            <strong>Emily</strong>
            <p>X rosa</p>
          </div>
          <b>{score.X}</b>
        </aside>
      </section>
    </main>
  );
}
