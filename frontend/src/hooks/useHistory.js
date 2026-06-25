import { useRef, useState, useCallback } from 'react'

export function useHistory(fabricRef, setLayers) {
  const undoStack   = useRef([])
  const redoStack   = useRef([])
  const isRestoring = useRef(false)

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const syncFlags = () => {
    setCanUndo(undoStack.current.length > 0)
    setCanRedo(redoStack.current.length > 0)
  }

  const pushSnapshot = useCallback(() => {
    if (!fabricRef.current || isRestoring.current) return
    const snapshot = JSON.stringify(fabricRef.current.toJSON(['data']))
    undoStack.current.push(snapshot)
    redoStack.current = []
    syncFlags()
  }, [fabricRef])

  const rebuildLayersFromCanvas = useCallback((canvas) => {
    const restoredLayers = canvas.getObjects()
      .filter(obj => obj.data?.layerId !== undefined)
      .map(obj => ({
        id:         obj.data.layerId,
        type:       obj.data.type,
        label:      obj.data.label,
        text:       obj.data.label,
        group_id:   obj.data.groupId   ?? null,
        group_role: obj.data.groupRole ?? null,
        x:          Math.round(obj.left),
        y:          Math.round(obj.top),
        w:          Math.round(obj.width  * obj.scaleX),
        h:          Math.round(obj.height * obj.scaleY),
      }))
    setLayers(restoredLayers)
  }, [setLayers])

  const undo = useCallback(() => {
    if (!fabricRef.current || undoStack.current.length === 0) return
    const canvas   = fabricRef.current
    const current  = JSON.stringify(canvas.toJSON(['data']))
    const previous = undoStack.current.pop()

    redoStack.current.push(current)
    isRestoring.current = true

    canvas.loadFromJSON(previous, () => {
      restoreBackground(canvas)
      canvas.renderAll()
      rebuildLayersFromCanvas(canvas)
      isRestoring.current = false
      syncFlags()
    })
  }, [fabricRef, rebuildLayersFromCanvas])

  const redo = useCallback(() => {
    if (!fabricRef.current || redoStack.current.length === 0) return
    const canvas  = fabricRef.current
    const current = JSON.stringify(canvas.toJSON(['data']))
    const next    = redoStack.current.pop()

    undoStack.current.push(current)
    isRestoring.current = true

    canvas.loadFromJSON(next, () => {
      restoreBackground(canvas)
      canvas.renderAll()
      rebuildLayersFromCanvas(canvas)
      isRestoring.current = false
      syncFlags()
    })
  }, [fabricRef, rebuildLayersFromCanvas])

  return { pushSnapshot, undo, redo, canUndo, canRedo }
}


function restoreBackground(canvas) {
  canvas.getObjects().forEach(obj => {
    if (obj.data?.role === 'background') {
      obj.set({ selectable: false, evented: false, hoverCursor: 'default' })
    }
  })
}