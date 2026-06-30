import { useState, useEffect } from 'react'

import axios from 'axios'
import UploadPage   from './pages/UploadPage'
import CanvasEditor from './pages/CanvasEditor'
import HistoryPage  from './pages/HistoryPage'
import LoginPage from './pages/LoginPage'
import HistoryNavbar from "./components/library/HistoryNavbar";


const API = import.meta.env.VITE_API_URL

export default function App() {
  const [currentPage, setCurrentPage] = useState('upload')
  const [projectData, setProjectData] = useState(null)
  const [restoring,   setRestoring]   = useState(true)

  // check if there's a last opened project to restore
  useEffect(() => {
    const isRefresh = sessionStorage.getItem('editify_session_active')

    if (!isRefresh) {
      sessionStorage.setItem('editify_session_active', 'true')
      setRestoring(false)
      return
    }

    const lastPage = sessionStorage.getItem('editify_current_page')

    if (lastPage === 'history') {
      setCurrentPage('history')
      setRestoring(false)
      return
    }

    if (lastPage === 'upload' || !lastPage) {
      setRestoring(false)
      return
    }

    // lastPage === 'canvas'
    const lastId = localStorage.getItem('editify_last_project')
    if (!lastId) { setRestoring(false); return }

    axios.get(`${API}/projects/${lastId}/saved`)
      .then(res => {
        if (res.data.has_saved_state) {
          const state = JSON.parse(res.data.saved_state)
          setProjectData({
            ...state,
            file_id:     lastId,
            filename:    res.data.filename,
            _savedState: res.data.saved_state,
          })
          setCurrentPage('canvas')
        }
      })
      .catch(() => localStorage.removeItem('editify_last_project'))
      .finally(() => setRestoring(false))
  }, [])

  const goToCanvas = (data) => {
    setProjectData(data)
    setCurrentPage('canvas')
    sessionStorage.setItem('editify_current_page', 'canvas')
  }

  const goToHistory = () => {
    setCurrentPage('history')
    sessionStorage.setItem('editify_current_page', 'history')
  }

  const goToUpload = () => {
    localStorage.removeItem('editify_last_project')
    setCurrentPage('upload')
    sessionStorage.setItem('editify_current_page', 'upload')
  }

  if (restoring) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (currentPage === 'login') {
    return (
      <LoginPage
        onLogin={() => setCurrentPage('upload')}
      />
    )
  }

  if (currentPage === 'canvas') {
    return <CanvasEditor project={projectData} onBack={goToUpload} onLibrary={goToHistory} />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {currentPage === "history" && (
          <HistoryNavbar
              currentPage={currentPage}
              goToUpload={goToUpload}
              goToHistory={goToHistory}
          />
      )}

      {currentPage === 'upload'  && <UploadPage  onSuccess={goToCanvas} onHistory={goToHistory}/>}
      {currentPage === 'history' && <HistoryPage onOpen={goToCanvas} />}
    </div>
  )
}