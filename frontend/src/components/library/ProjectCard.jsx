import { useState } from 'react'
import { FiTrash2 } from 'react-icons/fi'

function formatDate(timestamp) {
  if (!timestamp) return ""

  try {
    const d = new Date(timestamp)
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return timestamp.split(" ")[0]
  }
}

export default function ProjectCard({ project, onClick, onDelete }) {
  const date = formatDate(project.created_at)

  return (
    <button
      onClick={onClick}
      className="
        group
        w-full
        overflow-hidden
        rounded-2xl
        bg-white/[0.04]
        border
        border-white/10
        backdrop-blur-lg
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-blue-400/30
        hover:bg-white/[0.08]
        hover:shadow-xl    
        hover:shadow-[0_10px_40px_rgba(59,130,246,0.12)] 
      "
    >
      {/* Thumbnail */}

      <div className="
                relative
                h-44
                bg-[#0F172A]
                overflow-hidden
                flex
                items-center
                justify-center
            "
        >
        {project.thumbnail_b64 ? (
          <img
            src={`data:image/png;base64,${project.thumbnail_b64}`}
            alt={project.filename}
            className="
              max-w-full
              max-h-full
              object-contain
              transition-all
              duration-500
              group-hover:scale-[1.05]
            "
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-600">
            No Preview
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(project)
          }}
          className="
            absolute
            top-2.5
            right-2.5
            flex
            items-center
            justify-center
            w-8
            h-8
            rounded-full
            bg-black/30
            backdrop-blur-sm
            text-gray-300
            opacity-0
            group-hover:opacity-100
            hover:bg-red-500/20
            hover:text-red-400
            transition-all
            duration-200
          "
        >
          <FiTrash2 size={15} strokeWidth={2.2} />
        </button>

      </div>

      {/* Bottom */}

      <div className="px-4 py-3 text-left">

        <h3
          className="
              text-white
              font-semibold
              truncate
              text-[15px]
              tracking-wide
            "
          >
          {project.filename}
        </h3>

        <p className="mt-2 text-sm text-gray-400">
          {date}
        </p>


      </div>
    </button>
  )
}