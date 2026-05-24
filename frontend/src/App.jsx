import { useState } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-16">
        <Dashboard currentPage={currentPage} onNavigate={setCurrentPage} />
      </main>
    </div>
  )
}
