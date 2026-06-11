const games = [
  {
    id: "termo",
    title: "Termoo",
    subtitle: "Quatro palavras escondidas ao mesmo tempo.",
    status: "Jogar",
    available: true,
  },
  {
    id: "pula-pirata",
    title: "Pula Pirata",
    subtitle: "Escolham as espadinhas em turnos.",
    status: "Jogar",
    available: true,
  },
  {
    id: "ludo",
    title: "Ludo",
    subtitle: "Rafa azul contra Emily rosa no tabuleiro clássico.",
    status: "Jogar",
    available: true,
  },
  {
    id: "domino",
    title: "Dominó",
    subtitle: "Joguem em turnos sem espiar a mão do outro.",
    status: "Jogar",
    available: true,
  },
  {
    id: "escape-room",
    title: "Escape Room",
    subtitle: "Uma sala cheia de pistas para resolver.",
    status: "Jogar",
    available: true,
  },
  {
  id: "uno",
  title: "UNO",
  subtitle: "UNO simplificado contra bot, com Vuxe, To fome, Estessada e Docinhos.",
  status: "Jogar",
  available: true
},
{
  id: "jogo-da-velha",
  title: "Jogo da Velha",
  subtitle: "Rafa contra Emily, X rosa e O azul.",
  status: "Jogar",
  available: true,
},
{
  id: "cobrinha",
  title: "Cobrinha",
  subtitle: "Pegue docinhos sem deixar a cobrinha se enrolar.",
  status: "Jogar",
  available: true,
}
];

function GameMenu({ onSelectGame }) {
  return (
    <section className="menu-page">
      <div className="menu-shell">
        <header className="menu-header">
          <p className="menu-kicker">Joguinhos da Emily</p>
          <h1>Escolha o jogo</h1>
          <p>
            Cada jogo aqui é inspirado em alguma coisa que a gente já jogou
            junto. Escolhe um, chama a Emily, e bora jogar.
          </p>
        </header>

        <div className="games-grid">
          {games.map((game) => (
            <button
              key={game.id}
              className={`game-card ${!game.available ? "locked" : ""}`}
              onClick={() => {
                if (game.available) {
                  onSelectGame(game.id);
                }
              }}
              disabled={!game.available}
            >
              <span className="game-status">{game.status}</span>
              <h2>{game.title}</h2>
              <p>{game.subtitle}</p>
            </button>
          ))}
        </div>

        <footer className="menu-footer">
          Os próximos jogos entram aqui, um por vez.
        </footer>
      </div>
    </section>
  );
}

export default GameMenu;