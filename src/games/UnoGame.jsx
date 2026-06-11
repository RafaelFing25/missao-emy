import { useEffect, useMemo, useState } from "react";
import "./UnoGame.css";

const COLOR_OPTIONS = [
  { id: "rosa", name: "Rosa", short: "Rosa", emoji: "💗" },
  { id: "roxo", name: "Roxo", short: "Roxo", emoji: "💜" },
  { id: "preto", name: "Preto", short: "Preto", emoji: "🖤" },
  { id: "azul", name: "Azul", short: "Azul", emoji: "💙" },
];

const COLOR_BY_ID = COLOR_OPTIONS.reduce((acc, color) => {
  acc[color.id] = color;
  return acc;
}, {});

const BOT_LINES = {
  Rafa: [
    "Essa foi calculada.",
    "Vou fingir que não pensei muito.",
    "Estratégia azul em andamento.",
    "Não ri, eu sei jogar.",
  ],
  Emily: [
    "Vuxe vai perder.",
    "To fome, mas ainda vou ganhar.",
    "Estou levemente estessada.",
    "Essa carta foi um docinho.",
  ],
};

const HUMAN_LINES = [
  "Boa jogada.",
  "Essa encaixou bonito.",
  "O jogo virou um pouquinho.",
  "Clássico movimento de quem sabe o que está fazendo.",
];

const SPECIAL_COPY = {
  draw2: {
    title: "Compa compa docinho",
    symbol: "+2",
    description: "O outro compra 2 e perde a vez.",
  },
  skip: {
    title: "To estessada",
    symbol: "⊘",
    description: "Bloqueia a vez do outro.",
  },
  reverse: {
    title: "Voltinha moto?",
    symbol: "↺",
    description: "Com 2 jogadores, funciona como bloqueio.",
  },
  wild: {
    title: "Ota cor",
    symbol: "★",
    description: "Escolhe a próxima cor.",
  },
  draw4: {
    title: "Compa 4 docinho",
    symbol: "+4",
    description: "Escolhe a cor, o outro compra 4 e perde a vez.",
  },
};

function randomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function shuffle(cards) {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeNumberCard(color, value) {
  return {
    id: randomId(),
    type: "number",
    color,
    value,
    title: String(value),
    symbol: String(value),
  };
}

function makeActionCard(color, action) {
  return {
    id: randomId(),
    type: "action",
    color,
    action,
    title: SPECIAL_COPY[action].title,
    symbol: SPECIAL_COPY[action].symbol,
  };
}

function makeWildCard(action) {
  return {
    id: randomId(),
    type: "wild",
    color: null,
    action,
    title: SPECIAL_COPY[action].title,
    symbol: SPECIAL_COPY[action].symbol,
  };
}

function buildDeck() {
  const deck = [];

  COLOR_OPTIONS.forEach(({ id: color }) => {
    for (let value = 0; value <= 9; value += 1) {
      deck.push(makeNumberCard(color, value));
      if (value !== 0) deck.push(makeNumberCard(color, value));
    }

    deck.push(makeActionCard(color, "draw2"));
    deck.push(makeActionCard(color, "draw2"));
    deck.push(makeActionCard(color, "skip"));
    deck.push(makeActionCard(color, "skip"));
    deck.push(makeActionCard(color, "reverse"));
    deck.push(makeActionCard(color, "reverse"));
  });

  for (let i = 0; i < 4; i += 1) {
    deck.push(makeWildCard("wild"));
    deck.push(makeWildCard("draw4"));
  }

  return shuffle(deck);
}

function getCardName(card) {
  if (!card) return "carta";
  if (card.type === "number") return `${card.value} ${COLOR_BY_ID[card.color]?.short || ""}`.trim();
  return card.title;
}

function getCurrentTopCard(game) {
  return game.discardPile[game.discardPile.length - 1];
}

function canPlayCard(card, topCard, currentColor) {
  if (!card || !topCard) return false;
  if (card.type === "wild") return true;
  if (card.color === currentColor) return true;

  if (card.type === "number" && topCard.type === "number") {
    return card.value === topCard.value;
  }

  if (card.type === "action" && topCard.type === "action") {
    return card.action === topCard.action;
  }

  return false;
}

function drawFromDeck(game, target, amount) {
  const next = {
    ...game,
    deck: [...game.deck],
    discardPile: [...game.discardPile],
    hands: {
      human: [...game.hands.human],
      bot: [...game.hands.bot],
    },
  };

  for (let i = 0; i < amount; i += 1) {
    if (next.deck.length === 0 && next.discardPile.length > 1) {
      const top = next.discardPile[next.discardPile.length - 1];
      const rest = next.discardPile.slice(0, -1);
      next.deck = shuffle(rest);
      next.discardPile = [top];
    }

    const drawn = next.deck.pop();
    if (!drawn) break;
    next.hands[target].push(drawn);
  }

  return next;
}

function getOtherPlayer(player) {
  return player === "human" ? "bot" : "human";
}

function chooseBestColor(hand) {
  const counts = COLOR_OPTIONS.map(({ id }) => ({
    id,
    count: hand.filter((card) => card.color === id).length,
  })).sort((a, b) => b.count - a.count);

  return counts[0]?.id || "rosa";
}

function getPlayableCards(hand, topCard, currentColor) {
  return hand.filter((card) => canPlayCard(card, topCard, currentColor));
}

function getBotChoice(hand, topCard, currentColor) {
  const playable = getPlayableCards(hand, topCard, currentColor);
  if (playable.length === 0) return null;

  const score = (card) => {
    if (card.action === "draw4") return 95;
    if (card.action === "draw2") return 80;
    if (card.action === "skip") return 62;
    if (card.action === "reverse") return 52;
    if (card.action === "wild") return 34;
    if (card.color === currentColor) return 24;
    return 12;
  };

  return [...playable].sort((a, b) => score(b) - score(a))[0];
}

function getRandomLine(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}

function createInitialGame(selectedHuman) {
  const humanName = selectedHuman;
  const botName = selectedHuman === "Rafa" ? "Emily" : "Rafa";
  const fullDeck = buildDeck();
  const humanHand = fullDeck.splice(0, 7);
  const botHand = fullDeck.splice(0, 7);

  let firstCardIndex = fullDeck.findIndex((card) => card.type === "number");
  if (firstCardIndex < 0) firstCardIndex = 0;
  const [firstCard] = fullDeck.splice(firstCardIndex, 1);

  return {
    humanName,
    botName,
    deck: fullDeck,
    discardPile: [firstCard],
    currentColor: firstCard.color || "rosa",
    hands: {
      human: humanHand,
      bot: botHand,
    },
    turn: "human",
    drawnThisTurn: false,
    message: `${humanName} começa. Jogue por cor, número ou símbolo.`,
    gameOver: null,
  };
}

function removeCardFromHand(hand, cardId) {
  const index = hand.findIndex((card) => card.id === cardId);
  if (index < 0) return { card: null, hand };

  const nextHand = [...hand];
  const [card] = nextHand.splice(index, 1);
  return { card, hand: nextHand };
}

function applyPlayedCard(game, actor, card, chosenColor) {
  const opponent = getOtherPlayer(actor);
  const actorName = actor === "human" ? game.humanName : game.botName;
  const opponentName = opponent === "human" ? game.humanName : game.botName;
  const selectedColor = card.type === "wild" ? chosenColor : card.color;

  let next = {
    ...game,
    discardPile: [...game.discardPile, card],
    currentColor: selectedColor || game.currentColor,
    drawnThisTurn: false,
  };

  let nextTurn = opponent;
  let effectMessage = `${actorName} jogou ${getCardName(card)}.`;

  if (card.action === "draw2") {
    next = drawFromDeck(next, opponent, 2);
    nextTurn = actor;
    effectMessage = `${actorName} jogou Compa compa docinho. ${opponentName} comprou 2 e perdeu a vez.`;
  }

  if (card.action === "skip") {
    nextTurn = actor;
    effectMessage = `${actorName} usou To estessada. ${opponentName} perdeu a vez.`;
  }

  if (card.action === "reverse") {
    nextTurn = actor;
    effectMessage = `${actorName} chamou Voltinha moto? ${opponentName} perdeu a vez.`;
  }

  if (card.action === "wild") {
    const colorName = COLOR_BY_ID[next.currentColor]?.name || "uma cor";
    effectMessage = `${actorName} jogou Ota cor e escolheu ${colorName}.`;
  }

  if (card.action === "draw4") {
    next = drawFromDeck(next, opponent, 4);
    nextTurn = actor;
    const colorName = COLOR_BY_ID[next.currentColor]?.name || "uma cor";
    effectMessage = `${actorName} jogou Compa 4 docinho, escolheu ${colorName}, e ${opponentName} comprou 4.`;
  }

  if (next.hands[actor].length === 0) {
    return {
      ...next,
      turn: actor,
      gameOver: actor,
      message: `${actorName} venceu. Última carta: ${getCardName(card)}.`,
    };
  }

  const flavor = actor === "bot" ? getRandomLine(BOT_LINES[actorName]) : getRandomLine(HUMAN_LINES);

  return {
    ...next,
    turn: nextTurn,
    message: `${effectMessage} ${flavor}`,
  };
}

function getFanStyle(index, count, variant = "human") {
  const center = (count - 1) / 2;
  const distance = index - center;
  const maxTilt = variant === "human" ? 8 : 6;
  const tilt = count > 1 ? (distance / Math.max(center, 1)) * maxTilt : 0;
  const lift = variant === "human" ? Math.abs(distance) * -1.25 : Math.abs(distance) * -0.65;

  let marginLeft = 10;
  if (count > 30) marginLeft = -94;
  else if (count > 24) marginLeft = -90;
  else if (count > 18) marginLeft = -84;
  else if (count > 14) marginLeft = -74;
  else if (count > 10) marginLeft = -60;
  else if (count > 7) marginLeft = -42;
  else if (count > 1) marginLeft = -18;

  let scale = 1;
  if (variant === "bot") {
    if (count > 24) scale = 0.56;
    else if (count > 18) scale = 0.62;
    else if (count > 14) scale = 0.7;
    else if (count > 9) scale = 0.8;
    else scale = 0.9;
  } else {
    if (count > 30) scale = 0.62;
    else if (count > 24) scale = 0.68;
    else if (count > 18) scale = 0.76;
    else if (count > 14) scale = 0.84;
    else if (count > 10) scale = 0.9;
    else if (count > 7) scale = 0.96;
  }

  return {
    "--tilt": `${tilt.toFixed(2)}deg`,
    "--lift": `${lift.toFixed(2)}px`,
    "--scale": scale,
    marginLeft: index === 0 ? 0 : `${marginLeft}px`,
    zIndex: index + 1,
  };
}

function UnoCard({ card, faceUp = true, playable = false, selected = false, onClick }) {
  if (!faceUp) {
    return (
      <div className="uno-card uno-card-back" aria-label="Carta virada para baixo">
        <span>UNO</span>
        <small>R&E</small>
      </div>
    );
  }

  const isSpecial = card.type === "action" || card.type === "wild";
  const isSoftRedSpecial = card.action === "wild" || card.action === "draw4";
  const colorClass = isSoftRedSpecial ? "especial" : card.color;
  const description = card.action ? SPECIAL_COPY[card.action]?.description : "Carta numérica.";
  const colorTag = card.type === "action" ? COLOR_BY_ID[card.color]?.short : card.type === "wild" ? "Livre" : COLOR_BY_ID[card.color]?.short;

  return (
    <button
      type="button"
      className={`uno-card ${colorClass} ${isSpecial ? "is-special" : ""} ${isSoftRedSpecial ? "is-soft-red-special" : ""} ${playable ? "is-playable" : ""} ${selected ? "is-selected" : ""}`}
      onClick={onClick}
      title={description}
      aria-label={getCardName(card)}
    >
      <span className="uno-card-corner top">{card.symbol}</span>
      <span className="uno-card-glow" aria-hidden="true" />
      <span className="uno-card-symbol">{card.symbol}</span>
      <span className="uno-card-title">{card.type === "number" ? colorTag : card.title}</span>
      {isSpecial && <span className="uno-card-mini-tag">{colorTag}</span>}
      <span className="uno-card-corner bottom">{card.symbol}</span>
    </button>
  );
}

function PlayerBadge({ name, label, count, active }) {
  const isEmily = name === "Emily";
  return (
    <div className={`uno-player-badge ${active ? "active" : ""} ${isEmily ? "emily" : "rafa"}`}>
      <div className="uno-avatar" aria-hidden="true">
        {isEmily ? "E" : "R"}
      </div>
      <div>
        <strong>{label}</strong>
        <span>{count} carta{count === 1 ? "" : "s"}</span>
      </div>
    </div>
  );
}

export default function UnoGame({ onBack }) {
  const [game, setGame] = useState(null);
  const [colorPickerCardId, setColorPickerCardId] = useState(null);
  const [showRules, setShowRules] = useState(false);

  const topCard = useMemo(() => (game ? getCurrentTopCard(game) : null), [game]);

  const humanPlayableIds = useMemo(() => {
    if (!game || !topCard || game.turn !== "human") return new Set();
    return new Set(
      game.hands.human
        .filter((card) => canPlayCard(card, topCard, game.currentColor))
        .map((card) => card.id)
    );
  }, [game, topCard]);

  const humanHasPlayableCard = humanPlayableIds.size > 0;

  function startGame(selectedHuman) {
    setColorPickerCardId(null);
    setShowRules(false);
    setGame(createInitialGame(selectedHuman));
  }

  function playHumanCard(cardId, chosenColor = null) {
    setGame((current) => {
      if (!current || current.turn !== "human" || current.gameOver) return current;

      const currentTop = getCurrentTopCard(current);
      const originalCard = current.hands.human.find((card) => card.id === cardId);
      if (!originalCard || !canPlayCard(originalCard, currentTop, current.currentColor)) return current;

      if (originalCard.type === "wild" && !chosenColor) return current;

      const { card, hand } = removeCardFromHand(current.hands.human, cardId);
      if (!card) return current;

      const next = {
        ...current,
        hands: {
          ...current.hands,
          human: hand,
        },
      };

      return applyPlayedCard(next, "human", card, chosenColor);
    });
  }

  function handleHumanCardClick(card) {
    if (!game || game.turn !== "human" || game.gameOver) return;
    if (!canPlayCard(card, topCard, game.currentColor)) return;

    if (card.type === "wild") {
      setColorPickerCardId(card.id);
      return;
    }

    playHumanCard(card.id);
  }

  function chooseWildColor(colorId) {
    if (!colorPickerCardId) return;
    const cardId = colorPickerCardId;
    setColorPickerCardId(null);
    playHumanCard(cardId, colorId);
  }

  function drawOneCard() {
    setGame((current) => {
      if (!current || current.turn !== "human" || current.gameOver || current.drawnThisTurn) return current;

      const next = drawFromDeck(current, "human", 1);
      const drawnCard = next.hands.human[next.hands.human.length - 1];
      const canPlayDrawn = canPlayCard(drawnCard, getCurrentTopCard(next), next.currentColor);

      return {
        ...next,
        drawnThisTurn: true,
        message: canPlayDrawn
          ? `Você comprou ${getCardName(drawnCard)}. Dá para jogar essa carta agora.`
          : `Você comprou ${getCardName(drawnCard)}. Se nada encaixar, pode passar.`,
      };
    });
  }

  function passTurn() {
    setGame((current) => {
      if (!current || current.turn !== "human" || current.gameOver) return current;
      if (!current.drawnThisTurn && humanHasPlayableCard) return current;

      return {
        ...current,
        turn: "bot",
        drawnThisTurn: false,
        message: `${current.humanName} passou. Agora é a vez de ${current.botName}.`,
      };
    });
  }

  function runBotTurn() {
    setGame((current) => {
      if (!current || current.turn !== "bot" || current.gameOver) return current;

      const botName = current.botName;
      const currentTop = getCurrentTopCard(current);
      const chosenCard = getBotChoice(current.hands.bot, currentTop, current.currentColor);

      if (chosenCard) {
        const { card, hand } = removeCardFromHand(current.hands.bot, chosenCard.id);
        const colorChoice = card.type === "wild" ? chooseBestColor(hand) : null;
        const next = {
          ...current,
          hands: {
            ...current.hands,
            bot: hand,
          },
        };
        return applyPlayedCard(next, "bot", card, colorChoice);
      }

      let next = drawFromDeck(current, "bot", 1);
      const drawnCard = next.hands.bot[next.hands.bot.length - 1];

      if (drawnCard && canPlayCard(drawnCard, getCurrentTopCard(next), next.currentColor)) {
        const { card, hand } = removeCardFromHand(next.hands.bot, drawnCard.id);
        const colorChoice = card.type === "wild" ? chooseBestColor(hand) : null;
        next = {
          ...next,
          hands: {
            ...next.hands,
            bot: hand,
          },
        };
        return applyPlayedCard(next, "bot", card, colorChoice);
      }

      return {
        ...next,
        turn: "human",
        drawnThisTurn: false,
        message: `${botName} comprou uma carta e passou. ${getRandomLine(BOT_LINES[botName])}`,
      };
    });
  }

  useEffect(() => {
    if (!game || game.turn !== "bot" || game.gameOver || colorPickerCardId) return undefined;

    const timer = window.setTimeout(() => {
      runBotTurn();
    }, 650);

    return () => window.clearTimeout(timer);
  }, [game, colorPickerCardId]);

  if (!game) {
    return (
      <section className="uno-screen uno-start-screen">
        <div className="uno-topbar">
          <button type="button" className="uno-ghost-button" onClick={onBack}>
            ← Voltar ao menu
          </button>
        </div>

        <div className="uno-start-card">
          <span className="uno-kicker">UNO simplificado</span>
          <h1>UNO Rafa & Emily</h1>
          <p>
            Escolha quem vai jogar. A outra pessoa vira bot, com cartas escondidas e especiais do jeitinho de vocês.
          </p>

          <div className="uno-player-choice">
            <button type="button" className="choose-rafa" onClick={() => startGame("Rafa")}>
              Jogar como Rafa
              <small>contra Emily bot</small>
            </button>
            <button type="button" className="choose-emily" onClick={() => startGame("Emily")}>
              Jogar como Emily
              <small>contra Rafa bot</small>
            </button>
          </div>

          <div className="uno-mini-rules">
            <strong>Cartas especiais</strong>
            <span>+4: Compa 4 docinho</span>
            <span>+2: Compa compa docinho</span>
            <span>Troca cor: Ota cor</span>
            <span>Bloqueia: To estessada</span>
            <span>Volta: Voltinha moto?</span>
          </div>
        </div>
      </section>
    );
  }

  const currentColor = COLOR_BY_ID[game.currentColor];
  const botCardCount = game.hands.bot.length;
  const humanCardCount = game.hands.human.length;
  const canDraw = game.turn === "human" && !game.drawnThisTurn && !game.gameOver;
  const canPass = game.turn === "human" && !game.gameOver && (game.drawnThisTurn || !humanHasPlayableCard);
  const winnerName = game.gameOver === "human" ? game.humanName : game.gameOver === "bot" ? game.botName : null;

  return (
    <section className="uno-screen uno-game-screen">
      <header className="uno-topbar uno-game-topbar">
        <button type="button" className="uno-ghost-button" onClick={onBack}>
          ← Voltar ao menu
        </button>
        <div className="uno-title-block">
          <span>UNO simplificado</span>
          <h1>UNO Rafa & Emily</h1>
        </div>
        <div className="uno-topbar-buttons">
          <button type="button" className="uno-ghost-button" onClick={() => setShowRules((value) => !value)}>
            Regras
          </button>
          <button type="button" className="uno-ghost-button" onClick={() => startGame(game.humanName)}>
            Reiniciar
          </button>
        </div>
      </header>

      {showRules && (
        <div className="uno-rules-panel">
          <strong>Como jogar</strong>
          <p>Jogue uma carta da mesma cor, número ou símbolo da carta aberta. Coringas podem ir a qualquer momento.</p>
          <p>Especiais são rosa forte no visual. +2 e +4 fazem comprar e perder a vez. To estessada e Voltinha moto? bloqueiam.</p>
        </div>
      )}

      <main className="uno-arena">
        <div className="uno-arena-glow" aria-hidden="true" />
        <div className="uno-rotation-arrow arrow-one" aria-hidden="true">↻</div>
        <div className="uno-rotation-arrow arrow-two" aria-hidden="true">↻</div>

        <section className="uno-bot-zone">
          <PlayerBadge
            name={game.botName}
            label={`${game.botName} bot`}
            count={botCardCount}
            active={game.turn === "bot" && !game.gameOver}
          />
          <div className="uno-hidden-hand" aria-label={`Mão do bot com ${botCardCount} cartas`}>
            {game.hands.bot.map((card, index) => (
              <div key={card.id} className="uno-card-wrap bot-card-wrap" style={getFanStyle(index, botCardCount, "bot")}>
                <UnoCard card={card} faceUp={false} />
              </div>
            ))}
          </div>
        </section>

        <section className="uno-center-zone">
          <div className="uno-deck-block">
            <button type="button" className="uno-draw-pile" onClick={drawOneCard} disabled={!canDraw}>
              <span>UNO</span>
              <small>Comprar</small>
            </button>
            <span className="uno-deck-count">Monte: {game.deck.length}</span>
          </div>

          <div className="uno-discard-stack">
            <span className="uno-small-label">Carta aberta</span>
            <div className="uno-stack-shadow one" aria-hidden="true" />
            <div className="uno-stack-shadow two" aria-hidden="true" />
            <UnoCard card={topCard} />
          </div>

          <div className={`uno-current-color ${game.currentColor}`}>
            <span>Cor atual</span>
            <strong>{currentColor?.emoji} {currentColor?.name}</strong>
          </div>
        </section>

        <section className="uno-status-strip">
          <span className={`uno-turn-pill ${game.turn}`}>
            {game.gameOver ? "Fim de jogo" : game.turn === "human" ? `Vez de ${game.humanName}` : `Vez de ${game.botName} bot`}
          </span>
          <p>{game.message}</p>
          {game.turn === "human" && !game.gameOver && !humanHasPlayableCard && !game.drawnThisTurn && (
            <small>Nenhuma carta encaixa agora. Compra uma carta.</small>
          )}
        </section>

        <div className="uno-floating-actions" aria-label="Ações da vez">
          <button type="button" onClick={drawOneCard} disabled={!canDraw}>
            Comprar
          </button>
          <button type="button" onClick={passTurn} disabled={!canPass}>
            Passar
          </button>
        </div>

        <section className="uno-human-zone">
          <div className="uno-human-header">
            <PlayerBadge
              name={game.humanName}
              label={game.humanName}
              count={humanCardCount}
              active={game.turn === "human" && !game.gameOver}
            />
          </div>

          <div className="uno-human-hand" style={{ "--card-count": humanCardCount }}>
            {game.hands.human.map((card, index) => (
              <div key={card.id} className="uno-card-wrap human-card-wrap" style={getFanStyle(index, humanCardCount, "human")}>
                <UnoCard
                  card={card}
                  playable={humanPlayableIds.has(card.id)}
                  selected={colorPickerCardId === card.id}
                  onClick={() => handleHumanCardClick(card)}
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      {colorPickerCardId && (
        <div className="uno-modal-backdrop" role="presentation">
          <div className="uno-color-modal" role="dialog" aria-modal="true" aria-label="Escolha uma cor">
            <h2>Escolha a ota cor</h2>
            <p>Rosa, roxo, preto ou azul. Agora é puxar o jogo para onde quiser.</p>
            <div className="uno-color-grid">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  className={`uno-color-choice ${color.id}`}
                  onClick={() => chooseWildColor(color.id)}
                >
                  <span>{color.emoji}</span>
                  {color.name}
                </button>
              ))}
            </div>
            <button type="button" className="uno-ghost-button dark" onClick={() => setColorPickerCardId(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {winnerName && (
        <div className="uno-modal-backdrop" role="presentation">
          <div className="uno-win-modal" role="dialog" aria-modal="true" aria-label="Fim de jogo">
            <span className="uno-kicker">Fim de jogo</span>
            <h2>{winnerName} venceu!</h2>
            <p>Vitória limpa, com docinho, voltinha e um caos saudável de UNO.</p>
            <div className="uno-win-actions">
              <button type="button" onClick={() => startGame(game.humanName)}>
                Jogar de novo
              </button>
              <button type="button" className="uno-ghost-button dark" onClick={onBack}>
                Voltar ao menu
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}