'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { authorizeAdminAction } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { deleteImageKitFile, getImageKitConfig } from '@/lib/imagekit-server'
import { clearAdminLoginAttempts, reserveAdminLoginAttempt } from '@/lib/admin-login-rate-limit'

export async function signInAction(formData: FormData) {
  const attempt = await reserveAdminLoginAttempt()
  if (!attempt.allowed) {
    const retryAt = attempt.retry_at
      ? new Date(attempt.retry_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
      })
      : '24 hours from now'
    redirect(`/admin/login/?error=${encodeURIComponent(`Too many failed sign-in attempts. Try again after ${retryAt} UTC.`)}`)
  }

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
    redirect(`/admin/login/?error=${encodeURIComponent('Enter a valid email and password.')}`)
  }
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user || data.user.app_metadata?.role !== 'admin') {
    if (data.user) await supabase.auth.signOut()
    redirect(`/admin/login/?error=${encodeURIComponent('Sign-in failed. Check your credentials and admin access.')}`)
  }
  await clearAdminLoginAttempts(attempt.ipHash)
  redirect('/admin/')
}

export async function signOutAction() {
  const { supabase } = await authorizeAdminAction()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(`Could not sign out: ${error.message}`)
  redirect('/admin/login/')
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function optional(formData: FormData, key: string) {
  return value(formData, key) || null
}

function revalidatePublicContent() {
  updateTag('public-content')
}

function revalidatePublicSettings() {
  updateTag('public-site-settings')
}

function validateCanonicalUrl(url: string | null) {
  if (!url) return
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
  } catch {
    throw new Error('Canonical URL must be a valid http or https URL.')
  }
}

export async function savePromptAction(formData: FormData) {
  const { supabase, user } = await authorizeAdminAction()
  const id = value(formData, 'id')
  const title = value(formData, 'title')
  const slug = value(formData, 'slug')
  const categoryId = value(formData, 'category_id')
  const promptText = String(formData.get('prompt_text') ?? '')
  const excerpt = value(formData, 'excerpt')
  const status = value(formData, 'status') === 'published' ? 'published' : 'draft'
  const canonicalUrl = optional(formData, 'canonical_url')
  if (!title || !slug || !categoryId || !excerpt || !promptText.trim()) {
    throw new Error('Title, slug, excerpt, category, and prompt text are required.')
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Use lowercase letters, numbers, and hyphens for the URL slug.')
  }
  if (status === 'published') {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('is_published')
      .eq('id', categoryId)
      .single()
    if (categoryError) throw new Error(`Could not verify the prompt category: ${categoryError.message}`)
    if (!category.is_published) {
      throw new Error('Publish this prompt’s category first; prompts in unpublished categories are hidden from the website.')
    }
  }
  validateCanonicalUrl(canonicalUrl)
  const now = new Date().toISOString()
  let publishedAt: string | null = null
  if (status === 'published') {
    if (id) {
      const { data: existingPrompt, error: loadError } = await supabase.from('prompts').select('status,published_at').eq('id', id).maybeSingle()
      if (loadError) throw new Error(`Could not check existing prompt status: ${loadError.message}`)
      publishedAt = existingPrompt?.status === 'published' ? existingPrompt.published_at : now
    } else {
      publishedAt = now
    }
  }
  const record = {
    title,
    slug,
    excerpt,
    prompt_text: promptText,
    instructions: optional(formData, 'instructions'),
    personalization_tips: optional(formData, 'personalization_tips'),
    expected_result: optional(formData, 'expected_result'),
    category_id: categoryId,
    tags: value(formData, 'tags').split(',').map((tag) => tag.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean),
    model_name: optional(formData, 'model_name'),
    art_style: optional(formData, 'art_style'),
    aspect_ratio: optional(formData, 'aspect_ratio'),
    use_case: optional(formData, 'use_case'),
    seo_title: optional(formData, 'seo_title'),
    meta_description: optional(formData, 'meta_description'),
    canonical_url: canonicalUrl,
    og_title: optional(formData, 'og_title'),
    og_description: optional(formData, 'og_description'),
    og_image_url: optional(formData, 'og_image_url'),
    indexing_preference: value(formData, 'indexing_preference') === 'noindex' ? 'noindex' : 'index',
    status,
    is_featured: formData.get('is_featured') === 'on',
    published_at: publishedAt,
    created_by: user.id,
    updated_at: now,
  } as const

  const { created_by: _createdBy, ...updateRecord } = record
  const result = id
    ? await supabase.from('prompts').update(updateRecord).eq('id', id).select('id').single()
    : await supabase.from('prompts').insert(record).select('id').single()
  if (result.error) {
    if (result.error.code === '23505') throw new Error('That URL slug is already in use.')
    throw new Error(`Could not save prompt: ${result.error.message}`)
  }
  revalidatePath('/admin')
  revalidatePath('/admin/prompts')
  revalidatePublicContent()
  revalidatePath('/', 'layout')
  revalidatePath('/sitemap.xml')
  redirect(`/admin/prompts/${result.data.id}/edit/?saved=1`)
}

