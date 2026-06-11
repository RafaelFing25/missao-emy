import { useMemo, useState } from "react";
import "./EscapeRoomGame.css";

const FINAL_CODE = "0124";

const CLUE_TEXTS = {
  note: {
    title: "Bilhete da ordem",
    text: "Ordem rabiscada: vaga, mês, FZ25 e docinhos.",
  },
  zero: {
    title: "Placa da garagem",
    text: "A placa mostra vagas livres: 0.",
  },
  calendar: {
    title: "Calendário marcado",
    text: "Janeiro está marcado como mês 1, no dia 24.",
  },
  moto: {
    title: "FZ25 das voltinhas",
    text: "No adesivo FZ25, o número 2 está brilhando.",
  },
  candy: {
    title: "Potinho de docinhos",
    text: "Dentro dele tem 4 docinhos e os bilhetinhos de vocês.",
  },
};

function addUnique(list, item) {
  if (list.some((current) => current.id === item.id)) return list;
  return [...list, item];
}

export default function EscapeRoomGame({ onBack }) {
  const [modal, setModal] = useState(null);
  const [items, setItems] = useState({ key: false });
  const [clues, setClues] = useState([]);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(
    "Explore a sala, encontre as pistas e descubra a senha da porta."
  );
  const [wrongCode, setWrongCode] = useState(false);
  const [finished, setFinished] = useState(false);

  const progress = useMemo(() => {
    const total = Object.keys(CLUE_TEXTS).length;
    return `${clues.length}/${total}`;
  }, [clues.length]);

  function registerClue(id) {
    const clue = CLUE_TEXTS[id];
    if (!clue) return;
    setClues((current) => addUnique(current, { id, ...clue }));
  }

  function openObject(objectId) {
    if (finished && objectId !== "door") return;

    if (objectId === "note") {
      registerClue("note");
      setMessage("Boa. O bilhete mostra a ordem das pistas, mas não entrega a senha pronta.");
      setModal({
        title: "Bilhete da ordem",
        body: "Está escrito: vaga, mês, FZ25 e docinhos. Parece uma ordem, não uma senha pronta.",
      });
      return;
    }

    if (objectId === "zero") {
      registerClue("zero");
      setMessage("A garagem guardava uma pista curta e suspeita.");
      setModal({
        title: "Placa da garagem",
        body: "Perto da moto tem uma plaquinha: vagas livres: 0. Nada romântico demais, só bem específico.",
      });
      return;
    }

    if (objectId === "calendar") {
      registerClue("calendar");
      setMessage("O calendário marcou o mês certo.");
      setModal({
        title: "Calendário",
        body: "Janeiro aparece como mês 1. O dia 24 está circulado com um coração pequeno e a anotação: oficial.",
      });
      return;
    }

    if (objectId === "moto") {
      registerClue("moto");
      setMessage("A FZ25 deixou um número brilhando.");
      setModal({
        title: "FZ25 das voltinhas",
        body: "A mini FZ25 está pronta para uma voltinha. No adesivo FZ25, o 2 brilha mais que o resto.",
      });
      return;
    }

    if (objectId === "helmets") {
      setMessage("Os capacetes combinam com a FZ25, mas parecem só lembrança da sala.");
      setModal({
        title: "Capacetes das voltinhas",
        body: "Dois capacetes pretos com viseira azul: um com orelhinhas de gato e outro simples. Claramente esperando uma voltinha.",
      });
      return;
    }

    if (objectId === "rug") {
      if (items.key) {
        setModal({
          title: "Tapete",
          body: "O tapete já foi revirado. Agora ele só guarda poeira e suspeitas.",
        });
        return;
      }

      setItems((current) => ({ ...current, key: true }));
      setMessage("Você encontrou uma chave pequena.");
      setModal({
        title: "Tapete",
        body: "Debaixo do tapete tinha uma chave pequena com um chaveiro de coração.",
      });
      return;
    }

    if (objectId === "candy") {
      if (!items.key) {
        setMessage("O potinho está fechado. Deve ter uma chave em algum lugar.");
        setModal({
          title: "Potinho fechado",
          body: "Dá para ver uns docinhos lá dentro, mas a tampinha está trancada. Bem suspeito.",
        });
        return;
      }

      registerClue("candy");
      setMessage("O potinho revelou uma pista doce.");
      setModal({
        title: "Potinho de docinhos",
        body: "Dentro dele tem 4 docinhos e quatro bilhetinhos: vuxe, to fome, estessada e docinho.",
      });
      return;
    }

    if (objectId === "frame") {
      setModal({
        title: "Quadrinho Rafa e Emily",
        body: "Um desenho simples: azul, rosa, uma moto pequena e um caminho cheio de voltinhas.",
      });
      return;
    }

    if (objectId === "door") {
      setModal({ title: "Porta final", type: "door" });
    }
  }

  function tryCode(event) {
    event.preventDefault();

    if (code === FINAL_CODE) {
      setFinished(true);
      setModal(null);
      setMessage("A porta destrancou. 01/24 era mesmo o caminho.");
      return;
    }

    setWrongCode(true);
    setMessage("A senha ainda não é essa. Revise a ordem das pistas.");
    window.setTimeout(() => setWrongCode(false), 450);
  }

  function resetGame() {
    setModal(null);
    setItems({ key: false });
    setClues([]);
    setCode("");
    setMessage("Explore a sala, encontre as pistas e descubra a senha da porta.");
    setWrongCode(false);
    setFinished(false);
  }

  return (
    <main className="escape-page">
      <header className="escape-topbar">
        <button className="escape-back" type="button" onClick={onBack}>
          ← Voltar ao menu
        </button>

        <div className="escape-title-block">
          <span className="escape-kicker">Jogo 5</span>
          <h1>Escape Room</h1>
          <p>Uma sala, algumas pistas e uma porta esperando a data certa.</p>
        </div>

        <button className="escape-reset" type="button" onClick={resetGame}>
          Reiniciar
        </button>
      </header>

      <section className="escape-hud" aria-label="Informações do jogo">
        <div className="escape-hud-card">
          <strong>Objetivo</strong>
          <span>Abrir a porta final</span>
        </div>
        <div className="escape-hud-card">
          <strong>Pistas</strong>
          <span>{progress}</span>
        </div>
        <div className="escape-hud-card">
          <strong>Inventário</strong>
          <span>{items.key ? "Chave pequena" : "Vazio"}</span>
        </div>
      </section>

      <p className={`escape-message ${finished ? "success" : ""}`}>{message}</p>

      <section className={`escape-room ${finished ? "room-open" : ""}`}>
        <div className="room-wall" />
        <div className="room-floor" />
        <div className="room-light" />

        <button
          className="hotspot door-hotspot"
          type="button"
          onClick={() => openObject("door")}
          aria-label="Porta final"
        >
          <span className="door-shape">
            <span className="door-window" />
            <span className="door-handle" />
          </span>
          <span className="hotspot-label">Porta</span>
        </button>

        <button
          className="hotspot calendar-hotspot"
          type="button"
          onClick={() => openObject("calendar")}
          aria-label="Calendário marcado"
        >
          <span className="calendar-shape">
            <span className="calendar-month">JAN</span>
            <span className="calendar-date"><strong>1</strong><small>dia 24</small></span>
            <span className="calendar-heart">♥</span>
          </span>
          <span className="hotspot-label">Calendário</span>
        </button>

        <button
          className="hotspot moto-hotspot"
          type="button"
          onClick={() => openObject("moto")}
          aria-label="FZ25 das voltinhas"
        >
          <span className="moto-shape">
            <span className="moto-wheel back" />
            <span className="moto-wheel front" />
            <span className="moto-body" />
            <span className="moto-seat" />
            <span className="moto-handle" />
            <span className="moto-badge">FZ<span className="moto-glow">2</span>5</span>
          </span>
          <span className="hotspot-label">FZ25</span>
        </button>

        <button
          className="hotspot zero-hotspot"
          type="button"
          onClick={() => openObject("zero")}
          aria-label="Placa da garagem"
        >
          <span className="zero-sign">
            <span>Vagas livres</span>
            <strong>0</strong>
          </span>
          <span className="hotspot-label">Garagem</span>
        </button>

        <button
          className="hotspot helmets-hotspot"
          type="button"
          onClick={() => openObject("helmets")}
          aria-label="Capacetes"
        >
          <span className="helmets-shape">
            <span className="helmet helmet-cat" aria-hidden="true">
              <span className="helmet-ear left" />
              <span className="helmet-ear right" />
              <span className="helmet-visor" />
            </span>
            <span className="helmet helmet-plain" aria-hidden="true">
              <span className="helmet-visor" />
            </span>
          </span>
          <span className="hotspot-label">Capacetes</span>
        </button>

        <button
          className="hotspot frame-hotspot"
          type="button"
          onClick={() => openObject("frame")}
          aria-label="Quadrinho de Rafa e Emily"
        >
          <span className="frame-shape">
            <span className="frame-road" />
            <span className="frame-dot blue" />
            <span className="frame-dot pink" />
          </span>
          <span className="hotspot-label">Quadro</span>
        </button>

        <button
          className="hotspot note-hotspot"
          type="button"
          onClick={() => openObject("note")}
          aria-label="Bilhete"
        >
          <span className="note-shape">?</span>
          <span className="hotspot-label">Bilhete</span>
        </button>

        <button
          className="hotspot candy-hotspot"
          type="button"
          onClick={() => openObject("candy")}
          aria-label="Potinho de docinhos"
        >
          <span className={`candy-shape ${items.key ? "unlocked" : ""}`}>
            <span className="candy-lid" />
            <span className="candy-piece one" />
            <span className="candy-piece two" />
            <span className="candy-piece three" />
            <span className="candy-piece four" />
            <span className="candy-lock" />
          </span>
          <span className="hotspot-label">Docinhos</span>
        </button>

        <button
          className="hotspot rug-hotspot"
          type="button"
          onClick={() => openObject("rug")}
          aria-label="Tapete"
        >
          <span className="rug-shape" />
          <span className="hotspot-label">Tapete</span>
        </button>

        <div className="wall-words" aria-hidden="true">
          <span>vuxe</span>
          <span>to fome</span>
          <span>estessada</span>
        </div>

        {finished && (
          <div className="escape-finished-card">
            <strong>Porta aberta.</strong>
            <span>Vocês escaparam seguindo a data oficial e as pistas de vocês.</span>
          </div>
        )}
      </section>

      <aside className="escape-clues" aria-label="Pistas encontradas">
        <h2>Pistas encontradas</h2>
        {clues.length === 0 ? (
          <p>Nenhuma pista ainda. Comece clicando nos objetos da sala.</p>
        ) : (
          <ul>
            {clues.map((clue) => (
              <li key={clue.id}>
                <strong>{clue.title}</strong>
                <span>{clue.text}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {modal && (
        <div className="escape-modal-backdrop" role="presentation">
          <section className="escape-modal" role="dialog" aria-modal="true">
            <button
              className="modal-close"
              type="button"
              onClick={() => setModal(null)}
              aria-label="Fechar"
            >
              ×
            </button>

            <h2>{modal.title}</h2>

            {modal.type === "door" ? (
              <form onSubmit={tryCode} className="door-form">
                <p>
                  A porta tem um cadeado de quatro números. A ordem das pistas
                  está escondida em algum lugar da sala.
                </p>

                <input
                  className={wrongCode ? "shake" : ""}
                  value={code}
                  onChange={(event) => {
                    const onlyNumbers = event.target.value.replace(/\D/g, "");
                    setCode(onlyNumbers.slice(0, 4));
                  }}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  autoFocus
                />

                <div className="door-actions">
                  <button type="submit">Tentar senha</button>
                  <button type="button" onClick={() => setModal(null)}>
                    Continuar procurando
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p>{modal.body}</p>
                <button
                  className="modal-primary"
                  type="button"
                  onClick={() => setModal(null)}
                >
                  Fechar
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
