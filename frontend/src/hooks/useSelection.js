import { useEffect, useState } from 'react'

export function useSelection(fabricRef, ready) {
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!ready || !fabricRef.current) return
    const canvas = fabricRef.current

    const onCreated = (e) => setSelected(canvas.getActiveObject() ?? null)
    const onUpdated = (e) => setSelected(canvas.getActiveObject() ?? null)
    const onCleared = ()  => setSelected(null)

    canvas.on('selection:created', onCreated)
    canvas.on('selection:updated', onUpdated)
    canvas.on('selection:cleared',  onCleared)

    return () => {
      canvas.off('selection:created', onCreated)
      canvas.off('selection:updated', onUpdated)
      canvas.off('selection:cleared',  onCleared)
    }
  }, [ready])

  return { selected, setSelected }
}