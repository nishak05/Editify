import { useEffect } from 'react'

export default function CanvasStage({ canvasRef, onDelete, onUndo, onRedo }) {

  useEffect(() => {
    const handleKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        onDelete?.()
        return
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); onUndo?.() }
        if (e.key === 'y')                { e.preventDefault(); onRedo?.() }
        if (e.key === 'z' &&  e.shiftKey) { e.preventDefault(); onRedo?.() }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onDelete, onUndo, onRedo])

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-950 overflow-auto p-6">
      <div className="shadow-2xl rounded-lg overflow-hidden ring-1 ring-gray-800">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}