import Header from "../components/Header";
import Main from "../components/Main";
import "./App.css";

export default function App() {
  return (
    <>
      <Header />
      <Main />

      <footer className="app-footer">
        <p>
          Developed by Shahil Mohammed (shvhil) as a study & exploration of
          React + Vite with GPT models. Have fun :D
          <br />
          <a
            href="https://github.com/shvhil"
            target="_blank"
            rel="noopener noreferrer"
          >
            Github - @shvhil
          </a>
        </p>
      </footer>
    </>
  );
}
