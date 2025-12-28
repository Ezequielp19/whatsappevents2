'use client'

import { useState, useRef } from 'react'
import { X, Video, Download, Check, AlertCircle, Loader2 } from 'lucide-react'

interface VideoCompressorModalProps {
  isOpen: boolean
  onClose: () => void
  onVideoCompressed: (compressedVideoBase64: string) => void
}

export default function VideoCompressorModal({ isOpen, onClose, onVideoCompressed }: VideoCompressorModalProps) {
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [compressedVideo, setCompressedVideo] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const getBase64Size = (base64String: string): number => {
    // Base64 aumenta el tamaño en ~33%, así que el tamaño real es menor
    return (base64String.length * 3) / 4
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      setError('Por favor selecciona un archivo de video válido')
      return
    }

    setOriginalFile(file)
    setCompressedVideo(null)
    setError(null)
    setCompressionProgress(0)

    // Cargar preview
    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result as string
      if (videoPreviewRef.current) {
        videoPreviewRef.current.src = url
      }
    }
    reader.readAsDataURL(file)
  }

  const compressVideo = async () => {
    if (!originalFile) return

    setIsCompressing(true)
    setError(null)
    setCompressionProgress(0)

    try {
      // Crear video element para procesar
      const video = document.createElement('video')
      video.preload = 'auto'
      video.muted = true
      video.playsInline = true
      
      const videoUrl = URL.createObjectURL(originalFile)
      video.src = videoUrl

      // Esperar a que el video cargue
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.currentTime = 0
          resolve(null)
        }
        video.onerror = () => reject(new Error('Error al cargar el video'))
        setTimeout(() => reject(new Error('Timeout al cargar el video')), 10000)
      })

      setCompressionProgress(10)

      // Obtener dimensiones originales
      const originalWidth = video.videoWidth
      const originalHeight = video.videoHeight
      
      // Calcular dimensiones reducidas (mantener aspect ratio)
      // Objetivo: máximo 640px de ancho para reducir tamaño significativamente
      const maxWidth = 640
      const maxHeight = 480
      let newWidth = originalWidth
      let newHeight = originalHeight

      if (originalWidth > maxWidth || originalHeight > maxHeight) {
        const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight)
        newWidth = Math.floor(originalWidth * ratio)
        newHeight = Math.floor(originalHeight * ratio)
      }

      setCompressionProgress(20)

      // Crear canvas para comprimir
      const canvas = document.createElement('canvas')
      canvas.width = newWidth
      canvas.height = newHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: false })

      if (!ctx) {
        throw new Error('No se pudo obtener el contexto del canvas')
      }

      // Configurar calidad de dibujado
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'medium'

      setCompressionProgress(30)

      // Intentar usar MediaRecorder con diferentes codecs
      let mimeType = 'video/webm;codecs=vp9'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm'
        }
      }

      // Crear stream desde el canvas
      const stream = canvas.captureStream(15) // 15 FPS para reducir tamaño
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 300000 // 300 kbps para reducir tamaño
      })

      const chunks: Blob[] = []
      let frameCount = 0
      const totalFrames = Math.ceil(video.duration * 15) // 15 FPS
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: mimeType })
          setCompressionProgress(90)

          // Convertir a base64
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = reader.result as string
            
            // Verificar tamaño
            const base64Size = getBase64Size(base64)
            const maxSize = 0.9 * 1024 * 1024 // 0.9 MB para dejar margen

            if (base64Size > maxSize) {
              setError(`El video comprimido aún es muy grande (${formatFileSize(base64Size)}). Intenta con un video más corto (máximo 10-15 segundos) o de menor resolución.`)
              setIsCompressing(false)
              URL.revokeObjectURL(videoUrl)
              return
            }

            setCompressedVideo(base64)
            setCompressionProgress(100)
            setIsCompressing(false)
            URL.revokeObjectURL(videoUrl)
          }
          reader.onerror = () => {
            setError('Error al convertir el video comprimido')
            setIsCompressing(false)
            URL.revokeObjectURL(videoUrl)
          }
          reader.readAsDataURL(blob)
        } catch (err) {
          setError('Error al procesar el video comprimido')
          setIsCompressing(false)
          URL.revokeObjectURL(videoUrl)
        }
      }

      // Función para dibujar frame
      const drawFrame = () => {
        if (video.ended || video.paused) {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop()
          }
          return
        }

        ctx.drawImage(video, 0, 0, newWidth, newHeight)
        frameCount++
        
        // Actualizar progreso
        const progress = 30 + (frameCount / totalFrames) * 50
        setCompressionProgress(Math.min(progress, 80))

        // Continuar al siguiente frame
        video.currentTime += 1/15 // Avanzar 1/15 segundos (15 FPS)
      }

      // Iniciar grabación
      mediaRecorder.start(100) // Capturar cada 100ms

      // Reproducir y grabar
      video.currentTime = 0
      await video.play()

      video.onseeked = drawFrame
      video.onended = () => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
        URL.revokeObjectURL(videoUrl)
      }

      // Dibujar frames
      drawFrame()
      const interval = setInterval(() => {
        if (video.ended || video.paused) {
          clearInterval(interval)
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop()
          }
        } else {
          drawFrame()
        }
      }, 1000/15) // 15 FPS

      // Timeout de seguridad (máximo 60 segundos)
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
        video.pause()
        clearInterval(interval)
        URL.revokeObjectURL(videoUrl)
      }, 60000)

    } catch (err: any) {
      console.error('Error comprimiendo video:', err)
      setError(err.message || 'Error al comprimir el video. Intenta con otro archivo o uno más corto.')
      setIsCompressing(false)
    }
  }

  const handleUseCompressed = () => {
    if (compressedVideo) {
      onVideoCompressed(compressedVideo)
      handleReset()
      onClose()
    }
  }

  const handleDownload = () => {
    if (compressedVideo) {
      const link = document.createElement('a')
      link.href = compressedVideo
      link.download = `video-comprimido-${Date.now()}.webm`
      link.click()
    }
  }

  const handleReset = () => {
    setOriginalFile(null)
    setCompressedVideo(null)
    setError(null)
    setCompressionProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.src = ''
    }
  }

  if (!isOpen) return null

  const originalSize = originalFile ? originalFile.size : 0
  const originalBase64Size = originalFile ? getBase64Size(URL.createObjectURL(originalFile)) : 0
  const compressedBase64Size = compressedVideo ? getBase64Size(compressedVideo) : 0
  const targetSize = 0.9 * 1024 * 1024 // 0.9 MB
  const reduction = originalFile && compressedVideo 
    ? ((1 - compressedBase64Size / originalBase64Size) * 100).toFixed(1)
    : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Video className="w-6 h-6 mr-2" />
            Compresor de Video
          </h2>
          <button
            onClick={() => {
              handleReset()
              onClose()
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">¿Por qué comprimir el video?</p>
                <p>
                  Firestore tiene un límite de <strong>1MB por campo</strong>. Este compresor reduce el tamaño 
                  del video para que sea compatible con el sistema, manteniendo la mejor calidad posible.
                </p>
              </div>
            </div>
          </div>

          {/* Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona el video a comprimir:
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isCompressing}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressing}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Video className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Haz clic para seleccionar un video</p>
              <p className="text-xs text-gray-500 mt-1">Formatos: MP4, WebM, MOV, etc.</p>
            </button>
          </div>

          {/* Video Info */}
          {originalFile && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative">
                <video
                  ref={videoPreviewRef}
                  className="w-full h-48 object-cover rounded-lg border bg-gray-100"
                  controls
                  muted
                />
              </div>

              {/* Size Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Tamaño Original</p>
                  <p className="text-lg font-semibold text-gray-900">{formatFileSize(originalSize)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    En base64: ~{formatFileSize(originalBase64Size)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 mb-1">Tamaño Objetivo</p>
                  <p className="text-lg font-semibold text-blue-900">{formatFileSize(targetSize)}</p>
                  <p className="text-xs text-blue-600 mt-1">Máximo para Firestore</p>
                </div>
              </div>

              {/* Compress Button */}
              {!compressedVideo && !isCompressing && (
                <button
                  onClick={compressVideo}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Comprimir Video
                </button>
              )}

              {/* Compression Progress */}
              {isCompressing && (
                <div className="space-y-3">
                  <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${compressionProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-center text-blue-600">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span className="text-sm font-medium">
                      Comprimiendo... {compressionProgress}%
                    </span>
                  </div>
                  <p className="text-xs text-center text-gray-500">
                    Esto puede tomar unos momentos dependiendo del tamaño del video
                  </p>
                </div>
              )}

              {/* Compressed Result */}
              {compressedVideo && !isCompressing && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900 mb-2">¡Video comprimido exitosamente!</p>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-green-700 mb-1">Tamaño Comprimido</p>
                            <p className="text-lg font-semibold text-green-900">
                              {formatFileSize(compressedBase64Size)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-green-700 mb-1">Reducción</p>
                            <p className="text-lg font-semibold text-green-900">
                              {reduction}%
                            </p>
                          </div>
                        </div>
                        {compressedBase64Size <= targetSize ? (
                          <p className="text-xs text-green-700 mt-2">
                            ✅ El video es compatible con Firestore
                          </p>
                        ) : (
                          <p className="text-xs text-yellow-700 mt-2">
                            ⚠️ El video aún es grande, pero debería funcionar
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleUseCompressed}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Usar Este Video
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Descargar
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Error</p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={() => {
              handleReset()
              onClose()
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