export async function updatePromptStatusAction(formData: FormData) {
  const { supabase } = await authorizeAdminAction()
  const id = value(formData, 'id')
  const status = value(formData, 'status')
  if (!id || !['draft', 'published', 'archived', 'trashed'].includes(status)) {
    throw new Error('Invalid prompt status request.')
  }
  const { error } = await supabase
    .from('prompts')
    .update({
      status: status as 'draft' | 'published' | 'archived' | 'trashed',
      published_at: status === 'published' ? new Date().toISOString() : null,
      deleted_at: status === 'trashed' ? new Date().toISOString() : null,
    })
    .eq('id', id)
  if (error) throw new Error(`Could not update prompt status: ${error.message}`)
  revalidatePath('/admin/prompts')
  revalidatePublicContent()
  revalidatePath('/', 'layout')
  revalidatePath('/sitemap.xml')
}

export async function duplicatePromptAction(formData: FormData) {
  const { supabase, user } = await authorizeAdminAction()
  const id = value(formData, 'id')
  const { data: prompt, error: loadError } = await supabase.from('prompts').select('*').eq('id', id).single()
  if (loadError) throw new Error(`Could not load prompt to duplicate: ${loadError.message}`)
  const { data: copy, error } = await supabase.from('prompts').insert({
    ...prompt,
    id: undefined,
    title: `${prompt.title} (copy)`,
    slug: `${prompt.slug}-copy`,
    status: 'draft',
    published_at: null,
    deleted_at: null,
    created_by: user.id,
  }).select('id').single()
  if (error) throw new Error(`Could not duplicate prompt: ${error.message}`)
  revalidatePath('/admin/prompts')
  redirect(`/admin/prompts/${copy.id}/edit/`)
}

export async function saveCategoryAction(formData: FormData) {
  const { supabase } = await authorizeAdminAction()
  const id = value(formData, 'id')
  const name = value(formData, 'name')
  const slug = value(formData, 'slug')
  const imageUrl = optional(formData, 'image_url')
  if (!name || !slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Enter a category name and a valid lowercase URL slug.')
  }
  if (imageUrl && !imageUrl.startsWith('/')) {
    try {
      if (!['http:', 'https:'].includes(new URL(imageUrl).protocol)) throw new Error()
    } catch {
      throw new Error('Category image must be a local path or a valid http or https URL.')
    }
  }
  const category = {
    name,
    slug,
    description: value(formData, 'description'),
    image_url: imageUrl,
    seo_title: optional(formData, 'seo_title'),
    meta_description: optional(formData, 'meta_description'),
    sort_order: Math.max(0, Number.parseInt(value(formData, 'sort_order') || '0', 10)),
    is_published: formData.get('is_published') === 'on',
    updated_at: new Date().toISOString(),
  }
  const result = id
    ? await supabase.from('categories').update(category).eq('id', id)
    : await supabase.from('categories').insert(category)
  if (result.error) {
    if (result.error.code === '23505') throw new Error('That category slug is already in use.')
    throw new Error(`Could not save category: ${result.error.message}`)
  }
  revalidatePath('/admin/categories')
  revalidatePublicContent()
  revalidatePath('/', 'layout')
  revalidatePath('/sitemap.xml')
  redirect('/admin/categories/?saved=1')
}

export async function deleteCategoryAction(formData: FormData) {
  const { supabase } = await authorizeAdminAction()
  const id = value(formData, 'id')
  const { count, error: countError } = await supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('category_id', id)
  if (countError) throw new Error(`Could not check category usage: ${countError.message}`)
  if (count) throw new Error('This category is assigned to prompts. Reassign those prompts before deleting it.')
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(`Could not delete category: ${error.message}`)
  revalidatePath('/admin/categories')
  revalidatePublicContent()
  redirect('/admin/categories/?deleted=1')
}

