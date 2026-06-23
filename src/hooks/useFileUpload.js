import { useState, useCallback } from 'react'
import { supabase } from '@/config/supabase'

const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'zip']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  const validateFile = useCallback((file) => {
    const extension = file.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error(`File type .${extension} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`)
    }
    if (file.size > MAX_SIZE) {
      throw new Error(`File too large. Maximum size: 10MB`)
    }
    return true
  }, [])

  const uploadFile = useCallback(async (file, bucket = 'attachments') => {
    setUploading(true)
    setError(null)
    setProgress(0)
    try {
      validateFile(file)

      const extension = file.name.split('.').pop().toLowerCase()
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`
      const filePath = `uploads/${uniqueName}`

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      setProgress(100)
      return urlData.publicUrl
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setUploading(false)
    }
  }, [validateFile])

  const deleteFile = useCallback(async (url, bucket = 'attachments') => {
    try {
      const path = url.split(`${bucket}/`)[1]
      if (!path) return

      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (deleteError) throw deleteError
    } catch (err) {
      console.error('Delete file error:', err)
    }
  }, [])

  return {
    uploading,
    error,
    progress,
    uploadFile,
    deleteFile,
    validateFile,
    ALLOWED_EXTENSIONS,
    MAX_SIZE,
  }
}
