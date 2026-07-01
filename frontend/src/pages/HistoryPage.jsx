import { useState, useEffect } from 'react'
import axios from 'axios'
import ProjectCard from '../components/library/ProjectCard'
import ConfirmDialog from '../components/common/ConfirmDialog'

import { FiSearch } from 'react-icons/fi'


const API = import.meta.env.VITE_API_URL

export default function HistoryPage({ onOpenProject }) {
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const filteredProjects = projects.filter(project =>
    project.filename.toLowerCase().includes(search.toLowerCase())
  )

  const groupedProjects = {
    Today: [],
    Yesterday: [],
    'Earlier This Week': [],
    Older: [],
  }

  filteredProjects.forEach(project => {
    groupedProjects[getSection(project.created_at)].push(project)
    console.log(project.created_at)
  })

  useEffect(() => {
    axios.get(`${API}/projects`)
      .then(res => setProjects(res.data))
      .catch(() => setError('Could not load history. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const deleteProject = async () => {
    if (!projectToDelete) return
    try {

      setDeleting(true)

      await axios.delete(`${API}/projects/${projectToDelete.file_id}`)

      setProjects(prev =>
        prev.filter(p => p.file_id !== projectToDelete.file_id)
      )

      const last = localStorage.getItem("editify_last_project")

      if (last === projectToDelete.file_id) {
        localStorage.removeItem("editify_last_project")
      }

      setProjectToDelete(null)

    } catch {

      alert("Failed to delete project.")

    } finally {

      setDeleting(false)

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
    <>
      <div className="min-h-screen bg-[#070B16]">
        <div className="max-w-7xl mx-auto px-8 py-6">

          {/* Header */}

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">

            <div>

              <h1
                className="
                  text-5xl
                  font-extrabold
                  tracking-tight
                  bg-gradient-to-r
                  from-cyan-400
                  via-blue-500
                  to-purple-500
                  bg-clip-text
                  text-transparent
                "
              >
                Your Library
              </h1>

              <p className="mt-3 text-gray-400 text-lg">
                All your designs, organized in one place.
              </p>

            </div>

            <div className="relative w-72">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your library..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-white/10
                  bg-white/5
                  pl-11
                  pr-4
                  py-3
                  text-white
                  placeholder:text-gray-500
                  outline-none
                  transition-all
                  duration-200
                  focus:border-blue-500
                  focus:bg-white/10
                "
              />
            </div>

          </div>

          {filteredProjects.length === 0 && (

          <div className="text-center py-24">

              <h2 className="text-2xl font-semibold text-white">
                  No matching projects
              </h2>

              <p className="text-gray-500 mt-2">
                  Try another filename.
              </p>

          </div>

          )}

          {filteredProjects.length > 0 && Object.entries(groupedProjects).map(([section, items]) => {

            if (items.length === 0) return null
            
            return (
              <div key={section} className="mb-12">

                <div className="flex items-center mb-7">

                    <h2 className="text-xl font-bold text-white pr-5">
                        {section}
                    </h2>

                    <div className="flex-1 border-t border-white/15"></div>

                </div>

                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">

                  {items.map(project => (

                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => onOpenProject(project)}
                      onDelete={setProjectToDelete}

                    />

                  ))}

                </div>

              </div>
            )

          })}

        </div>
      </div>

      <ConfirmDialog
        open={projectToDelete !== null}
        title="Delete Project"
        message={
          projectToDelete
            ? `Are you sure you want to permanently delete\n"${projectToDelete.filename}"?\n\nThis action cannot be undone.`
            : ""
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onCancel={() => {
          if (!deleting) setProjectToDelete(null)
        }}
        onConfirm={deleteProject}
      />
    </>
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

function getSection(dateString) {
  const today = new Date()
  const date = new Date(dateString)

  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24))

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff <= 7) return 'Earlier This Week'
  return 'Older'
}