export async function saveSettingsAction(formData: FormData) {
  const { supabase, user } = await authorizeAdminAction()
  const key = value(formData, 'key')
  if (!['site', 'seo'].includes(key)) throw new Error('Invalid settings group.')
  const fields = [
    'site_name', 'tagline', 'site_url', 'contact_email', 'social_x', 'social_instagram',
    'social_youtube', 'social_pinterest', 'social_facebook', 'default_seo_title',
    'default_meta_description', 'default_og_image', 'indexing_enabled', 'sitemap_enabled',
    'max_images', 'google_analytics_id', 'google_search_console_verification',
    'bing_verification_code', 'adsense_publisher_id', 'listing_ad_slot_id',
    'prompt_ad_slot_id', 'adsense_enabled', 'ad_code_listing',
    'ad_code_prompt_top', 'ad_code_prompt_bottom', 'ad_code_head',
  ]
  const settings: Record<string, string | boolean | number> = {}
  for (const field of fields) {
    const entry = formData.get(field)
    if (entry !== null) settings[field] = field.endsWith('_enabled') ? entry === 'on' : String(entry).trim()
  }
  if (key === 'seo') {
    settings.indexing_enabled = formData.get('indexing_enabled') === 'on'
    settings.sitemap_enabled = formData.get('sitemap_enabled') === 'on'
  }
  if (key === 'site') {
    settings.adsense_enabled = formData.get('adsense_enabled') === 'on'
    for (const codeField of ['ad_code_listing', 'ad_code_prompt_top', 'ad_code_prompt_bottom', 'ad_code_head']) {
      const code = settings[codeField]
      if (typeof code === 'string' && code.length > 20000) {
        throw new Error('Each ad code snippet must be 20,000 characters or fewer.')
      }
    }
    const analyticsId = settings.google_analytics_id
    if (typeof analyticsId === 'string' && analyticsId && !/^G-[A-Z0-9]+$/i.test(analyticsId)) {
      throw new Error('Google Analytics ID should look like G-XXXXXXXXXX.')
    }
    const publisherId = settings.adsense_publisher_id
    if (typeof publisherId === 'string' && publisherId && !/^ca-pub-\d{10,20}$/.test(publisherId)) {
      throw new Error('AdSense publisher ID should look like ca-pub- followed by your publisher number.')
    }
    for (const slotField of ['listing_ad_slot_id', 'prompt_ad_slot_id']) {
      const slotId = settings[slotField]
      if (typeof slotId === 'string' && slotId && !/^\d{5,20}$/.test(slotId)) {
        throw new Error('Ad slot IDs should contain only digits.')
      }
    }
    for (const verificationField of ['google_search_console_verification', 'bing_verification_code']) {
      const verification = settings[verificationField]
      if (typeof verification === 'string' && verification && !/^[a-zA-Z0-9_-]{1,200}$/.test(verification)) {
        throw new Error('Verification codes may contain letters, numbers, underscores, and hyphens only.')
      }
    }
  }
  if (formData.has('max_images')) settings.max_images = Math.min(5, Math.max(1, Number(settings.max_images) || 5))
  const siteUrl = settings.site_url
  if (typeof siteUrl === 'string' && siteUrl) {
    try {
      if (!['http:', 'https:'].includes(new URL(siteUrl).protocol)) throw new Error()
    } catch {
      throw new Error('Public site URL must be a valid http or https URL.')
    }
  }
  if (typeof settings.contact_email === 'string' && settings.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contact_email)) {
    throw new Error('Enter a valid contact email address.')
  }
  const { data: existing, error: loadError } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle()
  if (loadError) throw new Error(`Could not load existing settings: ${loadError.message}`)
  const oldSettings = existing?.value && typeof existing.value === 'object' && !Array.isArray(existing.value)
    ? existing.value as Record<string, unknown>
    : {}
  const { error } = await supabase.from('site_settings').upsert(
    { key, value: { ...oldSettings, ...settings }, updated_by: user.id, updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  )
  if (error) throw new Error(`Could not save settings: ${error.message}`)
  revalidatePath('/admin/settings')
  revalidatePath('/admin/seo')
  revalidatePublicSettings()
  revalidatePath('/')
  redirect(`/admin/${key === 'seo' ? 'seo' : 'settings'}/?saved=1`)
}

