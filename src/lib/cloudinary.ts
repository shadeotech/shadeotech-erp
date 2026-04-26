import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  public_id: string
  secure_url: string
  format: string
  resource_type: string
}

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = 'care-maintenance',
  resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto'
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            format: result.format || '',
            resource_type: result.resource_type,
          })
        } else {
          reject(new Error('Upload failed: No result returned'))
        }
      }
    )

    // Convert buffer to stream
    const readable = new Readable()
    readable.push(buffer)
    readable.push(null)
    readable.pipe(uploadStream)
  })
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    throw error
  }
}

export { cloudinary }
