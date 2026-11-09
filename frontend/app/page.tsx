import { Chat } from "./chat";

export default function HomePage() {
  return (
    <main className="shell">
      <div className="panel">
        <header className="intro">
          <h1>Mental coach</h1>
          <p>A quiet place to talk through stress, habits, and the next small step.</p>
        </header>
        <Chat />
      </div>
    </main>
  );
}
