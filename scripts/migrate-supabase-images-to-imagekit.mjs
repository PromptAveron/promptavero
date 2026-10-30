import { createClient } from '@supabase/supabase-js'
import { basename } from 'node:path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const imageKitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY
if (!supabaseUrl || !serviceRoleKey || !imageKitPrivateKey) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and IMAGEKIT_PRIVATE_KEY before migrating images.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const supabaseOrigin = new URL(supabaseUrl).origin
const imageKitAuthorization = `Basic ${Buffer.from(`${imageKitPrivateKey}:`).toString('base64')}`
const uploads = new Map()
const oldObjects = new Map()
const buckets = new Set(['prompt-images', 'site-assets'])

function parseSupabaseStorageUrl(value) {
  if (typeof value !== 'string') return null
  let url
  try {
    url = new URL(value)
  } catch {
    return null
  }
  const prefix = '/storage/v1/object/public/'
  if (url.origin !== supabaseOrigin || !url.pathname.startsWith(prefix)) return null
  const [bucket, ...path] = url.pathname.slice(prefix.length).split('/')
  if (!bucket || !path.length) return null
  return {
    bucket: decodeURIComponent(bucket),
    path: path.map((segment) => decodeURIComponent(segment)).join('/'),
  }
}

async function uploadToImageKit(blob, fileName, bucket, path) {
  const formData = new FormData()
  formData.set('file', blob, fileName)
  formData.set('fileName', fileName)
  formData.set('folder', `/migrated/${bucket}`)
  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: { Authorization: imageKitAuthorization },
    body: formData,
  })
  if (!response.ok) throw new Error(`ImageKit upload failed for ${bucket}/${path} (HTTP ${response.status}).`)
  const result = await response.json()
  if (typeof result.fileId !== 'string' || typeof result.url !== 'string') {
    throw new Error(`ImageKit returned an invalid response for ${bucket}/${path}.`)
  }
  return { fileId: result.fileId, url: result.url }
}

async function migrateObject(bucket, path, mimeType) {
  const key = `${bucket}/${path}`
  oldObjects.set(key, { bucket, path })
  if (!uploads.has(key)) {
    const { data: file, error } = await supabase.storage.from(bucket).download(path)
    if (error) throw new Error(`Could not download ${key} from Supabase Storage: ${error.message}`)
    if (!file) throw new Error(`Supabase Storage returned no file for ${key}.`)
    const content = new Blob([await file.arrayBuffer()], { type: file.type || mimeType || 'application/octet-stream' })
    uploads.set(key, await uploadToImageKit(content, basename(path), bucket, path))
    console.info(`Uploaded ${key} to ImageKit`)
  }
  return uploads.get(key)
}

async function migrateUrl(value) {
  const location = parseSupabaseStorageUrl(value)
  if (!location) return value
  if (!buckets.has(location.bucket)) throw new Error(`Unexpected Supabase Storage bucket "${location.bucket}" in ${value}.`)
  return (await migrateObject(location.bucket, location.path)).url
}

async function migratePromptImages() {
  const { data: images, error } = await supabase
    .from('prompt_images')
    .select('id,image_url,imagekit_file_id,mime_type')
    .is('imagekit_file_id', null)
  if (error) throw new Error(`Could not load legacy prompt images: ${error.message}`)
  for (const image of images ?? []) {
    const location = parseSupabaseStorageUrl(image.image_url) ?? {
      bucket: 'prompt-images',
      path: image.image_url,
    }
    if (!buckets.has(location.bucket)) throw new Error(`Unexpected storage bucket for prompt image ${image.id}.`)
    const uploaded = await migrateObject(location.bucket, location.path, image.mime_type)
    const { error: updateError } = await supabase.from('prompt_images')
      .update({ image_url: uploaded.url, imagekit_file_id: uploaded.fileId })
      .eq('id', image.id)
    if (updateError) throw new Error(`Could not update prompt image ${image.id}: ${updateError.message}`)
  }
  console.info(`Migrated ${images?.length ?? 0} prompt image(s).`)
}

async function migrateUrlColumn(table, column) {
  const { data: rows, error } = await supabase.from(table).select(`id,${column}`).not(column, 'is', null)
  if (error) throw new Error(`Could not load ${table}.${column} image URLs: ${error.message}`)
  let count = 0
  for (const row of rows ?? []) {
    const oldUrl = row[column]
    const newUrl = await migrateUrl(oldUrl)
    if (newUrl === oldUrl) continue
    const { error: updateError } = await supabase.from(table).update({ [column]: newUrl }).eq('id', row.id)
    if (updateError) throw new Error(`Could not update ${table}.${column} for ${row.id}: ${updateError.message}`)
    count += 1
  }
  console.info(`Migrated ${count} ${table}.${column} URL(s).`)
}

async function migrateSettingsImages(key, fields) {
  const { data: row, error } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle()
  if (error) throw new Error(`Could not load ${key} settings: ${error.message}`)
  if (!row?.value || typeof row.value !== 'object' || Array.isArray(row.value)) return

  const value = { ...row.value }
  let changed = false
  for (const field of fields) {
    const oldUrl = value[field]
    if (typeof oldUrl !== 'string') continue
    const newUrl = await migrateUrl(oldUrl)
    if (newUrl === oldUrl) continue
    value[field] = newUrl
    changed = true
  }
  if (!changed) return

  const { error: updateError } = await supabase.from('site_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)
  if (updateError) throw new Error(`Could not update ${key} image URLs: ${updateError.message}`)
}

async function removeLegacyBuckets() {
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) throw new Error(`Could not list Supabase Storage buckets: ${listError.message}`)
  for (const bucket of buckets) {
    if (!existingBuckets?.some((existing) => existing.name === bucket)) continue
    const { error: emptyError } = await supabase.storage.emptyBucket(bucket)
    if (emptyError) throw new Error(`Could not empty Supabase Storage bucket "${bucket}": ${emptyError.message}`)
    const { error: deleteError } = await supabase.storage.deleteBucket(bucket)
    if (deleteError) throw new Error(`Could not remove Supabase Storage bucket "${bucket}": ${deleteError.message}`)
    console.info(`Removed Supabase Storage bucket "${bucket}".`)
  }
}

await migratePromptImages()
await migrateUrlColumn('categories', 'image_url')
await migrateUrlColumn('prompts', 'og_image_url')
await migrateSettingsImages('site', ['logo_url', 'favicon_url'])
await migrateSettingsImages('seo', ['default_og_image'])

for (const { bucket, path } of oldObjects.values()) {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new Error(`ImageKit URLs were saved, but could not remove old file ${bucket}/${path}: ${error.message}`)
}

await removeLegacyBuckets()
console.info(`Image migration complete: ${uploads.size} unique file(s) moved to ImageKit.`)