export async function saveBrandAssetAction(asset: 'logo' | 'favicon', imageUrl: string) {
  const { supabase, user } = await authorizeAdminAction()
  if (!['logo', 'favicon'].includes(asset)) throw new Error('Invalid brand asset type.')
  const { urlEndpoint: endpoint } = await getImageKitConfig()
  let parsedUrl: URL
  let parsedEndpoint: URL
  try {
    parsedUrl = new URL(imageUrl)
    parsedEndpoint = new URL(endpoint)
    if (parsedUrl.protocol !== 'https:' || parsedUrl.origin !== parsedEndpoint.origin) throw new Error()
    const endpointPath = parsedEndpoint.pathname.replace(/\/+$/, '')
    if (endpointPath && !parsedUrl.pathname.startsWith(`${endpointPath}/`)) throw new Error()
  } catch {
    throw new Error('Brand asset must be a valid HTTPS URL from the configured ImageKit endpoint.')
  }
  const { data: current, error: readError } = await supabase.from('site_settings').select('value').eq('key', 'site').maybeSingle()
  if (readError) throw new Error(`Could not read current brand settings: ${readError.message}`)
  const previous = current?.value && typeof current.value === 'object' && !Array.isArray(current.value)
    ? current.value as Record<string, unknown>
    : {}
  const key = asset === 'logo' ? 'logo_url' : 'favicon_url'
  const { error } = await supabase.from('site_settings').upsert(
    {
      key: 'site',
      value: { ...previous, [key]: imageUrl },
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  )
  if (error) throw new Error(`Could not save brand asset: ${error.message}`)
  revalidatePath('/', 'layout')
  revalidatePublicSettings()
  revalidatePath('/admin/settings')
  redirect('/admin/settings/?saved=1')
}

export async function refreshPromptPublicContentAction(promptId: string) {
  const { supabase } = await authorizeAdminAction()
  const { data: prompt, error } = await supabase
    .from('prompts')
    .select('status')
    .eq('id', promptId)
    .single()
  if (error) throw new Error(`Could not refresh prompt pages: ${error.message}`)
  if (prompt.status !== 'published') return
  revalidatePublicContent()
  revalidatePath('/', 'layout')
  revalidatePath('/sitemap.xml')
}

export async function updateImageMetadataAction(formData: FormData) {
  const { supabase } = await authorizeAdminAction()
  const id = value(formData, 'id')
  const { error } = await supabase.from('prompt_images').update({
    alt_text: value(formData, 'alt_text'),
    caption: optional(formData, 'caption'),
  }).eq('id', id)
  if (error) throw new Error(`Could not update image details: ${error.message}`)
  revalidatePublicContent()
  revalidatePath('/', 'layout')
  revalidatePath('/admin/media')
}

export async function setPrimaryImageAction(formData: FormData) {
  const { supabase } = await authorizeAdminAction()
  const id = value(formData, 'id')
  const { data: selected, error: loadError } = await supabase.from('prompt_images').select('prompt_id').eq('id', id).single()
  if (loadError) throw new Error(`Could not find image: ${loadError.message}`)
  const { error } = await supabase.from('prompt_images').update({ is_primary: true }).eq('id', id)
  if (error) throw new Error(`Could not select primary image: ${error.message}`)
  revalidatePublicContent()
  revalidatePath('/', 'layout')
  revalidatePath('/admin/media')
  revalidatePath(`/admin/prompts/${selected.prompt_id}/edit/`)
}

export async function movePromptImageAction(formData: FormData) {
  const { supabase } = await authorizeAdminAction()
  const id = value(formData, 'id')
  const direction = value(formData, 'direction')
  if (!['up', 'down'].includes(direction)) throw new Error('Invalid image ordering request.')
  const { data: image, error: loadError } = await supabase.from('prompt_images').select('id,prompt_id,sort_order').eq('id', id).single()
  if (loadError) throw new Error(`Could not find image: ${loadError.message}`)
  const { data: sibling, error: siblingError } = await supabase
    .from('prompt_images').select('id,sort_order').eq('prompt_id', image.prompt_id)
    [direction === 'up' ? 'lt' : 'gt']('sort_order', image.sort_order)
    .order('sort_order', { ascending: direction === 'up' }).limit(1).maybeSingle()
  if (siblingError) throw new Error(`Could not update image order: ${siblingError.message}`)
  if (sibling) {
    const { error } = await supabase.from('prompt_images').update({ sort_order: image.sort_order }).eq('id', sibling.id)
    if (error) throw new Error(`Could not update image order: ${error.message}`)
    const { error: swapError } = await supabase.from('prompt_images').update({ sort_order: sibling.sort_order }).eq('id', image.id)
    if (swapError) throw new Error(`Could not update image order: ${swapError.message}`)
  }
  revalidatePublicContent()
  revalidatePath('/', 'layout')
  revalidatePath(`/admin/prompts/${image.prompt_id}/edit/`)
}

export async function deletePromptImageAction(formData: FormData) {
  const { supabase } = await authorizeAdminAction()
  const id = value(formData, 'id')
  const { data: image, error: loadError } = await supabase.from('prompt_images').select('imagekit_file_id').eq('id', id).single()
  if (loadError) throw new Error(`Could not find image: ${loadError.message}`)
  if (!image.imagekit_file_id) {
    throw new Error('This image has not been migrated to ImageKit. Run the ImageKit migration script before deleting it.')
  }
  const { error } = await supabase.from('prompt_images').delete().eq('id', id)
  if (error) throw new Error(`Could not remove image metadata: ${error.message}`)
  revalidatePublicContent()
  revalidatePath('/', 'layout')
  revalidatePath('/admin/media')
  try {
    await deleteImageKitFile(image.imagekit_file_id, await getImageKitConfig())
  } catch (cleanupError) {
    throw new Error(`Image reference was removed, but ImageKit cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error.'}`)
  }
}
