import { createSupabaseServerClient } from '@/lib/supabase/server'
import { deleteImageKitFile, uploadImageKitFile } from '@/lib/imagekit-server'

const promptImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const brandImageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']

async function getAdminUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || user.app_metadata?.role !== 'admin') return null
  return { supabase, user }
}

export async function POST(request: Request) {
  const admin = await getAdminUser()
  if (!admin) return Response.json({ error: 'You are not authorized to upload images.' }, { status: 401 })
  if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
    return Response.json({ error: 'ImageKit is not configured. Set IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT.' }, { status: 503 })
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 5 * 1024 * 1024 + 128 * 1024) {
    return Response.json({ error: 'The upload exceeds the allowed file size.' }, { status: 413 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const purpose = formData.get('purpose')
  if (!(file instanceof File) || (purpose !== 'prompt' && purpose !== 'branding')) {
    return Response.json({ error: 'Invalid image upload request.' }, { status: 400 })
  }

  const isPromptImage = purpose === 'prompt'
  const asset = formData.get('asset')
  const promptId = formData.get('promptId')
  if (isPromptImage && (typeof promptId !== 'string' || !/^[0-9a-f-]{36}$/i.test(promptId))) {
    return Response.json({ error: 'Invalid prompt image upload request.' }, { status: 400 })
  }
  if (!isPromptImage && asset !== 'logo' && asset !== 'favicon') {
    return Response.json({ error: 'Invalid brand asset upload request.' }, { status: 400 })
  }

  const acceptedTypes = isPromptImage ? promptImageTypes : asset === 'logo'
    ? ['image/png', 'image/jpeg', 'image/webp']
    : brandImageTypes.filter((type) => type !== 'image/jpeg')
  const maxSize = isPromptImage ? 5 * 1024 * 1024 : 2 * 1024 * 1024
  if (!acceptedTypes.includes(file.type)) {
    return Response.json({ error: 'This image format is not supported.' }, { status: 400 })
  }
  if (file.size === 0 || file.size > maxSize) {
    return Response.json({ error: `File must be smaller than ${maxSize / (1024 * 1024)} MB.` }, { status: 413 })
  }

  if (isPromptImage) {
    const { data: prompt, error: promptError } = await admin.supabase.from('prompts').select('id').eq('id', promptId).maybeSingle()
    if (promptError) return Response.json({ error: `Could not verify the prompt: ${promptError.message}` }, { status: 500 })
    if (!prompt) return Response.json({ error: 'The selected prompt does not exist.' }, { status: 404 })
    const { count, error: countError } = await admin.supabase
      .from('prompt_images')
      .select('id', { count: 'exact', head: true })
      .eq('prompt_id', promptId)
    if (countError) return Response.json({ error: `Could not verify prompt image capacity: ${countError.message}` }, { status: 500 })
    if ((count ?? 0) >= 5) return Response.json({ error: 'This prompt already has five images.' }, { status: 409 })
  }

  const extension = file.type === 'image/jpeg' ? 'jpg'
    : file.type === 'image/x-icon' || file.type === 'image/vnd.microsoft.icon' ? 'ico'
      : file.type.split('/')[1]
  const fileName = `${isPromptImage ? 'image' : asset}-${crypto.randomUUID()}.${extension}`
  const folder = isPromptImage ? `/prompts/${promptId}` : `/branding/${admin.user.id}/${asset}`
  try {
    return Response.json(await uploadImageKitFile(file, fileName, folder))
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'ImageKit upload failed.' },
      { status: 502 },
    )
  }
}

export async function DELETE(request: Request) {
  const admin = await getAdminUser()
  if (!admin) return Response.json({ error: 'You are not authorized to delete images.' }, { status: 401 })

  const body: unknown = await request.json()
  if (!body || typeof body !== 'object' || !('fileId' in body) || typeof body.fileId !== 'string' || !/^[A-Za-z0-9_-]+$/.test(body.fileId)) {
    return Response.json({ error: 'Invalid ImageKit file ID.' }, { status: 400 })
  }
  try {
    await deleteImageKitFile(body.fileId)
    return Response.json({ success: true })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'ImageKit cleanup failed.' },
      { status: 502 },
    )
  }
}
