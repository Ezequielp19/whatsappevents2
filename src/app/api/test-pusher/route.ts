import { NextRequest, NextResponse } from 'next/server'
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: '2053317',
  key: '0bd455430523b265ba9f',
  secret: '4ecec29dd32be0dfa843',
  cluster: 'us2',
  useTLS: true
})

export async function GET(req: NextRequest) {
  try {
    console.log('Test Pusher GET - Iniciando...')
    
    // Probar con datos simples
    const testData = {
      message: 'Test message from GET',
      timestamp: new Date().toISOString()
    }
    
    console.log('Test Pusher GET - Enviando datos simples...')
    await pusher.trigger('test-channel', 'test-event', testData)
    console.log('Test Pusher GET - Éxito')
    
    return NextResponse.json({ success: true, message: 'Test GET exitoso' })
  } catch (error) {
    console.error('Test Pusher GET Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Test Pusher POST - Iniciando...')
    
    const body = await req.json()
    console.log('Test Pusher POST - Body recibido:', typeof body)
    
    // Probar con datos similares a un mensaje real (sin imagen)
    const testData = {
      id: 'msg_test_123',
      eventId: 'test-event-id',
      guestName: 'Test User',
      guestPhone: '+1234567890',
      message: 'Test message',
      status: 'pending',
      createdAt: new Date(),
      image: null
    }
    
    console.log('Test Pusher POST - Enviando datos de mensaje...')
    await pusher.trigger('test-channel', 'test-event', testData)
    console.log('Test Pusher POST - Éxito con datos de mensaje')
    
    return NextResponse.json({ success: true, message: 'Test POST con datos de mensaje exitoso' })
  } catch (error) {
    console.error('Test Pusher POST Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
