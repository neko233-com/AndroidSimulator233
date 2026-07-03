import { useState } from 'react'

function App() {
  const [result, setResult] = useState('')

  const greet = async () => {
    // Wails binding will be available at runtime
    setResult('Hello from AndroidSimulator233!')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">AndroidSimulator233</h1>
        <p className="text-gray-400 mb-8">Open-source Android Simulator</p>
        <button
          onClick={greet}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
        >
          Test Connection
        </button>
        {result && <p className="mt-4 text-green-400">{result}</p>}
      </div>
    </div>
  )
}

export default App
