import { NextRequest, NextResponse } from 'next/server'
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: '2053317',
  key: '0bd455430523b265ba9f',
  secret: '4ecec29dd32be0dfa843',
  cluster: 'us2',
  useTLS: true
})

export async function POST(req: NextRequest) {
  try {
    console.log('Pusher API - Iniciando request...')
    
    const body = await req.json()
    console.log('Pusher API - Body recibido exitosamente')
    
    const { channel, event, data } = body
    console.log('Pusher API - Channel:', channel)
    console.log('Pusher API - Event:', event)
    console.log('Pusher API - Data keys:', Object.keys(data))
    console.log('Pusher API - Has image:', !!data.image)
    console.log('Pusher API - Image length:', data.image ? data.image.length : 0)

    // Verificar tamaño de la imagen - límite más estricto para Pusher
    if (data.image && data.image.length > 200000) { // 200KB en caracteres base64
      console.log('Pusher API - Imagen demasiado grande:', data.image.length)
      return NextResponse.json({ 
        success: false, 
        error: 'Imagen demasiado grande. Máximo 200KB.' 
      }, { status: 400 })
    }

    console.log('Pusher API - Intentando trigger...')
    
    // Manejar diferentes tipos de eventos
    let dataToSend
    if (event === 'client-new-message') {
      // Para mensajes nuevos, incluir imagen
      dataToSend = {
        id: data.id,
        eventId: data.eventId,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        message: data.message,
        status: data.status,
        createdAt: data.createdAt,
        image: data.image
      }
      console.log('Pusher API - Enviando mensaje nuevo con imagen')
    } else {
      // Para otros eventos (aprobación, rechazo), enviar datos tal como llegan
      dataToSend = data
      console.log('Pusher API - Enviando evento:', event, 'con datos:', dataToSend)
    }
    
    await pusher.trigger(channel, event, dataToSend)
    console.log('Pusher API - Trigger exitoso')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Mensaje enviado correctamente'
    })
  } catch (error) {
    console.error('Pusher API Error completo:', error)
    console.error('Pusher API Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Pusher API Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
