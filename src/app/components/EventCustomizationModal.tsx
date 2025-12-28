'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Palette, Image as ImageIcon, Type, ImagePlus, Video, AlertCircle } from 'lucide-react'
import Image from 'next/image'

interface EventCustomizationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateEvent: (data: EventCustomizationData) => void
}

export interface EventCustomizationData {
  name: string
  displayName: string
  backgroundColor: string
  textColor: string
  backgroundImage?: string
  backgroundVideo?: string
  logo?: string
  logoPosition?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center' | 'left' | 'right' | 'center'
}

const colorPresets = [
  { name: 'WhatsApp Verde', bg: '#25d366', text: '#ffffff' },
  { name: 'Azul Profundo', bg: '#1e3a8a', text: '#ffffff' },
  { name: 'Morado Elegante', bg: '#7c3aed', text: '#ffffff' },
  { name: 'Rojo Pasión', bg: '#dc2626', text: '#ffffff' },
  { name: 'Naranja Vibrante', bg: '#ea580c', text: '#ffffff' },
  { name: 'Gris Oscuro', bg: '#374151', text: '#ffffff' },
  { name: 'Rosa Fiesta', bg: '#ec4899', text: '#ffffff' },
  { name: 'Verde Esmeralda', bg: '#059669', text: '#ffffff' },
]

