import { useEffect, useMemo, useRef, useState } from "react";
import "./DominoGame.css";

const PLAYERS = {
  rafa: {
    id: "rafa",
    name: "Rafa",
    className: "blue",
  },
  emily: {
    id: "emily",
    name: "Emily",
    className: "pink",
  },
};

const PLAYER_ORDER = ["rafa", "emily"];

const TILE = {
  horizontal: {
    width: 58,
    height: 30,
  },
  vertical: {
    width: 30,
    height: 58,
  },
};

const PATH_GAP_X = 4;
const PATH_GAP_Y = 4;

const RIGHT_DIRECTIONS = [
  ...Array(8).fill("right"),
  ...Array(2).fill("down"),
  ...Array(15).fill("left"),
  ...Array(2).fill("up"),
  ...Array(10).fill("right"),
];

const LEFT_DIRECTIONS = [
  ...Array(8).fill("left"),
  ...Array(2).fill("up"),
  ...Array(15).fill("right"),
  ...Array(2).fill("down"),
  ...Array(10).fill("left"),
];

function createTile(a, b) {
  return {
    id: `${a}-${b}`,
    a,
    b,
  };
}

function createTileSet() {
  const tiles = [];

  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      tiles.push(createTile(a, b));
    }
  }

  return tiles;
}

function shuffleTiles(tiles) {
  const nextTiles = [...tiles];

  for (let i = nextTiles.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [nextTiles[i], nextTiles[randomIndex]] = [
      nextTiles[randomIndex],
      nextTiles[i],
    ];
  }

  return nextTiles;
}

function tileScore(tile) {
  return tile.a + tile.b;
}

function handScore(hand) {
  return hand.reduce((sum, tile) => sum + tileScore(tile), 0);
}

function sortHand(hand) {
  return [...hand].sort((tileA, tileB) => {
    const doubleA = tileA.a === tileA.b;
    const doubleB = tileB.a === tileB.b;

    if (doubleA && !doubleB) return -1;
    if (!doubleA && doubleB) return 1;

    return tileScore(tileB) - tileScore(tileA);
  });
}

function getOpponentId(playerId) {
  return playerId === "rafa" ? "emily" : "rafa";
}

function getNextPlayerId(playerId) {
  return getOpponentId(playerId);
}

function findStarter(hands) {
  let best = null;

  PLAYER_ORDER.forEach((playerId) => {
    hands[playerId].forEach((tile) => {
      const isDouble = tile.a === tile.b;
      const value = isDouble ? tile.a + 100 : tileScore(tile);

      if (!best || value > best.value) {
        best = {
          playerId,
          tile,
          value,
        };
      }
    });
  });

  return best;
}

function removeTileFromHand(hand, tileId) {
  return hand.filter((tile) => tile.id !== tileId);
}

function getBoardEnds(board) {
  if (board.length === 0) {
    return {
      left: null,
      right: null,
    };
  }

  return {
    left: board[0].left,
    right: board[board.length - 1].right,
  };
}

function getPlayableSides(tile, board) {
  if (board.length === 0) {
    return ["start"];
  }

  const { left, right } = getBoardEnds(board);
  const sides = [];

  if (tile.a === left || tile.b === left) {
    sides.push("left");
  }

  if (tile.a === right || tile.b === right) {
    sides.push("right");
  }

  return sides;
}

function canPlayTile(tile, board) {
  return getPlayableSides(tile, board).length > 0;
}

function getLegalTiles(hand, board) {
  return hand.filter((tile) => canPlayTile(tile, board));
}

