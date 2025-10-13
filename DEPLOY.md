# Script de Deploy para Vercel

## 🚀 Pasos para Deploy

### 1. Preparar el Proyecto
```bash
# Asegúrate de estar en el directorio del proyecto
cd whatsapp-events

# Verifica que todo compile
npm run build

# Si hay errores, arréglalos antes de continuar
```

### 2. Subir a GitHub
```bash
# Inicializar git si no está inicializado
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit: WhatsApp Events app"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/tu-usuario/whatsapp-events.git
git branch -M main
git push -u origin main
```

### 3. Deploy en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu cuenta de GitHub
3. Importa el proyecto `whatsapp-events`
4. En la configuración del proyecto, agrega las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`: Tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu clave anónima de Supabase
5. Haz clic en "Deploy"

### 4. Configurar Supabase
1. Ve a tu proyecto en Supabase
2. Ejecuta los comandos SQL del archivo `SUPABASE_SETUP.md`
3. Verifica que las tablas estén creadas correctamente

### 5. Probar la Aplicación
1. Abre la URL de Vercel
2. Crea un evento de prueba
3. Escanea el QR desde tu móvil
4. Envía un mensaje de prueba
5. Aprueba el mensaje desde el panel de administración
6. Verifica que aparezca en la pantalla pública

## 🔧 Variables de Entorno Requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

## 📱 URLs Importantes

- **Panel de Administración**: `https://tu-app.vercel.app/`
- **Página de Invitados**: `https://tu-app.vercel.app/guest?event=event_code`

## 🎯 Checklist de Deploy

- [ ] Proyecto compila sin errores (`npm run build`)
- [ ] Código subido a GitHub
- [ ] Proyecto conectado en Vercel
- [ ] Variables de entorno configuradas en Vercel
- [ ] Base de datos Supabase configurada
- [ ] Tablas creadas en Supabase
- [ ] Políticas de seguridad configuradas
- [ ] Realtime habilitado en Supabase
- [ ] Aplicación funcionando en producción
- [ ] QR generándose correctamente
- [ ] Mensajes enviándose y aprobándose
- [ ] Pantalla pública mostrando mensajes

## 🐛 Solución de Problemas Comunes

### Error de Variables de Entorno
- Verifica que las variables estén configuradas en Vercel
- Asegúrate de que los nombres sean exactos
- Reinicia el deploy después de cambiar variables

### Error de Conexión a Supabase
- Verifica que la URL y clave sean correctas
- Asegúrate de que el proyecto de Supabase esté activo
- Revisa las políticas de seguridad

### QR No Funciona
- Verifica que la URL del QR sea correcta
- Asegúrate de que el evento esté activo
- Prueba escaneando desde diferentes dispositivos

## 🎉 ¡Listo!

Una vez completado el deploy, tendrás tu aplicación de WhatsApp Events funcionando en producción. Los invitados podrán escanear el QR y enviar mensajes que aparecerán en tiempo real en la pantalla del evento.
