import { useState } from "react";
import "./BatalhaNavalGame.css";

const BOARD_SIZE = 8;
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;
const CELLS = Array.from({ length: TOTAL_CELLS }, (_, index) => index);
const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const PLAYERS = {
  emily: {
    name: "Emily",
    initial: "E",
    className: "emily",
    privateWarning: "Rafa, vira o rosto. Essa parte é só da Emily.",
  },
  rafa: {
    name: "Rafa",
    initial: "R",
    className: "rafa",
    privateWarning: "Emily, agora é sua vez de não espiar.",
  },
};

const SHIPS = [
  { id: "coracao", name: "Coração", size: 5, symbol: "💗" },
  { id: "vuxe", name: "Vuxe", size: 4, symbol: "✨" },
  { id: "moto", name: "Moto", size: 2, symbol: "🏍️" },
  { id: "docinho", name: "Docinho", size: 3, symbol: "🍬" },
];

function createEmptyFleets() {
  return {
    emily: [],
    rafa: [],
  };
}

function createEmptyShots() {
  return {
    emily: [],
    rafa: [],
  };
}

function getOpponent(player) {
  return player === "emily" ? "rafa" : "emily";
}

function getCoordinate(index) {
  const row = Math.floor(index / BOARD_SIZE);
  const col = index % BOARD_SIZE;

  return `${ROW_LABELS[row]}${col + 1}`;
}

function getPlacementCells(startIndex, size, direction) {
  const row = Math.floor(startIndex / BOARD_SIZE);
  const col = startIndex % BOARD_SIZE;

  if (direction === "horizontal") {
    if (col + size > BOARD_SIZE) return [];
    return Array.from({ length: size }, (_, offset) => startIndex + offset);
  }

  if (row + size > BOARD_SIZE) return [];
  return Array.from(
    { length: size },
    (_, offset) => startIndex + offset * BOARD_SIZE,
  );
}

function getShipAt(fleet, index) {
  return fleet.find((ship) => ship.cells.includes(index));
}

function hasFleetCell(fleet, index) {
  return Boolean(getShipAt(fleet, index));
}

function isValidPlacement(cells, fleet, expectedSize) {
  if (cells.length !== expectedSize) return false;

  return cells.every(
    (cell) =>
      cell >= 0 && cell < TOTAL_CELLS && !hasFleetCell(fleet, cell),
  );
}

function isShipSunk(ship, shots) {
  return ship.cells.every((cell) => shots.includes(cell));
}

function isFleetSunk(fleet, shots) {
  return fleet.every((ship) => isShipSunk(ship, shots));
}

function getFleetHealth(fleet, shots) {
  const total = fleet.reduce((sum, ship) => sum + ship.size, 0);
  const hits = fleet.reduce(
    (sum, ship) =>
      sum + ship.cells.filter((cell) => shots.includes(cell)).length,
    0,
  );

  return {
    total,
    hits,
    remaining: total - hits,
  };
}

function FleetStatus({ fleet, shots = [], mode }) {
  return (
    <div className="naval-fleet-list">
      {SHIPS.map((shipSpec) => {
        const ship = fleet.find((item) => item.id === shipSpec.id);
        const placed = Boolean(ship);
        const sunk = ship ? isShipSunk(ship, shots) : false;
        const hits = ship
          ? ship.cells.filter((cell) => shots.includes(cell)).length
          : 0;

        return (
          <div
            key={shipSpec.id}
            className={`naval-ship-row ${placed ? "placed" : ""} ${
              sunk ? "sunk" : ""
            }`}
          >
            <span>{shipSpec.symbol}</span>
            <strong>{shipSpec.name}</strong>
            <small>
              {mode === "placement"
                ? placed
                  ? "posicionado"
                  : `${shipSpec.size} casas`
                : sunk
                  ? "afundado"
                  : `${hits}/${shipSpec.size}`}
            </small>
          </div>
        );
      })}
    </div>
  );
}

