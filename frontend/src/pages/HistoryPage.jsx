import { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function HistoryPage({ onOpen }) {
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    axios.get(`${API}/projects`)
      .then(res => setProjects(res.data))
      .catch(() => setError('Could not load history. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const fetchAndOpen = async (project) => {
    if (project.status !== 'ready') return
    try {
      const saved = await axios.get(`${API}/projects/${project.file_id}/saved`)

      if (saved.data.has_saved_state) {
        const state = JSON.parse(saved.data.saved_state)
        onOpen({
          ...state,
          file_id:      project.file_id,
          filename:     project.filename,
          _savedState:  saved.data.saved_state,
        })
      } else {
        // no saved state — rerun pipeline
        const res = await axios.get(`${API}/projects/${project.file_id}/layers`)
        onOpen(res.data)
      }
    } catch {
      alert('Could not load project. Try uploading again.')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh] text-red-400">{error}</div>
  )

  if (projects.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
      <p className="text-lg">No projects yet</p>
      <p className="text-sm mt-1">Upload a poster to get started</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Past projects</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(p => (
          <HistoryCard key={p.id} project={p} onClick={() => fetchAndOpen(p)} />
        ))}
      </div>
    </div>
  )
}


function HistoryCard({ project, onClick }) {
  const date = formatDate(project.created_at)

  return (
    <div
      onClick={onClick}
      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition cursor-pointer group"
    >
      {/* thumbnail */}
      <div className="w-full h-40 bg-gray-800 flex items-center justify-center overflow-hidden">
        {project.thumbnail_b64 ? (
          <img
            src={`data:image/png;base64,${project.thumbnail_b64}`}
            alt={project.filename}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-600">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            <span className="text-xs">No preview</span>
          </div>
        )}
      </div>

      {/* metadata */}
      <div className="p-3">
        <p className="text-sm font-medium text-white truncate mb-1">{project.filename}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{project.layer_count} layers · {date}</span>
          <span className={`text-xs font-medium ${project.status === 'ready' ? 'text-green-400' : 'text-yellow-400'}`}>
            {project.status}
          </span>
        </div>
      </div>
    </div>
  )
}


function formatDate(timestamp) {
  if (!timestamp) return ''
  try {
    const d = new Date(timestamp)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return timestamp.split(' ')[0]
  }
}