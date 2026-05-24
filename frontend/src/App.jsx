import { useState } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Footer from './components/Footer'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-20 pb-8 md:pt-16 flex-1">
        <Dashboard currentPage={currentPage} onNavigate={setCurrentPage} />
      </main>
      <Footer />
    </div>
  )
}
