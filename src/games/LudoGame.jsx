import { useState } from "react";

const BOARD_SIZE = 15;
const COMMON_PART_LENGTH = 51;
const DICE_VALUES = [1, 2, 3, 4, 5, 6];

const COMMON_LOOP = [
  { row: 6, col: 1 },
  { row: 6, col: 2 },
  { row: 6, col: 3 },
  { row: 6, col: 4 },
  { row: 6, col: 5 },
  { row: 5, col: 6 },
  { row: 4, col: 6 },
  { row: 3, col: 6 },
  { row: 2, col: 6 },
  { row: 1, col: 6 },
  { row: 0, col: 6 },
  { row: 0, col: 7 },
  { row: 0, col: 8 },
  { row: 1, col: 8 },
  { row: 2, col: 8 },
  { row: 3, col: 8 },
  { row: 4, col: 8 },
  { row: 5, col: 8 },
  { row: 6, col: 9 },
  { row: 6, col: 10 },
  { row: 6, col: 11 },
  { row: 6, col: 12 },
  { row: 6, col: 13 },
  { row: 6, col: 14 },
  { row: 7, col: 14 },
  { row: 8, col: 14 },
  { row: 8, col: 13 },
  { row: 8, col: 12 },
  { row: 8, col: 11 },
  { row: 8, col: 10 },
  { row: 8, col: 9 },
  { row: 9, col: 8 },
  { row: 10, col: 8 },
  { row: 11, col: 8 },
  { row: 12, col: 8 },
  { row: 13, col: 8 },
  { row: 14, col: 8 },
  { row: 14, col: 7 },
  { row: 14, col: 6 },
  { row: 13, col: 6 },
  { row: 12, col: 6 },
  { row: 11, col: 6 },
  { row: 10, col: 6 },
  { row: 9, col: 6 },
  { row: 8, col: 5 },
  { row: 8, col: 4 },
  { row: 8, col: 3 },
  { row: 8, col: 2 },
  { row: 8, col: 1 },
  { row: 8, col: 0 },
  { row: 7, col: 0 },
  { row: 6, col: 0 },
];

const SAFE_COMMON_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

const PLAYER_ORDER = ["rafa", "emily"];

const PLAYER_DATA = {
  rafa: {
    id: "rafa",
    name: "Rafa",
    colorName: "azul",
    className: "blue",
    startIndex: 39,
    homeLane: [
      { row: 13, col: 7 },
      { row: 12, col: 7 },
      { row: 11, col: 7 },
      { row: 10, col: 7 },
      { row: 9, col: 7 },
      { row: 8, col: 7 },
    ],
  },
  emily: {
    id: "emily",
    name: "Emily",
    colorName: "rosa",
    className: "pink",
    startIndex: 13,
    homeLane: [
      { row: 1, col: 7 },
      { row: 2, col: 7 },
      { row: 3, col: 7 },
      { row: 4, col: 7 },
      { row: 5, col: 7 },
      { row: 6, col: 7 },
    ],
  },
};

const BASE_SLOTS = {
  rafa: [
    { row: 10, col: 1 },
    { row: 10, col: 4 },
    { row: 13, col: 1 },
    { row: 13, col: 4 },
  ],
  emily: [
    { row: 1, col: 10 },
    { row: 1, col: 13 },
    { row: 4, col: 10 },
    { row: 4, col: 13 },
  ],
};

const INITIAL_PIECES = {
  rafa: [-1, -1, -1, -1],
  emily: [-1, -1, -1, -1],
};

function coordKey(row, col) {
  return `${row}-${col}`;
}

const COMMON_INDEX_BY_COORD = new Map(
  COMMON_LOOP.map((coord, index) => [coordKey(coord.row, coord.col), index])
);

function buildPlayerPath(player) {
  const commonPart = Array.from({ length: COMMON_PART_LENGTH }).map(
    (_, pathIndex) => {
      const loopIndex = (player.startIndex + pathIndex) % COMMON_LOOP.length;
      const coord = COMMON_LOOP[loopIndex];

      return {
        ...coord,
        type: "common",
        loopIndex,
      };
    }
  );

  const homePart = player.homeLane.map((coord, index) => ({
    ...coord,
    type: "home",
    homeIndex: index,
    loopIndex: null,
  }));

  return [...commonPart, ...homePart];
}

const PATHS = {
  rafa: buildPlayerPath(PLAYER_DATA.rafa),
  emily: buildPlayerPath(PLAYER_DATA.emily),
};