export default function EventCustomizationModal({ isOpen, onClose, onCreateEvent }: EventCustomizationModalProps) {
  const [formData, setFormData] = useState<EventCustomizationData>({
    name: '',
    displayName: '',
    backgroundColor: '#1f2937',
    textColor: '#ffffff',
    backgroundImage: undefined,
    backgroundVideo: undefined,
    logo: undefined,
    logoPosition: 'top-left'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Tamaño máximo permitido por Firestore (0.9 MB en base64 = ~675 KB de archivo)
  const MAX_VIDEO_SIZE_BASE64 = 0.9 * 1024 * 1024 // 0.9 MB
  const MAX_VIDEO_SIZE_FILE = 675 * 1024 // ~675 KB de archivo original

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const getBase64Size = (base64String: string): number => {
    // Base64 aumenta el tamaño en ~33%, así que el tamaño real es menor
    return (base64String.length * 3) / 4
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.displayName.trim()) return

    setIsLoading(true)
    try {
      await onCreateEvent(formData)
      onClose()
      // Reset form
      setFormData({
        name: '',
        displayName: '',
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        backgroundImage: undefined,
        backgroundVideo: undefined,
        logo: undefined,
        logoPosition: 'top-left'
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (videoInputRef.current) videoInputRef.current.value = ''
    } catch (error) {
      console.error('Error creating event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen debe ser menor a 2MB')
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setFormData(prev => ({ ...prev, backgroundImage: result }))
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, backgroundImage: undefined }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Función para subir video a Cloudinary
  const uploadVideoToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'ml_default') // Mismo preset que las imágenes
    formData.append('resource_type', 'video') // Especificar que es un video

    const response = await fetch('https://api.cloudinary.com/v1_1/dncqwpyua/video/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Error al subir el video a Cloudinary')
    }

    const result = await response.json()
    if (!result.secure_url) {
      throw new Error('Error: No se recibió la URL del video')
    }

    return result.secure_url
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('video/')) {
      alert('Por favor selecciona un video válido')
      if (videoInputRef.current) {
        videoInputRef.current.value = ''
      }
      return
    }

    // Validar tamaño (máximo 100MB para Cloudinary free tier)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      alert(
        `⚠️ El video es demasiado grande (${formatFileSize(file.size)}).\n\n` +
        `El tamaño máximo permitido es ${formatFileSize(maxSize)}.\n\n` +
        `Por favor, comprime tu video antes de subirlo usando una herramienta online como:\n` +
        `• https://www.freeconvert.com/video-compressor\n` +
        `• https://www.compresss.com/\n` +
        `• https://www.youcompress.com/`
      )
      if (videoInputRef.current) {
        videoInputRef.current.value = ''
      }
      return
    }

    // Mostrar indicador de carga
    setIsUploadingVideo(true)

    try {
      // Subir a Cloudinary
      const videoUrl = await uploadVideoToCloudinary(file)
      
      // Guardar la URL en lugar de base64
      setFormData(prev => ({ ...prev, backgroundVideo: videoUrl, backgroundImage: undefined }))
      
      // Limpiar imagen si había una
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: unknown) {
      console.error('Error uploading video:', error)
      alert(`Error al subir el video: ${error.message || 'Error desconocido'}`)
    } finally {
      setIsUploadingVideo(false)
    }
  }

  const removeVideo = () => {
    setFormData(prev => ({ ...prev, backgroundVideo: undefined }))
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('El logo debe ser menor a 2MB')
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setFormData(prev => ({ ...prev, logo: result }))
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo: undefined }))
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">🎨 Personalizar Evento</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Type className="w-5 h-5 mr-2" />
              Información del Evento
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del evento (interno):
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                placeholder="Ej: Cumpleaños de María"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto que aparece en pantalla:
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                placeholder="Ej: Cumpleaños de María 🎉"
                required
              />
            </div>
          </div>

          {/* Colores */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Colores
            </h3>

            {/* Presets de colores */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Colores predefinidos:
              </label>
              <div className="grid grid-cols-4 gap-3">
                {colorPresets.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      backgroundColor: preset.bg, 
                      textColor: preset.text 
                    }))}
                    className="p-3 rounded-lg border-2 hover:border-gray-400 transition-colors"
                    style={{ 
                      backgroundColor: preset.bg,
                      color: preset.text,
                      borderColor: formData.backgroundColor === preset.bg ? '#374151' : 'transparent'
                    }}
                  >
                    <div className="text-xs font-medium" style={{ color: preset.text }}>{preset.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Colores personalizados */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color de fondo:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    placeholder="#1f2937"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color del texto:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.textColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.textColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <ImagePlus className="w-5 h-5 mr-2" />
              Logo del Evento (Opcional)
            </h3>

            <div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              
              {formData.logo ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Image
                      src={formData.logo}
                      alt="Logo Preview"
                      width={200}
                      height={200}
                      className="w-32 h-32 object-contain rounded-lg border mx-auto"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    ✅ Logo cargado.
                  </p>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                  >
                    <ImagePlus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">Haz clic para subir un logo</p>
                    <p className="text-sm text-gray-500 mt-1">Máximo 2MB</p>
                  </button>
                </div>
              )}
            </div>

            {formData.logo && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posición del logo en la vista pública:
                </label>
                <select
                  value={formData.logoPosition || 'top-left'}
                  onChange={(e) => setFormData(prev => ({ ...prev, logoPosition: e.target.value as EventCustomizationData['logoPosition'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                >
                  <option value="top-left">Arriba Izquierda</option>
                  <option value="top-center">Arriba Centro</option>
                  <option value="top-right">Arriba Derecha</option>
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                  <option value="bottom-left">Abajo Izquierda</option>
                  <option value="bottom-center">Abajo Centro</option>
                  <option value="bottom-right">Abajo Derecha</option>
                </select>
              </div>
            )}
          </div>

          {/* Imagen o Video de fondo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2" />
              Fondo de Pantalla (Opcional)
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Puedes elegir una imagen estática o un video que se reproducirá en loop
            </p>

            {/* Información sobre videos */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-2">✅ Videos almacenados en Cloudinary (Gratis):</p>
                  <p className="mb-2">
                    Los videos se suben a <strong>Cloudinary</strong> (servicio gratuito) y se guarda solo la URL en Firestore. 
                    Esto permite videos de hasta <strong>100MB</strong> sin problemas de rendimiento.
                  </p>
                  <p className="mb-2">
                    <strong>Recomendaciones para mejor rendimiento:</strong>
                  </p>
                  <ul className="list-disc list-inside mb-2 space-y-1">
                    <li>Videos cortos (10-30 segundos funcionan mejor)</li>
                    <li>Resolución moderada (720p o menos)</li>
                    <li>Formato MP4 o WebM</li>
                  </ul>
                  <p className="text-xs text-green-700 italic">
                    💡 Cloudinary optimiza automáticamente los videos para mejor rendimiento.
                  </p>
                </div>
              </div>
            </div>

            {/* Video */}
            <div className="mb-4">
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                disabled={isUploadingVideo}
              />
              
              {isUploadingVideo ? (
                <div className="w-full border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-blue-700 font-medium">Subiendo video...</p>
                    <p className="text-xs text-blue-600 mt-2">Por favor espera, esto puede tomar unos momentos</p>
                  </div>
                </div>
              ) : formData.backgroundVideo ? (
                <div className="space-y-3">
                  <div className="relative">
                    <video
                      src={formData.backgroundVideo}
                      className="w-full h-48 object-cover rounded-lg border"
                      controls
                      muted
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    ✅ Video cargado. Se reproducirá en loop en la pantalla pública.
                  </p>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploadingVideo}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Video className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600 text-sm">Subir Video</p>
                    <p className="text-xs text-gray-500 mt-1">Máximo 100MB - Se almacenará en Cloudinary (gratis)</p>
                  </button>
                </div>
              )}
            </div>

            {/* Imagen (solo si no hay video) */}
            {!formData.backgroundVideo && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {formData.backgroundImage ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Image
                        src={formData.backgroundImage}
                        alt="Preview"
                        width={400}
                        height={192}
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      ✅ Imagen cargada. Se mostrará como fondo en la pantalla pública.
                    </p>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors"
                    >
                      <ImageIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600 text-sm">Subir Imagen</p>
                      <p className="text-xs text-gray-500 mt-1">Máximo 2MB</p>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Vista Previa</h3>
            <div 
              className="p-6 rounded-lg border relative overflow-hidden"
              style={{ 
                backgroundColor: formData.backgroundColor,
                color: formData.textColor,
                backgroundImage: formData.backgroundImage ? `url(${formData.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center center',
                minHeight: '200px'
              }}
            >
              {/* Video de fondo en preview */}
              {formData.backgroundVideo && (
                <video
                  src={formData.backgroundVideo}
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              )}
              <div className="relative z-10">
              {/* Logo en preview */}
              {formData.logo && (
                <div 
                  className="absolute"
                  style={{
                    ...(formData.logoPosition === 'top-left' && { top: '1rem', left: '1rem' }),
                    ...(formData.logoPosition === 'top-center' && { top: '1rem', left: '50%', transform: 'translateX(-50%)' }),
                    ...(formData.logoPosition === 'top-right' && { top: '1rem', right: '1rem' }),
                    ...(formData.logoPosition === 'left' && { top: '50%', left: '1rem', transform: 'translateY(-50%)' }),
                    ...(formData.logoPosition === 'center' && { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }),
                    ...(formData.logoPosition === 'right' && { top: '50%', right: '1rem', transform: 'translateY(-50%)' }),
                    ...(formData.logoPosition === 'bottom-left' && { bottom: '1rem', left: '1rem' }),
                    ...(formData.logoPosition === 'bottom-center' && { bottom: '1rem', left: '50%', transform: 'translateX(-50%)' }),
                    ...(formData.logoPosition === 'bottom-right' && { bottom: '1rem', right: '1rem' })
                  }}
                >
                  <Image
                    src={formData.logo}
                    alt="Logo"
                    width={80}
                    height={80}
                    className="w-20 h-20 object-contain"
                  />
                </div>
              )}
              <h2 className="text-2xl font-bold text-center mb-2" style={{ color: formData.textColor }}>
                {formData.displayName || 'Nombre del evento'}
              </h2>
              <div className="flex items-center justify-center text-sm opacity-90" style={{ color: formData.textColor }}>
                <span>Escaneá el QR para participar</span>
              </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim() || !formData.displayName.trim()}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                'Crear Evento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
