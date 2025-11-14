# Configuración de GitHub App para PR Dashboard

Esta guía te ayudará a crear y configurar una GitHub App para usar con el PR Dashboard.

## Paso 1: Crear GitHub App

1. Ve a tu cuenta de GitHub → **Settings** → **Developer settings** → **GitHub Apps**
2. Click en **New GitHub App**
3. Completa el formulario:

### Información básica
- **GitHub App name**: `PR Dashboard` (o el nombre que prefieras)
- **Homepage URL**: Tu URL de Netlify (ej: `https://your-site.netlify.app`)
- **Webhook**: Desmarcar "Active" (no necesitamos webhooks por ahora)

### Permisos (Permissions)

#### Repository permissions:
- **Pull requests**: `Read & write` ✅
  - Necesario para leer PRs y modificar labels
- **Metadata**: `Read-only` ✅
  - Acceso básico a repositorios

### Subscribe to events (opcional)
Puedes suscribirte a estos eventos si quieres notificaciones en tiempo real:
- Pull request
- Label

### ¿Dónde puede instalarse esta GitHub App?
- Si es para uso personal: Selecciona **Only on this account**
- Si es para tu organización: Podrás transferirla después

4. Click en **Create GitHub App**

## Paso 2: Generar Private Key

1. En la página de tu GitHub App, baja hasta la sección **Private keys**
2. Click en **Generate a private key**
3. Se descargará un archivo `.pem` → **Guárdalo en un lugar seguro**

## Paso 3: Instalar la GitHub App

1. En la página de tu GitHub App, click en **Install App** (en el menú lateral)
2. Selecciona tu cuenta personal o la organización donde quieres instalarla
3. Elige qué repositorios quieres monitorear:
   - **All repositories**: La app tendrá acceso a todos tus repos
   - **Only select repositories**: Elige repos específicos (recomendado)
4. Click en **Install**

## Paso 4: Obtener IDs necesarios

### App ID
- En la página de configuración de tu GitHub App
- Lo verás como **App ID** en la parte superior

### Installation ID
1. Ve a la página donde instalaste la app
2. La URL será algo como: `https://github.com/settings/installations/XXXXXXXX`
3. El número al final (`XXXXXXXX`) es tu **Installation ID**

## Paso 5: Configurar variables de entorno en Netlify

1. Ve a tu sitio en Netlify → **Site configuration** → **Environment variables**
2. Agrega estas tres variables:

### GITHUB_APP_ID
```
Valor: El App ID de tu GitHub App (número)
```

### GITHUB_APP_INSTALLATION_ID
```
Valor: El Installation ID (número de la URL)
```

### GITHUB_APP_PRIVATE_KEY
```
Valor: El contenido COMPLETO del archivo .pem
```

**IMPORTANTE**: Para la Private Key:
- Abre el archivo `.pem` con un editor de texto
- Copia TODO el contenido (incluye BEGIN y END)
- Pégalo como valor en Netlify
- Netlify manejará los saltos de línea automáticamente

Ejemplo de cómo se ve un private key:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(muchas líneas)
...
-----END RSA PRIVATE KEY-----
```

## Paso 6: Deploy y configurar repositorios

1. Haz deploy de tu app en Netlify
2. Abre la URL de tu app
3. Ve al panel de **Configuración** (⚙️)
4. Agrega los repositorios que quieres monitorear
   - Usa el formato: `owner/repo`
   - Ejemplo: `facebook/react`
5. Configura el tiempo límite SLA (por defecto: 4 horas)
6. Click en **Guardar configuración**

## Transferir GitHub App a una Organización (Opcional)

Si inicialmente creaste la app en tu cuenta personal y ahora quieres moverla a una organización:

1. Ve a la página de tu GitHub App
2. Click en **Advanced** (en el menú lateral)
3. Scroll hasta **Transfer ownership**
4. Selecciona la organización destino
5. La organización debe aceptar la transferencia

## Troubleshooting

### Error: "GitHub App not configured"
- Verifica que las 3 variables de entorno estén configuradas en Netlify
- Asegúrate de que el private key incluya las líneas BEGIN y END
- Redeploy después de configurar las variables

### Error: "Failed to fetch PRs"
- Verifica que la GitHub App esté instalada en los repos que configuraste
- Revisa que los permisos de Pull requests estén en Read & write
- Asegúrate de que el Installation ID sea correcto

### No aparecen PRs
- Verifica que agregaste repositorios en el panel de configuración
- Asegúrate de que los repos tienen PRs abiertas
- Revisa que los repos estén escritos correctamente: `owner/repo`

### No puedo marcar PRs como urgentes
- Verifica que el permiso de Pull requests esté en Read & write (no solo Read)
- La app creará automáticamente la label "urgent" la primera vez

## Seguridad

- ⚠️ Nunca compartas tu private key
- ⚠️ Nunca hagas commit del archivo `.pem` en git
- ⚠️ Las variables de entorno en Netlify están encriptadas y son seguras
- ✅ Puedes revocar y regenerar el private key en cualquier momento desde GitHub

## Próximos pasos

Una vez configurada la GitHub App:
1. Las PRs se actualizarán automáticamente cada minuto
2. Puedes marcar PRs como urgentes desde el dashboard
3. Las etiquetas "urgent" se sincronizarán con GitHub
4. Recibirás alertas visuales para PRs sin assignee/reviewer

¿Problemas? Revisa los logs de Netlify Functions en:
`Site → Functions → function-name → Logs`
