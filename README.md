# 🏋️‍♂️ IronFit Gym SaaS - MVP de Gestión de Gimnasios

Sistema integral (SaaS) diseñado para administrar gimnasios modernos con gestión de clientes, control de inventario de suplementos/bebidas y punto de venta ágil (POS) con actualización automática de stock.

---

## 🚀 Stack Tecnológico

- **Frontend:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilos & UI:** [Tailwind CSS](https://tailwindcss.com/) + componentes accesibles inspirados en [shadcn/ui](https://ui.shadcn.com/) + iconos [Lucide React](https://lucide.dev/)
- **Estado Global:** [Zustand](https://github.com/pmndrs/zustand) (reactivo, ligero y desacoplado)
- **Gráficos & Visualización:** [Recharts](https://recharts.org/) (análisis de ventas a 7 y 30 días)
- **Base de Datos & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security RLS, RPC functions)

---

## 📦 Módulos Principales

### 1. 🔐 Autenticación & Control de Acceso por Roles (RBAC)
- **Admin:**
  - Acceso irrestricto a todo el sistema.
  - Métricas de facturación, ganancias netas y reportes financieros.
  - CRUD total de clientes, productos y anulación de ventas.
- **Empleado:**
  - Acceso operacional de mostrador.
  - Registro y edición de fichas de socios/clientes.
  - Operación ágil de la caja (Punto de Venta POS).
  - Consulta de existencias de inventario en tiempo real (márgenes y precios de compra ocultos).

### 2. 📊 Dashboard Principal (Recharts)
- Tarjetas de KPIs en tiempo real:
  - Total de socios activos y porcentaje de retención.
  - Ganancia neta y facturación del día.
  - Contador de ventas del turno.
  - Alerta inteligente de productos con stock bajo (crítico).
- Gráficos interactivos de facturación con filtro de **7 días** y **30 días**, alternable entre gráfico de barras y gráfico de área.

### 3. 👥 Gestión de Clientes (Miembros del Gym)
- CRUD completo con búsqueda en tiempo real por Nombre, DNI/Carnet o Teléfono.
- Filtro por estado de membresía: *Activo* (al día) e *Inactivo* (vencido).
- Campos reglamentarios: Nombre completo, DNI/Carnet, Teléfono, Fecha de inicio y Estado.
- Toggle rápido de estado de membresía con un solo clic.

### 4. 🥤 Inventario y Control de Almacén
- CRUD de productos por categorías especializadas:
  - **Agua** (mineral, con gas)
  - **Proteínas** (whey isolate, concentrada, vegana)
  - **Postres proteicos** (barras, galletas, flanes fit)
  - **Energizantes** (Monster, Red Bull, pre-entrenos)
  - **Otros** (shakers, toallas, accesorios)
- Campos: Nombre, categoría, precio de compra, precio de venta, stock actual y stock mínimo.
- Cálculo automático en vivo del margen de ganancia porcentual (`%`) y ganancia bruta unitaria.

### 5. 🛒 Punto de Venta (POS) & Descuento de Stock
- Catálogo visual por categorías con buscador instantáneo.
- Alerta visual cuando un producto está bajo en stock o agotado.
- Asignación opcional de socio o cobro como "Cliente Mostrador".
- Selección de método de pago: *Efectivo*, *Tarjeta*, *Bizum / Transferencia*, *Otro*.
- **Descuento automático de existencias**: Se descuenta del inventario en cuanto se confirma el cobro.
- Generación de **Ticket / Recibo de Venta** imprimible con número de ticket, cajero, detalle y total.

---

## 🗄️ Esquema de Base de Datos & Políticas RLS (Supabase)

El script SQL completo y listo para producción se encuentra en:
📁 `supabase/schema.sql`

### Tablas incluidas:
1. `profiles`: Perfiles vinculados a `auth.users` con roles `admin` y `empleado`.
2. `clients`: Ficha de socios con DNI único y estado de membresía.
3. `products`: Catálogo de inventario con precios de compra, venta y stock.
4. `sales`: Cabecera de venta con monto total, cajero, socio y método de pago.
5. `sale_items`: Líneas de venta asociadas a cada producto.

### Función Atómica PostgreSQL (`process_sale`):
Garantiza transaccionalidad total con bloqueo de fila (`FOR UPDATE`), previniendo condiciones de carrera:
1. Valida stock suficiente.
2. Descuenta el inventario de cada producto.
3. Inserta el registro en `sales`.
4. Inserta cada producto en `sale_items`.

---

## 🛠️ Instalación y Ejecución Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

3. **Compilar para producción:**
   ```bash
   npm run build
   ```

4. **Conectar con tu proyecto de Supabase (Opcional):**
   - Crea un nuevo proyecto en [Supabase](https://supabase.com).
   - Dirígete al **SQL Editor** en Supabase y ejecuta el script ubicado en `supabase/schema.sql`.
   - Copia tu **Project URL** y **Anon Key** en el archivo `.env`:
     ```env
     VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
     VITE_SUPABASE_ANON_KEY=tu-clave-anon
     ```
   - O bien, haz clic en el botón **"BD: Modo Demo"** dentro del navbar de la aplicación para guardar tus credenciales directamente desde la interfaz.

