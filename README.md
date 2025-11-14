# PR Dashboard

Monitor de Pull Requests de GitHub con alertas de asignación y gestión de urgencias.

## Características

- 📊 **Dashboard en tiempo real**: Visualiza todas las PRs abiertas de múltiples repositorios
- ⏱️ **Sistema SLA configurable**: Define tiempo límite para asignación de assignee y reviewer
- 🚨 **Alertas visuales**: Estados OK, Warning y Overdue según tiempo transcurrido
- ⭐ **Marcado de urgentes**: Marca PRs como urgentes usando labels de GitHub
- 🔍 **Filtros avanzados**: Filtra por urgentes, overdue, sin asignar
- 📈 **Ordenamiento inteligente**: Ordena por urgencia, tiempo abierto, o número de reviewers
- 🔄 **Auto-refresh**: Actualización automática cada minuto
- ⚙️ **Configuración flexible**: Panel para gestionar repos y parámetros SLA

## Stack Tecnológico

- **Frontend**: Vite + React + TypeScript + TailwindCSS
- **State Management**: TanStack Query (React Query)
- **Backend**: Netlify Functions (Serverless)
- **Storage**: Netlify Blobs
- **GitHub Integration**: GitHub App con Octokit

## Instalación y Desarrollo Local

1. Clona el repositorio:
```bash
git clone https://github.com/prubiera85/hot-potato-pr-dashboard.git
cd hot-potato-pr-dashboard
```

2. Instala dependencias:
```bash
npm install
```

3. Configura las variables de entorno (ver [GITHUB_APP_SETUP.md](./GITHUB_APP_SETUP.md)):
```bash
cp .env.example .env
# Edita .env con tus credenciales de GitHub App
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

5. Para desarrollo con Netlify Functions:
```bash
npm install -g netlify-cli
netlify dev
```

## Deploy en Netlify

1. Conecta el repositorio a Netlify
2. Configura las variables de entorno (ver [GITHUB_APP_SETUP.md](./GITHUB_APP_SETUP.md))
3. Deploy automático en cada push a main

### Variables de entorno requeridas:
- `GITHUB_APP_ID`: ID de tu GitHub App
- `GITHUB_APP_INSTALLATION_ID`: ID de instalación de la app
- `GITHUB_APP_PRIVATE_KEY`: Private key completa (.pem)

## Configuración de GitHub App

Sigue la guía detallada en [GITHUB_APP_SETUP.md](./GITHUB_APP_SETUP.md) para:
1. Crear una GitHub App en tu cuenta personal
2. Configurar permisos necesarios
3. Instalar la app en tus repositorios
4. Obtener las credenciales necesarias
5. Transferir a organización (opcional)

## Uso

### Panel de Configuración

1. Configura el **tiempo límite SLA** (por defecto: 4 horas)
   - PRs sin assignee o reviewer por más de este tiempo se marcarán como "overdue"

2. Configura el **umbral de advertencia** (por defecto: 80%)
   - Muestra warning cuando se alcanza este % del tiempo límite

3. Agrega **repositorios a monitorear**:
   - Formato: `owner/repo`
   - Ejemplo: `facebook/react`, `vercel/next.js`

### Dashboard Principal

**Métricas:**
- Total de PRs abiertas
- PRs urgentes
- PRs overdue
- PRs sin asignar

**Filtros:**
- Todas
- Urgentes (⭐)
- Overdue (🚨)
- Sin asignar

**Ordenamiento:**
- Urgente + Overdue (recomendado)
- Tiempo abierta
- Número de reviewers

**Acciones por PR:**
- Marcar/desmarcar como urgente
- Ver en GitHub
- Estado visual (OK ✅ / Warning ⚠️ / Overdue 🚨)

## Estructura del Proyecto

```
pr-dashboard/
├── netlify/
│   └── functions/         # Netlify serverless functions
│       ├── get-prs.mts           # Obtener PRs de GitHub
│       ├── toggle-urgent.mts     # Gestionar label urgente
│       └── config.mts            # Gestionar configuración
├── src/
│   ├── components/        # Componentes React
│   │   ├── Dashboard.tsx         # Vista principal
│   │   ├── PRCard.tsx            # Card de PR individual
│   │   └── ConfigPanel.tsx       # Panel de configuración
│   ├── types/            # TypeScript types
│   │   └── github.ts             # Tipos de GitHub y PR
│   └── utils/            # Utilidades
│       └── prHelpers.ts          # Helpers para PRs
├── netlify.toml          # Configuración de Netlify
└── GITHUB_APP_SETUP.md   # Guía de configuración

```

## Migración a Organización

Una vez que hayas probado el dashboard con tu cuenta personal y quieras usarlo en tu organización:

1. Transfiere la GitHub App a la organización (ver [GITHUB_APP_SETUP.md](./GITHUB_APP_SETUP.md))
2. No necesitas cambiar ninguna configuración en Netlify
3. Los permisos se mantienen
4. La configuración de repos se mantiene

## Troubleshooting

Ver la sección de **Troubleshooting** en [GITHUB_APP_SETUP.md](./GITHUB_APP_SETUP.md)

## Roadmap

- [ ] Notificaciones push cuando una PR se vuelve overdue
- [ ] Integración con Slack/Discord
- [ ] Estadísticas históricas
- [ ] Exportar reportes
- [ ] Modo dark

## Contribuir

Las contribuciones son bienvenidas. Por favor abre un issue primero para discutir cambios mayores.

## Licencia

ISC