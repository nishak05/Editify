import { useEffect, useState } from 'react'
import { fabric } from 'fabric'

export function useSelection(fabricRef, ready) {
  const [selectionMode, setSelectionMode] = useState('individual')
  const [selected, setSelected]           = useState(null)

  useEffect(() => {
    if (!ready || !fabricRef.current) return
    const canvas = fabricRef.current

    const onCreated = (e) => handleSelection(e.selected, canvas, selectionMode, setSelected)
    const onUpdated = (e) => handleSelection(e.selected, canvas, selectionMode, setSelected)
    const onCleared = ()  => setSelected(null)

    canvas.on('selection:created', onCreated)
    canvas.on('selection:updated', onUpdated)
    canvas.on('selection:cleared',  onCleared)

    return () => {
      canvas.off('selection:created', onCreated)
      canvas.off('selection:updated', onUpdated)
      canvas.off('selection:cleared',  onCleared)
    }
  }, [ready, selectionMode])

  // clear active selection when user switches modes so nothing lingers
  useEffect(() => {
    if (!fabricRef.current) return
    fabricRef.current.discardActiveObject()
    fabricRef.current.renderAll()
    setSelected(null)
  }, [selectionMode])

  return { selectionMode, setSelectionMode, selected, setSelected }
}


function handleSelection(selectedObjects, canvas, selectionMode, setSelected) {
  if (!selectedObjects || selectedObjects.length === 0) return

  const clicked = selectedObjects[0]

  if (clicked.data?.role === 'background') {
    canvas.discardActiveObject()
    canvas.renderAll()
    return
  }

  if (selectionMode === 'individual') {
    setSelected(clicked)
    return
  }

  // GROUP MODE — find all objects sharing the same group_id
  const groupId = clicked.data?.groupId
  if (!groupId) {
    setSelected(clicked)
    return
  }

  const groupMembers = canvas.getObjects().filter(
    obj => obj.data?.groupId === groupId && obj.data?.role !== 'background'
  )

  if (groupMembers.length <= 1) {
    setSelected(clicked)
    return
  }

  // ActiveSelection lets all members move and resize together
  // this is the same mechanism Fabric uses for shift+click multi-select
  const activeSelection = new fabric.ActiveSelection(groupMembers, { canvas })
  canvas.setActiveObject(activeSelection)
  canvas.renderAll()
  setSelected(activeSelection)
}