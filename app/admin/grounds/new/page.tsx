'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Camera, Plus } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PhotoSelectionModal from '@/components/PhotoSelectionModal'
import UploadProgressBar from '@/components/UploadProgressBar'
import { compressAndConvertToWebP, validateImageFile, getFileSize } from '@/lib/image-utils'
import toast from 'react-hot-toast'

export default function NewGroundPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    city: '',
    phone: '',
    secondaryPhone: '',
    morningPrice: '',
    eveningPrice: '',
    openingTime: '06:00',
    closingTime: '22:00',
    amenities: [] as string[],
    images: [] as string[]
  })
  const [amenityInput, setAmenityInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadMessage, setUploadMessage] = useState('')
  const [showProgressBar, setShowProgressBar] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }))
      setAmenityInput('')
    }
  }

  const handleRemoveAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }))
  }

  const handlePhotoTaken = async (file: File) => {
    await processAndUploadImage(file)
  }

  const handleFileSelected = async (file: File) => {
    await processAndUploadImage(file)
  }

  const processAndUploadImage = async (file: File) => {
    setUploadingImages(true)
    setShowProgressBar(true)
    setUploadProgress(0)
    
    try {
      // Validate file
      const validation = validateImageFile(file)
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file')
        return
      }

      // Show file size info
      const originalSize = getFileSize(file.size)
      setUploadMessage(`Processing image (${originalSize})...`)
      setUploadProgress(20)

      // Compress and convert to WebP
      const compressedFile = await compressAndConvertToWebP(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8
      })

      const compressedSize = getFileSize(compressedFile.size)
      setUploadMessage(`Uploading compressed image (${compressedSize})...`)
      setUploadProgress(60)

      // Upload to server
      const formData = new FormData()
      formData.append('image', compressedFile)
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      setUploadProgress(90)
      
      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, data.imageUrl]
        }))
        setUploadMessage('Upload completed!')
        setUploadProgress(100)
        toast.success(`Image uploaded successfully! (${originalSize} → ${compressedSize})`)
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      toast.error('Failed to upload image')
      setShowProgressBar(false)
    } finally {
      setUploadingImages(false)
      setShowPhotoModal(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.location || !formData.city || !formData.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!formData.morningPrice || !formData.eveningPrice) {
      toast.error('Please enter both morning and evening prices')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/grounds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          morningPrice: parseFloat(formData.morningPrice),
          eveningPrice: parseFloat(formData.eveningPrice)
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Ground submitted for review! You will be notified once it\'s approved.')
        router.push('/admin/dashboard')
      } else {
        toast.error(data.error || 'Failed to add ground')
      }
    } catch (error) {
      console.error('Error adding ground:', error)
      toast.error('Failed to add ground. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Ground</h1>
          <p className="text-gray-600">Fill in the details of your futsal ground</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Ground Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter ground name"
                  required
                />
              </div>

              <div>
                <label className="label">City *</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  <option value="">Select City</option>
                  <option value="Puttalam">Puttalam</option>
                  
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="label">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter full address"
                  required
                />
              </div>

              <div>
                <label className="label">Contact Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label className="label">Secondary Phone</label>
                <input
                  type="tel"
                  name="secondaryPhone"
                  value={formData.secondaryPhone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter secondary phone number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-field"
                  placeholder="Describe your ground facilities and features"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Morning Price (LKR) *</label>
                <input
                  type="number"
                  name="morningPrice"
                  value={formData.morningPrice}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter morning price"
                  min="0"
                  step="100"
                  required
                />
                 <p className="text-xs text-gray-500 mt-1">12:00 AM - 5:00 PM</p>
              </div>

              <div>
                <label className="label">Evening Price (LKR) *</label>
                <input
                  type="number"
                  name="eveningPrice"
                  value={formData.eveningPrice}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter evening price"
                  min="0"
                  step="100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">5:00 PM - 12:00 AM</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Opening Time</label>
                <input
                  type="time"
                  name="openingTime"
                  value={formData.openingTime}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Closing Time</label>
                <input
                  type="time"
                  name="closingTime"
                  value={formData.closingTime}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full flex items-center"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => handleRemoveAmenity(amenity)}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                className="input-field flex-1"
                placeholder="Add amenity (e.g., Parking, Changing Room, Water)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
              />
              <button
                type="button"
                onClick={handleAddAmenity}
                className="btn-secondary"
              >
                Add
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Ground ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="btn-primary flex items-center gap-2"
                  disabled={uploadingImages}
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                </button>
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="btn-outline flex items-center gap-2"
                  disabled={uploadingImages}
                >
                  <Upload className="h-4 w-4" />
                  Upload from Gallery
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Images will be automatically compressed and converted to WebP format
              </p>
              {uploadingImages && (
                <div className="mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-xs text-gray-600 mt-1">Processing image...</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Adding Ground...' : 'Add Ground'}
            </button>
          </div>
        </form>
      </div>

      {/* Photo Selection Modal */}
      <PhotoSelectionModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onPhotoTaken={handlePhotoTaken}
        onFileSelected={handleFileSelected}
      />

      {/* Upload Progress Bar */}
      <UploadProgressBar
        isVisible={showProgressBar}
        progress={uploadProgress}
        message={uploadMessage}
        onComplete={() => setShowProgressBar(false)}
      />
    </div>
  )
}
