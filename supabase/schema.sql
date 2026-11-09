-- ==============================================================================
-- SISTEMA DE GESTIÓN DE GIMNASIOS (SAAS) - ESQUEMA SUPABASE POSTGRESQL + RLS
-- ==============================================================================

-- 1. EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES DE USUARIOS (Vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'empleado')) DEFAULT 'empleado',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA DE CLIENTES (Miembros del Gimnasio)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    dni TEXT NOT NULL UNIQUE,
    phone TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('Activo', 'Inactivo')) DEFAULT 'Activo',
    plan_type TEXT NOT NULL CHECK (plan_type IN ('Sesión Individual', 'Día por Medio (Mes)', 'Mensual Completo')) DEFAULT 'Mensual Completo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA DE INVENTARIO / PRODUCTOS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Agua', 'Proteínas', 'Postres proteicos', 'Energizantes', 'Otros')),
    cost_price NUMERIC(10, 2) NOT NULL CHECK (cost_price >= 0),   -- Precio de compra
    sale_price NUMERIC(10, 2) NOT NULL CHECK (sale_price >= 0),   -- Precio de venta
    stock INTEGER NOT NULL CHECK (stock >= 0) DEFAULT 0,          -- Stock disponible
    min_stock INTEGER NOT NULL DEFAULT 5,                         -- Alerta de stock bajo
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABLA DE VENTAS (Cabecera de Venta POS)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Efectivo', 'Tarjeta', 'Transferencia', 'Otro')) DEFAULT 'Efectivo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. TABLA DE DETALLE DE VENTAS (Líneas de Producto)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- FUNCIONES AUXILIARES DE SEGURIDAD Y TRIGGER PARA UPDATED_AT
-- ==============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de actualización
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Función segura para obtener el rol del usuario autenticado sin recursión RLS
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(v_role, 'empleado');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger para crear perfil automáticamente al registrarse en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'empleado')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- FUNCIÓN RPC ATÓMICA PARA PROCESAR VENTAS Y REDUCIR STOCK
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.process_sale(
    p_client_id UUID,
    p_payment_method TEXT,
    p_items JSONB -- Arreglo de objetos: [{"product_id": "...", "quantity": 2, "unit_price": 2.50}]
)
RETURNS UUID AS $$
DECLARE
    v_sale_id UUID;
    v_total NUMERIC(10, 2) := 0;
    v_item JSONB;
    v_product_id UUID;
    v_qty INTEGER;
    v_price NUMERIC(10, 2);
    v_current_stock INTEGER;
    v_item_subtotal NUMERIC(10, 2);
BEGIN
    -- Validar que haya productos en la venta
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'La venta debe contener al menos un producto';
    END IF;

    -- 1. Calcular total y verificar stock de todos los productos primero
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::INTEGER;
        v_price := (v_item->>'unit_price')::NUMERIC;

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'La cantidad del producto debe ser mayor a 0';
        END IF;

        -- Bloqueo de fila para evitar condiciones de carrera (concurrency)
        SELECT stock INTO v_current_stock
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto con ID % no encontrado', v_product_id;
        END IF;

        IF v_current_stock < v_qty THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto (Disponible: %, Solicitado: %)', v_current_stock, v_qty;
        END IF;

        v_total := v_total + (v_qty * v_price);
    END LOOP;

    -- 2. Insertar cabecera de la venta
    INSERT INTO public.sales (user_id, client_id, total_amount, payment_method)
    VALUES (auth.uid(), p_client_id, v_total, p_payment_method)
    RETURNING id INTO v_sale_id;

    -- 3. Insertar detalle de venta y decrementar stock en inventario
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::INTEGER;
        v_price := (v_item->>'unit_price')::NUMERIC;
        v_item_subtotal := v_qty * v_price;

        -- Reducción de stock
        UPDATE public.products
        SET stock = stock - v_qty
        WHERE id = v_product_id;

        -- Inserción de ítem de venta
        INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal)
        VALUES (v_sale_id, v_product_id, v_qty, v_price, v_item_subtotal);
    END LOOP;

    RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD POR FILA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS PARA PROFILES
-- ------------------------------------------------------------------------------
-- Todos los usuarios autenticados pueden ver su propio perfil y el admin puede ver todos
CREATE POLICY "Ver perfiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.get_auth_role() = 'admin');

CREATE POLICY "Admin puede actualizar perfiles" ON public.profiles
    FOR UPDATE TO authenticated
    USING (public.get_auth_role() = 'admin' OR id = auth.uid());

