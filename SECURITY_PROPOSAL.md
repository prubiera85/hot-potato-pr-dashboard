# Propuestas de Securización - Hot Potato PR Dashboard

## Estado Actual

**CRÍTICO**: La aplicación actualmente NO tiene autenticación ni autorización. Todos los endpoints están expuestos públicamente.

### Vulnerabilidades Identificadas

1. ❌ **Sin autenticación**: Cualquiera con la URL puede acceder
2. ❌ **Sin autorización**: No hay sistema de permisos
3. ❌ **Seguridad CSS**: Botones críticos ocultos solo con CSS (fácilmente bypasseable)
4. ❌ **Sin auditoría**: No se registra quién hace qué
5. ❌ **Sin rate limiting**: Vulnerable a abuso
6. ❌ **Sin CORS**: Los endpoints pueden llamarse desde cualquier origen

---

## 🔐 Propuesta 1: Contraseña Simple Compartida (RÁPIDA)

### Descripción
Una única contraseña compartida por todos los usuarios. Ideal para equipos pequeños que necesitan protección básica inmediata.

### Características
- ✅ Implementación: **1-2 horas**
- ✅ Sin gestión de usuarios
- ✅ Contraseña en variable de entorno
- ✅ Sin dependencias externas
- ❌ No identifica usuarios individuales
- ❌ No permite filtrar "mis PRs"
- ❌ Sin auditoría de acciones

### Arquitectura

```
┌─────────────────────────────────┐
│  Frontend                        │
│                                  │
│  1. Pantalla de login            │
│  2. Input de contraseña          │
│  3. Guardar token en localStorage│
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│  POST /api/auth/login            │
│                                  │
│  - Compara con ADMIN_PASSWORD    │
│  - Genera JWT firmado            │
│  - Retorna token                 │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│  Middleware en todas las APIs    │
│                                  │
│  - Verifica JWT en headers       │
│  - Rechaza si inválido           │
│  - Continúa si válido            │
└─────────────────────────────────┘
```

### Variables de Entorno Necesarias
```bash
ADMIN_PASSWORD=tu-contraseña-segura-aqui
JWT_SECRET=clave-secreta-para-firmar-tokens
```

### Pros
- ✅ Implementación rápida
- ✅ Sin costes adicionales
- ✅ Fácil de entender
- ✅ No requiere servicios externos

### Contras
- ❌ Password compartido (si se filtra, afecta a todos)
- ❌ No hay concepto de "usuario"
- ❌ No se puede filtrar por usuario de GitHub
- ❌ No se puede auditar quién hizo cada acción

### Recomendado Para
- Equipos muy pequeños (2-5 personas)
- Protección básica inmediata
- Entornos de desarrollo/staging

---

## 🔐 Propuesta 2: GitHub OAuth (RECOMENDADA)

### Descripción
Autenticación mediante GitHub OAuth. Los usuarios inician sesión con su cuenta de GitHub, permitiendo identificación individual y filtrado personalizado.

### Características
- ✅ Implementación: **4-6 horas**
- ✅ Identifica usuarios individuales
- ✅ **Permite filtrar "Mis PRs"**
- ✅ Auditoría de acciones por usuario
- ✅ Usuarios ya tienen cuenta de GitHub
- ✅ Puede verificar permisos de GitHub
- ✅ Permite roles (admin, viewer)
- ❌ Más compleja que opción 1

### Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  Frontend                                                │
│                                                          │
│  - Botón "Login with GitHub"                            │
│  - Redirect a GitHub OAuth                              │
│  - Recibe callback con code                             │
│  - Guarda token + user info en localStorage/Zustand    │
│  - Muestra filtro "Mis PRs" si está autenticado         │
└──────────────┬──────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────┐
│  POST /api/auth/github/callback                         │
│                                                          │
│  1. Intercambia code por access_token con GitHub        │
│  2. Obtiene datos del usuario (login, email, avatar)    │
│  3. Verifica si el usuario tiene acceso permitido       │
│  4. Genera JWT con user info                            │
│  5. Retorna: { token, user: { login, avatar, ... } }    │
└──────────────┬──────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────┐
│  Middleware en todas las APIs                           │
│                                                          │
│  - Verifica JWT                                         │
│  - Extrae user info del token                           │
│  - Guarda en context.user                               │
│  - Logs de auditoría: "user X hizo Y"                   │
└─────────────────────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────┐
│  GET /api/prs?filter=mine                               │
│                                                          │
│  - Si filter=mine, filtra por context.user.login        │
│  - Muestra solo PRs donde:                              │
│    • author === user.login                              │
│    • assignees incluye user.login                       │
│    • reviewers incluye user.login                       │
└─────────────────────────────────────────────────────────┘
```

### Variables de Entorno Necesarias
```bash
GITHUB_OAUTH_CLIENT_ID=tu-oauth-app-client-id
GITHUB_OAUTH_CLIENT_SECRET=tu-oauth-app-secret
JWT_SECRET=clave-secreta-para-firmar-tokens
ALLOWED_GITHUB_USERS=user1,user2,user3  # Opcional: whitelist
ALLOWED_GITHUB_ORG=nombre-organizacion   # Opcional: solo miembros de org
```

### Setup GitHub OAuth App
1. Ir a GitHub Settings > Developer settings > OAuth Apps
2. Crear "New OAuth App"
3. **Homepage URL**: `https://tu-dashboard.netlify.app`
4. **Callback URL**: `https://tu-dashboard.netlify.app/auth/callback`
5. Copiar Client ID y Client Secret a Netlify env vars

