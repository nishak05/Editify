import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function CanvasEditor({ project, onBack }) {
  const canvasRef             = useRef(null)
  const fabricRef             = useRef(null)
  const [layers, setLayers]   = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError]     = useState('')
  

  useEffect(() => {
    if (!project || !canvasRef.current) return

    const maxW  = Math.min(project.image_w, window.innerWidth - 320)
    const scale = maxW / project.image_w
    const dispW = Math.round(project.image_w * scale)
    const dispH = Math.round(project.image_h * scale)

    const canvas = new fabric.Canvas(canvasRef.current, {
      width:                  dispW,
      height:                 dispH,
      preserveObjectStacking: true,
    })
    fabricRef.current = canvas

    // load CLEAN background — no elements baked in
    fabric.Image.fromURL(
      `data:image/jpeg;base64,${project.background_base64}`,
      (bgImg) => {
        bgImg.set({
          left:        0,
          top:         0,
          scaleX:      dispW / project.image_w,
          scaleY:      dispH / project.image_h,
          selectable:  false,
          evented:     false,
          hoverCursor: 'default',
        })
        canvas.add(bgImg)
        canvas.sendToBack(bgImg)

        // load each element as independent transparent PNG
        let loaded    = 0
        const allLayers = []

        project.layers.forEach((layer) => {
          if (!layer.base64) { loaded++; return }

          const mime = layer.format === 'png' ? 'image/png' : 'image/jpeg'
          fabric.Image.fromURL(
            `data:${mime};base64,${layer.base64}`,
            (img) => {
              img.set({
                left:        Math.round(layer.x * scale),
                top:         Math.round(layer.y * scale),
                scaleX:      (layer.w / img.width)  * scale,
                scaleY:      (layer.h / img.height) * scale,
                selectable:  true,
                hasControls: true,
                hasBorders:  true,
                opacity:     1,
                data: {
                  layerId: layer.id,
                  type:    layer.type,
                  label:   layer.label || layer.text,
                }
              })

              canvas.add(img)
              allLayers.push(layer)
              loaded++

              if (loaded === project.layers.length) {
                canvas.renderAll()
                setLayers([...allLayers])
              }
            }
          )
        })
      }
    )

    canvas.on('selection:created', (e) => setSelected(e.selected[0]))
    canvas.on('selection:updated', (e) => setSelected(e.selected[0]))
    canvas.on('selection:cleared',  ()  => setSelected(null))

    return () => canvas.dispose()
  }, [project])

  const handleDelete = () => {
    // delete is now instant — background is already clean
    if (!selected || !fabricRef.current) return
    const canvas  = fabricRef.current
    const layerId = selected.data?.layerId

    canvas.remove(selected)
    canvas.discardActiveObject()
    canvas.renderAll()
    setSelected(null)
    setLayers(prev => prev.filter(l => l.id !== layerId))
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
    <div className="flex h-[calc(100vh-57px)]">

      <div className="flex-1 flex items-center justify-center bg-gray-950 overflow-auto p-4">
        <canvas ref={canvasRef} className="rounded-lg shadow-2xl" />
      </div>

      <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col">

        <div className="p-4 border-b border-gray-800">
          <div className="text-sm font-medium text-white truncate">{project?.filename}</div>
          <div className="text-xs text-gray-500 mt-0.5">{layers.length} layers</div>
        </div>

        {selected && (
          <div className="p-4 border-b border-gray-800">
            <div className="text-xs text-gray-400 mb-1">Selected</div>
            <div className="text-sm text-white mb-3 truncate">
              {selected.data?.label || selected.data?.type}
            </div>
            <button
              onClick={handleDelete}
              className="w-full py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm text-white transition"
            >
              Delete element
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Layers</div>
          {layers.map(layer => (
            <div
              key={layer.id}
              className="flex items-center gap-2 py-2 px-3 rounded-lg mb-1 hover:bg-gray-800 transition"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${layer.type === 'text' ? 'bg-blue-400' : 'bg-green-400'}`} />
              <span className="text-xs text-gray-300 truncate">
                {layer.type === 'text' ? layer.text : layer.label}
              </span>
              <span className="text-xs text-gray-600 ml-auto">{layer.type}</span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800 flex flex-col gap-2">
          {error && <div className="text-xs text-red-400 mb-1">{error}</div>}
          <button
            onClick={handleExport}
            className="w-full py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm text-white transition"
          >
            Export PNG
          </button>
          <button
            onClick={onBack}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition"
          >
            ← New upload
          </button>
        </div>

      </div>
    </div>
  )
}