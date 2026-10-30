import 'server-only'

function getPrivateKey() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  if (!privateKey) throw new Error('ImageKit is not configured. Set IMAGEKIT_PRIVATE_KEY.')
  return privateKey
}

function authorizationHeader() {
  return `Basic ${btoa(`${getPrivateKey()}:`)}`
}

export async function uploadImageKitFile(file: File, fileName: string, folder: string) {
  const formData = new FormData()
  formData.set('file', file)
  formData.set('fileName', fileName)
  formData.set('folder', folder)

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: { Authorization: authorizationHeader() },
    body: formData,
  })
  if (!response.ok) throw new Error(`ImageKit upload failed (HTTP ${response.status}).`)

  const result: unknown = await response.json()
  if (!result || typeof result !== 'object' || !('fileId' in result) || typeof result.fileId !== 'string' || !('url' in result) || typeof result.url !== 'string') {
    throw new Error('ImageKit returned an invalid upload response.')
  }
  return { fileId: result.fileId, url: result.url }
}

export async function deleteImageKitFile(fileId: string) {
  const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: authorizationHeader() },
  })
  if (!response.ok) throw new Error(`ImageKit file deletion failed (HTTP ${response.status}).`)
}
