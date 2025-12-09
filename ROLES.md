# Sistema de Roles - Hot Potato PR Dashboard

Este documento describe el sistema de roles y permisos de la aplicación.

## Roles Disponibles

### 🔴 Superadmin

**Descripción**: Acceso completo incluyendo gamificación

**Características especiales**:
- Único rol con acceso a métricas de gamificación
- No puede ser eliminado del sistema
- Se configura únicamente vía variable de entorno

**Permisos**:
- ✅ Ver dashboard
- ✅ Marcar PRs como urgente/rápida
- ✅ Gestionar assignees y reviewers de PRs
- ✅ Acceder a configuración y gestión de roles
- ✅ Gestionar repositorios
- ✅ Acceso a gamificación (exclusivo)

**Qué ve en el sidebar**:
```
📋 Pull Requests
   - Todas las PRs
   - Mis PRs
👥 Equipo
   - Vista por Usuario
⚙️ Zona Admin
   - Configuración
   - Gestión de Roles
   - Gamificación ⭐ (exclusivo)
```

---

### 🔵 Admin

**Descripción**: Gestión de configuración, roles y todas las opciones de developer

**Características especiales**:
- Puede agregar/eliminar usuarios (admin y developer)
- Puede gestionar configuración de repositorios
- No puede eliminar superadmins
- No puede verse a sí mismo como superadmin

**Permisos**:
- ✅ Ver dashboard
- ✅ Marcar PRs como urgente/rápida
- ✅ Gestionar assignees y reviewers de PRs
- ✅ Acceder a configuración y gestión de roles
- ✅ Gestionar repositorios
- ❌ Acceso a gamificación

**Qué ve en el sidebar**:
```
📋 Pull Requests
   - Todas las PRs
   - Mis PRs
👥 Equipo
   - Vista por Usuario
⚙️ Zona Admin
   - Configuración
   - Gestión de Roles
```

---

### 🟢 Developer

**Descripción**: Puede ver y editar PRs (urgente/rápida, assignees, reviewers)

**Características especiales**:
- Rol por defecto al agregar nuevos usuarios
- Puede interactuar con PRs pero no con configuraciones del sistema

**Permisos**:
- ✅ Ver dashboard
- ✅ Marcar PRs como urgente/rápida
- ✅ Gestionar assignees y reviewers de PRs
- ❌ Acceder a configuración y gestión de roles
- ❌ Gestionar repositorios
- ❌ Acceso a gamificación

**Qué ve en el sidebar**:
```
📋 Pull Requests
   - Todas las PRs
   - Mis PRs
👥 Equipo
   - Vista por Usuario
```

---

### ⚪ Guest

**Descripción**: Solo visualización de PRs sin permisos de edición

**Características especiales**:
- Rol de solo lectura
- No se puede asignar desde la UI (solo por defecto si no está configurado)

**Permisos**:
- ✅ Ver dashboard
- ❌ Marcar PRs como urgente/rápida
- ❌ Gestionar assignees y reviewers de PRs
- ❌ Acceder a configuración y gestión de roles
- ❌ Gestionar repositorios
- ❌ Acceso a gamificación

**Qué ve en el sidebar**:
```
📋 Pull Requests
   - Todas las PRs
   - Mis PRs
👥 Equipo
   - Vista por Usuario
```

---

## Matriz de Permisos

| Permiso | Superadmin | Admin | Developer | Guest |
|---------|:----------:|:-----:|:---------:|:-----:|
| Ver dashboard | ✅ | ✅ | ✅ | ✅ |
| Marcar urgente/rápida | ✅ | ✅ | ✅ | ❌ |
| Gestionar assignees/reviewers | ✅ | ✅ | ✅ | ❌ |
| Acceder a configuración y roles | ✅ | ✅ | ❌ | ❌ |
| Gestionar repositorios | ✅ | ✅ | ❌ | ❌ |
| Acceso a gamificación | ✅ | ❌ | ❌ | ❌ |

---

## Gestión de Roles

### Configuración Inicial

Los roles se configuran mediante la variable de entorno `USER_ROLES` en Netlify:

```bash
USER_ROLES=prubiera85:superadmin,naclesz:admin
```

**Formato**: `username1:role1,username2:role2,...`

**Nota**: Esta configuración se migra automáticamente a Netlify Blobs en el primer acceso.

### Agregar Usuarios desde la UI

Los usuarios con rol **admin** o **superadmin** pueden agregar usuarios dinámicamente desde la interfaz:

1. Ir a **Zona Admin > Gestión de Roles**
2. Click en **"Agregar Usuario"**
3. Se abre un **dialog modal** con un formulario
4. Ingresar uno o varios usuarios de GitHub (separados por comas)
5. Seleccionar el rol: **admin** o **developer**
6. Click en **"Agregar"**
7. El listado se **actualiza automáticamente** mostrando los nuevos usuarios

**Ejemplo**: `user1, user2, user3`

