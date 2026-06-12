import { useEffect, useMemo, useState } from "react";

const WORD_BANK = [
  "BEIJO",
  "LINDA",
  "GOSTO",
  "VUXEE",
  "EMILY",
  "CASAL",
  "RISOS",
  "FELIZ",
  "DOCES",
  "VOLTA",
  "MIMOS",
  "SONHO",
  "CHAVE",
  "PORTA",
  "PISTA",
  "SEGUE",
  "JUNTO",
  "OLHAR",
  "FRASE",
  "BRISA",
  "QUERO",
  "SORRI",
  "NOITE",
  "LUZES",
];

const WORDS_PER_GAME = 4;
const WORD_SIZE = 5;
const MAX_ATTEMPTS = 9;

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const STATUS_PRIORITY = {
  absent: 1,
  present: 2,
  correct: 3,
};

function normalizeKey(value) {
  return value
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function shuffleWords(words) {
  const shuffled = [...words];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

function hasSameWords(firstList, secondList) {
  if (firstList.length !== secondList.length) return false;
  return firstList.every((word) => secondList.includes(word));
}

function getRandomWords(previousWords = []) {
  const normalizedBank = WORD_BANK.map((word) => normalizeKey(word)).filter(
    (word) => word.length === WORD_SIZE
  );
  const uniqueBank = [...new Set(normalizedBank)];

  for (let attempt = 0; attempt < 12; attempt++) {
    const selectedWords = shuffleWords(uniqueBank).slice(0, WORDS_PER_GAME);

    if (!hasSameWords(selectedWords, previousWords)) {
      return selectedWords;
    }
  }

  return shuffleWords(uniqueBank).slice(0, WORDS_PER_GAME);
}

function evaluateGuess(guess, target) {
  const result = Array(WORD_SIZE).fill("absent");
  const targetLetters = target.split("");
  const guessLetters = guess.split("");
  const remaining = {};

  for (let i = 0; i < WORD_SIZE; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = "correct";
    } else {
      remaining[targetLetters[i]] = (remaining[targetLetters[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < WORD_SIZE; i++) {
    if (result[i] === "correct") continue;

    const letter = guessLetters[i];

    if (remaining[letter] > 0) {
      result[i] = "present";
      remaining[letter] -= 1;
    }
  }

  return result;
}

function getSolvedIndex(guesses, target) {
  return guesses.findIndex((guess) => guess === target);
}

function getNextPosition(letters, currentIndex) {
  for (let i = currentIndex + 1; i < WORD_SIZE; i++) {
    if (!letters[i]) return i;
  }

  for (let i = 0; i < WORD_SIZE; i++) {
    if (!letters[i]) return i;
  }

  return Math.min(currentIndex + 1, WORD_SIZE - 1);
}

function QuartetoTermo({ onBack }) {
  const [currentWords, setCurrentWords] = useState(() => getRandomWords());
  const [guesses, setGuesses] = useState([]);
  const [currentLetters, setCurrentLetters] = useState(
    Array(WORD_SIZE).fill("")
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [message, setMessage] = useState("Descubra as quatro palavras.");
  const [gameStatus, setGameStatus] = useState("playing");

  const solvedWords = useMemo(() => {
    return currentWords.filter((word) => guesses.includes(word));
  }, [currentWords, guesses]);

  const keyboardStatus = useMemo(() => {
    const status = {};

    guesses.forEach((guess) => {
      currentWords.forEach((target) => {
        const evaluation = evaluateGuess(guess, target);

        guess.split("").forEach((letter, index) => {
          const newStatus = evaluation[index];
          const oldStatus = status[letter];

          if (
            !oldStatus ||
            STATUS_PRIORITY[newStatus] > STATUS_PRIORITY[oldStatus]
          ) {
            status[letter] = newStatus;
          }
        });
      });
    });

    return status;
  }, [currentWords, guesses]);

  function selectCell(index) {
    if (gameStatus !== "playing") return;
    setActiveIndex(index);
  }

  function addLetter(letter) {
    if (gameStatus !== "playing") return;

    const nextLetters = [...currentLetters];
    nextLetters[activeIndex] = letter;

    setCurrentLetters(nextLetters);
    setActiveIndex(getNextPosition(nextLetters, activeIndex));
  }

  function removeLetter() {
    if (gameStatus !== "playing") return;

    const nextLetters = [...currentLetters];

    if (nextLetters[activeIndex]) {
      nextLetters[activeIndex] = "";
      setCurrentLetters(nextLetters);
      return;
    }

    const previousIndex = Math.max(activeIndex - 1, 0);
    nextLetters[previousIndex] = "";

    setCurrentLetters(nextLetters);
    setActiveIndex(previousIndex);
  }

  function moveCursor(direction) {
    if (gameStatus !== "playing") return;

    setActiveIndex((current) => {
      if (direction === "left") return Math.max(current - 1, 0);
      if (direction === "right") return Math.min(current + 1, WORD_SIZE - 1);
      return current;
    });
  }

  function submitGuess() {
    if (gameStatus !== "playing") return;

    const isComplete = currentLetters.every(Boolean);

    if (!isComplete) {
      setMessage("Preencha as 5 letras.");
      return;
    }

    const currentGuess = currentLetters.join("");
    const nextGuesses = [...guesses, currentGuess];
    const nextSolvedWords = currentWords.filter((word) =>
      nextGuesses.includes(word)
    );

    setGuesses(nextGuesses);
    setCurrentLetters(Array(WORD_SIZE).fill(""));
    setActiveIndex(0);

    if (nextSolvedWords.length === currentWords.length) {
      setGameStatus("won");
      setMessage("Você acertou tudo. Tá impossível competir.");
      return;
    }

    if (nextGuesses.length >= MAX_ATTEMPTS) {
      setGameStatus("lost");
      setMessage(`Fim de jogo. As palavras eram: ${currentWords.join(", ")}.`);
      return;
    }

    const remaining = currentWords.length - nextSolvedWords.length;

    setMessage(
      remaining === 1
        ? "Falta só uma palavra."
        : `Ainda faltam ${remaining} palavras.`
    );
  }

  function handleKey(key) {
    const normalizedKey = normalizeKey(key);

    if (normalizedKey === "ENTER") {
      submitGuess();
      return;
    }

    if (normalizedKey === "BACKSPACE") {
      removeLetter();
      return;
    }

    if (key === "ArrowLeft") {
      moveCursor("left");
      return;
    }

    if (key === "ArrowRight") {
      moveCursor("right");
      return;
    }

    if (/^[A-Z]$/.test(normalizedKey)) {
      addLetter(normalizedKey);
    }
  }

  function restartGame() {
    setCurrentWords((previousWords) => getRandomWords(previousWords));
    setGuesses([]);
    setCurrentLetters(Array(WORD_SIZE).fill(""));
    setActiveIndex(0);
    setMessage("Novo quarteto sorteado. Descubra as quatro palavras.");
    setGameStatus("playing");
  }

  function showHelp() {
    setMessage("Verde: lugar certo. Amarelo: tem na palavra. Escuro: não tem.");
  }

  useEffect(() => {
    function onKeyDown(event) {
      const keysToPrevent = [
        "Enter",
        "Backspace",
        "ArrowLeft",
        "ArrowRight",
      ];

      if (keysToPrevent.includes(event.key) || /^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
      }

      handleKey(event.key);
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [currentLetters, activeIndex, guesses, gameStatus, currentWords]);

  return (
    <section className="termo-page">
      <header className="termo-topbar">
        <div className="termo-actions termo-actions-left">
          <button className="termo-icon" onClick={onBack} aria-label="Voltar">
            ^
          </button>

          <button className="termo-icon" onClick={showHelp} aria-label="Ajuda">
            ?
          </button>
        </div>

        <h1 className="termo-title">QUARTETO</h1>

        <div className="termo-actions termo-actions-right">
          <button
            className="termo-icon"
            onClick={() =>
              setMessage(
                `Palavras acertadas: ${solvedWords.length}/${currentWords.length}.`
              )
            }
            aria-label="Progresso"
          >
            ▥
          </button>

          <button
            className="termo-icon"
            onClick={restartGame}
            aria-label="Reiniciar"
          >
            ↻
          </button>
        </div>
      </header>

      <div className="termo-message">{message}</div>

      <div className="boards-area">
        <div className="boards-grid">
          {currentWords.map((word) => (
            <WordBoard
              key={word}
              target={word}
              guesses={guesses}
              currentLetters={currentLetters}
              activeIndex={activeIndex}
              gameStatus={gameStatus}
              onSelectCell={selectCell}
            />
          ))}
        </div>
      </div>

      <Keyboard keyboardStatus={keyboardStatus} onKeyPress={handleKey} />

      <footer className="termo-footer">
        {solvedWords.length}/{currentWords.length}
      </footer>
    </section>
  );
}

function WordBoard({
  target,
  guesses,
  currentLetters,
  activeIndex,
  gameStatus,
  onSelectCell,
}) {
  const solvedIndex = getSolvedIndex(guesses, target);

  return (
    <div className="word-board">
      {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIndex) => {
        const shouldShowGuess =
          rowIndex < guesses.length &&
          (solvedIndex === -1 || rowIndex <= solvedIndex);

        const isCurrentRow =
          gameStatus === "playing" &&
          rowIndex === guesses.length &&
          solvedIndex === -1;

        const rowLetters = shouldShowGuess
          ? guesses[rowIndex].split("")
          : isCurrentRow
            ? currentLetters
            : Array(WORD_SIZE).fill("");

        const evaluation = shouldShowGuess
          ? evaluateGuess(guesses[rowIndex], target)
          : [];

        return (
          <div className="word-row" key={rowIndex}>
            {Array.from({ length: WORD_SIZE }).map((_, letterIndex) => {
              const letter = rowLetters[letterIndex] || "";
              const status = evaluation[letterIndex] || "";
              const isSelected = isCurrentRow && letterIndex === activeIndex;

              return (
                <button
                  type="button"
                  className={`letter-cell ${status} ${
                    letter ? "filled" : ""
                  } ${isCurrentRow ? "selectable" : ""} ${
                    isSelected ? "selected" : ""
                  }`}
                  key={letterIndex}
                  onPointerDown={(event) => {
                    event.preventDefault();

                    if (isCurrentRow) {
                      onSelectCell(letterIndex);
                    }
                  }}
                  aria-label={`Letra ${letterIndex + 1}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function Keyboard({ keyboardStatus, onKeyPress }) {
  return (
    <div className="keyboard">
      <div className="keyboard-row">
        {KEYBOARD_ROWS[0].map((letter) => (
          <KeyButton
            key={letter}
            letter={letter}
            status={keyboardStatus[letter]}
            onKeyPress={onKeyPress}
          />
        ))}
      </div>

      <div className="keyboard-row">
        {KEYBOARD_ROWS[1].map((letter) => (
          <KeyButton
            key={letter}
            letter={letter}
            status={keyboardStatus[letter]}
            onKeyPress={onKeyPress}
          />
        ))}

        <button
          className="key key-backspace"
          onClick={() => onKeyPress("BACKSPACE")}
        >
          ⌫
        </button>
      </div>

      <div className="keyboard-row">
        {KEYBOARD_ROWS[2].map((letter) => (
          <KeyButton
            key={letter}
            letter={letter}
            status={keyboardStatus[letter]}
            onKeyPress={onKeyPress}
          />
        ))}

        <button className="key key-enter" onClick={() => onKeyPress("ENTER")}>
          ENTER
        </button>
      </div>
    </div>
  );
}

function KeyButton({ letter, status, onKeyPress }) {
  return (
    <button
      className={`key ${status || ""}`}
      onClick={() => onKeyPress(letter)}
    >
      {letter}
    </button>
  );
}

export default QuartetoTermo;
