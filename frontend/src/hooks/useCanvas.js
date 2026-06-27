import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'

const DEFAULT_FONT       = 'Arial'
const DEFAULT_TEXT_COLOR = '#000000'
const FONT_SIZE_RATIO    = 0.85

export function useCanvas(project) {
  const canvasRef           = useRef(null)
  const fabricRef           = useRef(null)
  const [layers, setLayers] = useState([])
  const [ready, setReady]   = useState(false)

  useEffect(() => {
    if (!project || !canvasRef.current) return

    const availableW = window.innerWidth  - 448 - 48
    const availableH = window.innerHeight - 48  - 48
    const scaleW     = (availableW * 0.90) / project.image_w
    const scaleH     = (availableH * 0.90) / project.image_h
    const scale      = Math.min(scaleW, scaleH)
    const dispW      = Math.round(project.image_w * scale)
    const dispH      = Math.round(project.image_h * scale)

    const canvas = new fabric.Canvas(canvasRef.current, {
      width:                  dispW,
      height:                 dispH,
      preserveObjectStacking: true,
    })
    fabricRef.current = canvas

    // if we have a saved canvas JSON, restore from it directly
    // this avoids rerunning any AI pipeline
    if (project._savedState) {
      try {
        const state = JSON.parse(project._savedState)
        if (state.canvas_json) {
          canvas.loadFromJSON(state.canvas_json, () => {
            restoreBackground(canvas)
            canvas.renderAll()
            const restoredLayers = extractLayersFromCanvas(canvas)
            setLayers(restoredLayers)
            setReady(true)
          })
          return () => { canvas.dispose(); fabricRef.current = null }
        }
      } catch (e) {
        console.error('Failed to restore saved state, loading fresh:', e)
      }
    }

    // normal path — load background then layers from pipeline output
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


function restoreBackground(canvas) {
  canvas.getObjects().forEach(obj => {
    if (obj.data?.role === 'background') {
      obj.set({ selectable: false, evented: false, hoverCursor: 'default' })
    }
  })
}


function extractLayersFromCanvas(canvas) {
  return canvas.getObjects()
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
      w:          Math.round(obj.width  * (obj.scaleX ?? 1)),
      h:          Math.round(obj.height * (obj.scaleY ?? 1)),
    }))
}


function renderObjectLayer(canvas, layer, scale, onLoaded) {
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
      onLoaded()
    }
  )
}


function renderTextLayer(canvas, layer, scale, onLoaded) {
  const canvasH  = layer.h * scale
  const fontSize = Math.max(8, Math.round(canvasH * FONT_SIZE_RATIO))

  const textObj = new fabric.IText(layer.text, {
    left:        Math.round(layer.x * scale),
    top:         Math.round(layer.y * scale),
    fontSize:    fontSize,
    fontFamily:  DEFAULT_FONT,
    fill:        DEFAULT_TEXT_COLOR,
    textAlign:   'left',
    selectable:  true,
    hasControls: true,
    hasBorders:  true,
    editable:    true,
    data: {
      layerId:   layer.id,
      type:      layer.type,
      label:     layer.text || `Text ${layer.id}`,
      groupId:   layer.group_id   ?? null,
      groupRole: layer.group_role ?? null,
    },
  })

  const actualHeight = textObj.getScaledHeight()
  const targetHeight = layer.h * scale
  if (actualHeight > targetHeight) {
    textObj.set('top', Math.round(layer.y * scale) - (actualHeight - targetHeight) * 0.5)
  }

  canvas.add(textObj)
  onLoaded()
}


function loadLayers(canvas, project, scale, setLayers, setReady) {
  const allLayers = []
  let loaded      = 0
  const total     = project.layers.length

  if (total === 0) {
    setReady(true)
    return
  }

  const onLoaded = (layer) => {
    allLayers.push(layer)
    loaded++
    if (loaded === total) {
      canvas.renderAll()
      setLayers([...allLayers])
      setReady(true)
    }
  }

  project.layers.forEach((layer) => {
    if (layer.type === 'text') {
      renderTextLayer(canvas, layer, scale, () => onLoaded(layer))
    } else {
      if (!layer.base64) {
        onLoaded(layer)
        return
      }
      renderObjectLayer(canvas, layer, scale, () => onLoaded(layer))
    }
  })
}