**Características**:
- ✅ Actualización instantánea del listado (sin recargar página)
- ✅ Soporte para múltiples usuarios simultáneos
- ✅ Validación en tiempo real
- ✅ Feedback visual durante el proceso (loading states)

### Eliminar Usuarios

Solo se pueden eliminar usuarios **admin** y **developer** desde la UI:

**Restricciones**:
- ✅ Admin puede eliminar: otros admins y developers
- ✅ Superadmin puede eliminar: admins y developers
- ❌ Nadie puede eliminar: superadmins
- ❌ No puedes eliminarte a ti mismo

**Proceso de eliminación**:
1. Click en el icono de papelera (🗑️) junto al usuario
2. Se abre un **AlertDialog de confirmación** (Shadcn/ui)
3. El dialog explica las consecuencias:
   - "Esta acción eliminará el acceso del usuario @username"
   - "El usuario quedará como 'guest' en su próximo login"
4. Confirmar con el botón rojo **"Eliminar"** o cancelar
5. El listado se **actualiza automáticamente** tras la eliminación

**Características**:
- ✅ Confirmación profesional con AlertDialog (no `confirm()` nativo)
- ✅ Actualización instantánea del listado
- ✅ Mensaje descriptivo de las consecuencias
- ✅ Botones con estados de loading
- ✅ Diseño consistente con el resto de la aplicación

### Roles por Defecto

- Usuario en `USER_ROLES` → Rol asignado
- Usuario NO en `USER_ROLES` → **guest**

---

## Cambios de Rol

### Cambiar rol de un usuario existente

Simplemente agrega el usuario nuevamente con el nuevo rol desde la UI. El sistema actualizará el rol automáticamente.

### Promover developer a admin

1. Ir a **Gestión de Roles**
2. Click en **"Agregar Usuario"**
3. Ingresar el username del developer
4. Seleccionar **admin**
5. Confirmar

### Degradar admin a developer

Mismo proceso, seleccionando **developer** como rol.

---

## Almacenamiento

### Netlify Blobs

Los roles se almacenan en **Netlify Blobs** (storage persistente):
- **Store name**: `user-roles`
- **Blob key**: `roles`
- **Formato**: Array de objetos JSON

```json
[
  {
    "username": "prubiera85",
    "role": "superadmin",
    "addedAt": "2025-01-26T10:30:00.000Z",
    "addedBy": "migration"
  },
  {
    "username": "naclesz",
    "role": "admin",
    "addedAt": "2025-01-26T11:00:00.000Z",
    "addedBy": "prubiera85"
  }
]
```

### Ventajas de usar Blobs

✅ **Cambios instantáneos** - No requiere rebuild ni redeploy
✅ **Persistente** - Los datos se mantienen entre deploys
✅ **Gestión dinámica** - Agregar/eliminar usuarios desde la UI
✅ **Auditable** - Registra quién agregó cada usuario y cuándo

---

## Seguridad

### Protecciones Implementadas

1. **JWT con expiración de 7 días** - Los tokens expiran automáticamente
2. **Verificación de rol en backend** - Todas las operaciones sensibles verifican el rol
3. **Superadmin protegido** - No se puede eliminar ni modificar desde la UI
4. **Auto-protección** - No puedes eliminarte a ti mismo
5. **Rol guest por defecto** - Usuarios sin rol asignado tienen acceso de solo lectura
6. **Validación de roles** - Solo se pueden asignar roles válidos (admin, developer)

### Endpoints Protegidos

**Requieren autenticación (JWT válido)**:
- `GET /api/get-user-roles`
- `POST /api/manage-user-role`
- `DELETE /api/manage-user-role`

**Requieren rol admin o superadmin**:
- Todos los endpoints de gestión de roles
- Endpoints de configuración de repositorios

---

## Casos de Uso Comunes

### Incorporar nuevo developer al equipo

```bash
1. Admin/Superadmin accede a "Gestión de Roles"
2. Click en "Agregar Usuario"
3. Ingresa: "nuevodev"
4. Selecciona rol: "developer"
5. El usuario podrá acceder inmediatamente tras login
```

### Promover developer a admin

```bash
1. Admin/Superadmin accede a "Gestión de Roles"
2. Click en "Agregar Usuario"
3. Ingresa el username del developer existente
4. Selecciona rol: "admin"
5. El usuario tendrá permisos de admin en su próximo login
```

### Revocar acceso de un usuario

```bash
1. Admin/Superadmin accede a "Gestión de Roles"
2. Localiza el usuario en la lista
3. Click en el icono de papelera (🗑️)
4. Confirma la eliminación
5. El usuario quedará como "guest" en su próximo login
```

### Agregar múltiples developers al mismo tiempo

```bash
1. Admin/Superadmin accede a "Gestión de Roles"
2. Click en "Agregar Usuario"
3. Ingresa: "dev1, dev2, dev3, dev4"
4. Selecciona rol: "developer"
5. Todos los usuarios se agregarán con el mismo rol
```

