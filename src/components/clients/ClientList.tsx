import React, { useState, useMemo } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RotateCw,
  Phone,
  ShieldAlert,
} from 'lucide-react'
import { useGymStore } from '../../store/useGymStore'
import { Client, MembershipStatus, PlanType } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { Card, CardContent } from '../ui/Card'
import { ClientModal } from './ClientModal'
import { getExpiryInfo, formatDateShort } from '../../lib/utils'

export function ClientList() {
  const { clients, addClient, updateClient, deleteClient, toggleClientStatus, renewClientMembership, currentUser } = useGymStore()
  const isAdmin = currentUser?.role === 'admin'

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Todos' | MembershipStatus | 'Por Vencer' | 'Vencidas'>('Todos')
  const [planFilter, setPlanFilter] = useState<'Todos' | PlanType>('Todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [renewSuccessId, setRenewSuccessId] = useState<string | null>(null)

  // Calcular clientes por vencer y vencidos
  const { expiringSoonClients, expiredClients } = useMemo(() => {
    const expiring: Client[] = []
    const expired: Client[] = []

    clients.forEach((c) => {
      if (c.plan_type === 'Sesión Individual') return // No alertar sobre sesiones individuales pasadas
      const info = getExpiryInfo(c.end_date)
      if (info.state === 'expiring_soon') expiring.push(c)
      if (info.state === 'expired') expired.push(c)
    })

    return { expiringSoonClients: expiring, expiredClients: expired }
  }, [clients])

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchSearch =
        client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.dni.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)

      const matchPlan = planFilter === 'Todos' || (client.plan_type || 'Mensual Completo') === planFilter

      let matchStatus = true
      if (statusFilter === 'Por Vencer') {
        const info = getExpiryInfo(client.end_date)
        matchStatus = info.state === 'expiring_soon' && client.plan_type !== 'Sesión Individual'
      } else if (statusFilter === 'Vencidas') {
        const info = getExpiryInfo(client.end_date)
        matchStatus = (info.state === 'expired' || client.status === 'Inactivo') && client.plan_type !== 'Sesión Individual'
      } else if (statusFilter !== 'Todos') {
        matchStatus = client.status === statusFilter
      }

      return matchSearch && matchPlan && matchStatus
    })
  }, [clients, searchTerm, statusFilter, planFilter])

  const activeCount = useMemo(() => clients.filter((c) => c.status === 'Activo').length, [clients])
  const inactiveCount = clients.length - activeCount

  const handleOpenCreate = () => {
    setClientToEdit(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (client: Client) => {
    setClientToEdit(client)
    setIsModalOpen(true)
  }

  const handleSaveClient = async (data: Omit<Client, 'id'>) => {
    if (clientToEdit) {
      await updateClient(clientToEdit.id, data)
    } else {
      await addClient(data)
    }
  }

  const handleRenew = async (clientId: string) => {
    await renewClientMembership(clientId)
    setRenewSuccessId(clientId)
    setTimeout(() => setRenewSuccessId(null), 2500)
  }

  const handleDeleteConfirm = async () => {
    if (clientToDelete) {
      await deleteClient(clientToDelete.id)
      setClientToDelete(null)
    }
  }

  const getPlanBadge = (plan?: PlanType) => {
    switch (plan) {
      case 'Sesión Individual':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50">
            Sesión Individual
          </span>
        )
      case 'Día por Medio (Mes)':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50">
            Día por Medio
          </span>
        )
      case 'Mensual Completo':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50">
            Mensual Completo
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-800 dark:text-blue-400" />
            <span>Directorio de Clientes y Membresías</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Total: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{clients.length} socios</span> ({activeCount} activos, {inactiveCount} inactivos)
          </p>
        </div>

        <Button onClick={handleOpenCreate}>
          <UserPlus className="h-4 w-4" />
          <span>Registrar Socio / Pase</span>
        </Button>
      </div>

      {/* Banner de Alerta de Vencimientos */}
      {(expiringSoonClients.length > 0 || expiredClients.length > 0) && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400 flex-shrink-0" />
            <div className="text-xs text-amber-900 dark:text-amber-300">
              <span className="font-bold">Aviso de Membresías: </span>
              {expiringSoonClients.length > 0 && (
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  {expiringSoonClients.length} por acabar en los próximos días.{' '}
                </span>
              )}
              {expiredClients.length > 0 && (
                <span className="font-semibold text-rose-700 dark:text-rose-400">
                  {expiredClients.length} ya acabaron.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {expiringSoonClients.length > 0 && (
              <button
                onClick={() => setStatusFilter('Por Vencer')}
                className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 dark:text-amber-300 underline"
              >
                Ver por vencer ({expiringSoonClients.length})
              </button>
            )}
            {expiredClients.length > 0 && (
              <button
                onClick={() => setStatusFilter('Vencidas')}
                className="text-[11px] font-semibold text-rose-700 hover:text-rose-800 dark:text-rose-400 underline"
              >
                Ver vencidas ({expiredClients.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <Card className="p-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar por nombre, DNI o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-3.5 w-3.5" />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro de Estado y Vencimiento */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400">Estado:</span>
              <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
                {(['Todos', 'Por Vencer', 'Vencidas', 'Activo'] as const).map((st) => {
                  const isSelected = statusFilter === st
                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`rounded-md px-2.5 py-0.5 text-[11px] font-medium transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'bg-blue-800 text-white shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      <span>{st}</span>
                      {st === 'Por Vencer' && expiringSoonClients.length > 0 && (
                        <span className={`text-[10px] px-1 rounded-full ${isSelected ? 'bg-amber-400 text-zinc-900 font-bold' : 'bg-amber-100 text-amber-800 font-bold'}`}>
                          {expiringSoonClients.length}
                        </span>
                      )}
                      {st === 'Vencidas' && expiredClients.length > 0 && (
                        <span className={`text-[10px] px-1 rounded-full ${isSelected ? 'bg-rose-400 text-zinc-900 font-bold' : 'bg-rose-100 text-rose-800 font-bold'}`}>
                          {expiredClients.length}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Filtro Plan */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400">Plan:</span>
              <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
                {(['Todos', 'Mensual Completo', 'Día por Medio (Mes)', 'Sesión Individual'] as const).map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setPlanFilter(plan)}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      planFilter === plan
                        ? 'bg-blue-800 text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    {plan === 'Día por Medio (Mes)' ? 'Día por Medio' : plan === 'Mensual Completo' ? 'Mensual' : plan === 'Sesión Individual' ? 'Individual' : 'Todos'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabla de Socios */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-100 bg-zinc-50/70 text-zinc-500 font-medium dark:border-zinc-800 dark:bg-zinc-850">
                <tr>
                  <th className="py-3 pl-5">Nombre Completo</th>
                  <th className="py-3 px-3">DNI / Carnet</th>
                  <th className="py-3 px-3">Plan</th>
                  <th className="py-3 px-3">Teléfono</th>
                  <th className="py-3 px-3">Fecha Vencimiento</th>
                  <th className="py-3 px-3">Vigencia / Alerta</th>
                  <th className="py-3 pr-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-zinc-400">
                      No se encontraron clientes con el filtro aplicado.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const expiry = getExpiryInfo(client.end_date)
                    const isIndividual = client.plan_type === 'Sesión Individual'
                    const isExpired = expiry.state === 'expired'
                    const isExpiringSoon = expiry.state === 'expiring_soon'

                    return (
                      <tr key={client.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/50 transition-colors">
                        <td className="py-3 pl-5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-800 font-semibold text-xs border border-blue-200/60 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900">
                              {client.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                                {client.full_name}
                              </p>
                              <p className="text-[10px] text-zinc-400">ID: {client.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-zinc-600 dark:text-zinc-400">
                          {client.dni || <span className="text-zinc-400 italic">Sin DNI</span>}
                        </td>

                        <td className="py-3 px-3">
                          {getPlanBadge(client.plan_type)}
                        </td>

                        <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                          {client.phone ? (
                            <a href={`tel:${client.phone}`} className="hover:text-blue-800 dark:hover:text-blue-400 flex items-center gap-1">
                              <Phone className="h-3 w-3 text-zinc-400" />
                              <span>{client.phone}</span>
                            </a>
                          ) : (
                            <span className="text-zinc-400 italic">Sin teléfono</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-zinc-500 dark:text-zinc-400">
                          {client.end_date || client.start_date}
                        </td>

                        {/* Columna de Alerta y Vigencia */}
                        <td className="py-3 px-3">
                          {isIndividual ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                              <Clock className="h-3 w-3" />
                              <span>Pase de 1 día</span>
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60">
                              <XCircle className="h-3 w-3" />
                              <span>{expiry.label} (Acabó)</span>
                            </span>
                          ) : isExpiringSoon ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60">
                              <AlertTriangle className="h-3 w-3" />
                              <span>{expiry.label}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{expiry.label}</span>
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-3 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botón Renovar rápido si está por vencer o vencida */}
                            {!isIndividual && (isExpired || isExpiringSoon) && (
                              <button
                                onClick={() => handleRenew(client.id)}
                                title="Renovar membresía (+30 días)"
                                className="flex items-center gap-1 rounded bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-semibold text-blue-800 hover:bg-blue-800 hover:text-white transition-colors dark:bg-blue-950/50 dark:border-blue-900 dark:text-blue-300"
                              >
                                <RotateCw className="h-3 w-3" />
                                <span>{renewSuccessId === client.id ? '¡Renovado!' : 'Renovar'}</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEdit(client)}
                              title="Editar socio"
                              className="rounded p-1 text-zinc-400 hover:text-blue-800 hover:bg-blue-50 dark:hover:text-blue-300 dark:hover:bg-blue-950/40"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => setClientToDelete(client)}
                                title="Eliminar socio"
                                className="rounded p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        clientToEdit={clientToEdit}
      />

      {/* Confirmación Eliminar */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white border border-zinc-200 p-5 shadow-lg dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">¿Eliminar socio?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
              Se eliminará permanentemente la ficha de <strong className="text-zinc-800 dark:text-zinc-200">{clientToDelete.full_name}</strong>.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setClientToDelete(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteConfirm}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
