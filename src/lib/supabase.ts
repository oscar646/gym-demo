import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Detectar credenciales desde variables de entorno o almacenamiento local
const envUrl = import.meta.env.VITE_SUPABASE_URL || ''
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Obtener credenciales configuradas
export function getSupabaseCredentials() {
  const localUrl = localStorage.getItem('ironfit_supabase_url') || ''
  const localKey = localStorage.getItem('ironfit_supabase_key') || ''
  
  const url = localUrl || envUrl
  const key = localKey || envAnonKey
  
  const isConfigured = Boolean(
    url && 
    key && 
    url.startsWith('https://') && 
    !url.includes('tu-proyecto-aqui') &&
    key.length > 20
  )

  return { url, key, isConfigured }
}

let supabaseInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials()
  
  if (!isConfigured) {
    return null
  }
  
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    } catch (e) {
      console.warn('Error inicializando cliente de Supabase:', e)
      return null
    }
  }
  
  return supabaseInstance
}

export function saveSupabaseCredentials(url: string, key: string) {
  localStorage.setItem('ironfit_supabase_url', url.trim())
  localStorage.setItem('ironfit_supabase_key', key.trim())
  supabaseInstance = null // Forzar reinicialización
}

export function clearSupabaseCredentials() {
  localStorage.removeItem('ironfit_supabase_url')
  localStorage.removeItem('ironfit_supabase_key')
  supabaseInstance = null
}

