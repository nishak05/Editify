import { useEffect, useState } from 'react'
import { fabric }       from 'fabric'
import { useCanvas }    from '../hooks/useCanvas'
import { useSelection } from '../hooks/useSelection'
import { useHistory }   from '../hooks/useHistory'
import { useSave }      from '../hooks/useSave'

import Toolbar         from '../components/editor/Toolbar'
import TextToolbar     from '../components/editor/TextToolbar'
import LayerPanel      from '../components/editor/LayerPanel'
import CanvasStage     from '../components/editor/CanvasStage'
import PropertiesPanel from '../components/editor/PropertiesPanel'

export default function CanvasEditor({ project, onBack, onLibrary}) {
  const { canvasRef, fabricRef, layers, setLayers, ready } = useCanvas(project)
  const { selected, setSelected }                          = useSelection(fabricRef, ready)
  const { pushSnapshot, undo, redo, canUndo, canRedo }     = useHistory(fabricRef, setLayers)
  const [groups, setGroups]       = useState(project?.groups ?? [])
  const [canvasVersion, setCanvasVersion] = useState(0)
  const bumpVersion = () => setCanvasVersion(v => v + 1)

  const { saveStatus, saveNow, triggerAutoSave } = useSave(fabricRef, project, layers, groups)

  // auto-save after meaningful edits
  useEffect(() => {
    if (!ready || !fabricRef.current) return
    const canvas = fabricRef.current

    const onModified = () => { pushSnapshot(); triggerAutoSave() }
    canvas.on('before:transform', pushSnapshot)
    canvas.on('object:modified',  onModified)

    return () => {
      canvas.off('before:transform', pushSnapshot)
      canvas.off('object:modified',  onModified)
    }
  }, [ready, pushSnapshot, triggerAutoSave])

  // also trigger auto-save when layers or groups change
  useEffect(() => {
    if (ready) triggerAutoSave()
  }, [layers, groups])

  const handleDelete = () => {
    if (!fabricRef.current) return
    const canvas = fabricRef.current
    const active = canvas.getActiveObject()
    if (!active) return

    pushSnapshot()

    if (active.type === 'activeSelection') {
      const members = [...active._objects]
      canvas.discardActiveObject()
      members.forEach(obj => {
        canvas.remove(obj)
        setLayers(prev => prev.filter(l => l.id !== obj.data?.layerId))
      })
    } else if (active.type === 'group') {
      const members = active.getObjects()
      canvas.remove(active)
      members.forEach(obj => {
        setLayers(prev => prev.filter(l => l.id !== obj.data?.layerId))
      })
      if (active.data?.groupId) {
        setGroups(prev => prev.filter(g => g.id !== active.data.groupId))
      }
    } else {
      const layerId = active.data?.layerId
      canvas.remove(active)
      setLayers(prev => prev.filter(l => l.id !== layerId))
    }

    canvas.discardActiveObject()
    canvas.renderAll()
    setSelected(null)
    triggerAutoSave()
  }

  const handleExport = () => {
    if (!fabricRef.current) return
    const url  = fabricRef.current.toDataURL({ format: 'png', quality: 1 })
    const link = document.createElement('a')
    link.download = `editify_${project.filename}`
    link.href     = url
    link.click()
  }

  const handleSelectGroup = (groupLayers) => {
    if (!fabricRef.current) return
    const canvas  = fabricRef.current
    const objects = canvas.getObjects().filter(obj =>
      groupLayers.some(l => l.id === obj.data?.layerId)
    )
    if (objects.length === 0) return
    if (objects.length === 1) {
      canvas.setActiveObject(objects[0])
    } else {
      const sel = new fabric.ActiveSelection(objects, { canvas })
      canvas.setActiveObject(sel)
    }
    canvas.renderAll()
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">

      <Toolbar
        onExport={handleExport}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onNewUpload={onBack}
        onOpenLibrary={onLibrary}
        saveStatus={saveStatus}
        onSaveNow={saveNow}
      />

      <TextToolbar
        selected={selected}
        fabricRef={fabricRef}
        onPropertyChange={() => { pushSnapshot(); bumpVersion(); triggerAutoSave() }}
      />

      <div className="flex flex-1 overflow-hidden">
        <LayerPanel
          layers={layers}
          groups={groups}
          selected={selected}
          fabricRef={fabricRef}
          onSelectGroup={handleSelectGroup}
          canvasVersion={canvasVersion}
          onBump={bumpVersion}
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
          onPropertyChange={() => { pushSnapshot(); bumpVersion(); triggerAutoSave() }}
          groups={groups}
          setGroups={setGroups}
          layers={layers}
          setLayers={setLayers}
          setSelected={setSelected}
          canvasVersion={canvasVersion}
        />
      </div>

    </div>
  )
}