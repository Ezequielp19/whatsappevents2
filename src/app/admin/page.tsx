'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  createEvent, 
  Event 
} from '@/lib/firebase'
import { subscribeToMessages, approveMessage, rejectMessage, Message } from '@/lib/pusher-messages'
import QRCode from 'qrcode'
import { 
  MessageCircle, 
  Check, 
  X, 
  QrCode, 
  Monitor,
  Play,
  Eye,
  Users
} from 'lucide-react'
import EventCustomizationModal, { EventCustomizationData } from '../components/EventCustomizationModal'
import Image from 'next/image'
import jsPDF from 'jspdf'

export default function AdminPage() {
  const [event, setEvent] = useState<Event | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showCustomizationModal, setShowCustomizationModal] = useState(false)

  // Función helper para convertir fechas de Firebase
  const formatDate = (date: Date | { seconds: number } | string | number | null | undefined) => {
    if (!date) return '--:--'
    
    let dateObj: Date
    
    // Si es un Timestamp de Firebase
    if (date && typeof date === 'object' && 'seconds' in date && typeof date.seconds === 'number') {
      dateObj = new Date(date.seconds * 1000)
    } else if (date instanceof Date) {
      dateObj = date
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date)
    } else {
      return '--:--'
    }
    
    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      return '--:--'
    }
    
    return dateObj.toLocaleString('es-ES')
  }

  // Crear nuevo evento con personalización
  const handleCreateEvent = async (data: EventCustomizationData) => {
    setIsLoading(true)
    try {
      const newEvent = await createEvent(
        data.name,
        data.displayName,
        data.backgroundColor,
        data.textColor,
        data.backgroundImage
      )
      setEvent(newEvent)
      
      // Generar QR
      const qrUrl = await QRCode.toDataURL(`${window.location.origin}/guest?event=${newEvent.qrCode}`)
      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Error al crear el evento')
    } finally {
      setIsLoading(false)
    }
  }

  // Abrir modal de personalización
  const openCustomizationModal = () => {
    setShowCustomizationModal(true)
  }

  // Los mensajes se cargan automáticamente con la suscripción de Pusher

  // Aprobar mensaje
  const approveMessageHandler = async (messageId: string) => {
    try {
      console.log('🔧 Admin - Aprobando mensaje:', messageId)
      await approveMessage(messageId, event!.id)
      console.log('✅ Admin - Mensaje aprobado exitosamente:', messageId)
    } catch (error) {
      console.error('❌ Admin - Error approving message:', error)
    }
  }

  // Rechazar mensaje
  const rejectMessageHandler = async (messageId: string) => {
    try {
      rejectMessage(messageId, event!.id)
    } catch (error) {
      console.error('Error rejecting message:', error)
    }
  }

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!event) return

    const unsubscribe = subscribeToMessages(event.id, (messages) => {
      setMessages(messages)
    })

    return () => unsubscribe()
  }, [event])

  // Los mensajes se cargan automáticamente con la suscripción de Pusher

  const pendingMessages = messages.filter(m => m.status === 'pending')
  const approvedMessages = messages.filter(m => m.status === 'approved')

  const downloadApprovedPDF = () => {
    const doc = new jsPDF()
    doc.text('Invitados con mensajes aprobados', 10, 10)
    approvedMessages.forEach((msg, i) => {
      doc.text(`${i + 1}. ${msg.guestName} - ${msg.guestPhone}`, 10, 20 + i * 10)
    })
    doc.save('invitados_aprobados.pdf')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🎉 WhatsApp Events
              </h1>
              <p className="text-gray-600 mt-1">Panel de Administración</p>
            </div>
            <div className="flex items-center space-x-4">
              {event && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Evento Activo</p>
                  <p className="font-semibold text-gray-900">{event.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!event ? (
          /* Sin evento activo */
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">🎪</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No hay evento activo
              </h2>
              <p className="text-gray-600 mb-6">
                Crea un nuevo evento para comenzar a recibir mensajes de los invitados
              </p>
              <button
                onClick={openCustomizationModal}
                disabled={isLoading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Crear Evento Personalizado
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Con evento activo */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* QR Code */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <QrCode className="mr-2" />
                  QR para Invitados
                </h2>
                {qrCodeUrl && (
                  <div className="text-center">
                    <Image src={qrCodeUrl} alt="QR Code" width={200} height={200} className="mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-4">
                      Los invitados escanean este QR para enviar mensajes
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => window.open(`/public?event=${event.qrCode}`, '_blank')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Pantalla
                      </button>
                      <button
                        onClick={() => window.open(`/guest?event=${event.qrCode}`, '_blank')}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Vista Invitado
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mensajes Pendientes */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <MessageCircle className="mr-2" />
                  Mensajes Pendientes ({pendingMessages.length})
                </h2>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pendingMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay mensajes pendientes</p>
                    </div>
                  ) : (
                    pendingMessages.map((message) => (
                      <div key={message.id} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold text-gray-900">{message.guestName}</span>
                            <span className="text-sm text-gray-700 ml-2">({message.guestPhone})</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-900 mb-3 font-medium">{message.message}</p>
                        {message.image && (
                          <div className="mb-3">
                            <img 
                              src={message.image} 
                              alt="Imagen del mensaje" 
                              className="max-w-full h-auto max-h-48 rounded-lg border"
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveMessageHandler(message.id)}
                            className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => rejectMessageHandler(message.id)}
                            className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Mensajes Aprobados */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Check className="mr-2" />
                  Mensajes Aprobados ({approvedMessages.length})
                </h2>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {approvedMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Check className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay mensajes aprobados</p>
                    </div>
                  ) : (
                    approvedMessages.map((message) => (
                      <div key={message.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold text-gray-900">{message.guestName}</span>
                            <span className="text-sm text-gray-700 ml-2">({message.guestPhone})</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-900 mb-3 font-medium">{message.message}</p>
                        {message.image && (
                          <div className="mb-3">
                            <img 
                              src={message.image} 
                              alt="Imagen del mensaje" 
                              className="max-w-full h-auto max-h-48 rounded-lg border"
                            />
                          </div>
                        )}
                        <div className="flex items-center text-green-600 text-sm">
                          <Check className="w-4 h-4 mr-1" />
                          Aprobado
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Estadísticas */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Mensajes:</span>
                    <span className="font-semibold">{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pendientes:</span>
                    <span className="font-semibold text-yellow-600">{pendingMessages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aprobados:</span>
                    <span className="font-semibold text-green-600">{approvedMessages.length}</span>
                  </div>
                </div>
                <button
                  onClick={downloadApprovedPDF}
                  className="w-full bg-gray-700 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition-colors mt-4"
                >
                  Descargar PDF de invitados aprobados
                </button>
              </div>

              {/* Acciones Rápidas */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Acciones</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => window.open(`/public?event=${event.qrCode}`, '_blank')}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    Abrir Pantalla
                  </button>
                  <button
                    onClick={openCustomizationModal}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Nuevo Evento
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Personalización */}
      <EventCustomizationModal
        isOpen={showCustomizationModal}
        onClose={() => setShowCustomizationModal(false)}
        onCreateEvent={handleCreateEvent}
      />
    </div>
  )
}
