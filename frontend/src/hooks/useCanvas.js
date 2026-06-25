import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'

export function useCanvas(project) {
  const canvasRef           = useRef(null)
  const fabricRef           = useRef(null)
  const [layers, setLayers] = useState([])
  const [ready, setReady]   = useState(false)

  useEffect(() => {
    if (!project || !canvasRef.current) return

    // available space after both sidebars (2 × 224px) and padding
    const availableW = window.innerWidth  - 448 - 48
    const availableH = window.innerHeight - 48  - 48

    // scale to fill 90% of available space, preserving aspect ratio
    const scaleW = (availableW * 0.90) / project.image_w
    const scaleH = (availableH * 0.90) / project.image_h
    const scale  = Math.min(scaleW, scaleH)

    const dispW = Math.round(project.image_w * scale)
    const dispH = Math.round(project.image_h * scale)

    const canvas = new fabric.Canvas(canvasRef.current, {
      width:                  dispW,
      height:                 dispH,
      preserveObjectStacking: true,
    })
    fabricRef.current = canvas

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
          data:        { role: 'background' },
        })
        canvas.add(bgImg)
        canvas.sendToBack(bgImg)
        loadLayers(canvas, project, scale, setLayers, setReady)
      }
    )

    return () => {
      canvas.dispose()
      fabricRef.current = null
    }
  }, [project])

  return { canvasRef, fabricRef, layers, setLayers, ready }
}


function loadLayers(canvas, project, scale, setLayers, setReady) {
  const allLayers = []
  let loaded      = 0
  const total     = project.layers.filter(l => l.base64).length

  if (total === 0) {
    setReady(true)
    return
  }

  project.layers.forEach((layer) => {
    if (!layer.base64) {
      loaded++
      return
    }

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
            layerId:   layer.id,
            type:      layer.type,
            label:     layer.label || layer.text || `Layer ${layer.id}`,
            groupId:   layer.group_id   ?? null,
            groupRole: layer.group_role ?? null,
          },
        })

        canvas.add(img)
        allLayers.push(layer)
        loaded++

        if (loaded === project.layers.length) {
          canvas.renderAll()
          setLayers([...allLayers])
          setReady(true)
        }
      }
    )
  })
}