function NavalBoard({
  owner,
  fleet,
  shots = [],
  mode,
  activePlayer,
  previewCells = [],
  previewIsValid = true,
  winner,
  onCellClick,
  onCellEnter,
  onCellLeave,
}) {
  const canAttackBoard =
    mode === "battle" && !winner && owner === getOpponent(activePlayer);

  return (
    <div className={`naval-board-card ${PLAYERS[owner].className}`}>
      <div className="naval-board-title">
        <span>Campo de</span>
        <strong>{PLAYERS[owner].name}</strong>
      </div>

      <div className={`naval-board naval-board-${mode}`}>
        {CELLS.map((index) => {
          const ship = getShipAt(fleet, index);
          const isShot = shots.includes(index);
          const isHit = Boolean(ship && isShot);
          const isMiss = Boolean(!ship && isShot);
          const isPreview = previewCells.includes(index);
          const isPlaced = mode === "placement" && Boolean(ship);
          const isTargetable = canAttackBoard && !isShot;

          return (
            <button
              key={index}
              className={[
                "naval-cell",
                isPlaced ? "placed" : "",
                isPreview ? "preview" : "",
                isPreview && !previewIsValid ? "invalid-preview" : "",
                isHit ? "hit" : "",
                isMiss ? "miss" : "",
                isTargetable ? "targetable" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              type="button"
              onClick={() => onCellClick(index)}
              onMouseEnter={() => onCellEnter?.(index)}
              onMouseLeave={() => onCellLeave?.()}
              aria-label={`${PLAYERS[owner].name} ${getCoordinate(index)}`}
              disabled={mode === "battle" && (!canAttackBoard || isShot || winner)}
            >
              {mode === "placement" && ship && <span>{ship.symbol}</span>}
              {mode === "placement" && !ship && isPreview && <span>•</span>}
              {mode === "battle" && isHit && <span>💥</span>}
              {mode === "battle" && isMiss && <span>•</span>}
            </button>
          );
        })}
      </div>

      {mode === "battle" && (
        <FleetStatus fleet={fleet} shots={shots} mode="battle" />
      )}
    </div>
  );
}

export default function BatalhaNavalGame({ onBack }) {
  const [phase, setPhase] = useState("handoff");
  const [placingPlayer, setPlacingPlayer] = useState("emily");
  const [fleets, setFleets] = useState(createEmptyFleets);
  const [shots, setShots] = useState(createEmptyShots);
  const [direction, setDirection] = useState("horizontal");
  const [hoverIndex, setHoverIndex] = useState(null);
  const [turn, setTurn] = useState("emily");
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState(
    "Emily prepara a primeira frota. Rafa não pode olhar.",
  );

  const placingFleet = fleets[placingPlayer];
  const nextShip = SHIPS[placingFleet.length];
  const previewCells =
    phase === "placing" && hoverIndex !== null && nextShip
      ? getPlacementCells(hoverIndex, nextShip.size, direction)
      : [];
  const previewIsValid = nextShip
    ? isValidPlacement(previewCells, placingFleet, nextShip.size)
    : true;
  const targetPlayer = getOpponent(turn);
  const turnPlayer = PLAYERS[turn];

  function resetGame() {
    setPhase("handoff");
    setPlacingPlayer("emily");
    setFleets(createEmptyFleets());
    setShots(createEmptyShots());
    setDirection("horizontal");
    setHoverIndex(null);
    setTurn("emily");
    setWinner(null);
    setMessage("Emily prepara a primeira frota. Rafa não pode olhar.");
  }

  function startPrivatePlacement() {
    setPhase("placing");
    setHoverIndex(null);
    setMessage(
      `${PLAYERS[placingPlayer].name}, posicione seus navios. O outro não pode ver esse tabuleiro.`,
    );
  }

  function rotateShip() {
    setDirection((current) =>
      current === "horizontal" ? "vertical" : "horizontal",
    );
  }

  function handlePlaceShip(index) {
    if (phase !== "placing" || !nextShip) return;

    const cells = getPlacementCells(index, nextShip.size, direction);

    if (!isValidPlacement(cells, placingFleet, nextShip.size)) {
      setMessage("Esse navio não cabe aí ou encosta em outro. Escolhe outro lugar.");
      return;
    }

    const placedShip = {
      ...nextShip,
      direction,
      cells,
    };
    const nextFleet = [...placingFleet, placedShip];

    setFleets((current) => ({
      ...current,
      [placingPlayer]: nextFleet,
    }));
    setHoverIndex(null);

    if (nextFleet.length === SHIPS.length) {
      if (placingPlayer === "emily") {
        setPhase("handoff");
        setPlacingPlayer("rafa");
        setDirection("horizontal");
        setMessage("Frota da Emily pronta. Passe o controle para o Rafa.");
        return;
      }

      setPhase("battle");
      setTurn("emily");
      setMessage("Tudo pronto. Emily começa atacando o campo do Rafa.");
      return;
    }

    setMessage(
      `${placedShip.name} posicionado. Agora coloque ${SHIPS[nextFleet.length].name}.`,
    );
  }

  function undoLastShip() {
    if (phase !== "placing" || placingFleet.length === 0) return;

    const removedShip = placingFleet[placingFleet.length - 1];

    setFleets((current) => ({
      ...current,
      [placingPlayer]: placingFleet.slice(0, -1),
    }));
    setMessage(`${removedShip.name} saiu do tabuleiro.`);
  }

  function clearCurrentFleet() {
    if (phase !== "placing") return;

    setFleets((current) => ({
      ...current,
      [placingPlayer]: [],
    }));
    setMessage(`Frota de ${PLAYERS[placingPlayer].name} zerada. Começa de novo.`);
  }

  function handleAttack(owner, index) {
    if (phase !== "battle" || winner) return;

    if (owner !== targetPlayer) {
      setMessage(
        `Agora ${turnPlayer.name} precisa atacar o campo de ${PLAYERS[targetPlayer].name}.`,
      );
      return;
    }

    if (shots[owner].includes(index)) {
      setMessage("Essa casa já foi atacada. Escolhe outra.");
      return;
    }

    const shipHit = getShipAt(fleets[owner], index);
    const nextShotsForOwner = [...shots[owner], index];
    const nextShots = {
      ...shots,
      [owner]: nextShotsForOwner,
    };

    setShots(nextShots);

    if (isFleetSunk(fleets[owner], nextShotsForOwner)) {
      setWinner(turn);
      setMessage(
        `${turnPlayer.name} venceu a Batalha Naval. A frota de ${PLAYERS[owner].name} foi toda afundada.`,
      );
      return;
    }

 if (shipHit) {
  const sunk = isShipSunk(shipHit, nextShotsForOwner);

  setMessage(
    sunk
      ? `${turnPlayer.name} afundou ${shipHit.name} de ${PLAYERS[owner].name}. Pode jogar de novo.`
      : `${turnPlayer.name} acertou uma parte da frota de ${PLAYERS[owner].name}. Pode jogar de novo.`,
  );

  return;
}

const nextTurn = getOpponent(turn);

setMessage(
  `${turnPlayer.name} acertou água. Vez de ${PLAYERS[nextTurn].name}.`,
);

setTurn(nextTurn);
  }

  return (
    <main className="naval-game">
      <div className="naval-topbar">
        <button className="naval-soft-button" type="button" onClick={onBack}>
          ← Voltar ao menu
        </button>

        <div className="naval-title-box">
          <span>Emily x Rafa</span>
          <h1>Batalha Naval</h1>
        </div>

        <button className="naval-soft-button" type="button" onClick={resetGame}>
          Reiniciar
        </button>
      </div>

      {phase === "handoff" && (
        <section className="naval-privacy-screen">
          <div className={`naval-privacy-card ${PLAYERS[placingPlayer].className}`}>
            <div className="naval-avatar">{PLAYERS[placingPlayer].initial}</div>
            <span>fase privada</span>
            <h2>{PLAYERS[placingPlayer].name}, monte sua frota</h2>
            <p>{PLAYERS[placingPlayer].privateWarning}</p>
            <button type="button" onClick={startPrivatePlacement}>
              Começar posicionamento
            </button>
          </div>
        </section>
      )}

      {phase === "placing" && (
        <section className="naval-placement-layout">
          <aside className={`naval-side-card ${PLAYERS[placingPlayer].className}`}>
            <div className="naval-player-heading">
              <div className="naval-avatar">{PLAYERS[placingPlayer].initial}</div>
              <div>
                <span>posicionando</span>
                <strong>{PLAYERS[placingPlayer].name}</strong>
              </div>
            </div>

            <FleetStatus fleet={placingFleet} mode="placement" />
          </aside>

          <div className="naval-placement-main">
            <div className="naval-message-card">
              <strong>{message}</strong>
              {nextShip && (
                <span>
                  Próximo: {nextShip.symbol} {nextShip.name} · {nextShip.size} casas · {direction === "horizontal" ? "horizontal" : "vertical"}
                </span>
              )}
            </div>

            <NavalBoard
              owner={placingPlayer}
              fleet={placingFleet}
              mode="placement"
              activePlayer={placingPlayer}
              previewCells={previewCells}
              previewIsValid={previewIsValid}
              onCellClick={handlePlaceShip}
              onCellEnter={setHoverIndex}
              onCellLeave={() => setHoverIndex(null)}
            />

            <div className="naval-actions-row">
              <button type="button" onClick={rotateShip}>
                Girar navio
              </button>
              <button type="button" onClick={undoLastShip} disabled={placingFleet.length === 0}>
                Desfazer último
              </button>
              <button type="button" onClick={clearCurrentFleet} disabled={placingFleet.length === 0}>
                Limpar frota
              </button>
            </div>
          </div>

          <aside className="naval-rules-card">
            <strong>Regras rápidas</strong>
            <p>Posicione todos os navios sem deixar o outro jogador ver.</p>
            <p>Clique no tabuleiro para colocar o navio atual.</p>
            <p>Quando os dois terminarem, a batalha começa com a Emily.</p>
          </aside>
        </section>
      )}

      {phase === "battle" && (
        <section className="naval-battle-layout">
          <NavalBoard
            owner="emily"
            fleet={fleets.emily}
            shots={shots.emily}
            mode="battle"
            activePlayer={turn}
            winner={winner}
            onCellClick={(index) => handleAttack("emily", index)}
          />

          <div className="naval-battle-panel">
            <div className="naval-turn-card">
              <span>{winner ? "fim da batalha" : "vez de atacar"}</span>
              <strong>{winner ? PLAYERS[winner].name : turnPlayer.name}</strong>
              {!winner && <small>Alvo: campo de {PLAYERS[targetPlayer].name}</small>}
            </div>

            <div className="naval-message-card battle">
              <strong>{message}</strong>
            </div>

            <div className="naval-health-grid">
              {Object.keys(PLAYERS).map((player) => {
                const health = getFleetHealth(fleets[player], shots[player]);

                return (
                  <div
                    key={player}
                    className={`naval-health-card ${PLAYERS[player].className}`}
                  >
                    <span>{PLAYERS[player].name}</span>
                    <strong>
                      {health.remaining}/{health.total}
                    </strong>
                    <small>partes de navio</small>
                  </div>
                );
              })}
            </div>

            {winner && (
              <button className="naval-primary-button" type="button" onClick={resetGame}>
                Jogar de novo
              </button>
            )}
          </div>

          <NavalBoard
            owner="rafa"
            fleet={fleets.rafa}
            shots={shots.rafa}
            mode="battle"
            activePlayer={turn}
            winner={winner}
            onCellClick={(index) => handleAttack("rafa", index)}
          />
        </section>
      )}
    </main>
  );
}
