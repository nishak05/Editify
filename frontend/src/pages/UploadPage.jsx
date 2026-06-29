import { useState, useRef } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function UploadPage({ onSuccess, onHistory}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep]     = useState('')
  const [error, setError]   = useState('')
  const fileInputRef        = useRef(null)

  const steps = [
    'Uploading image...',
    'Detecting objects...',
    'Reading text...',
    'Building layers...',
    'Almost done...',
  ]

  const handleFile = async (file) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, WEBP images allowed')
      return
    }

    setError('')
    setIsLoading(true)

    // cycle through step messages while waiting
    let stepIndex = 0
    setStep(steps[0])
    const stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length
      setStep(steps[stepIndex])
    }, 2000)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 min timeout — pipeline takes ~10-30s
      })

      clearInterval(stepInterval)
      onSuccess(response.data)
    } catch (err) {
      clearInterval(stepInterval)
      setError(err.response?.data?.detail || 'Upload failed. Is the backend running?')
    } finally {
      setIsLoading(false)
      setStep('')
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <h1 className="text-3xl font-bold mb-2">Upload a poster</h1>
      <p className="text-gray-400 mb-8 text-center">
        Drop any poster, banner, or flyer — we'll break it into editable layers
      </p>

      {!isLoading ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current.click()}
          className={`w-full max-w-lg h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition
            ${isDragging ? 'border-blue-400 bg-blue-950' : 'border-gray-600 hover:border-gray-400 bg-gray-900'}`}
        >
          <div className="text-5xl mb-4">🖼️</div>
          <p className="text-gray-300 font-medium">Drag & drop your image here</p>
          <p className="text-gray-500 text-sm mt-1">or click to browse</p>
          <p className="text-gray-600 text-xs mt-3">JPEG, PNG, WEBP supported</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="w-full max-w-lg h-64 border-2 border-blue-500 rounded-xl flex flex-col items-center justify-center bg-gray-900">
          <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-blue-300 font-medium">{step}</p>
          <p className="text-gray-500 text-sm mt-2">This takes 10–30 seconds</p>
        </div>
      )}

      {error && (
        <div className="mt-4 px-4 py-3 bg-red-950 border border-red-700 rounded-lg text-red-300 text-sm max-w-lg w-full">
          {error}
        </div>
      )}
    </div>
  )
}