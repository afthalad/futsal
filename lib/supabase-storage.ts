import { supabase } from './supabase'

// Supabase Storage functions
export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from('ground-images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading image:', error)
      throw new Error('Failed to upload image')
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ground-images')
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error('Failed to upload image')
  }
}

// Server-side image upload
export const uploadImageServer = async (buffer: Buffer, path: string, contentType: string): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from('ground-images')
      .upload(path, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading image to server:', error)
      throw new Error('Failed to upload image')
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ground-images')
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Error uploading image to server:', error)
    throw new Error('Failed to upload image')
  }
}

// Delete image
export const deleteImage = async (path: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from('ground-images')
      .remove([path])

    if (error) {
      console.error('Error deleting image:', error)
      throw new Error('Failed to delete image')
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    throw new Error('Failed to delete image')
  }
}

// Generate unique filename
export const generateImagePath = (originalName: string, folder: string = 'grounds'): string => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split('.').pop()
  return `${folder}/${timestamp}_${randomString}.${extension}`
}
