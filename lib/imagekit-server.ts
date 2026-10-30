import 'server-only'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export type ImageKitConfig = {
  privateKey: string
  urlEndpoint: string
}

export async function getImageKitConfig(): Promise<ImageKitConfig> {
  const { env } = await getCloudflareContext({ async: true })
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || env.IMAGEKIT_URL_ENDPOINT
  if (!privateKey || !urlEndpoint) {
    throw new Error('ImageKit is not configured. Set IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT.')
  }
  return { privateKey, urlEndpoint }
}

function authorizationHeader(config: ImageKitConfig) {
  return `Basic ${btoa(`${config.privateKey}:`)}`
}

export async function uploadImageKitFile(file: File, fileName: string, folder: string, config: ImageKitConfig) {
  const formData = new FormData()
  formData.set('file', file)
  formData.set('fileName', fileName)
  formData.set('folder', folder)

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: { Authorization: authorizationHeader(config) },
    body: formData,
  })
  if (!response.ok) throw new Error(`ImageKit upload failed (HTTP ${response.status}).`)

  const result: unknown = await response.json()
  if (!result || typeof result !== 'object' || !('fileId' in result) || typeof result.fileId !== 'string' || !('url' in result) || typeof result.url !== 'string') {
    throw new Error('ImageKit returned an invalid upload response.')
  }
  return { fileId: result.fileId, url: result.url }
}

export async function deleteImageKitFile(fileId: string, config: ImageKitConfig) {
  const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: authorizationHeader(config) },
  })
  if (!response.ok) throw new Error(`ImageKit file deletion failed (HTTP ${response.status}).`)
}
