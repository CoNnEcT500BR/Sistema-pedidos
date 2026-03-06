import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Verificando...')

  useEffect(() => {
    // Verificar se a API está rodando
    fetch('http://localhost:3001/api/v1/health')
      .then(res => res.json())
      .then(data => setApiStatus(`✅ API conectada: ${data.version}`))
      .catch(() => setApiStatus('❌ API não encontrada'))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">🍔</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sistema de Pedidos</h1>
                <p className="text-xs text-gray-600">Off-Grid v1.0</p>
              </div>
            </div>
            <span className="px-4 py-2 bg-accent-100 text-accent-700 rounded-full font-semibold text-sm">
              {apiStatus}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Kiosk Card */}
          <div className="card border-l-4 border-primary-500">
            <div className="text-5xl mb-4">🖥️</div>
            <h2 className="text-2xl font-bold mb-2 text-primary-700">Kiosk</h2>
            <p className="text-gray-600 mb-4">Cliente monta seu pedido sozinho em tela touch grande</p>
            <a href="#" className="btn-primary inline-block">Acessar Kiosk</a>
          </div>

          {/* Staff Card */}
          <div className="card border-l-4 border-secondary-500">
            <div className="text-5xl mb-4">📱</div>
            <h2 className="text-2xl font-bold mb-2 text-secondary-700">Staff</h2>
            <p className="text-gray-600 mb-4">Atendente registra pedidos rapidamente no balcão</p>
            <a href="#" className="btn-secondary inline-block">Acessar Staff</a>
          </div>

          {/* Admin Card */}
          <div className="card border-l-4 border-accent-500">
            <div className="text-5xl mb-4">👨‍💼</div>
            <h2 className="text-2xl font-bold mb-2 text-accent-700">Admin</h2>
            <p className="text-gray-600 mb-4">Gerencia cardápio, preços e visualiza relatórios</p>
            <a href="#" className="btn-accent inline-block">Acessar Admin</a>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-16 card bg-primary-50 border-2 border-primary-200">
          <h3 className="text-xl font-bold text-primary-900 mb-2">🚀 Fase 1: Setup - Iniciada!</h3>
          <p className="text-primary-800 mb-4">
            Estrutura de monorepo configurada com TypeScript, React, Fastify, Prisma e Tailwind CSS.
          </p>
          <ul className="space-y-2 text-sm text-primary-700">
            <li>✅ Backend: Node.js + Fastify</li>
            <li>✅ Frontend: React + Vite</li>
            <li>✅ Styling: Tailwind CSS</li>
            <li>✅ Database: SQLite + Prisma</li>
            <li>✅ Type Safety: TypeScript em tudo</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default App
