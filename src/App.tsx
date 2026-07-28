import IDSQuestionnaire from './components/IDSQuestionnaire'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1>IDS Builder</h1>
        <p>Define en pocas preguntas qué información necesita tu proyecto de estructura</p>
      </header>
      <main className="app__main">
        <IDSQuestionnaire />
      </main>
      <footer className="app__footer">
        <span>Documentos claros para equipos de diseño y obra</span>
      </footer>
    </div>
  )
}

export default App
