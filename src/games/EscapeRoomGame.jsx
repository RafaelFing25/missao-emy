import { useMemo, useState } from "react";
import motoImage from "../assets/escape-room-fz25.png";
import "./EscapeRoomGame.css";

const FINAL_CODE = "0124";

const SCENES = [
  {
    id: "garagem",
    title: "Garagem",
    subtitle: "A FZ25 guarda parte da senha.",
  },
  {
    id: "mural",
    title: "Mural",
    subtitle: "Datas, bilhetes e ordem das pistas.",
  },
  {
    id: "mesa",
    title: "Mesa dos docinhos",
    subtitle: "Tem coisa trancada por aqui.",
  },
  {
    id: "porta",
    title: "Porta final",
    subtitle: "Use as pistas para escapar.",
  },
];

const CLUE_TEXTS = {
  order: {
    title: "Bilhete da ordem",
    text: "Ordem da senha: garagem, mês, FZ25 e docinhos.",
  },
  zero: {
    title: "Placa da garagem",
    text: "A placa mostra vagas livres: 0.",
  },
  calendar: {
    title: "Calendário marcado",
    text: "Janeiro aparece como mês 1, com o dia 24 circulado.",
  },
  moto: {
    title: "FZ25",
    text: "No adesivo da moto, o número 2 chama atenção.",
  },
  candy: {
    title: "Potinho de docinhos",
    text: "Dentro do potinho existem 4 docinhos.",
  },
};

const INITIAL_MESSAGE = "Explore os ambientes, junte as pistas e abra a porta final.";

function addUnique(list, item) {
  if (list.some((current) => current.id === item.id)) return list;
  return [...list, item];
}

