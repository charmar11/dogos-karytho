# Dogos Karytho POS — Instrucciones para el Agente

## Qué es este proyecto
Sistema de punto de venta (POS) para un negocio de hot dogs llamado **Dogos Karytho**.
Es una **sola página HTML** con JavaScript vanilla y Firebase Realtime Database.
Hospedado en **GitHub Pages**.

## Stack tecnológico
- **HTML/CSS/JS vanilla** — sin frameworks (NO React, NO Vue, NO Angular)
- **Firebase Realtime Database** SDK compat v10.12.2
- **Firebase Auth** compat v10.12.2
- **Chart.js** 4.4.1 — para gráficas en el módulo de reportes
- **SheetJS (XLSX)** 0.18.5 — para exportar a Excel
- **Un solo archivo:** `index.html` — todo el CSS, HTML y JS va en ese archivo

## Módulos existentes
1. **Cobrar (CIPOD)** — pantalla de ventas para usuarios normales
2. **Admin** — ventas, reportes, gestión de productos, cortes de caja
3. **Inventario** — ingredientes, recetas, historial, consumo automático
4. **Eventos** — ventas en bulk para eventos externos
5. **CIDOP/Gastos** — registro de gastos con categorías

## Reglas estrictas — NUNCA violar
- ❌ NUNCA usar frameworks JS (React, Vue, etc.)
- ❌ NUNCA dividir en múltiples archivos — todo va en `index.html`
- ❌ NUNCA borrar o modificar la configuración de Firebase (`FB_CONFIG`)
- ❌ NUNCA cambiar los nombres de nodos de Firebase (products, sales, gastos, etc.)
- ❌ NUNCA usar `localStorage` directamente — siempre usar `safeStorage`
- ✅ Siempre explicar los cambios en lenguaje simple (el dueño no sabe programación)
- ✅ Antes de cambios grandes, hacer un plan primero y esperar aprobación
- ✅ Mantener el diseño oscuro con variables CSS existentes (--red, --gold, --bg, etc.)
- ✅ Respetar el sistema de roles: admin, inventario, eventos, user

## Patrones importantes del código
- Los listeners de Firebase se inician con `startFbListeners()`
- Para escribir en Firebase: usar `fbWriteSecure()` y `fbUpdateSecure()`, nunca `.set()` directo
- Para eliminar: usar `fbRemoveSecure()`
- Los datos se sincronizan entre Firebase y localStorage con `safeStorage`
- El inventario se puede pausar con `isInvPaused()` — verificar siempre antes de descontar
- Los productos tienen variantes (`variations`) y extras (`extras`)
- Las recetas base se combinan con overrides de variantes en `descontarInventario()`

## Problemas recurrentes a tener en cuenta
- Los listeners de Firebase pueden duplicarse — verificar `fbListening` antes de iniciar
- El módulo CIDOP de gastos tiene su propio listener independiente (`loadGastos()`)
- Los eventos tienen su propio módulo de ventas separado de las ventas normales
- El fondo de caja (`fondo`) se guarda por fecha como llave

## Contexto del negocio
- Negocio familiar de hot dogs en Ciudad Obregón, Sonora, México
- El dueño usa la app desde el celular principalmente
- La app también la usan empleados con roles limitados
- Las ventas se miden contra una meta diaria (`config/daily_goal`)