function placeTileOnBoard(board, tile, side) {
  if (board.length === 0 || side === "start") {
    return [
      {
        id: tile.id,
        left: tile.a,
        right: tile.b,
      },
    ];
  }

  const { left, right } = getBoardEnds(board);

  if (side === "left") {
    if (tile.a === left) {
      return [
        {
          id: tile.id,
          left: tile.b,
          right: tile.a,
        },
        ...board,
      ];
    }

    if (tile.b === left) {
      return [
        {
          id: tile.id,
          left: tile.a,
          right: tile.b,
        },
        ...board,
      ];
    }
  }

  if (side === "right") {
    if (tile.a === right) {
      return [
        ...board,
        {
          id: tile.id,
          left: tile.a,
          right: tile.b,
        },
      ];
    }

    if (tile.b === right) {
      return [
        ...board,
        {
          id: tile.id,
          left: tile.b,
          right: tile.a,
        },
      ];
    }
  }

  return board;
}

function isRoundBlocked(hands, boneyard, board) {
  if (boneyard.length > 0) return false;

  const rafaCanPlay = getLegalTiles(hands.rafa, board).length > 0;
  const emilyCanPlay = getLegalTiles(hands.emily, board).length > 0;

  return !rafaCanPlay && !emilyCanPlay;
}

function getBlockedWinner(hands) {
  const rafaScore = handScore(hands.rafa);
  const emilyScore = handScore(hands.emily);

  if (rafaScore < emilyScore) return "rafa";
  if (emilyScore < rafaScore) return "emily";

  return null;
}

function getWinnerMessage(playerId, reason = "normal") {
  if (!playerId) {
    return "O jogo travou em empate. Ninguém é o maioral hoje. Que absurdo.";
  }

  const player = PLAYERS[playerId];

  if (reason === "blocked") {
    return `O jogo travou. ${player.name} ganhou nos pontos! ${player.name} é o maioral, o mais bonito e o mais inteligente do casal.`;
  }

  if (playerId === "emily") {
    return "Emily venceu! Emily é a maioral, a mais bonita e a mais inteligente do casal.";
  }

  return "Rafa venceu! Rafa é o maioral, o mais bonito e o mais inteligente do casal.";
}

function getDirection(directions, index) {
  return directions[Math.min(index - 1, directions.length - 1)];
}

function isHorizontalDirection(direction) {
  return direction === "left" || direction === "right";
}

function getTileValue(tile, side) {
  if (typeof tile[side] === "number") {
    return tile[side];
  }

  if (side === "left" && typeof tile.a === "number") {
    return tile.a;
  }

  if (side === "right" && typeof tile.b === "number") {
    return tile.b;
  }

  return null;
}

function isDoubleTile(tile) {
  const leftValue = getTileValue(tile, "left");
  const rightValue = getTileValue(tile, "right");

  return leftValue !== null && rightValue !== null && leftValue === rightValue;
}

function getTileLayout(tile, direction) {
  const isDouble = isDoubleTile(tile);
  const isVerticalDirection = direction === "up" || direction === "down";

  if (isDouble || isVerticalDirection) {
    return {
      width: TILE.vertical.width,
      height: TILE.vertical.height,
      orientation: "vertical",
    };
  }

  return {
    width: TILE.horizontal.width,
    height: TILE.horizontal.height,
    orientation: "horizontal",
  };
}

function movePoint(previous, currentLayout, direction) {
  const distanceX =
    previous.width / 2 + currentLayout.width / 2 + PATH_GAP_X;

  const distanceY =
    previous.height / 2 + currentLayout.height / 2 + PATH_GAP_Y;

  if (direction === "right") {
    return {
      x: previous.x + distanceX,
      y: previous.y,
    };
  }

  if (direction === "left") {
    return {
      x: previous.x - distanceX,
      y: previous.y,
    };
  }

  if (direction === "down") {
    return {
      x: previous.x,
      y: previous.y + distanceY,
    };
  }

  return {
    x: previous.x,
    y: previous.y - distanceY,
  };
}

