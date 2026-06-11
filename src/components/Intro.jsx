function Intro({ onStart }) {
  return (
    <section className="intro-page">
      <div className="intro-card">
        <p className="intro-kicker">Joguinhos da Emily</p>

        <h1>Uma salinha de jogos só nossa</h1>

        <p>Oi, Emily.</p>

        <p>
          Eu queria fazer uma coisa simples, mas com a nossa cara. Então montei
          uma salinha de jogos inspirada em alguns jogos que a gente já jogou.
        </p>

        <p>
          Não é nada muito sério. É só um jeitinho meu de transformar um pouco
          da nossa história em joguinhos.
        </p>

        <p>
          Escolhe um jogo, joga comigo, e tenta não trapacear.
        </p>

        <button className="primary-button" onClick={onStart}>
          Ver jogos
        </button>

        <span className="intro-note">
          Ou trapaceia. Eu provavelmente vou deixar.
        </span>
      </div>
    </section>
  );
}

export default Intro;