import React, { useState, useEffect } from 'react';
import { Copy, Check, Users, ShieldAlert, Award, ChevronDown, ChevronUp, Link, Sparkles, RefreshCw } from 'lucide-react';
import { User } from '../types';
import { getReferralNetworkDetails, ReferredDetails, syncStateWithSupabase, getDbState, normalizePhoneTo10Digits, checkSupabaseConnection, isRlsViolationDetected } from '../lib/state';

interface TeamProps {
  user: User;
  onUpdateUser?: (updated: User) => void;
}

export default function Team({ user, onUpdateUser }: TeamProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Segment collapsible states
  const [openA, setOpenA] = useState(true);
  const [openB, setOpenB] = useState(false);
  const [openC, setOpenC] = useState(false);
  const [showRlsGuide, setShowRlsGuide] = useState(false);

  const [network, setNetwork] = useState({
    levelA: [] as ReferredDetails[],
    levelB: [] as ReferredDetails[],
    levelC: [] as ReferredDetails[],
    totalEarnings: 0
  });

  const [dbStatus, setDbStatus] = useState<{
    isChecked: boolean;
    connected: boolean;
    hasTables: boolean;
    error: string | null;
  }>({
    isChecked: false,
    connected: false,
    hasTables: false,
    error: null
  });

  const performSync = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      // Diagnostic check the live status
      const status = await checkSupabaseConnection();
      setDbStatus({
        isChecked: true,
        connected: status.connected,
        hasTables: status.hasTables,
        error: status.error
      });

      // Sync from Supabase to fetch new users/referrals registered across and on other devices
      await syncStateWithSupabase();
      const details = getReferralNetworkDetails(user.phone);
      setNetwork(details);

      // Check if the current user's statistics or balances changed on the server (e.g. commissions approved)
      const stateObj = getDbState();
      const cleanPhone = normalizePhoneTo10Digits(user.phone);
      const updatedUser = stateObj.users[cleanPhone];
      if (updatedUser && onUpdateUser) {
        if (
          updatedUser.balance !== user.balance ||
          updatedUser.totalRecharged !== user.totalRecharged ||
          updatedUser.totalWithdrawn !== user.totalWithdrawn ||
          JSON.stringify(updatedUser.vips) !== JSON.stringify(user.vips)
        ) {
          onUpdateUser(updatedUser);
        }
      }
    } catch (e) {
      console.error("Error refreshing referral network:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Initial direct fetch from current local storage state so it shows up immediately
    const details = getReferralNetworkDetails(user.phone);
    setNetwork(details);
    
    // Auto sync from server to find newly registered referrals
    performSync(true);
  }, [user.phone]);

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/?ref=${user.phone}`
    : `https://autosport.com/?ref=${user.phone}`;

  const copyText = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const totalMembers = network.levelA.length + network.levelB.length + network.levelC.length;

  return (
    <div className="space-y-6 pb-24 font-sans text-left">
      
      {/* Title Block */}
      <div className="px-1 flex justify-between items-start gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Mi Red de Afiliados Sport</h2>
          <p className="text-xs text-slate-400 font-medium font-sans">Construye una escudería de referidos de 3 niveles y percibe jugosas comisiones directas sobre cada recarga aprobada.</p>
        </div>
        <button
          type="button"
          id="btn-refresh-team"
          onClick={() => performSync(false)}
          disabled={isSyncing}
          className="p-2.5 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-705 active:scale-95 rounded-2xl flex items-center justify-center border border-slate-200/60 transition-all cursor-pointer shadow-sm disabled:opacity-50 mt-1 flex-shrink-0"
          title="Actualizar Equipo"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-orange-600' : ''}`} />
        </button>
      </div>

      {/* Database Diagnostic Status Alert */}
      {dbStatus.isChecked && (
        <div className="space-y-3 text-left">
          <div className={`p-4 rounded-3xl flex items-start gap-3 border text-xs font-medium transition shadow-sm ${
            isRlsViolationDetected()
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : dbStatus.connected && dbStatus.hasTables 
                ? 'bg-emerald-50 border-emerald-200/60 text-emerald-800' 
                : dbStatus.connected 
                  ? 'bg-amber-50 border-amber-200/60 text-amber-800 font-sans animate-pulse' 
                  : 'bg-rose-50 border-rose-200/60 text-rose-800 font-sans'
          }`}>
            <div className={`h-3 w-3 rounded-full mt-0.5 flex-shrink-0 ${
              isRlsViolationDetected()
                ? 'bg-amber-600 animate-bounce'
                : dbStatus.connected && dbStatus.hasTables 
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-200' 
                  : dbStatus.connected 
                    ? 'bg-amber-500' 
                    : 'bg-rose-500'
            }`} />
            <div className="space-y-1 text-left flex-1 font-sans">
              <span className="font-black uppercase tracking-wider block text-[10px]">
                {isRlsViolationDetected()
                  ? '⚠️ ALERTA: Seguridad RLS Activa en Supabase'
                  : dbStatus.connected && dbStatus.hasTables 
                    ? 'Base de Datos Sincronizada' 
                    : dbStatus.connected 
                      ? 'Base de Datos en Espera (Esquema en Blanco)' 
                      : 'Modo Offline Completo'}
              </span>
              <p className="text-[11px] leading-relaxed opacity-90 font-medium text-slate-700">
                {isRlsViolationDetected() ? (
                  <>
                    <strong className="text-amber-950 block font-bold mb-1">¡La seguridad RLS está bloqueando el registro de tus referidos!</strong>
                    Supabase tiene habilitado "Row-Level Security (RLS)" en las tablas creadas, impidiendo que la aplicación registre nuevos usuarios o guarde sus datos. Pulsa el botón abajo para obtener la solución en 1 minuto.
                  </>
                ) : dbStatus.connected && dbStatus.hasTables 
                  ? 'Conexión activa con el servidor Supabase. Tu equipo y sus registros se sincronizan en tiempo real.' 
                  : dbStatus.connected 
                    ? 'Supabase está conectado pero falta inicializar el esquema. Ingresa al Panel de Administración para copiar y pegar el script SQL de creación de tablas.' 
                    : `Servidor desconectado. Los nuevos usuarios se guardan solo en local en este celular. Configura las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.`}
              </p>
              
              {isRlsViolationDetected() && (
                <button
                  type="button"
                  id="btn-toggle-rls-guide"
                  onClick={() => setShowRlsGuide(!showRlsGuide)}
                  className="mt-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] uppercase rounded-xl transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {showRlsGuide ? 'Ocultar Instrucciones RLS' : 'Ver solución de referidos RLS (1 min)'}
                </button>
              )}
            </div>
          </div>

          {isRlsViolationDetected() && showRlsGuide && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3.5 text-xs text-slate-700 shadow-inner">
              <h4 className="font-black uppercase tracking-wide text-xs text-slate-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-500" /> Guía de Solución: Desactivar RLS
              </h4>
              
              <div className="space-y-2 leading-relaxed">
                <p>Supabase habilita la opción de control <strong>Row Level Security (RLS)</strong> por defecto al crear las tablas. Para que tu aplicación pueda guardar libremente la información desde el celular con la clave pública, debes desactivarla.</p>
                
                <div className="p-3 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[10px] overflow-x-auto space-y-2 border border-slate-800">
                  <span className="text-orange-400 block font-bold tracking-wider">// OPCIÓN A: Ejecuta este código en el SQL Editor de tu consola de Supabase</span>
                  <code className="block select-all whitespace-pre leading-normal">
{`ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.history DISABLE ROW LEVEL SECURITY;`}
                  </code>
                </div>
                
                <div className="space-y-1 mt-3">
                  <span className="font-extrabold text-slate-800 block uppercase text-[10px] tracking-wide text-orange-600">OPCIÓN B: Desactivar desde la interfaz de Supabase</span>
                  <ol className="list-decimal pl-4.5 space-y-1.5 text-[11px] text-slate-650">
                    <li>Ingresa a tu panel de control de de <strong className="font-bold">Supabase</strong>.</li>
                    <li>Ve al menú de la izquierda y haz clic en <strong className="font-bold">Table Editor</strong> o <strong className="font-bold">Database</strong>.</li>
                    <li>Selecciona la tabla <strong className="font-bold">`users`</strong>.</li>
                    <li>Arriba a la derecha, debajo del nombre de tu proyecto, verás un botón verde/celeste que dice <strong className="font-bold text-slate-700">"RLS Enabled"</strong> o similar.</li>
                    <li>Haz clic en él y confirma para desactivarlo.</li>
                    <li>¡Repite este mismo paso para las tablas <strong className="font-bold font-mono text-[10px]">`referrals`, `recharges`, `withdrawals` y `history`</strong>!</li>
                  </ol>
                </div>

                <div className="pt-2 border-t border-slate-205 mt-2">
                  <p className="text-[11px] text-slate-500 font-semibold italic">Una vez desactivada la seguridad, vuelve aquí y pulsa el botón de recargar arriba a la derecha 🔄 para que los referidos guardados lokalmente se carguen en tu base de datos de manera inmediata.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Info Card */}
      <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-lg space-y-4 relative overflow-hidden">
        {/* Background visual graphics */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-650/20 rounded-full blur-xl -mr-4 -mt-4 animate-pulse" />
        
        <div>
          <span className="text-[10px] text-orange-500 font-black uppercase tracking-widest block">Potencia tus Ganancias</span>
          <h3 className="text-md font-black uppercase tracking-wide mt-0.5">Invita amig@s y colegas</h3>
        </div>

        {/* Level distribution visual list */}
        <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold text-orange-300 block">Equipo A</span>
            <span className="text-lg font-black font-mono">10 %</span>
            <span className="text-[8.5px] text-slate-350 block mt-0.5">Directos</span>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">Equipo B</span>
            <span className="text-lg font-black font-mono">2 %</span>
            <span className="text-[8.5px] text-slate-350 block mt-0.5">Nivel 2</span>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">Equipo C</span>
            <span className="text-lg font-black font-mono">1 %</span>
            <span className="text-[8.5px] text-slate-350 block mt-0.5">Nivel 3</span>
          </div>
        </div>

        {/* Copy triggers */}
        <div className="space-y-2 pt-2">
          {/* Reference Link */}
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">Mi Enlace Único de Inscripción</span>
            <div className="flex items-center gap-2 bg-white/15 p-2 px-3 rounded-2xl border border-white/5 backdrop-blur-sm">
              <span id="ref-link-display" className="font-mono text-xs text-slate-200 truncate flex-1 select-all font-semibold">
                {referralLink}
              </span>
              <button
                type="button"
                id="btn-copy-ref-link"
                onClick={() => copyText(referralLink, 'link')}
                className="h-8 py-1 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 transition"
              >
                {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
          </div>

          {/* Reference Code */}
          <div className="flex justify-between items-center gap-3">
            <div className="flex-1">
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">Mi Código de Referido</span>
              <span className="font-mono font-black text-sm text-amber-400">{user.phone}</span>
            </div>
            <button
              type="button"
              id="btn-copy-ref-code"
              onClick={() => copyText(user.phone, 'code')}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-650 text-white border border-slate-600 rounded-xl text-[10px] font-bold uppercase cursor-pointer"
            >
              {copiedCode ? "Copiado" : "Copiar Código"}
            </button>
          </div>
        </div>
      </div>

      {/* Network stats summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center">
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Miembros Totales</span>
          <span className="text-2xl font-black text-slate-800 font-mono block mt-1">{totalMembers}</span>
          <span className="text-[9px] text-slate-400 font-semibold uppercase block mt-0.5">Escudería Activa</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center">
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Mis Comisiones Ganadas</span>
          <span className="text-2xl font-black text-emerald-600 font-mono block mt-1">RD${network.totalEarnings.toFixed(0)}</span>
          <span className="text-[9px] text-slate-400 font-semibold uppercase block mt-0.5">Saldo Acreditado</span>
        </div>
      </div>

      {/* Segmented lists for referrals */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-650 px-1">Segmentación de Miembros de Red</h4>

        {/* LEVEL A / EQUIPO A */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setOpenA(!openA)}
            className="w-full p-4 flex justify-between items-center bg-slate-50 border-b border-slate-100 hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center">A</span>
              <div>
                <span className="text-xs font-black uppercase text-slate-800">Equipo A (Comisión 10%)</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">* Referidos directos recomendados por ti</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold text-slate-600">{network.levelA.length} usuarios</span>
              {openA ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          {openA && (
            <div className="p-4 space-y-3">
              {network.levelA.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">Aún no tienes referidos directos acreditados en tu Equipo A.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {network.levelA.map((member, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between text-xs items-center first:pt-0 last:pb-0">
                      <div>
                        <span className="font-mono font-black text-slate-800">{member.phone}</span>
                        <span className="text-[9px] text-slate-400 block">Registro: {new Date(member.registeredAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Acumulado Recargado</span>
                        <span className="font-mono font-bold text-slate-800">RD$ {member.totalRecharged.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* LEVEL B / EQUIPO B */}
        <div className="bg-white border border-slate-105 rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setOpenB(!openB)}
            className="w-full p-4 flex justify-between items-center bg-slate-50 border-b border-slate-100 hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">B</span>
              <div>
                <span className="text-xs font-black uppercase text-slate-800">Equipo B (Comisión 2%)</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">* Referidos indirectos recomendados por el Equipo A</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold text-slate-600">{network.levelB.length} usuarios</span>
              {openB ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          {openB && (
            <div className="p-4 space-y-3">
              {network.levelB.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">Aún no tienes referidos de nivel 2 acreditados en tu Equipo B.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {network.levelB.map((member, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between text-xs items-center first:pt-0 last:pb-0">
                      <div>
                        <span className="font-mono font-black text-slate-800">{member.phone}</span>
                        <span className="text-[9px] text-slate-400 block">Registro: {new Date(member.registeredAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Acumulado Recargado</span>
                        <span className="font-mono font-bold text-slate-800">RD$ {member.totalRecharged.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* LEVEL C / EQUIPO C */}
        <div className="bg-white border border-slate-105 rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setOpenC(!openC)}
            className="w-full p-4 flex justify-between items-center bg-slate-50 border-b border-slate-100 hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded bg-slate-200 text-slate-750 text-xs font-bold flex items-center justify-center">C</span>
              <div>
                <span className="text-xs font-black uppercase text-slate-800">Equipo C (Comisión 1%)</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">* Referidos indirectos recomendados por el Equipo B</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold text-slate-600">{network.levelC.length} usuarios</span>
              {openC ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          {openC && (
            <div className="p-4 space-y-3">
              {network.levelC.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">Aún no tienes referidos de nivel 3 acreditados en tu Equipo C.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {network.levelC.map((member, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between text-xs items-center first:pt-0 last:pb-0">
                      <div>
                        <span className="font-mono font-black text-slate-800">{member.phone}</span>
                        <span className="text-[9px] text-slate-400 block">Registro: {new Date(member.registeredAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Acumulado Recargado</span>
                        <span className="font-mono font-bold text-slate-800">RD$ {member.totalRecharged.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
