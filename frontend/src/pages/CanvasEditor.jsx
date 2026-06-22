export default function CanvasEditor({ project, onBack }) {
  return (
    <div className="flex items-center justify-center min-h-[80vh] flex-col gap-4">
      <p className="text-gray-400 text-lg">Canvas editor</p>
      <p className="text-gray-600 text-sm">
        Project: {project?.filename} — {project?.layers?.length} layers detected
      </p>
      <button
        onClick={onBack}
        className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition"
      >
        ← Back to upload
      </button>
    </div>
  )
}