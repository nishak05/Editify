import { useState } from 'react'
import UploadPage from './pages/UploadPage'
import CanvasEditor from './pages/CanvasEditor'
import HistoryPage from './pages/HistoryPage'

export default function App() {
  const [currentPage, setCurrentPage] = useState('upload')
  const [projectData, setProjectData] = useState(null)

  const goToCanvas = (data) => {
    setProjectData(data)
    setCurrentPage('canvas')
  }

  const goToHistory = () => setCurrentPage('history')
  const goToUpload  = () => setCurrentPage('upload')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <span
          className="text-xl font-bold text-white cursor-pointer"
          onClick={goToUpload}
        >
          Editify
        </span>
        <div className="flex gap-4">
          <button
            onClick={goToUpload}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Upload
          </button>
          <button
            onClick={goToHistory}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            History
          </button>
        </div>
      </nav>

      {currentPage === 'upload'  && <UploadPage onSuccess={goToCanvas} />}
      {currentPage === 'canvas'  && <CanvasEditor project={projectData} onBack={goToUpload} />}
      {currentPage === 'history' && <HistoryPage onOpen={goToCanvas} />}
    </div>
  )
}