function clonePieces(pieces) {
  return {
    rafa: [...pieces.rafa],
    emily: [...pieces.emily],
  };
}

function getOpponentId(playerId) {
  return playerId === "rafa" ? "emily" : "rafa";
}

function isFinished(playerId, position) {
  return position === PATHS[playerId].length - 1;
}

function countFinished(playerId, pieces) {
  return pieces[playerId].filter((position) => isFinished(playerId, position))
    .length;
}

function countInBase(playerId, pieces) {
  return pieces[playerId].filter((position) => position === -1).length;
}

function getWinnerMessage(playerId) {
  if (playerId === "emily") {
    return "Emily venceu! Emily é a maioral, a mais bonita e a mais inteligente do casal.";
  }

  return "Rafa venceu! Rafa é o maioral, o mais bonito e o mais inteligente do casal.";
}

function getPieceCoord(playerId, tokenIndex, pieces) {
  const position = pieces[playerId][tokenIndex];

  if (position === -1) {
    return BASE_SLOTS[playerId][tokenIndex];
  }

  return PATHS[playerId][position];
}

function isSafePosition(playerId, position) {
  if (position < 0 || position >= COMMON_PART_LENGTH) return true;

  const pathCell = PATHS[playerId][position];
  return SAFE_COMMON_INDICES.has(pathCell.loopIndex);
}

function getMoveOutcome(playerId, tokenIndex, roll, pieces) {
  const oldPosition = pieces[playerId][tokenIndex];

  if (isFinished(playerId, oldPosition)) return null;

  if (oldPosition === -1 && roll !== 6) return null;

  const newPosition = oldPosition === -1 ? 0 : oldPosition + roll;

  if (newPosition >= PATHS[playerId].length) return null;

  const nextPieces = clonePieces(pieces);
  nextPieces[playerId][tokenIndex] = newPosition;

  const captures = [];
  const opponentId = getOpponentId(playerId);
  const destination = PATHS[playerId][newPosition];
  const isCommonCell = newPosition < COMMON_PART_LENGTH;

  if (isCommonCell && !isSafePosition(playerId, newPosition)) {
    pieces[opponentId].forEach((opponentPosition, opponentTokenIndex) => {
      if (opponentPosition < 0 || opponentPosition >= COMMON_PART_LENGTH) {
        return;
      }

      const opponentCoord = PATHS[opponentId][opponentPosition];

      if (
        opponentCoord.row === destination.row &&
        opponentCoord.col === destination.col
      ) {
        captures.push(opponentTokenIndex);
        nextPieces[opponentId][opponentTokenIndex] = -1;
      }
    });
  }

  const willFinish = isFinished(playerId, newPosition);
  const willWin = nextPieces[playerId].every((position) =>
    isFinished(playerId, position)
  );

  return {
    tokenIndex,
    oldPosition,
    newPosition,
    captures,
    willFinish,
    willWin,
    nextPieces,
  };
}

function getLegalMoves(playerId, roll, pieces) {
  return pieces[playerId]
    .map((_, tokenIndex) => getMoveOutcome(playerId, tokenIndex, roll, pieces))
    .filter(Boolean);
}

function analyzeRoll(playerId, roll, pieces) {
  const moves = getLegalMoves(playerId, roll, pieces);

  return {
    roll,
    moves,
    hasLegal: moves.length > 0,
    releasesPiece: moves.some((move) => move.oldPosition === -1),
    captures: moves.some((move) => move.captures.length > 0),
    finishes: moves.some((move) => move.willFinish),
    wins: moves.some((move) => move.willWin),
    score: moves.reduce((bestScore, move) => {
      const progress =
        move.oldPosition === -1 ? 6 : move.newPosition - move.oldPosition;

      const score =
        progress +
        (move.oldPosition === -1 ? 4 : 0) +
        (move.captures.length > 0 ? 8 : 0) +
        (move.willFinish ? 10 : 0) +
        (move.willWin ? 50 : 0);

      return Math.max(bestScore, score);
    }, 0),
  };
}

function getRandomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getWeightedRoll(analyses) {
  const totalWeight = analyses.reduce(
    (sum, item) => sum + Math.max(item.score, 1),
    0
  );

  let pointer = Math.random() * totalWeight;

  for (const item of analyses) {
    pointer -= Math.max(item.score, 1);

    if (pointer <= 0) {
      return item.roll;
    }
  }

  return analyses[0]?.roll || getRandomItem(DICE_VALUES);
}