export default function EscapeRoomGame({ onBack }) {
  const [scene, setScene] = useState("garagem");
  const [modal, setModal] = useState(null);
  const [items, setItems] = useState({ key: false });
  const [clues, setClues] = useState([]);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(INITIAL_MESSAGE);
  const [wrongCode, setWrongCode] = useState(false);
  const [finished, setFinished] = useState(false);

  const currentScene = useMemo(() => {
    return SCENES.find((current) => current.id === scene) || SCENES[0];
  }, [scene]);

  const progress = useMemo(() => {
    const total = Object.keys(CLUE_TEXTS).length;
    return `${clues.length}/${total}`;
  }, [clues.length]);

  function registerClue(id) {
    const clue = CLUE_TEXTS[id];
    if (!clue) return;
    setClues((current) => addUnique(current, { id, ...clue }));
  }

  function goToScene(nextScene) {
    setScene(nextScene);
    setModal(null);
    setMessage(
      nextScene === "porta"
        ? "A porta precisa de uma senha de quatro números."
        : INITIAL_MESSAGE
    );
  }

  function openObject(objectId) {
    if (finished && objectId !== "door") return;

    if (objectId === "moto") {
      registerClue("moto");
      setMessage("A moto entregou uma pista importante.");
      setModal({
        title: "FZ25",
        body: "Essa é a moto certa. No adesivo FZ25, o número 2 parece mais importante do que o resto.",
      });
      return;
    }

    if (objectId === "plate") {
      registerClue("zero");
      setMessage("A placa da garagem não está ali por acaso.");
      setModal({
        title: "Placa da garagem",
        body: "A plaquinha diz: vagas livres: 0. Curto, seco e suspeito.",
      });
      return;
    }

    if (objectId === "helmets") {
      setMessage("Os capacetes combinam com a FZ25, mas não têm senha.");
      setModal({
        title: "Capacetes",
        body: "Dois capacetes esperando uma voltinha: um da Emily e um do Rafa. Bonito, mas parece só detalhe da cena.",
      });
      return;
    }

    if (objectId === "tools") {
      setMessage("As ferramentas estão no lugar, mas nenhuma abre a porta.");
      setModal({
        title: "Caixa de ferramentas",
        body: "Tem chave de boca, pano e uma luva. Nada que resolva o cadeado final.",
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

    if (objectId === "note") {
      registerClue("order");
      setMessage("Boa. Agora você tem a ordem das pistas.");
      setModal({
        title: "Bilhete da ordem",
        body: "Está escrito: garagem, mês, FZ25 e docinhos. Isso parece ser a ordem dos quatro números.",
      });
      return;
    }

    if (objectId === "frame") {
      setMessage("O quadro confirma que a sala é de vocês.");
      setModal({
        title: "Quadrinho Rafa e Emily",
        body: "Azul, rosa, uma estrada pequena e uma moto no meio. Não dá senha, mas deixa a sala mais de vocês.",
      });
      return;
    }

    if (objectId === "rug") {
      if (items.key) {
        setModal({
          title: "Tapete",
          body: "O tapete já foi levantado. Agora ele só finge que ainda tem mistério.",
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
        setMessage("O potinho está fechado. Procure uma chave.");
        setModal({
          title: "Potinho fechado",
          body: "Dá para ver uns docinhos lá dentro, mas a tampa está trancada. Deve ter uma chave escondida em algum ambiente.",
        });
        return;
      }

      registerClue("candy");
      setMessage("O potinho revelou a última pista numérica.");
      setModal({
        title: "Potinho de docinhos",
        body: "Você abriu o potinho. Dentro dele existem exatamente 4 docinhos e alguns bilhetinhos: vuxe, to fome, estessada e docinho.",
      });
      return;
    }

    if (objectId === "door") {
      setScene("porta");
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
    setScene("garagem");
    setModal(null);
    setItems({ key: false });
    setClues([]);
    setCode("");
    setMessage(INITIAL_MESSAGE);
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
          <p>Agora em ambientes: garagem, mural, mesa e porta final.</p>
        </div>

        <button className="escape-reset" type="button" onClick={resetGame}>
          Reiniciar
        </button>
      </header>

      <section className="escape-hud" aria-label="Informações do jogo">
        <div className="escape-hud-card">
          <strong>Ambiente</strong>
          <span>{currentScene.title}</span>
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

      <section className="escape-layout">
        <nav className="escape-map" aria-label="Ambientes do Escape Room">
          {SCENES.map((room) => (
            <button
              key={room.id}
              type="button"
              className={scene === room.id ? "active" : ""}
              onClick={() => goToScene(room.id)}
            >
              <strong>{room.title}</strong>
              <span>{room.subtitle}</span>
            </button>
          ))}
        </nav>

        <section
          className={`escape-room escape-room-${scene} ${finished ? "room-open" : ""}`}
          aria-label={currentScene.title}
        >
          <div className="room-header-card">
            <strong>{currentScene.title}</strong>
            <span>{currentScene.subtitle}</span>
          </div>

          {scene === "garagem" && (
            <GarageScene openObject={openObject} />
          )}

          {scene === "mural" && <MuralScene openObject={openObject} />}

          {scene === "mesa" && (
            <TableScene openObject={openObject} hasKey={items.key} />
          )}

          {scene === "porta" && (
            <DoorScene openObject={openObject} finished={finished} />
          )}

          {finished && (
            <div className="escape-finished-card">
              <strong>Porta aberta.</strong>
              <span>Vocês escaparam seguindo a data oficial e as pistas certas.</span>
            </div>
          )}
        </section>

        <aside className="escape-clues" aria-label="Pistas encontradas">
          <h2>Pistas encontradas</h2>
          {clues.length === 0 ? (
            <p>Nenhuma pista ainda. Clique nos objetos de cada ambiente.</p>
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
      </section>

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
                  está em um bilhete no mural.
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

function GarageScene({ openObject }) {
  return (
    <div className="scene scene-garage">
      <div className="garage-wall" />
      <div className="garage-floor" />

      <button
        className="scene-object moto-object"
        type="button"
        onClick={() => openObject("moto")}
        aria-label="Moto FZ25"
      >
        <img src={motoImage} alt="Moto FZ25" />
        <span className="moto-number">FZ25</span>
        <span className="object-label">Moto</span>
      </button>

      <button
        className="scene-object plate-object"
        type="button"
        onClick={() => openObject("plate")}
        aria-label="Placa da garagem"
      >
        <span>Vagas livres</span>
        <strong>0</strong>
        <span className="object-label">Placa</span>
      </button>

      <button
        className="scene-object helmets-object"
        type="button"
        onClick={() => openObject("helmets")}
        aria-label="Capacetes"
      >
        <span className="helmet cat" />
        <span className="helmet simple" />
        <span className="object-label">Capacetes</span>
      </button>

      <button
        className="scene-object tools-object"
        type="button"
        onClick={() => openObject("tools")}
        aria-label="Caixa de ferramentas"
      >
        <span className="toolbox-lid" />
        <span className="toolbox-body" />
        <span className="object-label">Ferramentas</span>
      </button>
    </div>
  );
}

function MuralScene({ openObject }) {
  return (
    <div className="scene scene-mural">
      <div className="mural-board">
        <button
          className="scene-object calendar-object"
          type="button"
          onClick={() => openObject("calendar")}
          aria-label="Calendário"
        >
          <span className="calendar-top">JAN</span>
          <strong>1</strong>
          <small>dia 24</small>
          <span className="calendar-heart">♥</span>
          <span className="object-label">Calendário</span>
        </button>

        <button
          className="scene-object note-object"
          type="button"
          onClick={() => openObject("note")}
          aria-label="Bilhete da ordem"
        >
          <strong>?</strong>
          <span>ordem</span>
          <span className="object-label">Bilhete</span>
        </button>

        <button
          className="scene-object frame-object"
          type="button"
          onClick={() => openObject("frame")}
          aria-label="Quadro Rafa e Emily"
        >
          <span className="frame-road" />
          <span className="frame-dot blue" />
          <span className="frame-dot pink" />
          <span className="object-label">Quadro</span>
        </button>
      </div>

      <div className="sticky-words" aria-hidden="true">
        <span>vuxe</span>
        <span>to fome</span>
        <span>estessada</span>
      </div>
    </div>
  );
}

function TableScene({ openObject, hasKey }) {
  return (
    <div className="scene scene-table">
      <div className="table-back-wall" />
      <div className="table-surface" />

      <button
        className="scene-object rug-object"
        type="button"
        onClick={() => openObject("rug")}
        aria-label="Tapete"
      >
        <span className="rug-shape" />
        <span className="object-label">Tapete</span>
      </button>

      <button
        className="scene-object candy-object"
        type="button"
        onClick={() => openObject("candy")}
        aria-label="Potinho de docinhos"
      >
        <span className={`candy-jar ${hasKey ? "unlocked" : ""}`}>
          <span className="candy-lid" />
          <span className="candy-piece one" />
          <span className="candy-piece two" />
          <span className="candy-piece three" />
          <span className="candy-piece four" />
          <span className="candy-lock" />
        </span>
        <span className="object-label">Docinhos</span>
      </button>

      <div className="table-note" aria-hidden="true">
        <span>não comer antes da senha</span>
      </div>
    </div>
  );
}

function DoorScene({ openObject, finished }) {
  return (
    <div className="scene scene-door">
      <div className="door-wall" />
      <button
        className="scene-object final-door-object"
        type="button"
        onClick={() => openObject("door")}
        aria-label="Porta final"
      >
        <span className={`final-door ${finished ? "open" : ""}`}>
          <span className="door-window" />
          <span className="door-handle" />
        </span>
        <span className="keypad-preview">0000</span>
        <span className="object-label">Porta</span>
      </button>
    </div>
  );
}