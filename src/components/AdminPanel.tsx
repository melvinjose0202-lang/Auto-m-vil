import React, { useState, useEffect } from 'react';
import { ShieldCheck, LogOut, CheckCircle2, XCircle, Landmark, Users, Coins, ArrowRightLeft, FileSpreadsheet, Search, RefreshCw, Smartphone, Copy, Check, Database, AlertTriangle, Gift, Award, TrendingUp, Code } from 'lucide-react';
import { RechargeRequest, WithdrawRequest, User, HistoryItem } from '../types';
import { 
  getDbState, 
  approveRechargeRequest, 
  denyRechargeRequest, 
  denyWithdrawalRequest, 
  approveWithdrawalRequest, 
  resetToDefaults,
  updateUserBalances,
  updateUserPassword,
  updateUserVips,
  deleteUserFromPlatform,
  VIP_LEVELS
} from '../lib/state';
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [recharges, setRecharges] = useState<RechargeRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [rechargeSearch, setRechargeSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [referralSearch, setReferralSearch] = useState("");
  const [bonusSearch, setBonusSearch] = useState("");
  const [tabSelection, setTabSelection] = useState<'recharges' | 'users' | 'withdrawals' | 'referrals'>('recharges');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Copy helper state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lightbox Receipt Visualizer state
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [selectedReceiptName, setSelectedReceiptName] = useState<string | null>(null);

  // User Management State (Expanding/collapsible forms)
  const [editingUserPhone, setEditingUserPhone] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState<number>(0);
  const [editTotalRecharged, setEditTotalRecharged] = useState<number>(0);
  const [editTotalWithdrawn, setEditTotalWithdrawn] = useState<number>(0);
  const [editPassword, setEditPassword] = useState<string>("");
  const [editVips, setEditVips] = useState<number[]>([]);

  // Supabase live check states
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [supabaseNeedsTables, setSupabaseNeedsTables] = useState<boolean>(false);
  const [supabaseErrorText, setSupabaseErrorText] = useState<string | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState<boolean>(false);
  const [sqlCopied, setSqlCopied] = useState<boolean>(false);

  const sqlCode = `-- =====================================================================
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

-- 2. Tabla de Conexión de Referidos (Estructura y Auditoría)
CREATE TABLE IF NOT EXISTS public.referrals (
    id text PRIMARY KEY,
    referrer_phone text NOT NULL REFERENCES public.users(phone) ON DELETE CASCADE,
    referred_phone text NOT NULL UNIQUE REFERENCES public.users(phone) ON DELETE CASCADE,
    level text DEFAULT 'A' CONSTRAINT chk_level CHECK (level IN ('A', 'B', 'C')),
    date text,
    CONSTRAINT chk_diff_phones CHECK (referrer_phone <> referred_phone)
);

-- 3. Tabla de Recargas (Anti-Hacks: Montos positivos e inmutabilidad en transacciones finalizadas)
CREATE TABLE IF NOT EXISTS public.recharges (
    id text PRIMARY KEY,
    phone text REFERENCES public.users(phone) ON DELETE CASCADE,
    amount numeric CONSTRAINT chk_min_recharge CHECK (amount > 0),
    payment_method text,
    reference text NOT NULL CONSTRAINT uq_recharge_reference UNIQUE,
    receipt_name text,
    receipt_url text,
    status text DEFAULT 'pendiente' CONSTRAINT chk_recharge_status CHECK (status IN ('pendiente', 'aprobado', 'denegado')),
    date text
);

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

-- 5. Tabla de Historial Contable (Previene registros maliciosos)
CREATE TABLE IF NOT EXISTS public.history (
    id text PRIMARY KEY,
    phone text REFERENCES public.users(phone) ON DELETE CASCADE,
    type text CONSTRAINT chk_history_type CHECK (type IN ('recarga', 'retiro', 'comision', 'rendimiento', 'bono')),
    amount numeric CONSTRAINT chk_history_amount CHECK (amount >= 0),
    description text,
    date text
);

-- =====================================================================
-- CONFIGURACIÓN DE SEGURIDAD RLS (POLÍTICAS COMPATIBLES CON CLIENTE HÍBRIDO)
-- =====================================================================

-- Habilitación explícita de RLS en todas las tablas primarias
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

-- 1. Políticas de Selección (SELECT - Permite lecturas de datos filtrados por el cliente)
CREATE POLICY "Permitir lectura general de usuarios" ON public.users FOR SELECT USING (true);
CREATE POLICY "Permitir lectura general de referidos" ON public.referrals FOR SELECT USING (true);
CREATE POLICY "Permitir lectura general de recargas" ON public.recharges FOR SELECT USING (true);
CREATE POLICY "Permitir lectura general de retiros" ON public.withdrawals FOR SELECT USING (true);
CREATE POLICY "Permitir lectura general de historial" ON public.history FOR SELECT USING (true);

-- 2. Políticas de Creación (INSERT - Permite registros y envío de solicitudes de recarga/retiro)
CREATE POLICY "Permitir registro público de usuarios" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir logueo de referidos legítimo" ON public.referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir envío de solicitudes de recarga" ON public.recharges FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir envío de solicitudes de retiro" ON public.withdrawals FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir registro de entradas contables" ON public.history FOR INSERT WITH CHECK (true);

-- 3. Políticas de Modificación (UPDATE - Garantiza actualizaciones mutuas bajo lógica de triggers)
CREATE POLICY "Permitir actualizaciones de usuarios" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Permitir actualizaciones de referidos" ON public.referrals FOR UPDATE USING (true);
CREATE POLICY "Permitir aprobación o denegación de recargas" ON public.recharges FOR UPDATE USING (true);
CREATE POLICY "Permitir procesamiento de retiros" ON public.withdrawals FOR UPDATE USING (true);
CREATE POLICY "Permitir corrección de historial" ON public.history FOR UPDATE USING (true);

-- =====================================================================
-- TRIGGERS DE SEGURIDAD (ANTI-DOUBLE-SPENDING & ANTI-FORGERY)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.protect_recharges_finalized() 
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IN ('aprobado', 'denegado')) THEN
        RAISE EXCEPTION 'Esta transacción ya ha sido finalizada y no puede alterarse por motivos de seguridad.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_protect_recharges 
BEFORE UPDATE ON public.recharges
FOR EACH ROW EXECUTE FUNCTION public.protect_recharges_finalized();

CREATE OR REPLACE FUNCTION public.protect_withdrawals_finalized() 
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IN ('completado', 'cancelado')) THEN
        RAISE EXCEPTION 'Este retiro ya ha sido procesado/cancelado y está congelado.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_protect_withdrawals 
BEFORE UPDATE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.protect_withdrawals_finalized();

-- Índices de velocidad
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users(referred_by);
CREATE INDEX IF NOT EXISTS idx_recharges_phone ON public.recharges(phone);
CREATE INDEX IF NOT EXISTS idx_withdrawals_phone ON public.withdrawals(phone);
CREATE INDEX IF NOT EXISTS idx_history_phone ON public.history(phone);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_phone);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_phone);`;

  // Load and refresh state from localStorage
  const loadAdminState = () => {
    const db = getDbState();
    setRecharges(db.recharges);
    setWithdrawals(db.withdrawals);
    setUsers(Object.values(db.users));
    setHistory(db.history || []);
  };

  useEffect(() => {
    loadAdminState();

    // Check supabase tables configuration
    async function checkSupabase() {
      if (!supabase) {
        setSupabaseConnected(false);
        return;
      }
      try {
        const { error: checkErr } = await supabase.from('users').select('phone').limit(1);
        if (checkErr) {
          setSupabaseConnected(true);
          const msg = checkErr.message;
          if (msg.includes("Could not find the table") || msg.includes("does not exist") || checkErr.code === "P0001") {
            setSupabaseNeedsTables(true);
          } else {
            setSupabaseErrorText(msg);
          }
        } else {
          setSupabaseConnected(true);
          setSupabaseNeedsTables(false);
        }
      } catch (err: any) {
        setSupabaseErrorText(err.message || String(err));
      }
    }

    checkSupabase();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const handleApproveRecharge = (id: string) => {
    setError(null);
    setSuccess(null);
    const res = approveRechargeRequest(id);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`¡Transacción ${id} aprobada con éxito! Balance y comisiones multinivel acreditadas.`);
      loadAdminState();
    }
  };

  const handleDenyRecharge = (id: string) => {
    setError(null);
    setSuccess(null);
    const res = denyRechargeRequest(id);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`Solictud de recarga ${id} denegada correctamente.`);
      loadAdminState();
    }
  };

  const handleApproveWithdrawal = (id: string) => {
    setError(null);
    setSuccess(null);
    const res = approveWithdrawalRequest(id);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`¡Solicitud de retiro ${id} marcada como completada y liquidada!`);
      loadAdminState();
    }
  };

  const handleDenyWithdrawal = (id: string) => {
    setError(null);
    setSuccess(null);
    const res = denyWithdrawalRequest(id);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`Solicitud de retiro ${id} denegada. Los fondos fueron reembolsados al usuario.`);
      loadAdminState();
    }
  };

  const handleResetData = () => {
    if (window.confirm("¿Seguro que deseas reiniciar la plataforma de simulación y restablecer los datos por defecto?")) {
      resetToDefaults();
      loadAdminState();
      setSuccess("Toda la base de datos de simulación ha sido restaurada a los valores predeterminados.");
    }
  };

  const handleStartEditingUser = (user: User) => {
    if (editingUserPhone === user.phone) {
      setEditingUserPhone(null);
    } else {
      setEditingUserPhone(user.phone);
      setEditBalance(user.balance);
      setEditTotalRecharged(user.totalRecharged);
      setEditTotalWithdrawn(user.totalWithdrawn);
      setEditPassword(user.password || "");
      setEditVips(user.vips);
      setError(null);
      setSuccess(null);
    }
  };

  const handleSaveUserBalances = (phone: string) => {
    setError(null);
    setSuccess(null);
    const res = updateUserBalances(phone, editBalance, editTotalRecharged, editTotalWithdrawn);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`Los balances del piloto ${phone} fueron actualizados correctamente.`);
      loadAdminState();
    }
  };

  const handleSaveUserPassword = (phone: string) => {
    setError(null);
    setSuccess(null);
    if (!editPassword.trim()) {
      setError("La contraseña no puede estar vacía.");
      return;
    }
    const res = updateUserPassword(phone, editPassword.trim());
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`La contraseña de acceso del piloto ${phone} fue actualizada a "${editPassword.trim()}" con éxito.`);
      loadAdminState();
    }
  };

  const handleToggleVip = (phone: string, vipId: number) => {
    setError(null);
    setSuccess(null);
    let updatedVips = [...editVips];
    if (updatedVips.includes(vipId)) {
      updatedVips = updatedVips.filter(v => v !== vipId);
    } else {
      updatedVips.push(vipId);
    }
    setEditVips(updatedVips);

    const res = updateUserVips(phone, updatedVips);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`Suscripción VIP del piloto ${phone} actualizada con éxito.`);
      loadAdminState();
    }
  };

  const handleDeleteUser = (phone: string) => {
    setError(null);
    setSuccess(null);
    if (phone === "8097617087") {
      setError("Por medidas de seguridad, no puedes eliminar la cuenta raíz de administrador.");
      return;
    }
    if (window.confirm(`⚠️ ADVERTENCIA CRÍTICA: ¿Estás seguro de que deseas eliminar permanentemente al piloto ${phone} de toda la plataforma? Esta acción borrará todas sus compras de vehículos, referidos, recargas, cobros y es irreversible.`)) {
      const res = deleteUserFromPlatform(phone);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`El piloto ${phone} fue eliminado del sistema por completo.`);
        setEditingUserPhone(null);
        loadAdminState();
      }
    }
  };

  // Stats calculate
  const totalBalanceInCirculation = users.reduce((acc, u) => acc + u.balance, 0);
  const totalApprovedDeposits = recharges.filter(r => r.status === 'aprobado').reduce((acc, r) => acc + r.amount, 0);
  const pendingDepositsCount = recharges.filter(r => r.status === 'pendiente').length;
  const pendingWithdrawCount = withdrawals.filter(w => w.status === 'pendiente').length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-left">
      
      {/* Top Admin Navigation Header bar */}
      <header className="bg-slate-900 text-white py-4 px-4 sm:px-6 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-orange-650 rounded-xl flex items-center justify-center font-black text-white text-md">
            AS
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight">Centro de Control Admin</h1>
            <span className="text-[9.5px] uppercase font-bold text-orange-400 tracking-wider">Auto Sport • La Fama Dominicana</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 text-slate-300 transition"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </button>
      </header>

      {/* Main admin body */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

        {/* Global Stats Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Usuarios Registrados</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xl font-black font-mono text-slate-800">{users.length}</span>
              <Users className="h-5 w-5 text-slate-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50">
            <span className="text-[10px] text-slate-405 font-extrabold uppercase block tracking-wider">Recargo Total Aprobado</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xl font-black font-mono text-emerald-600">RD$ {totalApprovedDeposits.toLocaleString()}</span>
              <Coins className="h-5 w-5 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50">
            <span className="text-[10px] text-slate-405 font-extrabold uppercase block tracking-wider">Pendientes de Aprobación</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xl font-black font-mono text-amber-600">{pendingDepositsCount} depósito(s)</span>
              <Landmark className="h-5 w-5 text-amber-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50 overflow-hidden">
            <span className="text-[10px] text-slate-405 font-extrabold uppercase block tracking-wider">Saldo Total en Circulación</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xl font-black font-mono text-slate-800">RD$ {totalBalanceInCirculation.toLocaleString()}</span>
              <ArrowRightLeft className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Feedback errors & success */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="font-bold underline text-[10px]">Cerrar</button>
          </div>
        )}

        {/* Supabase Status Banner */}
        {supabaseConnected ? (
          supabaseNeedsTables ? (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex gap-3">
                <div className="h-10 w-10 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-bold">
                  <Database className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-650 animate-pulse" />
                    ¡Supabase Conectado, pero necesita inicializar tablas!
                  </h4>
                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed mt-0.5">
                    Hemos detectado que tu proyecto en Supabase está en blanco y aún no tiene las tablas creadas. Copia el script SQL a continuación y ejecútalo en la pestaña <strong className="font-bold">SQL Editor</strong> en tu consola de Supabase para poder sincronizar todos los datos en tiempo real.
                  </p>
                </div>
              </div>

              <div className="bg-amber-100/50 p-2 rounded-2xl flex justify-between gap-2 items-center flex-wrap">
                <button
                  onClick={() => setShowSqlGuide(!showSqlGuide)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10.5px] font-extrabold uppercase transition cursor-pointer"
                >
                  {showSqlGuide ? "Ocultar Instrucciones SQL" : "Ver Instrucciones y SQL Copiable"}
                </button>
                <div className="text-[10px] text-amber-900 font-bold bg-amber-200/50 px-3 py-1 rounded-lg">
                  Estado: Tablas Faltantes
                </div>
              </div>

              {showSqlGuide && (
                <div className="space-y-2 mt-4 animate-fadeIn">
                  <div className="flex justify-between items-center bg-slate-950 px-4 py-2.5 rounded-t-2xl text-white text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <FileSpreadsheet className="h-4 w-4" />
                      Inicialización de Tablas en Supabase
                    </span>
                    <button
                      onClick={handleCopySql}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      {sqlCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-slate-400" />}
                      {sqlCopied ? "¡Copiado!" : "Copiar SQL"}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-slate-200 text-[10px] font-mono rounded-b-2xl overflow-x-auto text-left max-h-64 shadow-inner">
                    {sqlCode}
                  </pre>
                  <p className="text-[10px] text-amber-850 font-medium italic mt-1 bg-amber-100/50 p-2.5 rounded-xl">
                    💡 <strong>Pasos rápidos:</strong> Entra a <strong>supabase.com</strong> &rarr; Abre tu proyecto &rarr; Click en <strong>SQL Editor</strong> &rarr; Click en <strong>"New query"</strong> &rarr; Pega el código de arriba &rarr; Click en <strong>"Run"</strong>. El sistema creará las tablas de forma automática.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100/80 rounded-3xl p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-left">
                <div className="h-8 w-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-950">Sincronización Supabase Activa</h4>
                  <p className="text-[10px] text-emerald-700 font-bold">Todos los movimientos, usuarios, recargas y retiros se sincronizan al instante con la nube.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase bg-emerald-200/50 text-emerald-800 px-3 py-1 rounded-xl">
                  EN LÍNEA
                </span>
              </div>
            </div>
          )
        ) : null}

        {supabaseErrorText && (
          <div className="p-4 bg-red-105 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold leading-relaxed text-left">
            <strong>Advertencia del backend:</strong> {supabaseErrorText}. Por favor, verifica tu conexión y la base de datos de Supabase.
          </div>
        )}

        {/* Segmented controls tabs for admin modules */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 max-w-xl gap-1">
          <button
            onClick={() => setTabSelection('recharges')}
            className={`flex-1 py-2 rounded-xl text-center font-bold text-xs cursor-pointer transition ${tabSelection === 'recharges' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Depositos ({pendingDepositsCount})
          </button>
          <button
            onClick={() => setTabSelection('withdrawals')}
            className={`flex-1 py-2 rounded-xl text-center font-bold text-xs cursor-pointer transition ${tabSelection === 'withdrawals' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Retiros ({pendingWithdrawCount})
          </button>
          <button
            onClick={() => setTabSelection('users')}
            className={`flex-1 py-2 rounded-xl text-center font-bold text-xs cursor-pointer transition ${tabSelection === 'users' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Usuarios ({users.length})
          </button>
          <button
            onClick={() => setTabSelection('referrals')}
            className={`flex-1 py-2 rounded-xl text-center font-bold text-xs cursor-pointer transition ${tabSelection === 'referrals' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Red & Bonos 💎
          </button>
        </div>

        {/* RECHARGES WORKFLOW TAB */}
        {tabSelection === 'recharges' && (
          <div className="bg-white border border-slate-205 rounded-3xl p-5 space-y-4 shadow-sm">
            
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div>
                <h3 className="text-md font-black uppercase text-slate-800 tracking-tight">Solicitudes de Recarga Pendientes / Totales</h3>
                <p className="text-[11px] text-slate-400 font-medium">Revisa los comprobantes subidos por los usuarios dominicanos y aprueba para sumar fondos de manera instantánea.</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por teléfono..."
                  className="pl-9 pr-4 py-2 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-slate-50 w-full sm:w-60"
                  value={rechargeSearch}
                  onChange={(e) => setRechargeSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Recharges list view */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-xs text-left text-slate-800">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                  <tr>
                    <th className="p-3">ID Transacción</th>
                    <th className="p-3">Teléfono</th>
                    <th className="p-3">Monto Solicitado</th>
                    <th className="p-3">Destinatario / Canal</th>
                    <th className="p-3">Referencia Documento</th>
                    <th className="p-3">Recibo Recargado</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {recharges
                    .filter(r => !rechargeSearch || r.phone.includes(rechargeSearch))
                    .length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-sans">No se encontraron solicitudes registradas en la simulación.</td>
                      </tr>
                    ) : (
                      recharges
                        .filter(r => !rechargeSearch || r.phone.includes(rechargeSearch))
                        .map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/50 font-sans">
                            <td className="p-3 font-mono font-bold text-slate-800">{req.id}</td>
                            <td className="p-3 font-mono text-slate-850 font-bold">{req.phone}</td>
                            <td className="p-3 font-mono text-emerald-600 font-black text-sm">RD$ {req.amount.toLocaleString()}</td>
                            <td className="p-3 font-medium text-slate-600">{req.paymentMethod}</td>
                            <td className="p-3 font-mono text-xs">{req.reference}</td>
                            <td className="p-3">
                              <div className="flex flex-col gap-1 items-start">
                                <span className="text-[10px] bg-slate-100 text-slate-650 font-semibold py-0.5 px-2 rounded font-mono border border-slate-200 truncate max-w-[130px]" title={req.receiptName}>
                                  📄 {req.receiptName}
                                </span>
                                {req.receiptUrl ? (
                                  <button
                                    onClick={() => {
                                      setSelectedReceiptUrl(req.receiptUrl);
                                      setSelectedReceiptName(`Recarga ${req.id} - Piloto ${req.phone}`);
                                    }}
                                    className="text-[9.5px] uppercase tracking-wider font-black text-orange-600 hover:text-orange-700 bg-orange-500/10 hover:bg-orange-500/15 px-2 py-0.5 rounded-md cursor-pointer border border-orange-200/50 transition whitespace-nowrap mt-1 flex items-center gap-1"
                                  >
                                    <span>👁️ Ver Imagen</span>
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-slate-400 italic mt-0.5">Sin imagen</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`text-[9.5px] uppercase font-black px-2.5 py-1 rounded-full ${req.status === 'pendiente' ? 'bg-amber-100 text-amber-800' : req.status === 'aprobado' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-105 text-red-800'}`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {req.status === 'pendiente' ? (
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => handleDenyRecharge(req.id)}
                                    className="py-1.5 px-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-[10px] rounded-lg cursor-pointer uppercase tracking-wider"
                                  >
                                    Rechazar
                                  </button>
                                  <button
                                    onClick={() => handleApproveRecharge(req.id)}
                                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg cursor-pointer uppercase tracking-wider shadow-sm"
                                  >
                                    Aprobar
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10.5px] font-semibold text-slate-400 capitalize">Procesado</span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* WITHDRAWALS WORKFLOW TAB */}
        {tabSelection === 'withdrawals' && (
          <div className="bg-white border border-slate-205 rounded-3xl p-5 space-y-4 shadow-sm">
            
            <div>
              <h3 className="text-md font-black uppercase text-slate-800 tracking-tight">Solicitudes de Retiro Pendientes</h3>
              <p className="text-[11px] text-slate-400 font-medium">Revisa los retiros solicitados por los usuarios. Los fondos ya fueron debitados del balance del usuario al solicitar el cobro.</p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-xs text-left text-slate-800">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                  <tr>
                    <th className="p-3">ID Retiro</th>
                    <th className="p-3">Usuario (Tel)</th>
                    <th className="p-3">Banco / Dirección</th>
                    <th className="p-3">Número de Cuenta</th>
                    <th className="p-3">Titular Registrado</th>
                    <th className="p-3">Monto Bruto</th>
                    <th className="p-3">Comisión (12%)</th>
                    <th className="p-3">A Recibir (Neto)</th>
                    <th className="p-3">Fecha Solicitada</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Acciones de Cobros</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-6 text-center text-slate-400 font-sans">No hay solicitudes de retiro registradas en esta simulación.</td>
                    </tr>
                  ) : (
                    withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/50 font-sans">
                        <td className="p-3 font-mono font-bold text-slate-800">{w.id}</td>
                        <td className="p-3 font-mono font-bold text-slate-800">{w.phone}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-sans">
                            <span className="font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                              {w.bankName || "Banco Popular"}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(w.bankName || "Banco Popular");
                                setCopiedId(w.id + '_bank');
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                              title="Copiar Banco"
                            >
                              {copiedId === w.id + '_bank' ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-bold text-slate-900 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded text-[11px]">
                              {w.accountNumber || "123456789 (Ejemplo)"}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(w.accountNumber || "123456789");
                                setCopiedId(w.id + '_acc');
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                              title="Copiar Cuenta"
                            >
                              {copiedId === w.id + '_acc' ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-sans">
                            <span className="text-slate-750 font-semibold text-xs text-left block">
                              {w.accountOwner || "Piloto Dominicano"}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(w.accountOwner || "Piloto Dominicano");
                                setCopiedId(w.id + '_own');
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                              title="Copiar Titular"
                            >
                              {copiedId === w.id + '_own' ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold">RD$ {w.amount}</td>
                        <td className="p-3 font-mono text-red-650 font-semibold">-RD$ {w.commission}</td>
                        <td className="p-3 font-mono text-emerald-650 font-black">RD$ {w.netAmount}</td>
                        <td className="p-3 font-mono text-[11px]">{new Date(w.date).toLocaleString('es-DO')}</td>
                        <td className="p-3">
                          <span className={`text-[9.5px] uppercase font-black px-2.5 py-1 rounded-full ${w.status === 'pendiente' ? 'bg-amber-100 text-amber-800' : w.status === 'completado' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-105 text-red-000'}`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {w.status === 'pendiente' ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleDenyWithdrawal(w.id)}
                                className="py-1.5 px-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-[10px] rounded-lg cursor-pointer uppercase tracking-wider whitespace-nowrap"
                              >
                                Cancelar / Reembolsar
                              </button>
                              <button
                                onClick={() => handleApproveWithdrawal(w.id)}
                                className="py-1.5 px-3 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg cursor-pointer uppercase tracking-wider shadow-sm whitespace-nowrap"
                              >
                                Completar Pago
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10.5px] font-semibold text-slate-400 capitalize whitespace-nowrap">Procesado</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* REGISTERED USERS LIST TAB */}
        {tabSelection === 'users' && (
          <div className="bg-white border border-slate-205 rounded-3xl p-5 space-y-4 shadow-sm">
            
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div>
                <h3 className="text-md font-black uppercase text-slate-800 tracking-tight">Nuevos Usuarios Registrados en la Plataforma</h3>
                <p className="text-[11px] text-slate-400 font-medium">Historial sincronizado de todos los pilotos registrados en Auto Sport Dominicana.</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por número..."
                  className="pl-9 pr-4 py-2 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-slate-50 w-full sm:w-60"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Users grid table */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-xs text-left text-slate-800">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                  <tr>
                    <th className="p-3">Teléfono Piloto</th>
                    <th className="p-3">Contraseña (Demo)</th>
                    <th className="p-3">Saldo Actual</th>
                    <th className="p-3">Referido por</th>
                    <th className="p-3">VIPs Rentados</th>
                    <th className="p-3">Total Recargado</th>
                    <th className="p-3">Total Retirado</th>
                    <th className="p-3">Fecha Ingreso</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-755 text-xs">
                  {users
                    .filter(u => !userSearch || u.phone.includes(userSearch))
                    .map((item, idx) => {
                      const isExpanded = editingUserPhone === item.phone;
                      return (
                        <React.Fragment key={idx}>
                          <tr className={`hover:bg-slate-50/40 transition-colors ${isExpanded ? 'bg-orange-50/30' : ''}`}>
                            <td className="p-3 font-semibold text-slate-900">{item.phone}</td>
                            <td className="p-3 text-slate-400">
                              <span className="bg-slate-100 hover:bg-slate-200 text-slate-750 font-semibold px-2 py-0.5 rounded cursor-pointer transition select-none tracking-tight" onClick={() => handleStartEditingUser(item)}>
                                {isExpanded ? "👁️ " + (item.password || "OAuth") : "🔐 Ver clave"}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-850">RD$ {item.balance.toLocaleString('es-DO', {minimumFractionDigits: 1})}</td>
                            <td className="p-3 text-slate-500">{item.referredBy || "- Directo -"}</td>
                            <td className="p-3 font-sans">
                              <span className="bg-orange-50 text-orange-650 font-bold px-2 py-0.5 rounded text-[10px] border border-orange-100 uppercase tracking-tight">
                                {item.vips.length > 0 ? `VIP ${item.vips.join(', ')}` : 'Sin VIP'}
                              </span>
                            </td>
                            <td className="p-3 text-emerald-650 font-bold">RD$ {item.totalRecharged}</td>
                            <td className="p-3 text-red-650 font-bold">RD$ {item.totalWithdrawn}</td>
                            <td className="p-3 text-slate-400 font-sans">{new Date(item.registeredAt).toLocaleDateString()}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleStartEditingUser(item)}
                                className={`px-3 py-1.5 uppercase font-bold text-[9.5px] rounded-lg tracking-wider border cursor-pointer select-none transition ${isExpanded ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'}`}
                              >
                                {isExpanded ? 'Cerrar' : 'Gestionar'}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} className="p-5 bg-slate-50/80 border-t border-b border-orange-100/50">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-left font-sans text-slate-705">
                                  
                                  {/* BLOCK 1: MODIFY BALANCES */}
                                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                    <h4 className="text-[11px] font-black uppercase text-slate-800 border-b pb-1.5 flex items-center gap-1.5">
                                      <Coins className="h-4 w-4 text-orange-600" />
                                      Modificar Balances de Cuenta
                                    </h4>
                                    <div className="space-y-2.5">
                                      <div>
                                        <span className="text-[9.5px] font-bold text-slate-450 uppercase block tracking-wider">Saldo Disponible / Retiro (RD$)</span>
                                        <input
                                          type="number"
                                          className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
                                          value={editBalance}
                                          onChange={(e) => setEditBalance(Number(e.target.value))}
                                        />
                                      </div>
                                      <div>
                                        <span className="text-[9.5px] font-bold text-slate-450 uppercase block tracking-wider">Capital Invertido / Recargas (RD$)</span>
                                        <input
                                          type="number"
                                          className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
                                          value={editTotalRecharged}
                                          onChange={(e) => setEditTotalRecharged(Number(e.target.value))}
                                        />
                                      </div>
                                      <div>
                                        <span className="text-[9.5px] font-bold text-slate-455 uppercase block tracking-wider">Retiros Acumulados (RD$)</span>
                                        <input
                                          type="number"
                                          className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
                                          value={editTotalWithdrawn}
                                          onChange={(e) => setEditTotalWithdrawn(Number(e.target.value))}
                                        />
                                      </div>
                                      <button
                                        onClick={() => handleSaveUserBalances(item.phone)}
                                        className="w-full mt-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition"
                                      >
                                        Guardar Balances
                                      </button>
                                    </div>
                                  </div>

                                  {/* BLOCK 2: VIEW AND EDIT PASSWORD */}
                                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                                    <div className="space-y-3">
                                      <h4 className="text-[11px] font-black uppercase text-slate-800 border-b pb-1.5 flex items-center gap-1.5">
                                        <ShieldCheck className="h-4 w-4 text-orange-600" />
                                        Clave del Piloto
                                      </h4>
                                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between">
                                        <span className="text-[9.5px] font-bold text-slate-450 uppercase tracking-wide">Clave actual:</span>
                                        <span className="text-xs font-mono font-black text-slate-900 px-2.5 py-1 bg-white border rounded-lg shadow-sm">
                                          {item.password || "OAuth (Sin clave)"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-[9.5px] font-bold text-slate-450 uppercase block tracking-wider">Modificar Contraseña</span>
                                        <input
                                          type="text"
                                          placeholder="Escribe la clave de reemplazo..."
                                          className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
                                          value={editPassword}
                                          onChange={(e) => setEditPassword(e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleSaveUserPassword(item.phone)}
                                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition"
                                    >
                                      Establecer Nueva Clave
                                    </button>
                                  </div>

                                  {/* BLOCK 3: REGALAR / QUITAR VIPS */}
                                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                                    <div className="space-y-2">
                                      <h4 className="text-[11px] font-black uppercase text-slate-800 border-b pb-1.5 flex items-center gap-1.5">
                                        <Gift className="h-4 w-4 text-orange-600" />
                                        Membresías VIP (Regalar / Quitar)
                                      </h4>
                                      <p className="text-[10px] text-slate-400 font-medium leading-normal">
                                        Asigna o revoca accesos VIP instantáneamente. Se desbloqueará la plataforma del usuario al instante.
                                      </p>
                                      
                                      <div className="grid grid-cols-2 gap-1.5 pt-1.5 max-h-48 overflow-y-auto pr-1">
                                        {VIP_LEVELS.map((vip) => {
                                          const vipId = vip.id;
                                          const count = editVips.filter((v: number) => v === vipId).length;
                                          return (
                                            <div
                                              key={vipId}
                                              className={`p-1.5 rounded-xl border flex items-center justify-between gap-1.5 ${count > 0 ? 'bg-orange-50 border-orange-200 text-orange-950 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                                            >
                                              <div className="flex flex-col text-left justify-center pl-1">
                                                <span className="font-extrabold font-sans text-[10px] uppercase">VIP {vipId}</span>
                                                <span className="text-[8.5px] text-slate-400 font-mono mt-0.5">
                                                  {count > 0 ? `${count} Autos` : 'Sin auto'}
                                                </span>
                                              </div>
                                              
                                              <div className="flex items-center gap-1">
                                                {count > 0 && (
                                                  <button
                                                    onClick={() => {
                                                      const firstIndex = editVips.indexOf(vipId);
                                                      if (firstIndex !== -1) {
                                                        const updated = [...editVips];
                                                        updated.splice(firstIndex, 1);
                                                        setEditVips(updated);
                                                        updateUserVips(item.phone, updated);
                                                        loadAdminState();
                                                      }
                                                    }}
                                                    className="w-5 h-5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-black rounded flex items-center justify-center cursor-pointer select-none text-[10px]"
                                                    title="Quitar un coche VIP"
                                                  >
                                                    -
                                                  </button>
                                                )}
                                                <button
                                                  onClick={() => {
                                                    const updated = [...editVips, vipId].sort((a: number, b: number) => a - b);
                                                    setEditVips(updated);
                                                    updateUserVips(item.phone, updated);
                                                    loadAdminState();
                                                  }}
                                                  className="w-5 h-5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded flex items-center justify-center cursor-pointer select-none text-[10px]"
                                                  title="Regalar un coche VIP"
                                                >
                                                  +
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
                                      <span className="text-[9.5px] text-slate-400 font-black uppercase tracking-wider">Sanción de Cuenta:</span>
                                      <button
                                        onClick={() => handleDeleteUser(item.phone)}
                                        className="py-1.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-[9.5px] uppercase tracking-wider rounded-lg cursor-pointer transition"
                                      >
                                        Eliminar de Plataforma
                                      </button>
                                    </div>
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* REFERRALS AND BONUSES SYSTEM TRACKING TAB */}
        {tabSelection === 'referrals' && (
          <div className="space-y-6">
            
            {/* Referrals metric overview chips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-sm border border-slate-700/50">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Usuarios Registrados por Referencia</span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xl font-black font-mono text-amber-400">
                    {users.filter(u => u.referredBy).length} pilotos
                  </span>
                  <Code className="h-5 w-5 text-amber-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Usuarios que ingresaron usando el código o enlace de un patrocinador.</p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Inyección Total en Bonos de Bienvenida</span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xl font-black font-mono text-blue-600">
                    RD$ {(users.filter(u => u.registrationBonusClaimed).length * 20).toLocaleString()}
                  </span>
                  <Gift className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Bonos de RD$20 acreditados automáticamente en el registro de nuevos pilotos.</p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Comisiones de Red Entregadas (A, B, C)</span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xl font-black font-mono text-emerald-600">
                    RD$ {history.filter(h => h.type === 'comision').reduce((sum, h) => sum + h.amount, 0).toLocaleString()}
                  </span>
                  <Award className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Ganancias generadas para sponsors por recargas aprobadas (10%, 2%, 1%).</p>
              </div>
            </div>

            {/* BOX 1: REGISTRATION CODE TREE */}
            <div className="bg-white border border-slate-205 rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-orange-650" />
                    Árbol de Referidos y Códigos de Registro
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Esta tabla lee con qué código o enlace ingresó cada piloto, su bono de bienvenida y sus recargas/retiros acumulados.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por piloto o código..."
                    className="pl-9 pr-4 py-2 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-slate-50 w-full sm:w-64"
                    value={referralSearch}
                    onChange={(e) => setReferralSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-xs text-left text-slate-800">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                    <tr>
                      <th className="p-3">Piloto Registrado</th>
                      <th className="p-3">Código Ingresado (Patrocinador)</th>
                      <th className="p-3">Bono Registro (RD$)</th>
                      <th className="p-3">Miembros Red (Directos A)</th>
                      <th className="p-3">Total Recargado</th>
                      <th className="p-3">Total Retirado</th>
                      <th className="p-3">Saldo Neto</th>
                      <th className="p-3">Fecha de Unión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-755 text-xs">
                    {users
                      .filter(u => {
                        if (!referralSearch) return true;
                        const phoneMatch = u.phone.includes(referralSearch);
                        const refMatch = u.referredBy && u.referredBy.includes(referralSearch);
                        return phoneMatch || refMatch;
                      })
                      .map((item, idx) => {
                        const directReferralsCount = users.filter(usr => usr.referredBy && usr.referredBy.replace(/\s+/g, '') === item.phone.replace(/\s+/g, '')).length;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/40">
                            <td className="p-3 font-bold text-slate-900">{item.phone}</td>
                            <td className="p-3">
                              {item.referredBy ? (
                                <span className="bg-orange-50 text-orange-700 font-extrabold px-2 py-0.5 rounded text-[10px] border border-orange-100">
                                  {item.referredBy}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-sans italic text-[11px]">- Ninguno (Directo) -</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="font-sans font-bold text-emerald-600 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                                RD$ 20.00
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-extrabold text-slate-700 font-sans bg-slate-100 text-[10px] px-2 py-0.5 rounded">
                                {directReferralsCount} referidos
                              </span>
                            </td>
                            <td className="p-3 font-extrabold text-emerald-650">RD$ {item.totalRecharged.toLocaleString()}</td>
                            <td className="p-3 font-extrabold text-rose-600">RD$ {item.totalWithdrawn.toLocaleString()}</td>
                            <td className="p-3 text-slate-800 font-black">RD$ {item.balance.toLocaleString()}</td>
                            <td className="p-3 text-slate-400 font-sans">{new Date(item.registeredAt).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BOX 2: COMMISSION AND BONUS AUDITING LOGS */}
            <div className="bg-white border border-slate-205 rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Auditoría de Comisiones & Bonos Entregados
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Bandeja de verificación de bonificaciones y comisiones de red acreditadas a los balances de líderes.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por receptor de bono..."
                    className="pl-9 pr-4 py-2 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-slate-50 w-full sm:w-64"
                    value={bonusSearch}
                    onChange={(e) => setBonusSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-xs text-left text-slate-800">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-150">
                    <tr>
                      <th className="p-3">Destinatario / Líder</th>
                      <th className="p-3">Tipo Operación</th>
                      <th className="p-3">Bono / Comisión</th>
                      <th className="p-3">Concepto Detallado</th>
                      <th className="p-3">Código Auditor Transacción</th>
                      <th className="p-3">Fecha y Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-755 text-xs">
                    {history
                      .filter(h => h.type === 'comision' || h.type === 'bono' || h.description.toLowerCase().includes('bono') || h.description.toLowerCase().includes('comisión'))
                      .filter(h => {
                        if (!bonusSearch) return true;
                        return h.phone.includes(bonusSearch) || h.description.toLowerCase().includes(bonusSearch.toLowerCase());
                      })
                      .map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/40">
                          <td className="p-3 font-black text-slate-900">{item.phone}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 font-bold uppercase rounded text-[9px] ${
                              item.type === 'bono' 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {item.type === 'bono' ? 'REGISTRO (RD$20)' : 'COMISIÓN RED'}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-850">RD$ {item.amount.toFixed(2)}</td>
                          <td className="p-3 text-slate-500 font-sans text-xs">{item.description}</td>
                          <td className="p-3 text-slate-400 font-mono text-[10px]">{item.id}</td>
                          <td className="p-3 text-slate-400 font-sans">{new Date(item.date).toLocaleString()}</td>
                        </tr>
                      ))}
                    {history.filter(h => h.type === 'comision' || h.type === 'bono').length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-slate-400 font-sans">
                          Aún no se registran bonificaciones de equipo en esta sesión en la red.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Global Dev Utility Buttons */}
        <div className="bg-white border border-slate-205 rounded-3xl p-5 space-y-3 shadow-inner flex flex-col md:flex-row items-center justify-between text-xs">
          <div>
            <span className="font-extrabold uppercase text-[10px] tracking-wider text-slate-500 block">Herramientas del Instructor / Desarrollador</span>
            <p className="text-slate-400 font-sans text-[11px] mt-0.5">Puedes reiniciar la base de datos de simulación local para empezar pruebas con referidos desde cero.</p>
          </div>
          <button
            onClick={handleResetData}
            id="btn-wipe-simulation-data"
            type="button"
            className="py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl cursor-pointer uppercase tracking-wider text-[10px] shadow active:scale-95 transition"
          >
            Reiniciar Base de Datos Local
          </button>
        </div>

      </main>

      {/* Lightbox / Modal for viewing receipts */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 flex flex-col max-h-[90vh]">
            <button 
              onClick={() => {
                setSelectedReceiptUrl(null);
                setSelectedReceiptName(null);
              }}
              className="absolute top-4 right-4 h-8 w-8 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full flex items-center justify-center text-slate-800 font-bold cursor-pointer transition select-none text-xs"
              title="Cerrar"
            >
              ✕
            </button>
            <div className="flex flex-col mb-4">
              <span className="text-[9px] bg-orange-500/10 text-orange-600 font-extrabold uppercase px-2.5 py-1 rounded-full w-fit tracking-wider mb-1">
                Verificación de Depósito
              </span>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {selectedReceiptName || 'Comprobante de Pago'}
              </h3>
            </div>
            <div className="flex-1 overflow-auto rounded-2xl bg-slate-50 border border-slate-150 p-2 flex items-center justify-center">
              <img 
                src={selectedReceiptUrl} 
                alt="Comprobante de depósito" 
                className="max-h-[55vh] w-auto max-w-full object-contain rounded-xl shadow-sm border"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center">
              <p className="text-[10px] text-slate-400 font-medium">Verifica la referencia y el monto correspondiente.</p>
              <button
                onClick={() => {
                  setSelectedReceiptUrl(null);
                  setSelectedReceiptName(null);
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl cursor-pointer transition shadow-sm select-none"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
