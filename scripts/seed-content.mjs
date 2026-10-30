import { createClient } from '@supabase/supabase-js'
import { readFile, stat } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminUserId = process.env.SUPABASE_ADMIN_USER_ID
const imageKitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY
if (!supabaseUrl || !serviceRoleKey || !adminUserId || !imageKitPrivateKey) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ADMIN_USER_ID, and IMAGEKIT_PRIVATE_KEY before importing.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const imageKitAuthorization = `Basic ${Buffer.from(`${imageKitPrivateKey}:`).toString('base64')}`
async function uploadImage(contents, fileName, folder, mimeType) {
  const formData = new FormData()
  formData.set('file', new Blob([contents], { type: mimeType }), fileName)
  formData.set('fileName', fileName)
  formData.set('folder', folder)
  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: { Authorization: imageKitAuthorization },
    body: formData,
  })
  if (!response.ok) throw new Error(`ImageKit upload failed (HTTP ${response.status}).`)
  const result = await response.json()
  if (typeof result.fileId !== 'string' || typeof result.url !== 'string') {
    throw new Error('ImageKit returned an invalid upload response.')
  }
  return result
}

async function deleteImage(fileId) {
  const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: imageKitAuthorization },
  })
  if (!response.ok) throw new Error(`ImageKit file deletion failed (HTTP ${response.status}).`)
}

const categories = JSON.parse(await readFile(join(root, 'data', 'categories.json'), 'utf8'))
const prompts = JSON.parse(await readFile(join(root, 'data', 'prompts.json'), 'utf8'))
const categoryIds = new Map()

for (const category of categories) {
  const { data: existing, error: lookupError } = await supabase.from('categories').select('id').eq('slug', category.slug).maybeSingle()
  if (lookupError) throw new Error(`Could not check category "${category.slug}": ${lookupError.message}`)
  if (existing) {
    categoryIds.set(category.slug, existing.id)
    continue
  }
  const { data, error } = await supabase.from('categories').insert({
    name: category.name,
    slug: category.slug,
    description: category.description,
    image_url: category.image,
    seo_title: category.seoTitle ?? null,
    meta_description: category.seoDescription ?? null,
    sort_order: category.displayOrder,
    is_published: category.isVisible,
  }).select('id').single()
  if (error) throw new Error(`Could not import category "${category.slug}": ${error.message}`)
  categoryIds.set(category.slug, data.id)
}

for (const prompt of prompts) {
  const { data: existing, error: lookupError } = await supabase.from('prompts').select('id').eq('slug', prompt.slug).maybeSingle()
  if (lookupError) throw new Error(`Could not check prompt "${prompt.slug}": ${lookupError.message}`)
  if (existing) {
    console.info(`Skipped existing prompt: ${prompt.slug}`)
    continue
  }
  const categoryId = categoryIds.get(prompt.categorySlug)
  if (!categoryId) throw new Error(`No imported category exists for prompt "${prompt.slug}".`)
  const { data: inserted, error: promptError } = await supabase.from('prompts').insert({
    title: prompt.title,
    slug: prompt.slug,
    excerpt: prompt.shortDescription,
    prompt_text: prompt.promptText,
    category_id: categoryId,
    tags: prompt.tags ?? [],
    art_style: prompt.imageStyle ?? null,
    use_case: prompt.promptType ?? null,
    aspect_ratio: prompt.aspectRatio ?? null,
    model_name: prompt.aiModel ?? null,
    seo_title: prompt.seoTitle ?? null,
    meta_description: prompt.seoDescription ?? null,
    status: prompt.status === 'published' ? 'published' : 'draft',
    is_featured: Boolean(prompt.isFeatured),
    published_at: prompt.publishedAt ? new Date(prompt.publishedAt).toISOString() : null,
    created_by: adminUserId,
  }).select('id').single()
  if (promptError) throw new Error(`Could not import prompt "${prompt.slug}": ${promptError.message}`)

  const uploadedFileIds = []
  try {
    for (const [index, image] of prompt.images.entries()) {
      const localPath = join(root, 'public', image.src.replace(/^\/+/, ''))
      const contents = await readFile(localPath)
      const info = await stat(localPath)
      const extension = image.src.toLowerCase().split('.').pop()
      const mimeType = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : null
      if (!mimeType) throw new Error(`Unsupported image format: ${image.src}`)
      if (info.size > 5 * 1024 * 1024) throw new Error(`Image exceeds the 5 MB limit: ${image.src}`)
      const fileName = `${crypto.randomUUID()}-${basename(image.src)}`
      const uploaded = await uploadImage(contents, fileName, `/prompts/${inserted.id}`, mimeType)
      uploadedFileIds.push(uploaded.fileId)
      const { error: imageError } = await supabase.from('prompt_images').insert({
        prompt_id: inserted.id,
        image_url: uploaded.url,
        imagekit_file_id: uploaded.fileId,
        alt_text: image.alt,
        sort_order: image.order ?? index,
        is_primary: Boolean(image.isPrimary),
        mime_type: mimeType,
        file_size: info.size,
        width: image.width,
        height: image.height,
      })
      if (imageError) throw new Error(`Could not attach "${image.src}": ${imageError.message}`)
    }
  } catch (error) {
    for (const fileId of uploadedFileIds) {
      try {
        await deleteImage(fileId)
      } catch (cleanupError) {
        console.error(`ImageKit cleanup also failed for ${prompt.slug}: ${cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error.'}`)
      }
    }
    const { error: deleteError } = await supabase.from('prompts').delete().eq('id', inserted.id)
    if (deleteError) console.error(`Prompt cleanup also failed for ${prompt.slug}: ${deleteError.message}`)
    throw error
  }
  console.info(`Imported prompt and ${prompt.images.length} image(s): ${prompt.slug}`)
}
