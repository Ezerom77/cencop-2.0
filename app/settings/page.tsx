'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/Tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/AlertDialog'
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Mail,
  Smartphone,
  Globe,
  Palette,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  Lock,
  Users,
  FileText,
  Monitor,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import Layout from '@/components/layout/Layout'

interface UserSettings {
  profile: {
    name: string
    email: string
    phone?: string
    avatar?: string
    department: string
    position: string
    timezone: string
    language: string
  }
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    taskUpdates: boolean
    projectUpdates: boolean
    systemAlerts: boolean
    weeklyReports: boolean
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    passwordLastChanged: string
    loginHistory: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    dateFormat: string
    timeFormat: '12h' | '24h'
    defaultView: 'table' | 'cards'
    itemsPerPage: number
    autoRefresh: boolean
    refreshInterval: number
  }
}

interface SystemSettings {
  general: {
    companyName: string
    companyLogo?: string
    timezone: string
    language: string
    currency: string
    dateFormat: string
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    fromEmail: string
    fromName: string
    encryption: 'none' | 'tls' | 'ssl'
  }
  backup: {
    autoBackup: boolean
    backupFrequency: 'daily' | 'weekly' | 'monthly'
    retentionDays: number
    lastBackup?: string
  }
  maintenance: {
    maintenanceMode: boolean
    maintenanceMessage: string
    allowedIPs: string[]
  }
}