function buildArmPoints(tiles, directions) {
  if (tiles.length === 0) return [];

  const firstLayout = getTileLayout(tiles[0], "right");

  const points = [
    {
      x: 0,
      y: 0,
      width: firstLayout.width,
      height: firstLayout.height,
      orientation: firstLayout.orientation,
    },
  ];

  for (let index = 1; index < tiles.length; index++) {
    const direction = getDirection(directions, index);
    const currentLayout = getTileLayout(tiles[index], direction);
    const previous = points[index - 1];
    const nextPoint = movePoint(previous, currentLayout, direction);

    points.push({
      x: nextPoint.x,
      y: nextPoint.y,
      width: currentLayout.width,
      height: currentLayout.height,
      orientation: currentLayout.orientation,
    });
  }

  return points;
}

function getTrailItems(board, leftCount) {
  const centerIndex = Math.max(0, Math.min(leftCount, board.length - 1));

  const rightTiles = board.slice(centerIndex);
  const leftTiles = board.slice(0, centerIndex + 1).reverse();

  const rightPoints = buildArmPoints(rightTiles, RIGHT_DIRECTIONS);
  const leftPoints = buildArmPoints(leftTiles, LEFT_DIRECTIONS);

  const mapped = new Map();

  rightPoints.forEach((path, index) => {
    mapped.set(centerIndex + index, path);
  });

  leftPoints.forEach((path, index) => {
    mapped.set(centerIndex - index, path);
  });

  return board.map((tile, index) => ({
    tile,
    index,
    path: mapped.get(index) || {
      x: 0,
      y: 0,
      orientation: "horizontal",
      width: TILE.horizontal.width,
      height: TILE.horizontal.height,
    },
  }));
}

function getDropTarget(game, side) {
  const centerIndex = Math.max(
    0,
    Math.min(game.leftCount, game.board.length - 1)
  );

  const fakeTile = {
    a: 1,
    b: 2,
    left: 1,
    right: 2,
  };

  if (side === "left") {
    const leftTiles = game.board.slice(0, centerIndex + 1).reverse();
    const points = buildArmPoints([...leftTiles, fakeTile], LEFT_DIRECTIONS);
    return points[points.length - 1];
  }

  const rightTiles = game.board.slice(centerIndex);
  const points = buildArmPoints([...rightTiles, fakeTile], RIGHT_DIRECTIONS);
  return points[points.length - 1];
}
function getNearestDropSideFromPoint(clientX, clientY, rect, game) {
  const pointerX = clientX - rect.left;
  const pointerY = clientY - rect.top;

  const leftTarget = getDropTarget(game, "left");
  const rightTarget = getDropTarget(game, "right");

  const leftX = rect.width / 2 + leftTarget.x;
  const leftY = rect.height / 2 + leftTarget.y;
  const rightX = rect.width / 2 + rightTarget.x;
  const rightY = rect.height / 2 + rightTarget.y;

  const leftDistance = Math.hypot(pointerX - leftX, pointerY - leftY);
  const rightDistance = Math.hypot(pointerX - rightX, pointerY - rightY);

  return leftDistance <= rightDistance ? "left" : "right";
}