---

## Troubleshooting

### Usuario no puede ver "Zona Admin"

**Causa**: El usuario no tiene rol admin o superadmin
**Solución**: Verificar rol del usuario en "Gestión de Roles" y actualizar si es necesario

### Usuario aparece como "guest" después de login

**Causa**: El usuario no está en la configuración de roles
**Solución**: Agregar el usuario desde "Gestión de Roles"

### No puedo eliminar un usuario

**Causas posibles**:
1. Es un superadmin (no se pueden eliminar)
2. Intentas eliminarte a ti mismo (no permitido)
3. No tienes permisos de admin

**Solución**: Verificar rol del usuario y tus propios permisos

### Los cambios de rol no se reflejan

**Causa**: El JWT tiene caché del rol anterior
**Solución**: El usuario debe cerrar sesión y volver a iniciar sesión

---

## Configuración Técnica

### Variables de Entorno

**Netlify (Production & Development)**:
```bash
USER_ROLES=prubiera85:superadmin,naclesz:admin
JWT_SECRET=super-secret-jwt-key-xxxxx
```

**Local (.env)**:
```bash
USER_ROLES=prubiera85:superadmin,naclesz:admin
JWT_SECRET=super-secret-jwt-key-xxxxx
```

### Migración de Env Var a Blobs

La primera vez que se accede a la aplicación después del deploy:
1. El sistema lee `USER_ROLES` de las variables de entorno
2. Parsea y convierte a formato de blob
3. Guarda en Netlify Blobs
4. Futuras lecturas usan blobs en lugar de env var

### Archivos Relevantes

**Types y Configuración**:
- `src/types/github.ts` - Definición de roles y permisos

**Backend**:
- `netlify/functions/auth/jwt.mts` - Autenticación y asignación de roles
- `netlify/functions/lib/user-roles-store.mts` - Gestión de roles en blobs
- `netlify/functions/manage-user-role.mts` - CRUD de usuarios
- `netlify/functions/get-user-roles.mts` - Listado de usuarios

**Frontend**:
- `src/hooks/usePermissions.ts` - Hooks para verificar permisos
- `src/components/RoleManagementView.tsx` - UI de gestión de roles con dialog y confirmaciones
- `src/components/app-sidebar.tsx` - Navegación condicional por rol
- `src/components/ui/alert-dialog.tsx` - Componente AlertDialog de Shadcn para confirmaciones

---

## UX y Mejores Prácticas

### Actualización Automática del Listado

El sistema utiliza **React Query** con `refetchQueries` para garantizar que el listado de usuarios siempre esté actualizado:

```typescript
onSuccess: async () => {
  // Refetch immediately to update the list
  await queryClient.refetchQueries({ queryKey: ['user-roles'] });
}
```

**Beneficios**:
- ✅ No requiere recargar la página
- ✅ Feedback inmediato al usuario
- ✅ Previene datos desincronizados
- ✅ Mejor experiencia de usuario

### Confirmación de Eliminación

Se usa **AlertDialog de Shadcn/ui** en lugar de `window.confirm()`:

**Ventajas del AlertDialog**:
- 🎨 Diseño consistente con el resto de la aplicación
- 📱 Responsive y accesible
- 💬 Permite mensajes descriptivos y formateo
- 🔘 Botones personalizables con estados
- ⌨️ Soporte de teclado (Escape para cancelar)
- 🎯 Mejor UX que el dialog nativo del navegador

**Estructura del dialog**:
```tsx
<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción eliminará el acceso del usuario @{userToDelete}.
        El usuario quedará como "guest" en su próximo login.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        onClick={confirmDelete}
        className="bg-red-600 hover:bg-red-700"
      >
        Eliminar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Estados de Loading

Todos los botones muestran estados de carga durante operaciones:
- **"Agregando..."** mientras se agregan usuarios
- **"Eliminando..."** mientras se elimina un usuario
- Botones deshabilitados durante operaciones
- Previene clics múltiples accidentales

---

## Roadmap

### Mejoras implementadas recientemente ✅

- [x] **AlertDialog de Shadcn**: Confirmaciones profesionales en lugar de `confirm()` nativo
- [x] **Actualización automática**: Listado se actualiza instantáneamente tras agregar/eliminar usuarios
- [x] **React Query refetch**: Uso de `refetchQueries` para forzar actualizaciones inmediatas
- [x] **Estados de loading**: Feedback visual durante operaciones asíncronas
- [x] **Mensajes descriptivos**: Explicación clara de las consecuencias al eliminar usuarios

### Futuras mejoras planificadas

- [ ] Logs de auditoría de cambios de roles
- [ ] Notificaciones cuando se cambia el rol de un usuario
- [ ] Roles personalizados con permisos granulares
- [ ] Expiración automática de roles temporales
- [ ] Integración con equipos de GitHub
- [ ] Dashboard de actividad por usuario

---

**Última actualización**: Enero 2025
**Versión del documento**: 1.1
