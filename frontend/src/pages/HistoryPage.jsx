import { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function HistoryPage({ onOpen }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    axios.get(`${API}/projects`)
      .then(res => setProjects(res.data))
      .catch(() => setError('Could not load history. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

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
          <div
            key={p.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition cursor-pointer"
            onClick={() => onOpen(p)}
          >
            <div className="text-sm font-medium text-white truncate mb-2">{p.filename}</div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{p.layer_count} layers</span>
              <span className={p.status === 'ready' ? 'text-green-400' : 'text-yellow-400'}>
                {p.status}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-1">{p.created_at}</div>
          </div>
        ))}
      </div>
    </div>
  )
}