const SettingsPage = () => {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const [userResponse, systemResponse] = await Promise.all([
        fetch('/api/settings/user'),
        fetch('/api/settings/system')
      ])

      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUserSettings(userData.settings)
      }

      if (systemResponse.ok) {
        const systemData = await systemResponse.json()
        setSystemSettings(systemData.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const saveUserSettings = async () => {
    if (!userSettings) return

    try {
      setSaving(true)
      const response = await fetch('/api/settings/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userSettings),
      })

      if (response.ok) {
        toast.success('Configuración guardada exitosamente')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al guardar la configuración')
      }
    } catch (error) {
      console.error('Error saving user settings:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const saveSystemSettings = async () => {
    if (!systemSettings) return

    try {
      setSaving(true)
      const response = await fetch('/api/settings/system', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(systemSettings),
      })

      if (response.ok) {
        toast.success('Configuración del sistema guardada exitosamente')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al guardar la configuración del sistema')
      }
    } catch (error) {
      console.error('Error saving system settings:', error)
      toast.error('Error al guardar la configuración del sistema')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (response.ok) {
        toast.success('Contraseña cambiada exitosamente')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al cambiar la contraseña')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Error al cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  const createBackup = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings/backup', {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Respaldo creado exitosamente')
        fetchSettings() // Refresh to get updated last backup time
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al crear el respaldo')
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      toast.error('Error al crear el respaldo')
    } finally {
      setSaving(false)
    }
  }

  const testEmailSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings/test-email', {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Email de prueba enviado exitosamente')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al enviar el email de prueba')
      }
    } catch (error) {
      console.error('Error testing email:', error)
      toast.error('Error al enviar el email de prueba')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !userSettings) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando configuración...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">
            Personaliza tu experiencia y configura el sistema
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Preferencias
            </TabsTrigger>
            {session?.user?.role === 'ADMIN' && (
              <>
                <TabsTrigger value="system" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Sistema
                </TabsTrigger>
                <TabsTrigger value="backup" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Respaldos
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Actualiza tu información de perfil y datos de contacto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      value={userSettings.profile.name}
                      onChange={(e) => setUserSettings({
                        ...userSettings,
                        profile: { ...userSettings.profile, name: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userSettings.profile.email}
                      onChange={(e) => setUserSettings({
                        ...userSettings,
                        profile: { ...userSettings.profile, email: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={userSettings.profile.phone || ''}
                      onChange={(e) => setUserSettings({
                        ...userSettings,
                        profile: { ...userSettings.profile, phone: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={userSettings.profile.department}
                      onChange={(e) => setUserSettings({
                        ...userSettings,
                        profile: { ...userSettings.profile, department: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      value={userSettings.profile.position}
                      onChange={(e) => setUserSettings({
                        ...userSettings,
                        profile: { ...userSettings.profile, position: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zona horaria</Label>
                    <Select
                      value={userSettings.profile.timezone}
                      onValueChange={(value) => setUserSettings({
                        ...userSettings,
                        profile: { ...userSettings.profile, timezone: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                        <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokio (GMT+9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveUserSettings} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferencias de Notificaciones</CardTitle>
                <CardDescription>
                  Configura cómo y cuándo quieres recibir notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificaciones por email</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe notificaciones en tu correo electrónico
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications.email}
                      onCheckedChange={(checked) => setUserSettings({
                        ...userSettings,
                        notifications: { ...userSettings.notifications, email: checked }
                      })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificaciones push</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe notificaciones en el navegador
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications.push}
                      onCheckedChange={(checked) => setUserSettings({
                        ...userSettings,
                        notifications: { ...userSettings.notifications, push: checked }
                      })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Actualizaciones de tareas</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificaciones cuando se actualicen las tareas
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications.taskUpdates}
                      onCheckedChange={(checked) => setUserSettings({
                        ...userSettings,
                        notifications: { ...userSettings.notifications, taskUpdates: checked }
                      })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Actualizaciones de proyectos</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificaciones cuando se actualicen los proyectos
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications.projectUpdates}
                      onCheckedChange={(checked) => setUserSettings({
                        ...userSettings,
                        notifications: { ...userSettings.notifications, projectUpdates: checked }
                      })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas del sistema</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificaciones importantes del sistema
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications.systemAlerts}
                      onCheckedChange={(checked) => setUserSettings({
                        ...userSettings,
                        notifications: { ...userSettings.notifications, systemAlerts: checked }
                      })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reportes semanales</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe un resumen semanal por email
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications.weeklyReports}
                      onCheckedChange={(checked) => setUserSettings({
                        ...userSettings,
                        notifications: { ...userSettings.notifications, weeklyReports: checked }
                      })}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveUserSettings} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Seguridad</CardTitle>
                <CardDescription>
                  Gestiona la seguridad de tu cuenta y sesiones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Autenticación de dos factores</Label>
                      <p className="text-sm text-muted-foreground">
                        Añade una capa extra de seguridad a tu cuenta
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.security.twoFactorEnabled}
                      onCheckedChange={(checked) => setUserSettings({
                        ...userSettings,
                        security: { ...userSettings.security, twoFactorEnabled: checked }
                      })}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Tiempo de sesión (minutos)</Label>
                    <Select
                      value={userSettings.security.sessionTimeout.toString()}
                      onValueChange={(value) => setUserSettings({
                        ...userSettings,
                        security: { ...userSettings.security, sessionTimeout: parseInt(value) }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                        <SelectItem value="480">8 horas</SelectItem>
                        <SelectItem value="1440">24 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveUserSettings} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Cambiar Contraseña</CardTitle>
                <CardDescription>
                  Actualiza tu contraseña para mantener tu cuenta segura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={changePassword}
                    disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {saving ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="mr-2 h-4 w-4" />
                    )}
                    Cambiar contraseña
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Settings */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferencias de Interfaz</CardTitle>
                <CardDescription>
                  Personaliza la apariencia y comportamiento de la aplicación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema</Label>
                    <Select
                      value={userSettings.preferences.theme}
                      onValueChange={(value: 'light' | 'dark' | 'system') => setUserSettings({
                        ...userSettings,
                        preferences: { ...userSettings.preferences, theme: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Oscuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Formato de fecha</Label>
                    <Select
                      value={userSettings.preferences.dateFormat}
                      onValueChange={(value) => setUserSettings({
                        ...userSettings,
                        preferences: { ...userSettings.preferences, dateFormat: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeFormat">Formato de hora</Label>
                    <Select
                      value={userSettings.preferences.timeFormat}
                      onValueChange={(value: '12h' | '24h') => setUserSettings({
                        ...userSettings,
                        preferences: { ...userSettings.preferences, timeFormat: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
                        <SelectItem value="24h">24 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultView">Vista predeterminada</Label>
                    <Select
                      value={userSettings.preferences.defaultView}
                      onValueChange={(value: 'table' | 'cards') => setUserSettings({
                        ...userSettings,
                        preferences: { ...userSettings.preferences, defaultView: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="table">Tabla</SelectItem>
                        <SelectItem value="cards">Tarjetas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemsPerPage">Elementos por página</Label>
                    <Select
                      value={userSettings.preferences.itemsPerPage.toString()}
                      onValueChange={(value) => setUserSettings({
                        ...userSettings,
                        preferences: { ...userSettings.preferences, itemsPerPage: parseInt(value) }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refreshInterval">Intervalo de actualización (segundos)</Label>
                    <Select
                      value={userSettings.preferences.refreshInterval.toString()}
                      onValueChange={(value) => setUserSettings({
                        ...userSettings,
                        preferences: { ...userSettings.preferences, refreshInterval: parseInt(value) }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 segundos</SelectItem>
                        <SelectItem value="60">1 minuto</SelectItem>
                        <SelectItem value="300">5 minutos</SelectItem>
                        <SelectItem value="600">10 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Actualización automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Actualizar datos automáticamente en segundo plano
                    </p>
                  </div>
                  <Switch
                    checked={userSettings.preferences.autoRefresh}
                    onCheckedChange={(checked) => setUserSettings({
                      ...userSettings,
                      preferences: { ...userSettings.preferences, autoRefresh: checked }
                    })}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveUserSettings} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings (Admin only) */}
          {session?.user?.role === 'ADMIN' && systemSettings && (
            <>
              <TabsContent value="system" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración General del Sistema</CardTitle>
                    <CardDescription>
                      Configura los ajustes generales de la aplicación
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Nombre de la empresa</Label>
                        <Input
                          id="companyName"
                          value={systemSettings.general.companyName}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            general: { ...systemSettings.general, companyName: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Moneda</Label>
                        <Select
                          value={systemSettings.general.currency}
                          onValueChange={(value) => setSystemSettings({
                            ...systemSettings,
                            general: { ...systemSettings.general, currency: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
                            <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                            <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={saveSystemSettings} disabled={saving}>
                        {saving ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Guardar cambios
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Email</CardTitle>
                    <CardDescription>
                      Configura el servidor SMTP para envío de emails
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtpHost">Servidor SMTP</Label>
                        <Input
                          id="smtpHost"
                          value={systemSettings.email.smtpHost}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            email: { ...systemSettings.email, smtpHost: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">Puerto</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={systemSettings.email.smtpPort}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            email: { ...systemSettings.email, smtpPort: parseInt(e.target.value) }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpUser">Usuario</Label>
                        <Input
                          id="smtpUser"
                          value={systemSettings.email.smtpUser}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            email: { ...systemSettings.email, smtpUser: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fromEmail">Email remitente</Label>
                        <Input
                          id="fromEmail"
                          type="email"
                          value={systemSettings.email.fromEmail}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            email: { ...systemSettings.email, fromEmail: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={testEmailSettings} disabled={saving}>
                        <Mail className="mr-2 h-4 w-4" />
                        Probar configuración
                      </Button>
                      <Button onClick={saveSystemSettings} disabled={saving}>
                        {saving ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Guardar cambios
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Backup Settings */}
              <TabsContent value="backup" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Respaldos</CardTitle>
                    <CardDescription>
                      Gestiona los respaldos automáticos de la base de datos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Respaldos automáticos</Label>
                        <p className="text-sm text-muted-foreground">
                          Crear respaldos automáticamente según la frecuencia configurada
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.backup.autoBackup}
                        onCheckedChange={(checked) => setSystemSettings({
                          ...systemSettings,
                          backup: { ...systemSettings.backup, autoBackup: checked }
                        })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="backupFrequency">Frecuencia</Label>
                        <Select
                          value={systemSettings.backup.backupFrequency}
                          onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setSystemSettings({
                            ...systemSettings,
                            backup: { ...systemSettings.backup, backupFrequency: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diario</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="retentionDays">Retención (días)</Label>
                        <Input
                          id="retentionDays"
                          type="number"
                          value={systemSettings.backup.retentionDays}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            backup: { ...systemSettings.backup, retentionDays: parseInt(e.target.value) }
                          })}
                        />
                      </div>
                    </div>
                    {systemSettings.backup.lastBackup && (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">
                            Último respaldo: {new Date(systemSettings.backup.lastBackup).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={createBackup} disabled={saving}>
                        {saving ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Crear respaldo ahora
                      </Button>
                      <Button onClick={saveSystemSettings} disabled={saving}>
                        {saving ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Guardar cambios
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </Layout>
  )
}

export default SettingsPage