function rollDie(playerId, pieces, turnNumber) {
  const analyses = DICE_VALUES.map((roll) =>
    analyzeRoll(playerId, roll, pieces)
  );

  const legalAnalyses = analyses.filter((item) => item.hasLegal);
  const naturalRoll = getRandomItem(DICE_VALUES);
  const naturalAnalysis = analyses.find((item) => item.roll === naturalRoll);

  const emilyFinished = countFinished("emily", pieces);
  const rafaFinished = countFinished("rafa", pieces);
  const emilyInBase = countInBase("emily", pieces);

  if (playerId === "emily") {
    const winningRolls = legalAnalyses.filter((item) => item.wins);
    const captureRolls = legalAnalyses.filter((item) => item.captures);
    const finishRolls = legalAnalyses.filter((item) => item.finishes);
    const releaseRolls = legalAnalyses.filter((item) => item.releasesPiece);

    const emilyIsBehind = emilyFinished < rafaFinished;
    const gameIsAdvanced = turnNumber >= 18;
    const gameIsLate = turnNumber >= 28;

    if (Math.random() < 0.72) {
      return naturalRoll;
    }

    if (winningRolls.length > 0 && Math.random() < 0.65) {
      return getRandomItem(winningRolls).roll;
    }

    if ((emilyIsBehind || gameIsAdvanced) && captureRolls.length > 0) {
      if (Math.random() < 0.28) {
        return getRandomItem(captureRolls).roll;
      }
    }

    if ((emilyIsBehind || gameIsAdvanced) && finishRolls.length > 0) {
      if (Math.random() < 0.24) {
        return getRandomItem(finishRolls).roll;
      }
    }

    if (emilyInBase >= 2 && releaseRolls.length > 0) {
      if (Math.random() < 0.22) {
        return 6;
      }
    }

    if (gameIsLate && legalAnalyses.length > 0 && Math.random() < 0.32) {
      return getWeightedRoll(legalAnalyses);
    }

    return naturalRoll;
  }

  if (playerId === "rafa") {
    const rafaWinningNaturally = naturalAnalysis?.wins;

    if (rafaWinningNaturally && emilyFinished < 4) {
      const nonWinningRolls = analyses.filter((item) => !item.wins);

      if (nonWinningRolls.length > 0) {
        return getRandomItem(nonWinningRolls).roll;
      }
    }

    const rafaIsTooAhead = rafaFinished > emilyFinished + 1;

    if (rafaIsTooAhead && turnNumber >= 20 && Math.random() < 0.18) {
      const calmerRolls = analyses.filter(
        (item) => !item.wins && !item.captures && !item.finishes
      );

      if (calmerRolls.length > 0) {
        return getRandomItem(calmerRolls).roll;
      }
    }

    return naturalRoll;
  }

  return naturalRoll;
}

function getCellInfo(row, col) {
  const classes = ["ludo-cell"];
  const key = coordKey(row, col);
  const commonIndex = COMMON_INDEX_BY_COORD.get(key);

  if (row <= 5 && col <= 5) {
    classes.push("ludo-home-zone", "ludo-home-neutral");
  }

  if (row <= 5 && col >= 9) {
    classes.push("ludo-home-zone", "ludo-home-pink");
  }

  if (row >= 9 && col <= 5) {
    classes.push("ludo-home-zone", "ludo-home-blue");
  }

  if (row >= 9 && col >= 9) {
    classes.push("ludo-home-zone", "ludo-home-neutral");
  }

  if (commonIndex !== undefined) {
    classes.push("ludo-track");

    if (SAFE_COMMON_INDICES.has(commonIndex)) {
      classes.push("ludo-safe");
    }

    if (commonIndex === PLAYER_DATA.emily.startIndex) {
      classes.push("ludo-start-pink");
    }

    if (commonIndex === PLAYER_DATA.rafa.startIndex) {
      classes.push("ludo-start-blue");
    }
  }

  if (
    PLAYER_DATA.emily.homeLane.some(
      (cell) => cell.row === row && cell.col === col
    )
  ) {
    classes.push("ludo-lane", "ludo-lane-pink");
  }

  if (
    PLAYER_DATA.rafa.homeLane.some(
      (cell) => cell.row === row && cell.col === col
    )
  ) {
    classes.push("ludo-lane", "ludo-lane-blue");
  }

  if (row === 7 && col === 7) {
    classes.push("ludo-center");
  }

  if (BASE_SLOTS.emily.some((cell) => cell.row === row && cell.col === col)) {
    classes.push("ludo-base-slot", "ludo-base-slot-pink");
  }

  if (BASE_SLOTS.rafa.some((cell) => cell.row === row && cell.col === col)) {
    classes.push("ludo-base-slot", "ludo-base-slot-blue");
  }

  return {
    className: classes.join(" "),
    isSafe: commonIndex !== undefined && SAFE_COMMON_INDICES.has(commonIndex),
    isCenter: row === 7 && col === 7,
  };
}

