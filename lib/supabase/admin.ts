import 'server-only'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/admin/login/')
  if (user.app_metadata?.role !== 'admin') {
    await supabase.auth.signOut()
    redirect('/admin/login/?error=unauthorized')
  }
  return { supabase, user }
}

export async function authorizeAdminAction() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || user.app_metadata?.role !== 'admin') {
    throw new Error('You are not authorized to perform this action.')
  }
  return { supabase, user }
}
