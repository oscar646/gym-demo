import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
} from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { Database, CheckCircle2, Copy, Check, Key, ShieldCheck, RefreshCw } from 'lucide-react'

interface SupabaseConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  const { isSupabaseConnected, fetchData, resetToDemoData } = useGymStore()
  const creds = getSupabaseCredentials()

  const [url, setUrl] = useState(creds.url || '')
  const [key, setKey] = useState(creds.key || '')
  const [hasCopiedSql, setHasCopiedSql] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsTesting(true)
    setMessage(null)

    try {
      saveSupabaseCredentials(url, key)
      await fetchData()
      setMessage({
        text: 'Credenciales guardadas y sincronización iniciada.',
        type: 'success',
      })
    } catch (err: any) {
      setMessage({
        text: err?.message || 'Error al conectar con Supabase.',
        type: 'error',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleClear = () => {
    clearSupabaseCredentials()
    setUrl('')
    setKey('')
    setMessage({
      text: 'Se han eliminado las credenciales. La app continuará en Modo Demo Local.',
      type: 'success',
    })
  }

  const handleCopySqlPath = () => {
    navigator.clipboard.writeText('supabase/schema.sql')
    setHasCopiedSql(true)
    setTimeout(() => setHasCopiedSql(false), 2000)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración de Base de Datos"
      description="Conexión Supabase (opcional) y estado de datos"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Estado actual */}
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-850">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md bg-zinc-200 p-2 text-zinc-700 dark:bg-zinc-750 dark:text-zinc-300">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Estado de Almacenamiento</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isSupabaseConnected
                  ? 'Conectado a PostgreSQL en Supabase'
                  : 'Modo visual / demo local (sin base de datos externa)'}
              </p>
            </div>
          </div>
          <Badge variant={isSupabaseConnected ? 'success' : 'default'}>
            {isSupabaseConnected ? 'Supabase Activo' : 'Modo Demo Local'}
          </Badge>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="space-y-3">
          <Input
            label="Supabase URL (Opcional)"
            placeholder="https://xyz.supabase.co"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            icon={<Database className="h-3.5 w-3.5" />}
          />

          <Input
            type="password"
            label="Supabase Anon Key (Opcional)"
            placeholder="eyJhbGciOiJIUzI1NiIsInR..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            icon={<Key className="h-3.5 w-3.5" />}
          />

          {message && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-1.5 border ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900'
              }`}
            >
              {message.type === 'success' && <CheckCircle2 className="h-3.5 w-3.5" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <Button type="button" variant="outline" size="sm" onClick={handleClear}>
              Restaurar Modo Demo
            </Button>
            <Button type="submit" size="sm" isLoading={isTesting}>
              Guardar y Probar
            </Button>
          </div>
        </form>

        {/* Esquema SQL */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-1.5 dark:border-zinc-800 dark:bg-zinc-850">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" />
              <span>Esquema SQL & RLS preparado</span>
            </span>
            <button
              onClick={handleCopySqlPath}
              className="flex items-center gap-1 rounded border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {hasCopiedSql ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{hasCopiedSql ? 'Copiado' : 'supabase/schema.sql'}</span>
            </button>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            El archivo SQL incluye las tablas, políticas de seguridad RLS por rol y la función de reducción atómica de existencias.
          </p>
        </div>

        {/* Reiniciar datos de prueba */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">¿Restablecer datos iniciales de socios y stock?</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetToDemoData()
              alert('Datos de prueba restablecidos.')
            }}
          >
            <RefreshCw className="h-3 w-3" />
            <span>Resetear Datos</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
