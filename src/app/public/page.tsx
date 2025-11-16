'use client'

import { useState, useEffect } from 'react'
import { getEventByCode, Event } from '@/lib/firebase'
import { subscribeToMessages, Message } from '@/lib/pusher-messages'
import { MessageCircle, QrCode, Sparkles } from 'lucide-react'
import Image from 'next/image'

export default function PublicPage() {
  const [event, setEvent] = useState<Event | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [, setNewMessageCount] = useState(0)
  const [showNewMessageEffect, setShowNewMessageEffect] = useState(false)

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
    
    return dateObj.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const eventCode = urlParams.get('event')
    
    if (eventCode) {
      loadEventByCode(eventCode)
    } else {
      setIsLoading(false)
    }
  }, [])

  const loadEventByCode = async (code: string) => {
    try {
      const eventData = await getEventByCode(code)
      if (eventData) {
        setEvent(eventData)
        setIsLoading(false)
      } else {
        console.error('Event not found')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error loading event:', error)
      setIsLoading(false)
    }
  }

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!event) return

    const unsubscribe = subscribeToMessages(event.id, (newMessages) => {
      console.log('🔍 Pantalla pública - Todos los mensajes recibidos:', newMessages.map(m => ({
        id: m.id, 
        status: m.status, 
        message: m.message.substring(0, 50) + '...',
        guestName: m.guestName
      })))
      
      const approvedMessages = newMessages.filter(m => m.status === 'approved')
      console.log('✅ Pantalla pública - Mensajes aprobados:', approvedMessages.map(m => ({
        id: m.id, 
        message: m.message.substring(0, 50) + '...',
        guestName: m.guestName
      })))
      
      // Detectar mensajes nuevos
      if (messages.length > 0 && approvedMessages.length > messages.filter(m => m.status === 'approved').length) {
        console.log('🎉 Nuevo mensaje aprobado detectado!')
        setNewMessageCount(prev => prev + 1)
        setShowNewMessageEffect(true)
        setTimeout(() => {
          setShowNewMessageEffect(false)
        }, 3000)
      }
      setMessages(newMessages)
    })

    return () => unsubscribe()
  }, [event])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p>Cargando evento...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Evento no encontrado</h1>
          <p className="text-gray-400">Verifica que la URL sea correcta</p>
        </div>
      </div>
    )
  }

  // Filtrar solo mensajes aprobados para mostrar en pantalla pública
  const approvedMessages = messages.filter(m => m.status === 'approved')
  const messagesToShow = approvedMessages
  
  return (
    <div 
      className="min-h-screen relative"
      style={{ 
        backgroundColor: event.backgroundColor,
        color: event.textColor,
        backgroundImage: event.backgroundImage ? `url(${event.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Logo en posición absoluta */}
      {event.logo && (
        <div 
          className="absolute z-10"
          style={{
            ...(event.logoPosition === 'top-left' && { top: '1rem', left: '1rem' }),
            ...(event.logoPosition === 'top-center' && { top: '1rem', left: '50%', transform: 'translateX(-50%)' }),
            ...(event.logoPosition === 'top-right' && { top: '1rem', right: '1rem' }),
            ...(event.logoPosition === 'left' && { top: '50%', left: '1rem', transform: 'translateY(-50%)' }),
            ...(event.logoPosition === 'center' && { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }),
            ...(event.logoPosition === 'right' && { top: '50%', right: '1rem', transform: 'translateY(-50%)' }),
            ...(event.logoPosition === 'bottom-left' && { bottom: '1rem', left: '1rem' }),
            ...(event.logoPosition === 'bottom-center' && { bottom: '1rem', left: '50%', transform: 'translateX(-50%)' }),
            ...(event.logoPosition === 'bottom-right' && { bottom: '1rem', right: '1rem' }),
            ...(!event.logoPosition && { top: '1rem', left: '1rem' }) // Default a top-left si no hay posición
          }}
        >
          <Image
            src={event.logo}
            alt="Logo del evento"
            width={120}
            height={120}
            className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-lg"
            style={{
              filter: event.backgroundImage ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' : undefined
            }}
          />
        </div>
      )}

      {/* Header */}
      <div 
        className="border-b p-6 relative"
        style={{ 
          backgroundColor: event.backgroundImage ? 'rgba(0,0,0,0.7)' : undefined,
          backdropFilter: event.backgroundImage ? 'blur(10px)' : undefined
        }}
      >
        {/* Efecto de mensaje nuevo */}
        {showNewMessageEffect && (
          <div className="absolute top-4 right-4 animate-bounceIn">
            <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center space-x-2 shadow-lg">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">¡Nuevo mensaje!</span>
            </div>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-2">
            {event.displayName}
          </h1>
          <div className="flex items-center justify-center opacity-90">
            <QrCode className="w-6 h-6 mr-2" />
            <span className="text-lg">Escaneá el QR para participar</span>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div 
          className="rounded-lg p-4 min-h-[50vh] overflow-y-auto"
          style={{ 
            backgroundColor: event.backgroundImage ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)',
            backdropFilter: event.backgroundImage ? 'blur(10px)' : undefined
          }}
        >
          <div className="space-y-4">
            {messagesToShow.length === 0 ? (
              <div className="text-center py-8 opacity-90">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h2 className="text-lg font-semibold mb-2">¡Esperando mensajes!</h2>
                <p className="text-sm">Los mensajes aparecerán aquí cuando sean aprobados por el administrador</p>
              </div>
            ) : (
              messagesToShow.map((message, index) => (
                <div 
                  key={message.id} 
                  className={`flex items-end space-x-3 mb-3 ${
                    index % 2 === 0 ? 'animate-slideInLeft' : 'animate-slideInRight'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ 
                    background: 'linear-gradient(135deg, #25d366, #128c7e)',
                    color: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {message.guestName.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Mensaje */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm opacity-90">{message.guestName}</span>
                      <span className="text-xs opacity-60">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    
                    {/* Burbuja de mensaje */}
                    <div className="whatsapp-bubble-other relative">
                      <div className="text-gray-800 break-words">
                        {message.message}
                      </div>
                      {message.image && (
                        <div className="w-[180px] h-32 mt-2 rounded-lg overflow-hidden border shadow-sm">
                          <img 
                            src={message.image} 
                            alt="Imagen enviada" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      )}
                      <div className="message-time-left text-gray-500">
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 opacity-70">
          <p className="text-xs">
            WhatsApp Events - Mensajes en tiempo real
          </p>
        </div>
      </div>
    </div>
  )
}
