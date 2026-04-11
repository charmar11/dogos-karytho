# Firebase — Dogos Karytho

## Tipo de base de datos
Firebase **Realtime Database** (NO Firestore)
URL: `https://dogos-karytho-default-rtdb.firebaseio.com`

## Nodos principales

### `products`
Objeto con IDs numéricos como llaves. Cada producto:
```json
{
  "id": 1,
  "name": "Dogo Karytho",
  "basePrice": 50,
  "variations": [{ "name": "Con Papas", "price": 60 }],
  "extras": [{ "name": "Queso extra", "price": 10 }]
}
```

### `sales/{id}`
Cada venta, ID = timestamp numérico:
```json
{
  "id": 1712000000000,
  "timestamp": "2024-04-01T20:00:00.000Z",
  "time": "20:00",
  "date": "2024-04-01",
  "hour": 20,
  "items": [
    { "name": "Dogo Karytho", "var": "Con Papas", "extras": "Queso extra", "qty": 2, "price": 130 }
  ],
  "total": 130,
  "cash": 200,
  "cambio": 70
}
```

### `gastos/{id}`
Gastos del módulo CIDOP:
```json
{
  "id": "gasto_abc123",
  "fecha": "2024-04-01",
  "desc": "Bolsas para hot dogs",
  "cat": "cat_id_aqui",
  "monto": 150,
  "user": "Admin"
}
```

### `gasto_cats`
Categorías de gastos. Objeto con IDs:
```json
{
  "cat_xyz": { "id": "cat_xyz", "name": "Insumos", "icon": "🛒", "color": "#E02020" }
}
```

### `ingredients`
Inventario de ingredientes. Objeto con IDs tipo `ing_TIMESTAMP`:
```json
{
  "ing_1712000000000": {
    "id": "ing_1712000000000",
    "name": "Salchicha",
    "unit": "pz",
    "buyUnit": "paquete",
    "conversion": 10,
    "stock": 50,
    "alertAt": 10
  }
}
```

### `recipes`
Recetas de productos. Llaves = `{productId}` o `{productId}_{variante}`:
```json
{
  "1": [{ "ingId": "ing_xxx", "qty": 1 }],
  "1_Con Papas": [{ "ingId": "ing_xxx", "qty": 1 }, { "ingId": "ing_papas", "qty": 50 }]
}
```

### `general_recipe`
Consumo de condimentos generales (ketchup, mostaza, etc.):
```json
[{
  "ingId": "ing_ketchup",
  "qty": 15,
  "productMultipliers": { "1": 1, "2": 1.5 },
  "productIds": ["1", "2"]
}]
```

### `ing_categories`
Categorías de ingredientes para el módulo de inventario.

### `inv_history`
Historial de movimientos de inventario:
```json
{
  "ts": 1712000000000,
  "type": "consumo",
  "desc": "Consumo — 2x Dogo Karytho"
}
```

### `cortes`
Cortes de caja. Guardados con ID propio, limitado a últimos 200:
```json
{
  "id": "corte_abc",
  "ts": 1712000000000,
  "total": 1500,
  "fondoInicio": 200
}
```

### `config/daily_goal`
Meta de ventas diaria. Valor numérico simple.

### `fondo/{key}`
Fondo de caja. Llave basada en fecha.

### `cidop_members`
Miembros del equipo CIDOP. Objeto con nombres como llaves.

### `presence/{sessionId}`
Presencia en tiempo real de usuarios conectados.

### `activity_log`
Log de actividad reciente. Limitado a últimos 200 registros.

---

## Roles de usuario
| Rol | Acceso |
|---|---|
| `admin` | Todo — ventas, inventario, eventos, gastos, cortes |
| `inventario` | Solo módulo de inventario |
| `eventos` | Solo panel de eventos |
| `user` | Solo cobrar (vista CIPOD) |

## Emails hardcodeados por rol
```
ADMIN:      admin@karytho.com
INVENTARIO: inventario@karytho.com
EVENTOS:    eventos@karytho.com
```

## Claves de localStorage (safeStorage)
| Clave | Contenido |
|---|---|
| `dk_session` | '1' si hay sesión activa |
| `dk_role` | rol del usuario |
| `dk_display` | nombre visible |
| `dk_products_v3` | caché de productos |
| `dk_sales_v3` | caché de ventas |
| `dk_gastos_v1` | caché de gastos |
| `dk_ingredients_v1` | caché de ingredientes |
| `dk_recipes_v1` | caché de recetas |
| `dk_eventos_v1` | caché de eventos |
| `dk_fondo_v1` | fondo de caja |