function LudoGame({ onBack }) {
  const [pieces, setPieces] = useState(INITIAL_PIECES);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [dice, setDice] = useState(null);
  const [phase, setPhase] = useState("roll");
  const [legalTokens, setLegalTokens] = useState([]);
  const [turnNumber, setTurnNumber] = useState(1);
  const [message, setMessage] = useState("Vez do Rafa. Role o dado.");

  const currentPlayerId = PLAYER_ORDER[currentPlayerIndex];
  const currentPlayer = PLAYER_DATA[currentPlayerId];

  function resetGame() {
    setPieces(INITIAL_PIECES);
    setCurrentPlayerIndex(0);
    setDice(null);
    setPhase("roll");
    setLegalTokens([]);
    setTurnNumber(1);
    setMessage("Vez do Rafa. Role o dado.");
  }

  function goToNextTurn() {
    const nextIndex = currentPlayerIndex === 0 ? 1 : 0;
    const nextPlayerId = PLAYER_ORDER[nextIndex];
    const nextPlayer = PLAYER_DATA[nextPlayerId];

    setCurrentPlayerIndex(nextIndex);
    setDice(null);
    setLegalTokens([]);
    setPhase("roll");
    setTurnNumber((current) => current + 1);
    setMessage(`Vez de ${nextPlayer.name}. Role o dado.`);
  }

  function handleRoll() {
    if (phase !== "roll") return;

    const nextDice = rollDie(currentPlayerId, pieces, turnNumber);
    const moves = getLegalMoves(currentPlayerId, nextDice, pieces);

    setDice(nextDice);
    setLegalTokens(moves.map((move) => move.tokenIndex));

    if (moves.length === 0) {
      setPhase("blocked");
      setMessage(
        `${currentPlayer.name} tirou ${nextDice}, mas não tem peça para mover.`
      );
      return;
    }

    setPhase("move");
    setMessage(`${currentPlayer.name} tirou ${nextDice}. Escolha uma peça.`);
  }

  function handlePassTurn() {
    if (phase !== "blocked") return;
    goToNextTurn();
  }

  function handlePieceClick(playerId, tokenIndex) {
    if (phase !== "move") return;
    if (playerId !== currentPlayerId) return;
    if (!legalTokens.includes(tokenIndex)) return;

    const outcome = getMoveOutcome(playerId, tokenIndex, dice, pieces);

    if (!outcome) return;

    const player = PLAYER_DATA[playerId];
    const opponent = PLAYER_DATA[getOpponentId(playerId)];
    const nextPieces = outcome.nextPieces;

    setPieces(nextPieces);

    let nextMessage =
      outcome.oldPosition === -1
        ? `${player.name} tirou uma peça da base.`
        : `${player.name} avançou ${dice} casa${dice > 1 ? "s" : ""}.`;

    if (outcome.captures.length > 0) {
      nextMessage = `${player.name} capturou uma peça de ${opponent.name}.`;
    }

    if (outcome.willFinish) {
      nextMessage = `${player.name} colocou uma peça na casa final.`;
    }

    if (outcome.willWin) {
      setPhase("gameover");
      setDice(null);
      setLegalTokens([]);
      setMessage(getWinnerMessage(playerId));
      return;
    }

    const getsExtraTurn =
      dice === 6 || outcome.captures.length > 0 || outcome.willFinish;

    if (getsExtraTurn) {
      setDice(null);
      setLegalTokens([]);
      setPhase("roll");
      setTurnNumber((current) => current + 1);
      setMessage(`${nextMessage} ${player.name} joga de novo.`);
      return;
    }

    const nextIndex = currentPlayerIndex === 0 ? 1 : 0;
    const nextPlayerId = PLAYER_ORDER[nextIndex];
    const nextPlayer = PLAYER_DATA[nextPlayerId];

    setCurrentPlayerIndex(nextIndex);
    setDice(null);
    setLegalTokens([]);
    setPhase("roll");
    setTurnNumber((current) => current + 1);
    setMessage(`${nextMessage} Agora é vez de ${nextPlayer.name}.`);
  }

  return (
    <section className="ludo-page">
      <header className="ludo-header">
        <button className="ludo-icon-button" onClick={onBack}>
          ‹
        </button>

        <div>
          <p>Ludo</p>
          <h1>Rafa azul contra Emily rosa.</h1>
        </div>

        <button className="ludo-icon-button" onClick={resetGame}>
          ↻
        </button>
      </header>

      <div className="ludo-layout">
        <div className="ludo-board-card">
          <LudoBoard
            pieces={pieces}
            currentPlayerId={currentPlayerId}
            legalTokens={legalTokens}
            phase={phase}
            onPieceClick={handlePieceClick}
          />
        </div>

        <aside className="ludo-panel">
          <div className={`ludo-turn-card ludo-turn-${currentPlayer.className}`}>
            <span>Vez de jogar</span>
            <strong>{currentPlayer.name}</strong>
            <small>{currentPlayer.colorName}</small>
          </div>

          <div className="ludo-dice-card">
            <span>Dado</span>
            <div className="ludo-dice">{dice || "?"}</div>

            {phase === "roll" && (
              <button className="ludo-primary-button" onClick={handleRoll}>
                Rolar dado
              </button>
            )}

            {phase === "move" && (
              <p className="ludo-small-text">
                Escolha uma das peças brilhando no tabuleiro.
              </p>
            )}

            {phase === "blocked" && (
              <button className="ludo-primary-button" onClick={handlePassTurn}>
                Passar vez
              </button>
            )}

            {phase === "gameover" && (
              <button className="ludo-primary-button" onClick={resetGame}>
                Jogar de novo
              </button>
            )}
          </div>

          <div className="ludo-message">{message}</div>

          <div className="ludo-score-grid">
            <PlayerStatus playerId="rafa" pieces={pieces} />
            <PlayerStatus playerId="emily" pieces={pieces} />
          </div>

          <div className="ludo-rules">
            <strong>Regras rápidas</strong>
            <p>6 tira peça da base e dá jogada extra.</p>
            <p>Caindo em cima da peça adversária, captura.</p>
            <p>Casas com estrela são seguras.</p>
            <p>Precisa do número exato para chegar na casa final.</p>
            <p>Chegou na casa final, joga de novo.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function LudoBoard({ pieces, currentPlayerId, legalTokens, phase, onPieceClick }) {
  const cells = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cellInfo = getCellInfo(row, col);
      const piecesAtCell = getPiecesAtCell(row, col, pieces);

      cells.push(
        <div className={cellInfo.className} key={`${row}-${col}`}>
          {cellInfo.isCenter && <span className="ludo-center-heart">♥</span>}
          {cellInfo.isSafe && <span className="ludo-safe-star">★</span>}

          {piecesAtCell.length > 0 && (
            <div className={`ludo-pieces-stack count-${piecesAtCell.length}`}>
              {piecesAtCell.map((piece) => {
                const player = PLAYER_DATA[piece.playerId];
                const canMove =
                  phase === "move" &&
                  piece.playerId === currentPlayerId &&
                  legalTokens.includes(piece.tokenIndex);

                return (
                  <button
                    key={`${piece.playerId}-${piece.tokenIndex}`}
                    className={`ludo-piece ludo-piece-${player.className} ${
                      canMove ? "movable" : ""
                    }`}
                    onClick={() => onPieceClick(piece.playerId, piece.tokenIndex)}
                    disabled={!canMove}
                  >
                    {piece.tokenIndex + 1}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }
  }

  return <div className="ludo-board">{cells}</div>;
}

function getPiecesAtCell(row, col, pieces) {
  const piecesAtCell = [];

  PLAYER_ORDER.forEach((playerId) => {
    pieces[playerId].forEach((_, tokenIndex) => {
      const coord = getPieceCoord(playerId, tokenIndex, pieces);

      if (coord.row === row && coord.col === col) {
        piecesAtCell.push({
          playerId,
          tokenIndex,
        });
      }
    });
  });

  return piecesAtCell;
}

function PlayerStatus({ playerId, pieces }) {
  const player = PLAYER_DATA[playerId];
  const finished = countFinished(playerId, pieces);
  const inBase = countInBase(playerId, pieces);
  const onBoard = 4 - finished - inBase;

  return (
    <div className={`ludo-player-status ludo-status-${player.className}`}>
      <strong>{player.name}</strong>
      <span>Base: {inBase}</span>
      <span>Jogo: {onBoard}</span>
      <span>Final: {finished}/4</span>
    </div>
  );
}

export default LudoGame;