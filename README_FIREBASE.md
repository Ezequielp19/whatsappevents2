# WhatsApp Events 🔥 - Con Firebase

Una plataforma interactiva donde los invitados pueden mandar mensajes en tiempo real escaneando un QR, y todos los mensajes aparecen en la pantalla del evento como si fuera un grupo de WhatsApp gigante.

## 🚀 Características

- ✅ **Responsive**: Funciona perfectamente en móviles y desktop
- ✅ **Tiempo Real**: Los mensajes aparecen instantáneamente en pantalla
- ✅ **Moderación Obligatoria**: Todos los mensajes deben ser aprobados por el administrador
- ✅ **Sin Límites**: Los invitados pueden enviar múltiples mensajes
- ✅ **Fecha y Hora**: Cada mensaje muestra cuándo fue enviado
- ✅ **QR Dinámico**: Cada evento tiene su propio QR único
- ✅ **Sin Backend**: Usa Firebase como base de datos en la nube
- ✅ **Deploy Fácil**: Se sube directamente a Firebase Hosting
- ✅ **Completamente Gratis**: Usa solo el plan gratuito de Firebase

## 🛠️ Tecnologías

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Base de Datos**: Firebase Firestore (NoSQL)
- **Tiempo Real**: Firebase Firestore Realtime
- **QR**: Librería qrcode.js (generado en memoria)
- **Hosting**: Firebase Hosting
- **Iconos**: Lucide React

## 📋 Instalación

1. **Clona el repositorio**
```bash
git clone <tu-repo>
cd whatsapp-events
```

2. **Instala las dependencias**
```bash
npm install
```

3. **Configura Firebase** (ver `FIREBASE_SETUP.md`)

4. **Crea el archivo `.env.local`**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

5. **Ejecuta el proyecto**
```bash
npm run dev
```

## 🔥 Configuración de Firebase

### 1. Crear Proyecto en Firebase
- Ve a [firebase.google.com](https://firebase.google.com)
- Crea un nuevo proyecto
- Habilita Firestore Database
- Habilita Firebase Hosting

### 2. Configurar Firestore
- Ve a Firestore Database
- Crea las colecciones:
  - `events` (eventos)
  - `messages` (mensajes)

### 3. Reglas de Seguridad
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura y escritura para todos (para simplicidad)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 4. Obtener Credenciales
- Ve a Project Settings > General
- Copia las credenciales de configuración
- Péguelas en tu archivo `.env.local`

## 🎯 Uso

### Para Administradores
1. Abre la aplicación
2. Haz clic en "Crear Nuevo Evento"
3. Ingresa el nombre del evento
4. Copia el QR que se genera
5. Muestra el QR en pantalla para los invitados
6. Aprueba/rechaza mensajes desde el panel
7. Usa "Ver Pantalla Pública" para mostrar los mensajes

### Para Invitados
1. Escanea el QR del evento
2. Ingresa tu nombre
3. Escribe tu mensaje
4. Envía el mensaje
5. Espera a que sea aprobado por el administrador

## 🚀 Deploy en Firebase Hosting

1. **Instalar Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **Inicializar Firebase**
```bash
firebase init
# Selecciona: Hosting, Firestore
```

3. **Build del proyecto**
```bash
npm run build
```

4. **Deploy**
```bash
firebase deploy
```

## 📊 Estructura del Proyecto

```
src/
├── app/
│   ├── guest/          # Página para invitados
│   │   └── page.tsx
│   ├── globals.css      # Estilos globales
│   ├── layout.tsx       # Layout principal
│   └── page.tsx         # Página principal (admin)
├── lib/
│   └── firebase.ts      # Configuración de Firebase
```

## 🎨 Personalización

- **Colores**: Modifica los colores en `globals.css`
- **Estilos**: Usa Tailwind CSS para personalizar
- **Animaciones**: Las animaciones están en `globals.css`
- **Tema**: Puedes cambiar el tema de WhatsApp por otro

## 🔧 Configuración Avanzada

### Variables de Entorno Adicionales
```env
# Opcional: Configurar límites
NEXT_PUBLIC_MAX_MESSAGE_LENGTH=500
NEXT_PUBLIC_MAX_MESSAGES_PER_GUEST=10
```

### Personalización de Base de Datos
- Modifica las colecciones en Firestore según tus necesidades
- Agrega campos adicionales como avatar, emoji, etc.
- Configura reglas de seguridad personalizadas

## 🐛 Solución de Problemas

### Error de Conexión a Firebase
- Verifica que las variables de entorno estén correctas
- Asegúrate de que el proyecto de Firebase esté activo

### QR No Funciona
- Verifica que la URL del QR sea correcta
- Asegúrate de que el evento esté activo

### Mensajes No Aparecen
- Verifica que Firestore Realtime esté habilitado
- Revisa la consola del navegador para errores

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisa la documentación de Firebase
2. Verifica la configuración de Firebase Hosting
3. Revisa los logs en la consola del navegador

## 🎉 ¡Disfruta tu Evento!

Esta aplicación está diseñada para hacer que tus eventos sean más interactivos y divertidos. ¡Los invitados van a amar poder participar de esta manera!

## 💰 Costos

**Completamente GRATIS** con el plan gratuito de Firebase:
- ✅ 1GB de almacenamiento
- ✅ 20,000 lecturas/día
- ✅ 20,000 escrituras/día
- ✅ 10GB de transferencia/mes
- ✅ Hosting ilimitado
