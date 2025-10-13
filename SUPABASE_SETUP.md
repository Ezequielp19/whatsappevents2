# WhatsApp Events - Configuración de Supabase

## 📋 Pasos para configurar Supabase

### 1. Crear cuenta en Supabase
- Ve a [supabase.com](https://supabase.com)
- Crea una cuenta gratuita
- Crea un nuevo proyecto

### 2. Configurar la Base de Datos

Ejecuta estos comandos SQL en el editor SQL de Supabase:

```sql
-- Crear tabla de eventos
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Crear tabla de mensajes
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar Realtime para las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Crear índices para mejor rendimiento
CREATE INDEX idx_messages_event_id ON messages(event_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_events_qr_code ON events(qr_code);
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

### 4. Obtener las credenciales
- En tu proyecto de Supabase, ve a Settings > API
- Copia la URL del proyecto
- Copia la clave anónima (anon key)

### 5. Configurar Políticas de Seguridad (RLS)

```sql
-- Habilitar RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política para lectura de eventos
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

-- Política para lectura de mensajes
CREATE POLICY "Messages are viewable by everyone" ON messages
  FOR SELECT USING (true);

-- Política para inserción de mensajes
CREATE POLICY "Anyone can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

-- Política para actualización de mensajes (solo para cambiar status)
CREATE POLICY "Anyone can update message status" ON messages
  FOR UPDATE USING (true);
```

## 🚀 Deploy en Vercel

### 1. Subir a GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Conectar con Vercel
- Ve a [vercel.com](https://vercel.com)
- Conecta tu cuenta de GitHub
- Importa el proyecto
- Agrega las variables de entorno en Vercel

### 3. Variables de Entorno en Vercel
En la configuración del proyecto en Vercel, agrega:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📱 Cómo usar la aplicación

1. **Crear Evento**: El administrador crea un evento y obtiene un QR
2. **Mostrar QR**: Se muestra el QR en pantalla para que los invitados lo escaneen
3. **Enviar Mensajes**: Los invitados escanean el QR y envían mensajes
4. **Moderar**: El administrador aprueba/rechaza mensajes
5. **Pantalla Pública**: Los mensajes aprobados aparecen en tiempo real

## 🎨 Características

- ✅ **Responsive**: Funciona en móviles y desktop
- ✅ **Tiempo Real**: Mensajes aparecen instantáneamente
- ✅ **Moderación Obligatoria**: Todos los mensajes deben ser aprobados
- ✅ **Sin Límites**: Los invitados pueden enviar múltiples mensajes
- ✅ **Fecha y Hora**: Cada mensaje muestra cuándo fue enviado
- ✅ **QR Dinámico**: Cada evento tiene su propio QR único
