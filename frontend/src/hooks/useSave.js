import { useRef, useState, useCallback } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL
const DEBOUNCE_MS = 2000

export function useSave(fabricRef, project, layers, groups) {
  const [saveStatus, setSaveStatus]   = useState('saved')
  const debounceTimer                 = useRef(null)
  const lastSavedRef                  = useRef(null)

  const saveNow = useCallback(async () => {
    if (!fabricRef.current || !project?.file_id) return

    setSaveStatus('saving')

    try {
      const canvasJson   = JSON.stringify(fabricRef.current.toJSON(['data']))
      const thumbnailB64 = fabricRef.current.toDataURL({ format: 'png', quality: 0.7 })
        .replace('data:image/png;base64,', '')

      const savedState = JSON.stringify({
        canvas_json:  canvasJson,
        layers:       layers,
        groups:       groups,
        image_w:      project.image_w,
        image_h:      project.image_h,
        filename:     project.filename,
        background_base64: project.background_base64,
      })

      await axios.post(`${API}/projects/${project.file_id}/save`, {
        saved_state:   savedState,
        thumbnail_b64: thumbnailB64,
        layer_count:   layers.length,
      })

      lastSavedRef.current = savedState
      setSaveStatus('saved')

      // store last opened project id for refresh persistence
      localStorage.setItem('editify_last_project', project.file_id)

    } catch (err) {
      console.error('Save failed:', err)
      setSaveStatus('error')
    }
  }, [fabricRef, project, layers, groups])

  // call this after every meaningful edit
  const triggerAutoSave = useCallback(() => {
    setSaveStatus('unsaved')
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      saveNow()
    }, DEBOUNCE_MS)
  }, [saveNow])

  return { saveStatus, saveNow, triggerAutoSave }
}