-- ------------------------------------------------------------------------------
-- RLS PARA CLIENTES (Gym Members)
-- Admin y Empleado pueden registrar, consultar y actualizar clientes
-- ------------------------------------------------------------------------------
CREATE POLICY "Lectura de clientes permitida para usuarios autenticados" ON public.clients
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Creación de clientes permitida para admin y empleado" ON public.clients
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Actualización de clientes permitida para admin y empleado" ON public.clients
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Solo admin puede eliminar clientes" ON public.clients
    FOR DELETE TO authenticated
    USING (public.get_auth_role() = 'admin');

-- ------------------------------------------------------------------------------
-- RLS PARA PRODUCTOS (Inventario)
-- Empleados pueden ver productos y stock; solo Admin puede crear, editar y eliminar
-- ------------------------------------------------------------------------------
CREATE POLICY "Lectura de productos para todos los usuarios autenticados" ON public.products
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Solo admin puede insertar productos" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (public.get_auth_role() = 'admin');

CREATE POLICY "Admin puede actualizar productos (empleados modifican vía process_sale)" ON public.products
    FOR UPDATE TO authenticated
    USING (public.get_auth_role() = 'admin');

CREATE POLICY "Solo admin puede eliminar productos" ON public.products
    FOR DELETE TO authenticated
    USING (public.get_auth_role() = 'admin');

-- ------------------------------------------------------------------------------
-- RLS PARA VENTAS (Sales)
-- Admin y Empleado pueden consultar ventas y registrar nuevas ventas
-- ------------------------------------------------------------------------------
CREATE POLICY "Lectura de ventas para usuarios autenticados" ON public.sales
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Registro de ventas permitido para usuarios autenticados" ON public.sales
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Solo admin puede anular o eliminar ventas" ON public.sales
    FOR DELETE TO authenticated
    USING (public.get_auth_role() = 'admin');

-- ------------------------------------------------------------------------------
-- RLS PARA ITEMS DE VENTA (Sale Items)
-- ------------------------------------------------------------------------------
CREATE POLICY "Lectura de items de venta para usuarios autenticados" ON public.sale_items
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Registro de items de venta permitido" ON public.sale_items
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- ==============================================================================
-- DATOS SEMILLA DE PRUEBA (MOCK DATA PARA TEST INICIAL)
-- ==============================================================================

-- Productos iniciales
INSERT INTO public.products (name, category, cost_price, sale_price, stock, min_stock) VALUES
('Agua Mineral 500ml', 'Agua', 0.40, 1.00, 48, 10),
('Agua con Gas 500ml', 'Agua', 0.50, 1.20, 24, 10),
('Whey Protein Isolate 1kg Vainilla', 'Proteínas', 22.00, 38.50, 12, 3),
('Whey Protein Concentrada Chocolate 1kg', 'Proteínas', 18.00, 32.00, 15, 3),
('Barra Proteica Brownie 60g (20g Proteína)', 'Postres proteicos', 1.10, 2.50, 30, 8),
('Galleta Proteica Cookies & Cream 75g', 'Postres proteicos', 1.25, 2.75, 18, 5),
('Monster Energy Ultra White 500ml', 'Energizantes', 1.20, 2.50, 20, 6),
('Red Bull Sugarfree 250ml', 'Energizantes', 1.10, 2.20, 14, 5),
('Bebida Pre-Entreno C4 Explosive', 'Energizantes', 1.50, 3.00, 4, 5) -- Bajo stock (4 < 5)
ON CONFLICT DO NOTHING;

-- Clientes iniciales
INSERT INTO public.clients (full_name, dni, phone, start_date, status) VALUES
('Carlos Mendoza', '45892134A', '+34 611 223 344', CURRENT_DATE - INTERVAL '60 days', 'Activo'),
('Lucía Gómez Torres', '78451296B', '+34 622 334 455', CURRENT_DATE - INTERVAL '30 days', 'Activo'),
('Alejandro Silva', '32145698C', '+34 633 445 566', CURRENT_DATE - INTERVAL '12 days', 'Activo'),
('María Fernández', '56987412D', '+34 644 556 677', CURRENT_DATE - INTERVAL '90 days', 'Inactivo'),
('Javier Ortiz Morales', '12345678E', '+34 655 667 788', CURRENT_DATE - INTERVAL '5 days', 'Activo')
ON CONFLICT DO NOTHING;

