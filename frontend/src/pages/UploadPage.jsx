import { useState, useRef } from 'react'
import axios from 'axios'

import HomeLayout from "../components/home/HomeLayout";
import Hero from "../components/home/Hero";
import UploadCard from "../components/home/UploadCard";
import RecentFiles from "../components/home/RecentFiles";
import HelpDialog from "../components/common/HelpDialog";

const API = import.meta.env.VITE_API_URL

export default function UploadPage({ onSuccess, onHistory, onOpenProject, onAccount, onHelp,}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep]     = useState('')
  const [error, setError]   = useState('')
  const fileInputRef        = useRef(null)
  const [helpOpen, setHelpOpen] = useState(false);

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
    <>
      <HomeLayout 
        onLibrary={onHistory} 
        onAccount={onAccount} 
        onHelp={() => setHelpOpen(true)}>

        <div className="h-full flex flex-col px-12 pt-2 pb-4">

          <Hero />

          <div className="mt-2 flex flex-col items-center">

            <div className="mt-2 w-full flex justify-center">
              <UploadCard
                isDragging={isDragging}
                isLoading={isLoading}
                error={error}
                step={step}
                fileInputRef={fileInputRef}
                handleFile={handleFile}
                onDrop={onDrop}
                setIsDragging={setIsDragging}
              />
            </div>

            <div className="mt-2 w-full max-w-7xl mx-auto">
              <RecentFiles 
                  onOpen={onOpenProject}
                  onViewAll={onHistory}
              />

            </div>

          </div>

        </div>

      </HomeLayout>
      
      <HelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />

    </>
  )
}