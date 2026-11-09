import React, { useState, useEffect } from 'react'
import { Client, MembershipStatus, PlanType } from '../../types'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { calculateEndDate } from '../../lib/utils'
import { User, CreditCard, Phone, Calendar, Info, Zap } from 'lucide-react'

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (clientData: Omit<Client, 'id'>) => Promise<void>
  clientToEdit?: Client | null
}

const PLAN_OPTIONS: { value: PlanType; label: string }[] = [
  { value: 'Mensual Completo', label: 'Mensual Completo (Pase libre todos los días)' },
  { value: 'Día por Medio (Mes)', label: 'Día por Medio (Mes - 3 días/semana)' },
  { value: 'Sesión Individual', label: '⚡ Sesión Individual (Pase por día - Sin datos obligatorios)' },
]

export function ClientModal({
  isOpen,
  onClose,
  onSave,
  clientToEdit,
}: ClientModalProps) {
  const [fullName, setFullName] = useState('')
  const [dni, setDni] = useState('')
  const [phone, setPhone] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState<MembershipStatus>('Activo')
  const [planType, setPlanType] = useState<PlanType>('Mensual Completo')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isIndividual = planType === 'Sesión Individual'

  useEffect(() => {
    if (clientToEdit) {
      setFullName(clientToEdit.full_name)
      setDni(clientToEdit.dni)
      setPhone(clientToEdit.phone)
      setStartDate(clientToEdit.start_date)
      setStatus(clientToEdit.status)
      setPlanType(clientToEdit.plan_type || 'Mensual Completo')
    } else {
      setFullName('')
      setDni('')
      setPhone('')
      setStartDate(new Date().toISOString().split('T')[0])
      setStatus('Activo')
      setPlanType('Mensual Completo')
    }
    setErrors({})
  }, [clientToEdit, isOpen])

  const validate = () => {
    const errs: Record<string, string> = {}
    
    // Si es sesión individual, nombre, DNI y teléfono NO son obligatorios
    if (!isIndividual) {
      if (!fullName.trim()) errs.fullName = 'El nombre completo es requerido'
      if (!dni.trim()) errs.dni = 'El DNI / Carnet es obligatorio para planes mensuales'
      if (!phone.trim()) errs.phone = 'El teléfono es obligatorio para planes mensuales'
    }

    if (!startDate) errs.startDate = 'La fecha de inicio es requerida'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      // Valores por defecto si es Sesión Individual y están vacíos
      const randomId = Math.floor(1000 + Math.random() * 9000)
      const finalName = isIndividual && !fullName.trim() 
        ? `Pase Individual #${randomId}` 
        : fullName.trim()

      const finalDni = isIndividual && !dni.trim()
        ? `S/D (Pase #${randomId})`
        : dni.trim().toUpperCase()

      const finalPhone = isIndividual && !phone.trim()
        ? ''
        : phone.trim()

      const endDate = calculateEndDate(startDate, planType)

      await onSave({
        full_name: finalName,
        dni: finalDni,
        phone: finalPhone,
        start_date: startDate,
        end_date: endDate,
        status,
        plan_type: planType,
      })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? 'Editar Socio' : 'Registrar Socio / Pase'}
      description="Ficha del miembro para control de acceso, plan de uso y membresía"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Selector de Plan primero para adaptar el formulario */}
        <Select
          label="Tipo de Plan / Modalidad de Uso *"
          value={planType}
          onChange={(e) => setPlanType(e.target.value as PlanType)}
          options={PLAN_OPTIONS}
        />

        {/* Aviso amigable para sesión individual */}
        {isIndividual && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-2.5 text-xs text-blue-900 flex items-start gap-2 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300 animate-in fade-in">
            <Zap className="h-4 w-4 text-blue-700 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Modo Pase Rápido Activo</p>
              <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5">
                Para <strong>Sesión Individual</strong> no es necesario registrar nombre, carnet ni teléfono. Puedes dejarlos en blanco y el sistema creará un pase automático al instante.
              </p>
            </div>
          </div>
        )}

        {/* Nombre completo */}
        <Input
          label={isIndividual ? 'Nombre del Visitante (Opcional)' : 'Nombre Completo *'}
          placeholder={isIndividual ? 'Opcional (Ej: Juan o dejar en blanco)' : 'Ej: Alejandro Morales Ríos'}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          icon={<User className="h-4 w-4" />}
          autoFocus={!isIndividual}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* DNI */}
          <Input
            label={isIndividual ? 'DNI / Carnet (Opcional)' : 'DNI / Carnet *'}
            placeholder={isIndividual ? 'Opcional para pase diario' : 'Ej: 4892104 LP'}
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            error={errors.dni}
            icon={<CreditCard className="h-4 w-4" />}
          />

          {/* Teléfono */}
          <Input
            label={isIndividual ? 'Teléfono / WhatsApp (Opcional)' : 'Teléfono / WhatsApp *'}
            placeholder={isIndividual ? 'Opcional' : 'Ej: +591 71234567'}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            icon={<Phone className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="date"
            label="Fecha de Inicio *"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={errors.startDate}
            icon={<Calendar className="h-4 w-4" />}
          />

          <Select
            label="Estado Inicial *"
            value={status}
            onChange={(e) => setStatus(e.target.value as MembershipStatus)}
            options={[
              { value: 'Activo', label: 'Activo' },
              { value: 'Inactivo', label: 'Inactivo' },
            ]}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {isIndividual ? '⚡ Registrar Pase Diario' : clientToEdit ? 'Guardar Cambios' : 'Registrar Socio'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
