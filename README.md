# WhatsApp Events 🎉

Una plataforma interactiva donde los invitados pueden mandar mensajes en tiempo real escaneando un QR, y todos los mensajes aparecen en la pantalla del evento como si fuera un grupo de WhatsApp gigante.

## 🚀 Características

- ✅ **Responsive**: Funciona perfectamente en móviles y desktop
- ✅ **Tiempo Real**: Los mensajes aparecen instantáneamente en pantalla
- ✅ **Moderación Obligatoria**: Todos los mensajes deben ser aprobados por el administrador
- ✅ **Sin Límites**: Los invitados pueden enviar múltiples mensajes
- ✅ **Fecha y Hora**: Cada mensaje muestra cuándo fue enviado
- ✅ **QR Dinámico**: Cada evento tiene su propio QR único
- ✅ **Sin Backend**: Usa Supabase como base de datos en la nube
- ✅ **Deploy Fácil**: Se sube directamente a Vercel

## 📱 Cómo Funciona

1. **El administrador crea un evento** y obtiene un QR único
2. **Se muestra el QR en pantalla** con la frase "Escaneá y mandá tu mensaje"
3. **Los invitados escanean el QR** y van a una web simple
4. **Escriben su nombre y mensaje** en el formulario
5. **El administrador aprueba/rechaza** los mensajes desde su panel
6. **Los mensajes aprobados aparecen** en tiempo real en la pantalla pública

## 🛠️ Tecnologías

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL en la nube)
- **Tiempo Real**: Supabase Realtime
- **QR**: Librería qrcode.js
- **Hosting**: Vercel
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

3. **Configura Supabase** (ver `SUPABASE_SETUP.md`)

4. **Crea el archivo `.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

5. **Ejecuta el proyecto**
```bash
npm run dev
```

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

## 🚀 Deploy en Vercel

1. **Sube el código a GitHub**
2. **Conecta con Vercel**
3. **Agrega las variables de entorno**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **¡Listo!** Tu aplicación estará online

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
│   └── supabase.ts      # Configuración de Supabase
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
- Modifica las tablas en Supabase según tus necesidades
- Agrega campos adicionales como avatar, emoji, etc.
- Configura políticas de seguridad personalizadas

## 🐛 Solución de Problemas

### Error de Conexión a Supabase
- Verifica que las variables de entorno estén correctas
- Asegúrate de que el proyecto de Supabase esté activo

### QR No Funciona
- Verifica que la URL del QR sea correcta
- Asegúrate de que el evento esté activo

### Mensajes No Aparecen
- Verifica que Supabase Realtime esté habilitado
- Revisa la consola del navegador para errores

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisa la documentación de Supabase
2. Verifica la configuración de Vercel
3. Revisa los logs en la consola del navegador

## 🎉 ¡Disfruta tu Evento!

Esta aplicación está diseñada para hacer que tus eventos sean más interactivos y divertidos. ¡Los invitados van a amar poder participar de esta manera!