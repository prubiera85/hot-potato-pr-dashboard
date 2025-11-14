# Hot Potato PR Dashboard - Manual de Usuario

## Índice
1. [Introducción](#introducción)
2. [Panel Principal](#panel-principal)
3. [Filtros y Ordenación](#filtros-y-ordenación)
4. [Marcado de PRs](#marcado-de-prs)
5. [Estados de las PRs](#estados-de-las-prs)
6. [Configuración](#configuración)
7. [Integración con GitHub](#integración-con-github)

---

## Introducción

Hot Potato PR Dashboard es una herramienta de monitoreo que te ayuda a mantener un seguimiento activo de las Pull Requests (PRs) que necesitan atención. El nombre hace referencia a la metáfora de una "patata caliente" - las PRs sin asignar o sin revisor deben pasarse rápidamente para mantener el flujo de trabajo.

### Filosofía
- **PRs sin assignee o reviewer = 🚨** Requieren atención inmediata
- **Sistema de SLA configurable** para definir límites de tiempo
- **Marcado inteligente** para priorizar y clasificar PRs

---

## Panel Principal

El dashboard muestra todas las PRs abiertas con la siguiente información:

### Información por PR

Cada tarjeta de PR muestra:

**Cabecera:**
- **Icono de estado** (✅ OK / ⚠️ Warning / 🚨 Overdue)
- **Marcadores especiales:**
  - ⭐ **Urgente** - PR que requiere atención prioritaria
  - ⚡ **Rápida** - PR fácil/rápida de revisar
- **Número y título** de la PR
- **Enlace directo** a GitHub

**Información del repositorio:**
- Nombre del repositorio (`owner/repo`)
- Tiempo que lleva abierta la PR
- Estado (OVERDUE si excede el límite)
- Usuario que creó la PR

**Asignación:**
- **Assignee:** Quién está trabajando en la PR
  - ✅ Si hay assignee asignado (muestra avatar + username)
  - ❌ Si falta assignee (texto rojo "Sin asignar")
- **Reviewer:** Quién debe revisar la PR
  - ✅ Si hay reviewers solicitados (muestra avatares + usernames + contador)
  - ❌ Si faltan reviewers (texto rojo "Sin reviewer")

**Etiquetas:**
- Muestra todas las etiquetas de GitHub con sus colores originales

**Acciones disponibles:**
- **Marcar urgente** - Priorizar la PR
- **Marcar rápida** - Indicar que es fácil de revisar
- **Ver en GitHub** - Abrir la PR en GitHub

---

## Filtros y Ordenación

### Filtros Disponibles

El dashboard ofrece 4 opciones de filtrado en la parte superior:

#### 1. **Todas las PRs**
Muestra todas las PRs abiertas sin excepción.

**Cuándo usar:** Cuando quieres una vista completa del estado de todos los repositorios.

#### 2. **Solo Urgentes** ⭐
Muestra únicamente las PRs marcadas como urgentes.

**Cuándo usar:**
- Cuando necesitas priorizar trabajo crítico
- Para revisar qué PRs tienen máxima prioridad
- En daily standups para identificar bloqueos

#### 3. **Solo Overdue** 🚨
Muestra solo las PRs que han excedido el límite de tiempo configurado (SLA).

**Cuándo usar:**
- Para identificar PRs que llevan demasiado tiempo sin atención
- Al final del día para ver qué quedó pendiente
- Para métricas de rendimiento del equipo

#### 4. **Solo Sin Asignar**
Muestra PRs que no tienen assignee O no tienen reviewer (o ambos).

**Cuándo usar:**
- Para distribuir trabajo entre el equipo
- Cuando necesitas asignar reviewers pendientes
- Para identificar PRs "huérfanas" que nadie ha reclamado

---

### Ordenación Disponible

Puedes ordenar las PRs de 3 formas diferentes:

#### 1. **Urgente + Overdue** (Predeterminado)
Ordena las PRs con la siguiente prioridad:
1. PRs **urgentes Y overdue** (más críticas)
2. PRs **urgentes** (sin overdue)
3. PRs **overdue** (sin marcar como urgente)
4. El resto ordenadas por tiempo abierto

**Cuándo usar:** La mayoría del tiempo - esta es la vista más accionable que combina prioridad manual (urgente) con SLA automático (overdue).

#### 2. **Tiempo Abierto**
Ordena por el tiempo que lleva abierta la PR, de mayor a menor.

**Cuándo usar:**
- Para encontrar PRs "olvidadas"
- Cuando quieres seguir un enfoque FIFO (First In, First Out)
- Para identificar PRs que podrían necesitar ser cerradas

#### 3. **Número de Reviewers**
Ordena por la cantidad de reviewers asignados, de menor a mayor.

**Cuándo usar:**
- Para identificar PRs que necesitan más reviewers
- Cuando estás distribuyendo carga de review entre el equipo
- Para balancear la cantidad de revisiones pendientes

---

## Marcado de PRs

El dashboard permite marcar PRs de dos formas complementarias:

### 1. Marcar como Urgente ⭐

**¿Qué significa?**
Una PR urgente requiere **atención prioritaria inmediata** del equipo.

**¿Cuándo marcar como urgente?**
- Hotfix para producción
- Bloquea a otros desarrolladores
- Necesaria para un release inminente
- Fixing critical bugs
- Dependencias críticas del negocio

**Indicadores visuales:**
- Botón rojo en la tarjeta ("Urgente")
- Icono ⭐ junto al título
- Prioridad alta en el ordenamiento

**Integración con GitHub:**
Cuando marcas una PR como urgente:
- Se crea automáticamente la etiqueta `urgent` en el repositorio (si no existe)
- Color de la etiqueta: **Rojo** (#d73a4a)
- Descripción: "This PR requires immediate attention"
- La etiqueta aparece en GitHub y en todas las vistas

**Desmarcar:**
Click en el botón "Urgente" (rojo) para quitar la marca. Esto eliminará la etiqueta de GitHub.

---

### 2. Marcar como Rápida ⚡

**¿Qué significa?**
Una PR rápida es **fácil/rápida de revisar** - ideal para llenar tiempos muertos.

**¿Cuándo marcar como rápida?**
- Cambios pequeños (< 50 líneas)
- Fix de typos o documentación
- Cambios de configuración simples
- Refactoring menor
- Updates de dependencias
- Cambios obvios que no requieren contexto profundo

**Indicadores visuales:**
- Botón amarillo en la tarjeta ("Rápida")
- Icono ⚡ junto al título

**Integración con GitHub:**
Cuando marcas una PR como rápida:
- Se crea automáticamente la etiqueta `quick` en el repositorio (si no existe)
- Color de la etiqueta: **Amarillo** (#fbca04)
- Descripción: "This PR is quick to review"
- La etiqueta aparece en GitHub y en todas las vistas

**Desmarcar:**
Click en el botón "Rápida" (amarillo) para quitar la marca. Esto eliminará la etiqueta de GitHub.

---

### Combinaciones de Marcado

Las PRs pueden tener **ambos marcadores simultáneamente**:

#### PR Urgente + Rápida ⭐⚡
**Escenario ideal:** Un hotfix crítico que además es simple de revisar.

**Ejemplo:**
```
"Fix: Cambiar URL de producción incorrecta en config"
- Urgente: Está rompiendo producción
- Rápida: Solo un cambio de string en 1 archivo
```

**Prioridad:** Máxima - se mostrará primero en el ordenamiento predeterminado.

#### PR Urgente solamente ⭐
**Escenario:** Cambio crítico pero complejo que requiere revisión cuidadosa.

**Ejemplo:**
```
"Fix: Corregir lógica de autenticación con JWT"
- Urgente: Afecta seguridad
- NO rápida: Requiere entender toda la lógica de auth
```

#### PR Rápida solamente ⚡
**Escenario:** Cambio simple pero no crítico.

**Ejemplo:**
```
"Docs: Actualizar README con nuevo endpoint"
- NO urgente: No afecta funcionalidad
- Rápida: Solo documentación, fácil de revisar
```

---

## Estados de las PRs

El dashboard clasifica automáticamente cada PR en uno de estos estados:

### ✅ OK (Verde)
**Condición:** PR tiene assignee Y reviewer asignados, o no ha alcanzado el 80% del tiempo límite.

**Borde:** Verde

**Significa:** La PR está bajo control, no requiere acción inmediata.

---

### ⚠️ Warning (Amarillo)
**Condición:** PR sin assignee O sin reviewer, y ha alcanzado el **80%** del tiempo límite configurado.

**Borde:** Amarillo

**Significa:** Atención - la PR se está acercando al límite de tiempo. Actúa pronto para evitar que pase a overdue.

**Ejemplo:** Si el SLA es 4 horas, warning aparece a las 3.2 horas (80% de 4h).

---

### 🚨 Overdue (Rojo)
**Condición:** PR sin assignee O sin reviewer, y ha **excedido** el tiempo límite configurado.

**Borde:** Rojo grueso

**Texto adicional:** Muestra "(OVERDUE)" en rojo al lado del tiempo abierto.

**Significa:** ¡Acción requerida! Esta PR ha superado el SLA y necesita atención inmediata.

**Ejemplo:** Si el SLA es 4 horas, overdue aparece después de 4 horas sin assignee/reviewer.

---

### Combinaciones con Marcadores

Los estados se combinan con los marcadores de forma independiente:

- **🚨 ⭐ Overdue + Urgente** = Máxima prioridad - Atención INMEDIATA
- **🚨 ⚡ Overdue + Rápida** = Alta prioridad pero fácil de resolver
- **⚠️ ⭐ Warning + Urgente** = Urgente que se acerca al límite
- **⚠️ ⚡ Warning + Rápida** = Oportunidad de resolver algo quick antes de que sea tarde

---

## Configuración

Accede al panel de configuración mediante el botón **"Configuración"** (engranaje) en la esquina superior derecha.

### Opciones de Configuración

#### 1. Tiempo Límite de Asignación (SLA)
**Valor:** Horas (número entero positivo)

**Descripción:** Define cuántas horas puede estar una PR sin assignee o reviewer antes de marcarseomo overdue.

**Advertencia automática:** El sistema te avisará cuando una PR alcance el 80% de este tiempo (estado Warning ⚠️).

**Ejemplo:**
- SLA = 4 horas
- Warning aparece a las 3.2 horas (80%)
- Overdue aparece a las 4+ horas

**Recomendaciones por tipo de equipo:**
- **Equipos ágiles pequeños:** 2-4 horas
- **Equipos medianos:** 4-8 horas
- **Equipos distribuidos globalmente:** 12-24 horas
- **Proyectos open source:** 48 horas

---

#### 2. Repositorios Monitoreados

**Agregar Repositorios:**

Puedes agregar repositorios de dos formas:

1. **URL completa de GitHub:**
   ```
   https://github.com/facebook/react
   https://github.com/microsoft/typescript
   ```

2. **Formato owner/repo:**
   ```
   facebook/react
   microsoft/typescript
   ```

**Proceso:**
1. Pega la URL o escribe owner/repo en el campo
2. Click en "Agregar"
3. El sistema valida automáticamente:
   - ✅ Formato correcto
   - ✅ Repositorio existe
   - ✅ GitHub App tiene acceso
4. Si hay error, se muestra mensaje específico con instrucciones

**Validación en tiempo real:**
- ❌ **Formato inválido:** Muestra ejemplos de formato correcto
- ❌ **Repositorio no existe:** Verifica el nombre
- ❌ **Sin acceso:** Debes instalar la GitHub App en ese repositorio

**Gestionar Repositorios:**
- ✅ **Checkbox:** Habilitar/deshabilitar monitoreo sin eliminar
- 🗑️ **Eliminar:** Quitar repositorio de la lista

**Nota:** Debes tener al menos 1 repositorio habilitado para guardar la configuración.

---

#### 3. Guardar y Cancelar

**Botón Guardar (Verde):**
- Guarda toda la configuración (SLA + repositorios)
- Actualiza el dashboard inmediatamente
- Disabled si no hay repositorios

**Botón Cancelar (Gris):**
- Cierra el modal sin guardar cambios
- Restaura valores previos
- Útil si agregaste repositorios por error

---

## Integración con GitHub

### Cómo Funcionan las Etiquetas

El dashboard utiliza **etiquetas de GitHub** para el marcado de PRs:

#### Etiqueta "urgent" ⭐
- **Color:** Rojo (#d73a4a)
- **Descripción:** "This PR requires immediate attention"
- **Creación:** Automática al marcar la primera PR como urgente en un repo
- **Sincronización:** Bidireccional

**Sincronización bidireccional significa:**
1. **Dashboard → GitHub:** Click en "Marcar urgente" crea/añade la etiqueta en GitHub
2. **GitHub → Dashboard:** Si agregas manualmente la etiqueta `urgent` en GitHub, aparece en el dashboard

#### Etiqueta "quick" ⚡
- **Color:** Amarillo (#fbca04)
- **Descripción:** "This PR is quick to review"
- **Creación:** Automática al marcar la primera PR como rápida en un repo
- **Sincronización:** Bidireccional

**Sincronización bidireccional significa:**
1. **Dashboard → GitHub:** Click en "Marcar rápida" crea/añade la etiqueta en GitHub
2. **GitHub → Dashboard:** Si agregas manualmente la etiqueta `quick` en GitHub, aparece en el dashboard

---

### Casos de Uso de Etiquetas

#### Escenario 1: Marcar desde el Dashboard
1. Abres Hot Potato PR Dashboard
2. Ves una PR que necesita atención urgente
3. Click en "Marcar urgente"
4. ✅ La etiqueta `urgent` aparece en GitHub inmediatamente
5. 🔄 El dashboard se actualiza mostrando ⭐

#### Escenario 2: Marcar desde GitHub
1. Estás revisando una PR en GitHub directamente
2. Te das cuenta que es fácil de revisar
3. Agregas manualmente la etiqueta `quick`
4. ✅ Al refrescar el dashboard (o esperar 1 minuto), aparece el icono ⚡

#### Escenario 3: Trabajo en Equipo
1. Developer A marca una PR como urgente desde el dashboard
2. Developer B ve la PR en GitHub con la etiqueta roja `urgent`
3. Developer C ve la PR en el dashboard con ⭐
4. ✅ Todo el equipo tiene la misma visibilidad

---

### Actualización Automática

**Frecuencia:** El dashboard se actualiza automáticamente cada **60 segundos**.

**Qué se actualiza:**
- Estados de todas las PRs
- Nuevas PRs abiertas
- PRs cerradas (desaparecen)
- Cambios en assignees/reviewers
- Etiquetas modificadas en GitHub
- Tiempos actualizados

**Actualización manual:**
Click en el botón de refresh (🔄) en cualquier momento para forzar una actualización inmediata.

---

## Consejos y Mejores Prácticas

### Para Desarrolladores

1. **Revisa el dashboard al empezar el día**
   - Filtra por "Solo Urgentes" para ver prioridades
   - Luego revisa "Solo Overdue" para rescatar PRs olvidadas

2. **Usa "Marcar rápida" generosamente**
   - Ayuda a tus compañeros a encontrar PRs que pueden revisar en 5 minutos
   - Ideal para typos, docs, configs simples

3. **Combina marcadores inteligentemente**
   - Urgente + Rápida = "Hazlo ahora, es fácil"
   - Solo Urgente = "Prioridad pero tómate tu tiempo para revisar bien"

### Para Tech Leads / Managers

1. **Configura SLAs realistas**
   - Mide tiempos actuales antes de configurar
   - Ajusta gradualmente hasta encontrar el equilibrio

2. **Monitorea métricas de overdue**
   - Alto % de overdues = SLA muy agresivo O problemas de proceso
   - Cero overdues prolongado = SLA demasiado laxo

3. **Usa el filtro "Solo Sin Asignar" en daily standups**
   - Identifica PRs que necesitan dueño
   - Distribuye carga de review

### Para Equipos

1. **Establece convenciones claras**
   - ¿Quién puede marcar como urgente?
   - ¿Cuántas PRs urgentes es razonable tener simultáneamente?

2. **Rotación de reviewers**
   - Ordena por "Número de Reviewers" para balancear carga
   - Las PRs con 0 reviewers son las primeras en la lista

3. **Ceremonias diarias**
   - Revisa PRs overdue en el standup
   - Asigna reviewers para PRs sin asignar

---

## Solución de Problemas

### "No veo ninguna PR"

**Posibles causas:**
1. No hay PRs abiertas en los repositorios configurados
2. GitHub App no tiene acceso a los repositorios
3. Repositorios deshabilitados en configuración

**Solución:**
- Verifica que los repos tengan PRs abiertas en GitHub
- Confirma que la GitHub App está instalada en los repositorios
- Revisa que los repositorios estén habilitados (checkbox marcado) en configuración

### "PR no aparece después de abrirla en GitHub"

**Causa:** Actualización cada 60 segundos.

**Solución:** Click en el botón de refresh (🔄) o espera hasta 1 minuto.

### "No puedo agregar un repositorio"

**Errores comunes:**

1. **"Formato inválido"**
   - Verifica que uses: `https://github.com/owner/repo` o `owner/repo`
   - Sin espacios ni caracteres especiales

2. **"El repositorio no existe o la GitHub App no tiene acceso"**
   - Verifica que el repositorio existe en GitHub
   - Instala la GitHub App en ese repositorio desde GitHub Settings

3. **"El repositorio ya está en la lista"**
   - El repositorio ya fue agregado previamente

### "Las etiquetas no se sincronizan"

**Solución:**
- Espera hasta 1 minuto (actualización automática)
- Haz refresh manual (🔄)
- Verifica que la GitHub App tenga permisos de escritura en etiquetas

---

## Glosario

- **SLA:** Service Level Agreement - tiempo límite configurado
- **PR:** Pull Request
- **Assignee:** Persona asignada para trabajar en la PR
- **Reviewer:** Persona asignada para revisar la PR
- **Overdue:** PR que ha excedido el SLA
- **Warning:** PR que está al 80% del SLA
- **Urgent:** PR marcada manualmente como prioritaria
- **Quick:** PR marcada como rápida/fácil de revisar
- **GitHub App:** Aplicación que conecta el dashboard con GitHub

---

## Soporte

Para reportar bugs o sugerir mejoras, contacta al equipo de desarrollo o crea un issue en el repositorio del dashboard.

---

**Versión:** 1.0
**Última actualización:** 2025
