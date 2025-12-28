import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore'

// Configuración de Firebase (reemplaza con tus credenciales)
const firebaseConfig = {
  apiKey: "AIzaSyBT2c3GgG4T6aArdoEYX4YPCUTnAcbFSdY",
  authDomain: "whatsapp-a413a.firebaseapp.com",
  projectId: "whatsapp-a413a",
  storageBucket: "whatsapp-a413a.firebasestorage.app",
  messagingSenderId: "58449304747",
  appId: "1:58449304747:web:93621596ca0603d6be6bee",
  measurementId: "G-NL0XX66K2Q"
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Tipos para TypeScript
export interface Message {
  id: string
  eventId: string
  guestName: string
  guestPhone: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  approvedAt?: Date
}

export interface Event {
  id: string
  name: string
  qrCode: string
  createdAt: Date
  isActive: boolean
  // Campos de personalización
  displayName: string
  backgroundColor: string
  textColor: string
  backgroundImage?: string // base64 o URL
  backgroundVideo?: string // URL de Cloudinary
  logo?: string // base64 o URL
  logoPosition?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center' | 'left' | 'right' | 'center'
  // Efectos
  effects?: {
    shake?: boolean // Pantalla movediza
    neonLights?: boolean // Luces neon
    rippleWaves?: boolean // Ondas expansivas
    sparkleParticles?: boolean // Partículas brillantes
  }
}

export interface Guest {
  id: string
  eventId: string
  name: string
  phone: string
  registeredAt: Date
}

// Funciones para eventos
export const createEvent = async (
  name: string, 
  displayName: string, 
  backgroundColor: string = '#1f2937', 
  textColor: string = '#ffffff',
  backgroundImage?: string,
  backgroundVideo?: string,
  logo?: string,
  logoPosition?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center' | 'left' | 'right' | 'center'
) => {
  try {
    const qrCode = `event_${Date.now()}`
    
    // Preparar datos del evento
    const eventData: {
      name: string
      qrCode: string
      displayName: string
      backgroundColor: string
      textColor: string
      backgroundImage: string | null
      backgroundVideo: string | null
      logo: string | null
      logoPosition: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center' | 'left' | 'right' | 'center' | null
      effects: {
        shake: boolean
        neonLights: boolean
        rippleWaves: boolean
        sparkleParticles: boolean
      }
      createdAt: Date
      isActive: boolean
    } = {
      name,
      qrCode,
      displayName,
      backgroundColor,
      textColor,
      backgroundImage: backgroundImage || null,
      backgroundVideo: backgroundVideo || null,
      logo: logo || null,
      logoPosition: logoPosition || null,
      effects: {
        shake: false,
        neonLights: false,
        rippleWaves: false,
        sparkleParticles: false
      },
      createdAt: new Date(),
      isActive: true
    }

    console.log('📝 Intentando guardar evento en Firestore...')
    console.log('📊 Tamaños aproximados:', {
      backgroundImage: backgroundImage ? `${(backgroundImage.length * 3 / 4 / 1024).toFixed(2)} KB` : 'N/A',
      backgroundVideo: backgroundVideo ? `${(backgroundVideo.length * 3 / 4 / 1024 / 1024).toFixed(2)} MB` : 'N/A',
      logo: logo ? `${(logo.length * 3 / 4 / 1024).toFixed(2)} KB` : 'N/A'
    })

    const docRef = await addDoc(collection(db, 'events'), eventData)
    console.log('✅ Evento guardado en Firestore con ID:', docRef.id)
    
    return { 
      id: docRef.id, 
      name, 
      qrCode, 
      displayName,
      backgroundColor,
      textColor,
      backgroundImage,
      backgroundVideo,
      logo,
      logoPosition,
      effects: {
        shake: false,
        neonLights: false,
        rippleWaves: false,
        sparkleParticles: false
      },
      createdAt: new Date(), 
      isActive: true 
    }
  } catch (error: unknown) {
    console.error('❌ Error en createEvent:', error)
    // Si el error es por tamaño, dar un mensaje más específico
    const firebaseError = error as { code?: string; message?: string }
    if (firebaseError?.code === 'invalid-argument' || firebaseError?.message?.includes('size') || firebaseError?.message?.includes('too large')) {
      throw new Error('El video o imagen es demasiado grande para Firestore. Por favor usa archivos más pequeños.')
    }
    throw error
  }
}

export const getEventByCode = async (qrCode: string) => {
  const q = query(collection(db, 'events'), where('qrCode', '==', qrCode), where('isActive', '==', true))
  const querySnapshot = await getDocs(q)
  if (querySnapshot.empty) return null
  
  const doc = querySnapshot.docs[0]
  return { id: doc.id, ...doc.data() } as Event
}

// Funciones para mensajes
export const createMessage = async (eventId: string, guestName: string, message: string, guestPhone: string) => {
  const docRef = await addDoc(collection(db, 'messages'), {
    eventId,
    guestName,
    guestPhone,
    message,
    status: 'pending',
    createdAt: new Date(),
    approvedAt: null
  })
  return { id: docRef.id, eventId, guestName, guestPhone, message, status: 'pending', createdAt: new Date() }
}

export const getMessages = async (eventId: string) => {
  const q = query(
    collection(db, 'messages'), 
    where('eventId', '==', eventId),
    orderBy('createdAt', 'desc')
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message))
}

export const approveMessage = async (messageId: string) => {
  const messageRef = doc(db, 'messages', messageId)
  await updateDoc(messageRef, {
    status: 'approved',
    approvedAt: new Date()
  })
}

export const rejectMessage = async (messageId: string) => {
  const messageRef = doc(db, 'messages', messageId)
  await updateDoc(messageRef, {
    status: 'rejected'
  })
}

// Función para actualizar efectos del evento
export const updateEventEffects = async (eventId: string, effects: { shake?: boolean; neonLights?: boolean; rippleWaves?: boolean; sparkleParticles?: boolean }) => {
  const eventRef = doc(db, 'events', eventId)
  await updateDoc(eventRef, {
    effects
  })
}

// Funciones para invitados
export const registerGuest = async (eventId: string, name: string, phone: string) => {
  const docRef = await addDoc(collection(db, 'guests'), {
    eventId,
    name,
    phone,
    registeredAt: new Date()
  })
  return { id: docRef.id, eventId, name, phone, registeredAt: new Date() }
}

export const getGuestByPhone = async (eventId: string, phone: string) => {
  const q = query(
    collection(db, 'guests'), 
    where('eventId', '==', eventId),
    where('phone', '==', phone)
  )
  const querySnapshot = await getDocs(q)
  if (querySnapshot.empty) return null
  
  const doc = querySnapshot.docs[0]
  return { id: doc.id, ...doc.data() } as Guest
}

// Suscripción en tiempo real
export const subscribeToMessages = (eventId: string, callback: (messages: Message[]) => void) => {
  const q = query(
    collection(db, 'messages'), 
    where('eventId', '==', eventId),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message))
    callback(messages)
  })
}

// Suscripción en tiempo real a cambios del evento
export const subscribeToEvent = (eventId: string, callback: (event: Event) => void) => {
  const eventRef = doc(db, 'events', eventId)
  
  return onSnapshot(eventRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const eventData = { id: docSnapshot.id, ...docSnapshot.data() } as Event
      callback(eventData)
    }
  })
}
