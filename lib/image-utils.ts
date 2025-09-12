/**
 * Image utility functions for compression and WebP conversion
 */

export interface ImageCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
}

/**
 * Compress and convert image to WebP format
 */
export const compressAndConvertToWebP = async (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'webp'
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Draw image on canvas with new dimensions
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob with specified format and quality
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }

          // Create new file with WebP extension
          const fileName = file.name.replace(/\.[^/.]+$/, `.${format}`)
          const compressedFile = new File([blob], fileName, {
            type: `image/${format}`,
            lastModified: Date.now()
          })

          resolve(compressedFile)
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Load the image
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Get file size in human readable format
 */
export const getFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate image file
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' }
  }

  // Check file size (max 10MB before compression)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' }
  }

  // Check supported formats
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!supportedTypes.includes(file.type)) {
    return { valid: false, error: 'Unsupported image format. Please use JPEG, PNG, or WebP' }
  }

  return { valid: true }
}

/**
 * Create a preview URL for the image
 */
export const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file)
}

/**
 * Clean up preview URL to prevent memory leaks
 */
export const revokeImagePreview = (url: string): void => {
  URL.revokeObjectURL(url)
}
