'use client'

type UploadOptions =
  | { purpose: 'prompt'; promptId: string }
  | { purpose: 'branding'; asset: 'logo' | 'favicon' }

type ImageKitUpload = { fileId: string; url: string }

function isImageKitUpload(value: unknown): value is ImageKitUpload {
  return Boolean(value && typeof value === 'object'
    && 'fileId' in value && typeof value.fileId === 'string'
    && 'url' in value && typeof value.url === 'string')
}

export async function uploadImageToImageKit(file: File, options: UploadOptions) {
  const formData = new FormData()
  formData.set('file', file)
  formData.set('purpose', options.purpose)
  if (options.purpose === 'prompt') formData.set('promptId', options.promptId)
  else formData.set('asset', options.asset)

  const response = await fetch('/api/admin/imagekit/', { method: 'POST', body: formData })
  const result: unknown = await response.json()
  if (!response.ok) {
    const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
      ? result.error
      : `Image upload failed (HTTP ${response.status}).`
    throw new Error(message)
  }
  if (!isImageKitUpload(result)) throw new Error('ImageKit returned an invalid upload response.')
  return result
}

export async function deleteImageKitUpload(fileId: string) {
  const response = await fetch('/api/admin/imagekit/', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId }),
  })
  if (!response.ok) {
    const result: unknown = await response.json()
    const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
      ? result.error
      : `ImageKit cleanup failed (HTTP ${response.status}).`
    throw new Error(message)
  }
}
