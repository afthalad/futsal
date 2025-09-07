'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Save, Trash2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import toast from 'react-hot-toast'

interface Ground {
  id: string
  name: string
  description: string | null
  location: string
  city: string
  phone: string
  email: string | null
  morningPrice: number
  eveningPrice: number
  openingTime: string
  closingTime: string
  amenities: string[]
  images: string[]
  ownerId: string
  isActive: boolean
}

export default function EditGroundPage() {
  const params = useParams()
  const router = useRouter()
  const [ground, setGround] = useState<Ground | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    city: '',
    phone: '',
    email: '',
    morningPrice: '',
    eveningPrice: '',
    openingTime: '06:00',
    closingTime: '22:00',
    amenities: [] as string[],
    images: [] as string[]
  })
  const [amenityInput, setAmenityInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchGround()
    }
  }, [params.id])

  const fetchGround = async () => {
    try {
      setFetching(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/grounds/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()

      if (response.ok) {
        setGround(data.ground)
        setFormData({
          name: data.ground.name || '',
          description: data.ground.description || '',
          location: data.ground.location || '',
          city: data.ground.city || '',
          phone: data.ground.phone || '',
          email: data.ground.email || '',
          morningPrice: data.ground.morningPrice?.toString() || '',
          eveningPrice: data.ground.eveningPrice?.toString() || '',
          openingTime: data.ground.openingTime || '06:00',
          closingTime: data.ground.closingTime || '22:00',
          amenities: data.ground.amenities || [],
          images: data.ground.images || []
        })
      } else {
        toast.error('Ground not found')
        router.push('/admin/dashboard')
      }
    } catch (error) {
      console.error('Error fetching ground:', error)
      toast.error('Failed to load ground details')
      router.push('/admin/dashboard')
    } finally {
      setFetching(false)
    }
  }

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setLoading(true)
      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          const formData = new FormData()
          formData.append('image', file)
          
          const token = localStorage.getItem('token')
          const response = await fetch('/api/upload/image', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          })
          
          if (response.ok) {
            const data = await response.json()
            return data.imageUrl
          }
          throw new Error('Upload failed')
        })

        const uploadedUrls = await Promise.all(uploadPromises)
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls]
        }))
        toast.success('Images uploaded successfully')
      } catch (error) {
        console.error('Error uploading images:', error)
        toast.error('Failed to upload images')
      } finally {
        setLoading(false)
      }
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
      const response = await fetch(`/api/grounds/${params.id}`, {
        method: 'PUT',
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
        toast.success('Ground updated successfully!')
        router.push('/admin/dashboard')
      } else {
        toast.error(data.error || 'Failed to update ground')
      }
    } catch (error) {
      console.error('Error updating ground:', error)
      toast.error('Failed to update ground. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ground? This action cannot be undone.')) {
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/grounds/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Ground deleted successfully!')
        router.push('/admin/dashboard')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete ground')
      }
    } catch (error) {
      console.error('Error deleting ground:', error)
      toast.error('Failed to delete ground. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!ground) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Ground not found</h1>
        </div>
      </div>
    )
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Ground</h1>
              <p className="text-gray-600">Update the details of your futsal ground</p>
            </div>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
              Delete Ground
            </button>
          </div>
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
                  <option value="Colombo">Colombo</option>
                  <option value="Gampaha">Gampaha</option>
                  <option value="Kalutara">Kalutara</option>
                  <option value="Kandy">Kandy</option>
                  <option value="Matale">Matale</option>
                  <option value="Nuwara Eliya">Nuwara Eliya</option>
                  <option value="Galle">Galle</option>
                  <option value="Matara">Matara</option>
                  <option value="Hambantota">Hambantota</option>
                  <option value="Jaffna">Jaffna</option>
                  <option value="Kilinochchi">Kilinochchi</option>
                  <option value="Mannar">Mannar</option>
                  <option value="Vavuniya">Vavuniya</option>
                  <option value="Mullaitivu">Mullaitivu</option>
                  <option value="Batticaloa">Batticaloa</option>
                  <option value="Ampara">Ampara</option>
                  <option value="Trincomalee">Trincomalee</option>
                  <option value="Kurunegala">Kurunegala</option>
                  <option value="Puttalam">Puttalam</option>
                  <option value="Anuradhapura">Anuradhapura</option>
                  <option value="Polonnaruwa">Polonnaruwa</option>
                  <option value="Badulla">Badulla</option>
                  <option value="Monaragala">Monaragala</option>
                  <option value="Ratnapura">Ratnapura</option>
                  <option value="Kegalle">Kegalle</option>
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
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter email address"
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
                <p className="text-xs text-gray-500 mt-1">6:00 AM - 12:00 PM</p>
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
                <p className="text-xs text-gray-500 mt-1">12:00 PM - 10:00 PM</p>
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
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Upload additional ground images</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="btn-outline cursor-pointer"
              >
                Choose Images
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary px-6 py-2"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2 px-6 py-2"
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              {loading ? 'Updating...' : 'Update Ground'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
