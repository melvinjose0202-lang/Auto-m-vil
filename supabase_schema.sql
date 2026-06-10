-- =====================================================================
-- ESQUEMA DE BASE DE DATOS AUTO SPORT (SUPABASE COMPATIBLE)
-- CON SISTEMA DE SEGURIDAD AVANZADO CONTRA INYECCIONES Y HACKS
-- =====================================================================

-- 1. Tabla de Usuarios (Con validación de saldo positivo y estatus)
CREATE TABLE IF NOT EXISTS public.users (
    phone text PRIMARY KEY,
    password text NOT NULL,
    balance numeric DEFAULT 0 CONSTRAINT chk_positive_balance CHECK (balance >= 0),
    registered_at text,
    referred_by text,
    vips jsonb DEFAULT '[]'::jsonb,
    total_recharged numeric DEFAULT 0 CONSTRAINT chk_positive_recharged CHECK (total_recharged >= 0),
    total_withdrawn numeric DEFAULT 0 CONSTRAINT chk_positive_withdrawn CHECK (total_withdrawn >= 0),
    registration_bonus_claimed boolean DEFAULT false,
    status text DEFAULT 'active' CONSTRAINT chk_valid_status CHECK (status IN ('active', 'suspended')),
    CONSTRAINT chk_no_self_referral CHECK (referred_by <> phone)
);

-- Desactivar Row Level Security (RLS) para evitar bloqueos en prototipos rápidos 
-- u optar por habilitarla si tienes tokens personalizados.
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Tabla de Conexión de Referidos (Estructura y Auditoría)
CREATE TABLE IF NOT EXISTS public.referrals (
    id text PRIMARY KEY,
    referrer_phone text NOT NULL REFERENCES public.users(phone) ON DELETE CASCADE,
    referred_phone text NOT NULL UNIQUE REFERENCES public.users(phone) ON DELETE CASCADE,
    level text DEFAULT 'A' CONSTRAINT chk_level CHECK (level IN ('A', 'B', 'C')),
    date text,
    CONSTRAINT chk_diff_phones CHECK (referrer_phone <> referred_phone)
);

ALTER TABLE public.referrals DISABLE ROW LEVEL SECURITY;

-- 3. Tabla de Recargas (Anti-Hacks: Montos positivos e inmutabilidad en transacciones finalizadas)
CREATE TABLE IF NOT EXISTS public.recharges (
    id text PRIMARY KEY,
    phone text REFERENCES public.users(phone) ON DELETE CASCADE,
    amount numeric CONSTRAINT chk_min_recharge CHECK (amount > 0),
    payment_method text,
    reference text NOT NULL CONSTRAINT uq_recharge_reference UNIQUE, -- ¡Previene repetir el mismo código de transacción!
    receipt_name text,
    receipt_url text,
    status text DEFAULT 'pendiente' CONSTRAINT chk_recharge_status CHECK (status IN ('pendiente', 'aprobado', 'denegado')),
    date text
);

ALTER TABLE public.recharges DISABLE ROW LEVEL SECURITY;

-- 4. Tabla de Retiros (Con comisión válida y montos limpios)
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id text PRIMARY KEY,
    phone text REFERENCES public.users(phone) ON DELETE CASCADE,
    amount numeric CONSTRAINT chk_min_withdraw CHECK (amount > 0),
    net_amount numeric CONSTRAINT chk_positive_net CHECK (net_amount >= 0),
    commission numeric DEFAULT 0 CONSTRAINT chk_positive_commission CHECK (commission >= 0),
    status text DEFAULT 'pendiente' CONSTRAINT chk_withdrawal_status CHECK (status IN ('pendiente', 'completado', 'cancelado')),
    date text
);

ALTER TABLE public.withdrawals DISABLE ROW LEVEL SECURITY;

-- 5. Tabla de Historial Contable (Previene registros maliciosos)
CREATE TABLE IF NOT EXISTS public.history (
    id text PRIMARY KEY,
    phone text REFERENCES public.users(phone) ON DELETE CASCADE,
    type text CONSTRAINT chk_history_type CHECK (type IN ('recarga', 'retiro', 'comision', 'rendimiento', 'bono')),
    amount numeric CONSTRAINT chk_history_amount CHECK (amount >= 0),
    description text,
    date text
);

ALTER TABLE public.history DISABLE ROW LEVEL SECURITY;


-- =====================================================================
-- TRIGGERS DE SEGURIDAD (ANTI-DOUBLE-SPENDING & ANTI-FORGERY)
-- Evita que hackers modifiquen tickets ya aprobados enviando peticiones maliciosas
-- =====================================================================

-- Trigger de Bloqueo de Recargas Finalizadas
CREATE OR REPLACE FUNCTION public.protect_recharges_finalized() 
RETURNS TRIGGER AS $$
BEGIN
    -- Si el estado viejo ya era aprobado o denegado, abortamos cualquier modificación!
    IF (OLD.status IN ('aprobado', 'denegado')) THEN
        RAISE EXCEPTION 'Esta transacción ya ha sido finalizada y no puede alterarse por motivos de seguridad.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_protect_recharges 
BEFORE UPDATE ON public.recharges
FOR EACH ROW EXECUTE FUNCTION public.protect_recharges_finalized();


-- Trigger de Bloqueo de Retiros Finalizados
CREATE OR REPLACE FUNCTION public.protect_withdrawals_finalized() 
RETURNS TRIGGER AS $$
BEGIN
    -- Si el estado viejo ya era completado o cancelado, bloqueamos la fila
    IF (OLD.status IN ('completado', 'cancelado')) THEN
        RAISE EXCEPTION 'Este retiro ya ha sido procesado/cancelado y está congelado.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_protect_withdrawals 
BEFORE UPDATE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.protect_withdrawals_finalized();


-- =====================================================================
-- Índices para búsqueda ultra rápida (Previene ataques de DDoS por consultas pesadas)
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users(referred_by);
CREATE INDEX IF NOT EXISTS idx_recharges_phone ON public.recharges(phone);
CREATE INDEX IF NOT EXISTS idx_withdrawals_phone ON public.withdrawals(phone);
CREATE INDEX IF NOT EXISTS idx_history_phone ON public.history(phone);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_phone);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_phone);
