import { useEffect } from 'react'
import { useCanvas }    from '../hooks/useCanvas'
import { useSelection } from '../hooks/useSelection'
import { useHistory }   from '../hooks/useHistory'

import Toolbar         from '../components/editor/Toolbar'
import LayerPanel      from '../components/editor/LayerPanel'
import CanvasStage     from '../components/editor/CanvasStage'
import PropertiesPanel from '../components/editor/PropertiesPanel'

export default function CanvasEditor({ project, onBack }) {
  const { canvasRef, fabricRef, layers, setLayers, ready } = useCanvas(project)
  const { selectionMode, setSelectionMode, selected, setSelected } = useSelection(fabricRef, ready)
  const { pushSnapshot, undo, redo, canUndo, canRedo } = useHistory(fabricRef, setLayers)
  
  // push a snapshot after any move or resize so those actions are undoable
  useEffect(() => {
    if (!ready || !fabricRef.current) return
    const canvas = fabricRef.current

    canvas.on('before:transform', pushSnapshot)
    return () => canvas.off('before:transform', pushSnapshot)
  }, [ready, pushSnapshot])

  const handleDelete = () => {
    if (!selected || !fabricRef.current) return
    const canvas = fabricRef.current

    pushSnapshot()

    if (selected.type === 'activeSelection') {
      const members = [...selected._objects]
      canvas.discardActiveObject()
      members.forEach(obj => {
        canvas.remove(obj)
        setLayers(prev => prev.filter(l => l.id !== obj.data?.layerId))
      })
    } else {
      const layerId = selected.data?.layerId
      canvas.remove(selected)
      setLayers(prev => prev.filter(l => l.id !== layerId))
    }

    canvas.discardActiveObject()
    canvas.renderAll()
    setSelected(null)
  }

  const handleExport = () => {
    if (!fabricRef.current) return
    const url  = fabricRef.current.toDataURL({ format: 'png', quality: 1 })
    const link = document.createElement('a')
    link.download = `editify_${project.filename}`
    link.href     = url
    link.click()
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">

      <Toolbar
        selectionMode={selectionMode}
        setSelectionMode={setSelectionMode}
        onExport={handleExport}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <div className="flex flex-1 overflow-hidden">
        <LayerPanel
          layers={layers}
          groups={project?.groups ?? []}
          selected={selected}
        />

        <CanvasStage
          canvasRef={canvasRef}
          onDelete={handleDelete}
          onUndo={undo}
          onRedo={redo}
        />

        <PropertiesPanel
          selected={selected}
          fabricRef={fabricRef}
          onDelete={handleDelete}
          onPropertyChange={pushSnapshot}
        />
      </div>

    </div>
  )
}