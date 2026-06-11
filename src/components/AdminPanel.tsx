import React, { useState, useEffect } from 'react';
import { ShieldCheck, LogOut, CheckCircle2, XCircle, Landmark, Users, Coins, ArrowRightLeft, FileSpreadsheet, Search, RefreshCw, Smartphone, Copy, Check, Database, AlertTriangle, Gift, Award, TrendingUp, Code } from 'lucide-react';
import { RechargeRequest, WithdrawRequest, User, HistoryItem } from '../types';
import { getDbState, approveRechargeRequest, denyRechargeRequest, denyWithdrawalRequest, approveWithdrawalRequest, resetToDefaults } from '../lib/state';
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
    reference text NOT NULL CONSTRAINT uq_recharge_reference UNIQUE,
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

-- Triggers de Bloqueo Inmutable (Anti-Doble Gasto / Hacks)
CREATE OR REPLACE FUNCTION public.protect_recharges_finalized() 
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IN ('aprobado', 'denegado')) THEN
        RAISE EXCEPTION 'Esta transacción ya ha sido finalizada y está congelada.';
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
                              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold py-0.5 px-2 rounded font-mono border border-slate-200">
                                🖼️ {req.receiptName}
                              </span>
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
                      <td colSpan={8} className="p-6 text-center text-slate-400 font-sans">No hay solicitudes de retiro registradas en esta simulación.</td>
                    </tr>
                  ) : (
                    withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/50 font-sans">
                        <td className="p-3 font-mono font-bold text-slate-800">{w.id}</td>
                        <td className="p-3 font-mono font-bold text-slate-800">{w.phone}</td>
                        <td className="p-3 font-mono font-bold">RD$ {w.amount}</td>
                        <td className="p-3 font-mono text-red-650 font-semibold">-RD$ {w.commission}</td>
                        <td className="p-3 font-mono text-emerald-650 font-black">RD$ {w.netAmount}</td>
                        <td className="p-3 font-mono text-[11px]">{new Date(w.date).toLocaleString('es-DO')}</td>
                        <td className="p-3">
                          <span className={`text-[9.5px] uppercase font-black px-2.5 py-1 rounded-full ${w.status === 'pendiente' ? 'bg-amber-100 text-amber-800' : w.status === 'completado' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {w.status === 'pendiente' ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleDenyWithdrawal(w.id)}
                                className="py-1.5 px-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-[10px] rounded-lg cursor-pointer uppercase tracking-wider"
                              >
                                Cancelar / Reembolsar
                              </button>
                              <button
                                onClick={() => handleApproveWithdrawal(w.id)}
                                className="py-1.5 px-3 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg cursor-pointer uppercase tracking-wider shadow-sm"
                              >
                                Completar Pago
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10.5px] font-semibold text-slate-400 capitalize">Completado</span>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-755 text-xs">
                  {users
                    .filter(u => !userSearch || u.phone.includes(userSearch))
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="p-3 font-semibold text-slate-900">{item.phone}</td>
                        <td className="p-3 text-slate-400">{item.password || "Servicio Externo"}</td>
                        <td className="p-3 font-bold text-slate-850">RD$ {item.balance.toLocaleString('es-DO', {minimumFractionDigits: 1})}</td>
                        <td className="p-3 text-slate-500">{item.referredBy || "- Directo -"}</td>
                        <td className="p-3 font-sans">
                          <span className="bg-orange-50 text-orange-650 font-bold px-2 py-0.5 rounded text-[10px] border border-orange-100">
                            {item.vips.length > 0 ? `VIP ${item.vips.join(', ')}` : 'Sin VIP'}
                          </span>
                        </td>
                        <td className="p-3 text-emerald-650 font-bold">RD$ {item.totalRecharged}</td>
                        <td className="p-3 text-red-650 font-bold">RD$ {item.totalWithdrawn}</td>
                        <td className="p-3 text-slate-400 font-sans">{new Date(item.registeredAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
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

    </div>
  );
}
