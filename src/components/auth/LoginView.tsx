import React, { useState } from 'react'
import { Dumbbell, ShieldCheck, User, ArrowRight, Lock, Mail } from 'lucide-react'
import { useGymStore } from '../../store/useGymStore'
import { UserRole } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { getSupabase } from '../../lib/supabase'

export function LoginView() {
  const { loginAs, setCurrentUser } = useGymStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setError(null)

    const supabase = getSupabase()
    if (supabase) {
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (authError) throw authError
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          setCurrentUser({
            id: data.user.id,
            email: data.user.email || email,
            full_name: profile?.full_name || data.user.user_metadata?.full_name || 'Usuario',
            role: (profile?.role as UserRole) || 'empleado',
          })
          return
        }
      } catch (err: any) {
        setError(err.message || 'Error de autenticación.')
      } finally {
        setIsLoading(false)
      }
    } else {
      const role: UserRole = email.toLowerCase().includes('admin') ? 'admin' : 'empleado'
      loginAs(role)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="w-full max-w-sm space-y-5">
        {/* Logo & Marca con Azul Sobrio */}
        <div className="text-center space-y-1">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-800 text-white shadow-xs mb-1">
            <Dumbbell className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Modelo de Prueba Gym</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Control de Clientes, Inventario y Punto de Venta
          </p>
        </div>

        {/* Card Principal */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Iniciar Sesión</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Selecciona un rol rápido para la demostración
              </p>
            </div>

            {/* Accesos Rápidos con Azul */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => loginAs('admin')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-blue-200/80 bg-blue-50/50 hover:bg-blue-100/60 dark:border-blue-900/40 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-blue-800 text-white flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-blue-950 dark:text-blue-300">Modo Administrador</div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Acceso total, ganancias y gráficos</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-blue-800 dark:text-blue-400" />
              </button>

              <button
                type="button"
                onClick={() => loginAs('empleado')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-850 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-zinc-100 text-zinc-700 flex items-center justify-center dark:bg-zinc-800 dark:text-zinc-300">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Modo Empleado</div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Caja de cobro, socios e inventario</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
              </button>
            </div>

            <div className="relative flex items-center justify-center my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <span className="relative bg-white px-2 text-[10px] text-zinc-400 uppercase tracking-wider dark:bg-zinc-900">
                O con credenciales
              </span>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCustomLogin} className="space-y-3">
              <Input
                type="email"
                label="Correo"
                placeholder="ej: admin@gym.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-3.5 w-3.5" />}
              />

              <Input
                type="password"
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-3.5 w-3.5" />}
              />

              {error && (
                <div className="p-2 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400">
                  {error}
                </div>
              )}

              <Button type="submit" size="md" className="w-full font-semibold" isLoading={isLoading}>
                Ingresar
              </Button>
            </form>
          </div>
        </Card>

        <p className="text-center text-[11px] text-zinc-400">
          Modelo de Prueba Gym · Versión de Demostración
        </p>
      </div>
    </div>
  )
}