### Nuevas Funcionalidades Desbloqueadas

#### Filtro "Mis PRs"
```typescript
// En Dashboard.tsx
const { data: user } = useQuery(['currentUser']);

<Button onClick={() => setFilter('mine')}>
  🧑 Mis PRs
</Button>

// En backend
if (filter === 'mine') {
  prs = prs.filter(pr =>
    pr.user.login === user.login ||
    pr.assignees.some(a => a.login === user.login) ||
    pr.reviewers.some(r => r.login === user.login)
  );
}
```

#### Sistema de Roles
```typescript
interface User {
  login: string;
  avatar_url: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer';
}

// Almacenado en Netlify Blobs
const userRoles = {
  'prubiera85': 'admin',
  'otro-dev': 'developer',
  'manager': 'viewer'
};

// Permisos
- admin: Puede todo (config, urgent, quick, assign)
- developer: Puede marcar urgent/quick, asignar/revisar
- viewer: Solo puede ver PRs
```

#### Auditoría de Acciones
```typescript
// En cada función protegida
await logAction({
  user: context.user.login,
  action: 'toggle_urgent',
  pr: `${owner}/${repo}#${prNumber}`,
  timestamp: new Date().toISOString()
});

// Almacenar en Netlify Blobs o enviar a servicio de logs
```

### Pros
- ✅ **Identifica usuarios individuales**
- ✅ **Permite filtro "Mis PRs"**
- ✅ Los usuarios ya tienen cuenta de GitHub
- ✅ Puede verificar membresía a organizaciones
- ✅ Auditoría completa
- ✅ Sistema de roles
- ✅ No requiere gestión de passwords

### Contras
- ❌ Más código que opción 1
- ❌ Requiere configurar OAuth App en GitHub
- ❌ Depende de disponibilidad de GitHub

### Recomendado Para
- **Tu caso de uso** (quieres filtrar "mis PRs")
- Equipos de cualquier tamaño
- Necesitas auditoría
- Necesitas roles diferentes

---

## 🔐 Propuesta 3: Híbrida (Contraseña + GitHub OAuth)

### Descripción
Combina ambas opciones: contraseña para acceso básico, GitHub OAuth para funciones avanzadas.

### Características
- ✅ Implementación: **5-7 horas**
- ✅ Dos niveles de acceso
- ✅ Password para vistas de solo lectura
- ✅ GitHub OAuth para funciones avanzadas
- ✅ Flexibilidad máxima

### Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  Login Screen                                            │
│                                                          │
│  ┌─────────────────────────────────────┐               │
│  │  Acceso Básico (Solo Lectura)       │               │
│  │  [Contraseña compartida] [Login]     │               │
│  └─────────────────────────────────────┘               │
│                                                          │
│  ┌─────────────────────────────────────┐               │
│  │  Acceso Completo                     │               │
│  │  [Login with GitHub]                 │               │
│  └─────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### Niveles de Acceso

| Acción | Password | GitHub OAuth |
|--------|----------|--------------|
| Ver PRs | ✅ | ✅ |
| Ver stats | ✅ | ✅ |
| Filtrar repos | ✅ | ✅ |
| **Filtrar "Mis PRs"** | ❌ | ✅ |
| Marcar Urgent/Quick | ❌ | ✅ |
| Asignar assignees | ❌ | ✅ |
| Asignar reviewers | ❌ | ✅ |
| Cambiar configuración | ❌ | ✅ (admin) |

### Pros
- ✅ Flexibilidad máxima
- ✅ Managers pueden ver sin GitHub login
- ✅ Devs tienen funciones completas
- ✅ Auditoría para acciones importantes

### Contras
- ❌ Más compleja
- ❌ Dos flujos de autenticación

### Recomendado Para
- Equipos mixtos (devs + managers/stakeholders)
- Necesitas que algunos solo vean, otros actúen

---

## 🔐 Propuesta 4: Netlify Identity (ALTERNATIVA)

### Descripción
Usa el servicio integrado de autenticación de Netlify Identity.

### Características
- ✅ Implementación: **3-4 horas**
- ✅ Integrado con Netlify
- ✅ Gestión de usuarios en Netlify UI
- ✅ Email + password o OAuth providers
- ✅ JWT automático
- ❌ No identifica automáticamente con usuario de GitHub
- ❌ Requiere crear cuentas manualmente

### Variables de Entorno Necesarias
```bash
# Ninguna extra, Netlify lo maneja
```

### Pros
- ✅ Fácil setup en Netlify
- ✅ UI de gestión de usuarios
- ✅ Soporte email/password y OAuth
- ✅ JWTs gestionados automáticamente

### Contras
- ❌ No conecta directamente con GitHub users
- ❌ Hay que crear cuentas manualmente
- ❌ **No permite filtro "Mis PRs" fácilmente** (no sabe tu GitHub user)
- ❌ Vendor lock-in con Netlify

### Recomendado Para
- Quieres algo rápido sin configurar OAuth
- No te importa crear usuarios manualmente
- **No es ideal para tu caso** (quieres filtrar "mis PRs")

---

## 📊 Comparativa Rápida

| Característica | Contraseña Simple | **GitHub OAuth** | Híbrida | Netlify Identity |
|----------------|-------------------|------------------|---------|------------------|
| Tiempo implementación | 1-2h | 4-6h | 5-7h | 3-4h |
| Filtro "Mis PRs" | ❌ | ✅ | ✅ | ❌ |
| Auditoría | ❌ | ✅ | ✅ | ⚠️ |
| Roles | ❌ | ✅ | ✅ | ✅ |
| Setup externo | ❌ | ✅ (OAuth App) | ✅ | ❌ |
| Gestión usuarios | ❌ | Automática | Automática | Manual |
| Costo | Gratis | Gratis | Gratis | Gratis (hasta 1000 users) |
| **Recomendada** | MVP rápido | **✅ TU CASO** | Equipos mixtos | No tu caso |

---

## 🎯 Recomendación Final

### Para tu caso de uso: **Opción 2 - GitHub OAuth**

**Razones:**
1. ✅ Cumple tu requisito principal: **"filtrar tus propias PRs"**
2. ✅ Tus usuarios ya tienen cuenta de GitHub (son desarrolladores)
3. ✅ Permite auditoría (sabes quién marcó qué como urgente)
4. ✅ Puede crecer con sistema de roles si lo necesitas
5. ✅ Sin costes adicionales
6. ✅ Integración natural con el contexto de PRs

### Plan de Implementación (4-6 horas)

#### Fase 1: Setup (30 min)
- [ ] Crear GitHub OAuth App
- [ ] Configurar variables de entorno en Netlify
- [ ] Instalar dependencias si es necesario

#### Fase 2: Backend Auth (1.5h)
- [ ] Crear `/api/auth/github/login` (inicia OAuth flow)
- [ ] Crear `/api/auth/github/callback` (intercambia code por token)
- [ ] Crear middleware de autenticación
- [ ] Proteger endpoints existentes

#### Fase 3: Frontend Auth (1.5h)
- [ ] Crear componente LoginScreen
- [ ] Usar Shadcn Dialog para modal de login
- [ ] Implementar Zustand store para user state
- [ ] Agregar botón "Login with GitHub"
- [ ] Manejar callback y guardar token

#### Fase 4: Filtro "Mis PRs" (1h)
- [ ] Agregar botón de filtro en Dashboard
- [ ] Modificar `/api/prs` para aceptar `filter=mine`
- [ ] Implementar lógica de filtrado por usuario
- [ ] Mostrar avatar del usuario en header

#### Fase 5: Reactivar Botones (30 min)
- [ ] Eliminar clases CSS hidden
- [ ] Agregar verificación de permisos en botones
- [ ] Mostrar disabled para usuarios sin permisos

#### Fase 6: Testing (1h)
- [ ] Probar flujo completo de login
- [ ] Probar filtro "Mis PRs"
- [ ] Probar acciones (urgent/quick)
- [ ] Probar logout y re-login

---

## 📝 Próximos Pasos

1. **Decide qué opción prefieres**
2. Te preparo un plan detallado de implementación
3. Creo los archivos necesarios
4. Implementamos paso a paso

**¿Quieres que implemente la Opción 2 (GitHub OAuth)?** Es la más adecuada para tu caso de uso de filtrar tus propias PRs.
