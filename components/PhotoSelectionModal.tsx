'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PhotoSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onPhotoTaken: (file: File) => void
  onFileSelected: (file: File) => void
}

export default function PhotoSelectionModal({ 
  isOpen, 
  onClose, 
  onPhotoTaken, 
  onFileSelected 
}: PhotoSelectionModalProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = async () => {
    try {
      setIsCapturing(true)
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera on mobile
        } 
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
      setIsCapturing(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCapturing(false)
    setCapturedImage(null)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        // Set canvas size to video size
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
            setCapturedImage(URL.createObjectURL(blob))
            onPhotoTaken(file)
            stopCamera()
          }
        }, 'image/jpeg', 0.9)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelected(file)
      onClose()
    }
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Add Ground Photo</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isCapturing ? (
            <div className="space-y-3">
              <Button
                onClick={startCamera}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Camera className="h-5 w-5 mr-2" />
                Take Photo
              </Button>
              
              <div className="relative">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload from Gallery
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={capturePhoto}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Capture
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {capturedImage && (
            <div className="mt-4">
              <p className="text-sm text-green-600 mb-2">Photo captured successfully!</p>
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