function isInsideRect(clientX, clientY, rect) {
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function createInitialGame() {
  const shuffledTiles = shuffleTiles(createTileSet());

  const rafaHand = sortHand(shuffledTiles.slice(0, 7));
  const emilyHand = sortHand(shuffledTiles.slice(7, 14));
  const boneyard = shuffledTiles.slice(14);

  const hands = {
    rafa: rafaHand,
    emily: emilyHand,
  };

  const starter = findStarter(hands);
  const starterPlayer = PLAYERS[starter.playerId];
  const nextPlayerId = getNextPlayerId(starter.playerId);
  const nextPlayer = PLAYERS[nextPlayerId];

  const nextHands = {
    ...hands,
    [starter.playerId]: sortHand(
      removeTileFromHand(hands[starter.playerId], starter.tile.id)
    ),
  };

  const board = [
    {
      id: starter.tile.id,
      left: starter.tile.a,
      right: starter.tile.b,
    },
  ];

  return {
    hands: nextHands,
    boneyard,
    board,
    leftCount: 0,
    currentPlayerId: nextPlayerId,
    selectedTileId: null,
    draggedTileId: null,
    dropHint: null,
    hasBoughtThisTurn: false,
    message: `${starterPlayer.name} começou com [${starter.tile.a}|${starter.tile.b}]. Agora é vez de ${nextPlayer.name}.`,
    winner: null,
    winnerReason: null,
  };
}

function DominoGame({ onBack }) {
  const [game, setGame] = useState(() => createInitialGame());
  const [pointerDrag, setPointerDrag] = useState(null);

  const boardAreaRef = useRef(null);
  const gameRef = useRef(game);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const currentPlayer = PLAYERS[game.currentPlayerId];
  const opponentId = getOpponentId(game.currentPlayerId);
  const opponentPlayer = PLAYERS[opponentId];
  const opponentCount = game.hands[opponentId].length;
  const currentHand = game.hands[game.currentPlayerId];

  const legalTiles = useMemo(() => {
    return getLegalTiles(currentHand, game.board);
  }, [currentHand, game.board]);

  const selectedTile = useMemo(() => {
    return currentHand.find((tile) => tile.id === game.selectedTileId) || null;
  }, [currentHand, game.selectedTileId]);

  const selectedSides = useMemo(() => {
    if (!selectedTile) return [];
    return getPlayableSides(selectedTile, game.board);
  }, [selectedTile, game.board]);

  const boardEnds = getBoardEnds(game.board);
  const trailItems = getTrailItems(game.board, game.leftCount);
  const leftDropTarget = getDropTarget(game, "left");
  const rightDropTarget = getDropTarget(game, "right");

  const canBuy =
    !game.winner &&
    !game.hasBoughtThisTurn &&
    legalTiles.length === 0 &&
    game.boneyard.length > 0;

  const canPass =
    !game.winner &&
    legalTiles.length === 0 &&
    (game.boneyard.length === 0 || game.hasBoughtThisTurn);

  function resetGame() {
    setGame(createInitialGame());
    setPointerDrag(null);
  }

  function selectTile(tileId) {
    if (gameRef.current.winner) return;

    const current = gameRef.current;
    const hand = current.hands[current.currentPlayerId];
    const tile = hand.find((item) => item.id === tileId);

    if (!tile) return;

    const sides = getPlayableSides(tile, current.board);

    if (sides.length === 0) return;

    if (sides.length === 1) {
      playTile(tileId, sides[0]);
      return;
    }

    setGame((state) => ({
      ...state,
      selectedTileId: tileId,
      message: "Essa peça encaixa dos dois lados. Escolha onde jogar.",
    }));
  }

  function playTile(tileId, side) {
    setGame((current) => {
      if (current.winner) return current;

      const playerId = current.currentPlayerId;
      const player = PLAYERS[playerId];
      const nextPlayerId = getNextPlayerId(playerId);
      const nextPlayer = PLAYERS[nextPlayerId];
      const hand = current.hands[playerId];
      const tile = hand.find((item) => item.id === tileId);

      if (!tile) return current;

      const playableSides = getPlayableSides(tile, current.board);

      if (!playableSides.includes(side)) {
        const ends = getBoardEnds(current.board);

        return {
          ...current,
          selectedTileId: tile.id,
          draggedTileId: null,
          dropHint: {
            side,
            valid: false,
          },
          message:
            side === "left"
              ? `Bloqueado. Essa peça não encaixa na ponta esquerda (${ends.left}).`
              : `Bloqueado. Essa peça não encaixa na ponta direita (${ends.right}).`,
        };
      }

      const nextBoard = placeTileOnBoard(current.board, tile, side);

      const nextHands = {
        ...current.hands,
        [playerId]: sortHand(removeTileFromHand(hand, tile.id)),
      };

      const nextLeftCount =
        side === "left" ? current.leftCount + 1 : current.leftCount;

      if (nextHands[playerId].length === 0) {
        return {
          ...current,
          hands: nextHands,
          board: nextBoard,
          leftCount: nextLeftCount,
          selectedTileId: null,
          draggedTileId: null,
          dropHint: null,
          hasBoughtThisTurn: false,
          winner: playerId,
          winnerReason: "normal",
          message: getWinnerMessage(playerId),
        };
      }

      if (isRoundBlocked(nextHands, current.boneyard, nextBoard)) {
        const winnerId = getBlockedWinner(nextHands);

        return {
          ...current,
          hands: nextHands,
          board: nextBoard,
          leftCount: nextLeftCount,
          selectedTileId: null,
          draggedTileId: null,
          dropHint: null,
          hasBoughtThisTurn: false,
          winner: winnerId,
          winnerReason: "blocked",
          message: getWinnerMessage(winnerId, "blocked"),
        };
      }

      return {
        ...current,
        hands: nextHands,
        board: nextBoard,
        leftCount: nextLeftCount,
        currentPlayerId: nextPlayerId,
        selectedTileId: null,
        draggedTileId: null,
        dropHint: null,
        hasBoughtThisTurn: false,
        message: `${player.name} jogou [${tile.a}|${tile.b}]. Agora é vez de ${nextPlayer.name}.`,
      };
    });
  }

  function playSelectedTile(side) {
    if (!selectedTile || !selectedSides.includes(side)) return;
    playTile(selectedTile.id, side);
  }

  function buyTile() {
    if (!canBuy) return;

    setGame((current) => {
      const [boughtTile, ...nextBoneyard] = current.boneyard;
      const playerId = current.currentPlayerId;
      const player = PLAYERS[playerId];

      const nextHands = {
        ...current.hands,
        [playerId]: sortHand([...current.hands[playerId], boughtTile]),
      };

      const canPlayAfterBuying = canPlayTile(boughtTile, current.board);

      return {
        ...current,
        hands: nextHands,
        boneyard: nextBoneyard,
        selectedTileId: null,
        draggedTileId: null,
        dropHint: null,
        hasBoughtThisTurn: true,
        message: canPlayAfterBuying
          ? `${player.name} comprou uma peça que encaixa. Agora jogue ela ou outra peça disponível.`
          : `${player.name} comprou uma peça, mas ainda não encaixa. Agora pode passar.`,
      };
    });
  }

  function passTurn() {
    if (!canPass) return;

    setGame((current) => {
      if (isRoundBlocked(current.hands, current.boneyard, current.board)) {
        const winnerId = getBlockedWinner(current.hands);

        return {
          ...current,
          selectedTileId: null,
          draggedTileId: null,
          dropHint: null,
          hasBoughtThisTurn: false,
          winner: winnerId,
          winnerReason: "blocked",
          message: getWinnerMessage(winnerId, "blocked"),
        };
      }

      const nextPlayerId = getNextPlayerId(current.currentPlayerId);
      const player = PLAYERS[current.currentPlayerId];
      const nextPlayer = PLAYERS[nextPlayerId];

      return {
        ...current,
        currentPlayerId: nextPlayerId,
        selectedTileId: null,
        draggedTileId: null,
        dropHint: null,
        hasBoughtThisTurn: false,
        message: `${player.name} passou a vez. Agora é vez de ${nextPlayer.name}.`,
      };
    });
  }

  function updateDropHint(clientX, clientY, tileId) {
    const current = gameRef.current;
    const boardRect = boardAreaRef.current?.getBoundingClientRect();

    if (!boardRect || !isInsideRect(clientX, clientY, boardRect)) {
      setGame((state) => ({
        ...state,
        dropHint: null,
      }));
      return;
    }

    const hand = current.hands[current.currentPlayerId];
    const tile = hand.find((item) => item.id === tileId);

    if (!tile) return;

    const side = getNearestDropSideFromPoint(
      clientX,
      clientY,
      boardRect,
      current
    );

    const valid = getPlayableSides(tile, current.board).includes(side);

    setGame((state) => {
      if (state.dropHint?.side === side && state.dropHint?.valid === valid) {
        return state;
      }

      return {
        ...state,
        dropHint: {
          side,
          valid,
        },
      };
    });
  }

  function handlePointerDown(tileId, event) {
    if (event.button !== 0) return;

    const current = gameRef.current;
    const hand = current.hands[current.currentPlayerId];
    const tile = hand.find((item) => item.id === tileId);

    if (!tile || !canPlayTile(tile, current.board)) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    setPointerDrag({
      tileId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    });

    setGame((state) => ({
      ...state,
      draggedTileId: tileId,
      selectedTileId: tileId,
      dropHint: null,
    }));
  }

  function handlePointerMove(tileId, event) {
    setPointerDrag((current) => {
      if (!current || current.tileId !== tileId) return current;

      const distance = Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY
      );

      const nextDrag = {
        ...current,
        x: event.clientX,
        y: event.clientY,
        moved: current.moved || distance > 6,
      };

      if (nextDrag.moved) {
        updateDropHint(event.clientX, event.clientY, tileId);
      }

      return nextDrag;
    });
  }

  function handlePointerUp(tileId, event) {
    const currentDrag = pointerDrag;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // pointer capture may already be released
    }

    if (!currentDrag || currentDrag.tileId !== tileId) {
      return;
    }

    const boardRect = boardAreaRef.current?.getBoundingClientRect();

    if (
      currentDrag.moved &&
      boardRect &&
      isInsideRect(event.clientX, event.clientY, boardRect)
    ) {
      const side = getNearestDropSideFromPoint(
        event.clientX,
        event.clientY,
        boardRect,
        gameRef.current
      );

      playTile(tileId, side);
    } else if (!currentDrag.moved) {
      selectTile(tileId);
    } else {
      setGame((state) => ({
        ...state,
        draggedTileId: null,
        dropHint: null,
      }));
    }

    setPointerDrag(null);
  }

  const draggedTile = pointerDrag
    ? currentHand.find((tile) => tile.id === pointerDrag.tileId)
    : null;

  return (
    <section className="domino-page">
      <div className="domino-table">
        <header className="domino-topbar">
          <button className="domino-icon-button" onClick={onBack}>
            ‹
          </button>

          <div>
            <p>Dominó</p>
            <h1>Rafa contra Emily</h1>
          </div>

          <button className="domino-icon-button" onClick={resetGame}>
            ↻
          </button>
        </header>

        <div className={`domino-turn-pill domino-turn-${currentPlayer.className}`}>
          <span>Vez de jogar</span>
          <strong>{currentPlayer.name}</strong>
        </div>

        <div className="domino-board-meta">
          

          <div>
            <span>Monte</span>
            <strong>{game.boneyard.length}</strong>
          </div>

          

          <div>
            <span>Peças de {opponentPlayer.name}</span>
            <strong>{opponentCount}</strong>
          </div>
        </div>

        <main
          ref={boardAreaRef}
          className={`domino-board-area ${
            game.dropHint
              ? game.dropHint.valid
                ? "drag-valid"
                : "drag-invalid"
              : ""
          }`}
        >
          <div className="domino-trail-board">
            {game.dropHint && (
              <div
                className={`domino-drop-marker ${
                  game.dropHint.valid ? "valid" : "invalid"
                }`}
                style={{
                  "--drop-x": `${game.dropHint.side === "left" ? leftDropTarget.x : rightDropTarget.x}px`,
                  "--drop-y": `${game.dropHint.side === "left" ? leftDropTarget.y : rightDropTarget.y}px`,
                }}
              >
                <strong>{game.dropHint.valid ? "Solte" : "X"}</strong>
              </div>
            )}

            {trailItems.map((item) => (
              <div
                key={`${item.tile.id}-${item.index}`}
                className="domino-board-piece"
                style={{
                  "--tile-x": `${item.path.x}px`,
                  "--tile-y": `${item.path.y}px`,
                  "--tile-w": `${item.path.width}px`,
                  "--tile-h": `${item.path.height}px`,
                }}
              >
                <DominoTile
                  tile={item.tile}
                  mode="board"
                  orientation={item.path.orientation || "horizontal"}
                />
              </div>
            ))}
          </div>
        </main>

        <div className="domino-message-pill">{game.message}</div>

        <section className="domino-bottom-area">
          {game.winner ? (
            <div className="domino-end-card">
              <strong>Fim de jogo</strong>
              <p>{game.message}</p>
              <button className="domino-primary-button" onClick={resetGame}>
                Jogar de novo
              </button>
            </div>
          ) : (
            <div className="domino-hand-shell">
              <div className="domino-hand-header">
                <div>
                  <span>Peças de</span>
                  <strong>{currentPlayer.name}</strong>
                </div>

                <div className="domino-hand-actions">
                  <button
                    className="domino-mini-button"
                    onClick={buyTile}
                    disabled={!canBuy}
                  >
                    Comprar
                  </button>

                  <button
                    className="domino-mini-button ghost"
                    onClick={passTurn}
                    disabled={!canPass}
                  >
                    Passar
                  </button>
                </div>
              </div>

              <div className="domino-hand">
                {currentHand.map((tile) => {
                  const playable = canPlayTile(tile, game.board);
                  const selected = tile.id === game.selectedTileId;

                  return (
                    <button
                      key={tile.id}
                      className={`domino-hand-tile ${
                        playable ? "playable" : "blocked"
                      } ${selected ? "selected" : ""}`}
                      onPointerDown={(event) => handlePointerDown(tile.id, event)}
                      onPointerMove={(event) => handlePointerMove(tile.id, event)}
                      onPointerUp={(event) => handlePointerUp(tile.id, event)}
                      disabled={!playable}
                    >
                      <DominoTile
                        tile={{
                          left: tile.a,
                          right: tile.b,
                        }}
                        mode="hand"
                      />
                    </button>
                  );
                })}
              </div>

              {selectedTile && selectedSides.length > 1 && (
                <div className="domino-side-actions">
                  <span>
                    [{selectedTile.a}|{selectedTile.b}] encaixa dos dois lados:
                  </span>

                  <div>
                    {selectedSides.includes("left") && (
                      <button
                        className="domino-secondary-button"
                        onClick={() => playSelectedTile("left")}
                      >
                        Esquerda
                      </button>
                    )}

                    {selectedSides.includes("right") && (
                      <button
                        className="domino-secondary-button"
                        onClick={() => playSelectedTile("right")}
                      >
                        Direita
                      </button>
                    )}
                  </div>
                </div>
              )}

              <p className="domino-help-text">
                {legalTiles.length > 0
                  ? "Arraste uma peça para perto da ponta do caminho."
                  : canBuy
                    ? "Nenhuma peça encaixa. Compre uma peça."
                    : game.hasBoughtThisTurn
                      ? "Você já comprou uma peça neste turno. Se nada encaixa, passe a vez."
                      : "Nenhuma peça encaixa e o monte acabou. Passe a vez."}
              </p>
            </div>
          )}
        </section>

        {draggedTile && pointerDrag && (
          <div
            className="domino-drag-preview"
            style={{
              "--drag-x": `${pointerDrag.x}px`,
              "--drag-y": `${pointerDrag.y}px`,
            }}
          >
            <DominoTile
              tile={{
                left: draggedTile.a,
                right: draggedTile.b,
              }}
              mode="hand"
            />
          </div>
        )}
      </div>
    </section>
  );
}

function DominoTile({ tile, mode, orientation }) {
  const isDouble = tile.left === tile.right;

  const visualOrientation =
    mode === "hand"
      ? "vertical"
      : orientation === "vertical"
        ? "vertical"
        : "horizontal";

  return (
    <div
      className={`domino-tile domino-tile-${mode} domino-tile-${visualOrientation} ${
        isDouble ? "double" : ""
      }`}
    >
      <span>{tile.left}</span>
      <i />
      <span>{tile.right}</span>
    </div>
  );
}

export default DominoGame;