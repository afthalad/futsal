import { storage } from './firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

// Firebase Storage functions
export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error('Failed to upload image')
  }
}

// Server-side image upload
export const uploadImageServer = async (buffer: Buffer, path: string, contentType: string): Promise<string> => {
  try {
    const { adminStorage } = await import('./firebase-admin')
    const bucket = adminStorage.bucket()
    const file = bucket.file(path)
    
    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=3600'
      }
    })
    
    // Make the file publicly accessible
    await file.makePublic()
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`
    return publicUrl
  } catch (error) {
    console.error('Error uploading image to server:', error)
    throw new Error('Failed to upload image')
  }
}

// Delete image
export const deleteImage = async (path: string): Promise<void> => {
  try {
    const imageRef = ref(storage, path)
    await deleteObject(imageRef)
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