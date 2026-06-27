import { useState, useEffect } from 'react'
import axios from 'axios'
import UploadPage   from './pages/UploadPage'
import CanvasEditor from './pages/CanvasEditor'
import HistoryPage  from './pages/HistoryPage'

const API = import.meta.env.VITE_API_URL

export default function App() {
  const [currentPage, setCurrentPage] = useState('upload')
  const [projectData, setProjectData] = useState(null)
  const [restoring,   setRestoring]   = useState(true)

  // on mount, check if there's a last opened project to restore
  useEffect(() => {
    const lastId = localStorage.getItem('editify_last_project')
    if (!lastId) { setRestoring(false); return }

    axios.get(`${API}/projects/${lastId}/saved`)
      .then(res => {
        if (res.data.has_saved_state) {
          const state = JSON.parse(res.data.saved_state)
          setProjectData({
            ...state,
            file_id:  lastId,
            filename: res.data.filename,
          })
          setCurrentPage('canvas')
        }
      })
      .catch(() => {
        localStorage.removeItem('editify_last_project')
      })
      .finally(() => setRestoring(false))
  }, [])

  const goToCanvas = (data) => {
    setProjectData(data)
    setCurrentPage('canvas')
  }

  const goToHistory = () => setCurrentPage('history')
  const goToUpload  = () => setCurrentPage('upload')

  if (restoring) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (currentPage === 'canvas') {
    return <CanvasEditor project={projectData} onBack={goToUpload} />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <span
          className="text-xl font-bold text-white select-none"
        >
          Editify
        </span>
        <div className="flex gap-4">
          <button onClick={goToUpload}  className="text-sm text-gray-400 hover:text-white transition">Upload</button>
          <button onClick={goToHistory} className="text-sm text-gray-400 hover:text-white transition">History</button>
        </div>
      </nav>

      {currentPage === 'upload'  && <UploadPage  onSuccess={goToCanvas} />}
      {currentPage === 'history' && <HistoryPage onOpen={goToCanvas} />}
    </div>
  )
}