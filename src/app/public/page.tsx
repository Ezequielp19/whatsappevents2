'use client'

import { useState, useEffect, useRef } from 'react'
import { getEventByCode, Event, subscribeToEvent } from '@/lib/firebase'
import { subscribeToMessages, Message } from '@/lib/pusher-messages'
import { MessageCircle, QrCode, Sparkles } from 'lucide-react'
import Image from 'next/image'

export default function PublicPage() {
  const [event, setEvent] = useState<Event | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [, setNewMessageCount] = useState(0)
  const [showNewMessageEffect, setShowNewMessageEffect] = useState(false)
  const [shouldShake, setShouldShake] = useState(false)
  const [rippleWaves, setRippleWaves] = useState<Array<{ id: string; x: number; y: number }>>([])
  const [sparkleParticles, setSparkleParticles] = useState<Array<{ id: string; x: number; y: number }>>([])

  // Ref para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isFirstLoad = useRef(true)
  const previousMessagesRef = useRef<Message[]>([])
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const processedMessagesRef = useRef<Set<string>>(new Set())

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

  // Suscribirse a cambios del evento en tiempo real
  useEffect(() => {
    if (!event) return

    const eventId = event.id
    const unsubscribeEvent = subscribeToEvent(eventId, (updatedEvent) => {
      setEvent(updatedEvent)
    })

    return () => unsubscribeEvent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id])

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!event) return

    const eventId = event.id
    const unsubscribe = subscribeToMessages(eventId, (newMessages) => {
      // Actualizar mensajes
      previousMessagesRef.current = newMessages
      setMessages(newMessages)
    })

    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id])

  // Detectar mensajes nuevos y aplicar efectos
  useEffect(() => {
    if (!event || messages.length === 0) return

    const approvedMessages = messages.filter(m => m.status === 'approved')
    const effects = event.effects || {}

    // Detectar mensajes realmente nuevos (no procesados antes)
    const newMessageIds = approvedMessages
      .filter(m => !processedMessagesRef.current.has(m.id))
      .map(m => m.id)

    if (newMessageIds.length > 0) {
      console.log('🎉 Nuevo mensaje aprobado detectado!', newMessageIds)

      // Marcar como procesados
      newMessageIds.forEach(id => processedMessagesRef.current.add(id))

      setNewMessageCount(prev => prev + 1)
      setShowNewMessageEffect(true)
      setTimeout(() => {
        setShowNewMessageEffect(false)
      }, 3000)

      // Aplicar efectos según configuración
      if (effects.shake) {
        setShouldShake(true)
        setTimeout(() => setShouldShake(false), 1000)
      }

      // Aplicar efectos visuales después de que el DOM se actualice
      setTimeout(() => {
        newMessageIds.forEach((msgId) => {
          const messageElement = messageRefs.current.get(msgId)
          if (messageElement) {
            const rect = messageElement.getBoundingClientRect()
            const x = rect.left + rect.width / 2
            const y = rect.top + rect.height / 2

            // Efecto de ondas expansivas
            if (effects.rippleWaves) {
              const waveId = `wave-${msgId}-${Date.now()}`
              setRippleWaves(prev => [...prev, { id: waveId, x, y }])

              setTimeout(() => {
                setRippleWaves(prev => prev.filter(w => w.id !== waveId))
              }, 2000)
            }

            // Efecto de partículas brillantes
            if (effects.sparkleParticles) {
              // Crear múltiples partículas
              for (let i = 0; i < 20; i++) {
                const particleId = `particle-${msgId}-${Date.now()}-${i}`
                const angle = (Math.PI * 2 * i) / 20
                const distance = 50 + Math.random() * 100
                setSparkleParticles(prev => [...prev, {
                  id: particleId,
                  x: x + Math.cos(angle) * distance,
                  y: y + Math.sin(angle) * distance
                }])

                setTimeout(() => {
                  setSparkleParticles(prev => prev.filter(p => p.id !== particleId))
                }, 1500)
              }
            }
          }
        })
      }, 200) // Delay para asegurar que el DOM esté actualizado
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, event?.id])

  // Scroll automático cuando cambian los mensajes
  useEffect(() => {
    if (messages.length > 0) {
      // Pequeño delay para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        // Scroll inmediato la primera vez, suave después
        const behavior = isFirstLoad.current ? 'auto' : 'smooth'
        messagesEndRef.current?.scrollIntoView({ behavior })
        isFirstLoad.current = false
      }, 100)
    }
  }, [messages])


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
  // Invertir orden: más antiguos arriba, más recientes abajo (como WhatsApp)
  const approvedMessages = messages.filter(m => m.status === 'approved').reverse()
  const messagesToShow = approvedMessages

  return (
    <div
      className={`min-h-screen relative ${shouldShake ? 'shake-effect' : ''} ${event.effects?.neonLights ? 'neon-lights-effect' : ''}`}
      style={{
        backgroundColor: event.backgroundVideo ? 'transparent' : event.backgroundColor,
        color: event.textColor,
        backgroundImage: event.backgroundImage && !event.backgroundVideo ? `url(${event.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed',
        position: 'relative',
        minHeight: '100vh'
      }}
    >
      {/* Video de fondo en loop */}
      {event.backgroundVideo && (
        <video
          src={event.backgroundVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="fixed inset-0 w-full h-full object-cover"
          style={{
            pointerEvents: 'none',
            zIndex: -1,
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            minWidth: '100%',
            minHeight: '100%'
          }}
          onError={(e) => {
            console.error('Error cargando video:', e)
            console.log('URL del video:', event.backgroundVideo)
            const videoElement = e.target as HTMLVideoElement
            console.log('Error code:', videoElement.error?.code)
            console.log('Error message:', videoElement.error?.message)
          }}
          onLoadedData={() => {
            console.log('✅ Video cargado exitosamente:', event.backgroundVideo)
          }}
          onCanPlay={() => {
            console.log('✅ Video listo para reproducir')
            const videoElement = document.querySelector('video') as HTMLVideoElement
            if (videoElement) {
              videoElement.play().catch(err => {
                console.error('Error al reproducir:', err)
              })
            }
          }}
        >
          <source src={event.backgroundVideo} type="video/mp4" />
          <source src={event.backgroundVideo} type="video/webm" />
          Tu navegador no soporta videos.
        </video>
      )}

      {/* Overlay para mejor legibilidad si hay video */}
      {event.backgroundVideo && (
        <div
          className="fixed inset-0 bg-black"
          style={{
            opacity: 0.3,
            zIndex: 0,
            pointerEvents: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh'
          }}
        />
      )}

      {/* Contenido con z-index relativo */}
      <div className="relative" style={{ zIndex: 1, position: 'relative' }}>
        {/* Ondas Expansivas */}
        {rippleWaves.map((wave) => (
          <div
            key={wave.id}
            className="ripple-wave"
            style={{
              left: `${wave.x}px`,
              top: `${wave.y}px`,
            }}
          />
        ))}

        {/* Partículas Brillantes */}
        {sparkleParticles.map((particle) => (
          <div
            key={particle.id}
            className="sparkle-particle"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
            }}
          />
        ))}
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
                filter: (event.backgroundImage || event.backgroundVideo) ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' : undefined
              }}
            />
          </div>
        )}

        {/* Header */}
        <div
          className={`border-b p-6 relative ${event.effects?.neonLights ? 'neon-lights-effect' : ''}`}
          style={{
            backgroundColor: (event.backgroundImage || event.backgroundVideo) ? 'rgba(0,0,0,0.7)' : undefined,
            backdropFilter: (event.backgroundImage || event.backgroundVideo) ? 'blur(10px)' : undefined
          }}
        >
          {/* Efecto de mensaje nuevo */}
          {showNewMessageEffect && (
            <div className="absolute top-4 right-4 animate-bounceIn z-20">
              <div className="bg-green-500 text-white px-6 py-3 rounded-full flex items-center space-x-2 shadow-2xl border-2 border-white">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span className="text-base font-bold">¡Nuevo mensaje!</span>
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto text-center">
            <h1 className={`text-4xl font-bold mb-2 ${event.effects?.neonLights ? 'neon-lights-effect' : ''}`}>
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
            className="rounded-lg min-h-[50vh] max-h-[80vh] overflow-y-auto relative"
            style={{
              backgroundColor: (event.backgroundImage || event.backgroundVideo) ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)',
              backdropFilter: (event.backgroundImage || event.backgroundVideo) ? 'blur(10px)' : undefined
            }}
          >
            {/* Background Media for Chat Box using waitingScreen media */}
            {event.waitingScreenVideo && (
              <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none z-0">
                <video
                  src={event.waitingScreenVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            )}
            {!event.waitingScreenVideo && event.waitingScreenImage && (
              <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none z-0">
                <Image
                  src={event.waitingScreenImage}
                  alt="Background"
                  fill
                  className="object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            )}

            {/* Texto de espera si no hay mensajes */}
            {messagesToShow.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10 pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl">
                  <h2 className="text-2xl font-bold mb-2 text-white">¡Esperando mensajes!</h2>
                  <p className="text-white/80">Escaneá el QR para ser el primero en escribir</p>
                </div>
              </div>
            )}

            <div className="p-4 space-y-4 relative z-10">
              {messagesToShow.length === 0 && !event.waitingScreenVideo && !event.waitingScreenImage ? (
                <div className="text-center py-8 opacity-90">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h2 className="text-lg font-semibold mb-2">¡Esperando mensajes!</h2>
                  <p className="text-sm">Los mensajes aparecerán aquí cuando sean aprobados por el administrador</p>
                </div>
              ) : (
                <>
                  {messagesToShow.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex items-end space-x-3 mb-3 ${index % 2 === 0 ? 'animate-slideInLeft' : 'animate-slideInRight'
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
                        <div
                          ref={(el) => {
                            if (el) messageRefs.current.set(message.id, el)
                          }}
                          className={`whatsapp-bubble-other relative ${event.effects?.neonLights ? 'neon-lights-effect' : ''}`}
                        >
                          <div className="text-gray-800 break-words">
                            {message.message}
                          </div>
                          {message.image && (
                            <div className="w-[180px] h-32 mt-2 rounded-lg overflow-hidden border shadow-sm">
                              <Image
                                src={message.image}
                                alt="Imagen enviada"
                                width={180}
                                height={128}
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
                  ))}
                  {/* Elemento invisible al final para scroll automático */}
                  <div ref={messagesEndRef} />
                </>
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
    </div>
  )
}
