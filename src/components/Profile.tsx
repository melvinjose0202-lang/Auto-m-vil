import React, { useState } from 'react';
import { LogOut, Send, MessageCircle, HelpCircle, Landmark, ShieldCheck, HeartHandshake, History, FileSpreadsheet } from 'lucide-react';
import { User } from '../types';
import { VIP_LEVELS } from '../lib/state';

interface ProfileProps {
  user: User;
  onLogout: () => void;
  onNavigateToTab: (index: number) => void;
}

export default function Profile({ user, onLogout, onNavigateToTab }: ProfileProps) {
  const [activeTab, setActiveTab ] = useState<'cuenta' | 'ganancias'>('cuenta');

  // Multipliers table based on 5% daily yields for each VIP
  const vipProfitTable = VIP_LEVELS.map(v => {
    const daily = v.price * v.dailyYield;
    const monthly = daily * 30;
    const yearly = daily * 365;
    return {
      name: v.name,
      car: v.carName,
      price: v.price,
      daily,
      monthly,
      yearly
    };
  });

  return (
    <div className="space-y-6 pb-24 font-sans text-left">
      
      {/* Upper Profile Greetings Header */}
      <div className="flex items-center gap-4 px-1 py-2">
        <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-750 flex items-center justify-center font-black text-rose-500 font-mono text-xl shadow">
          {user.phone.slice(-3)}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[9.5px] uppercase tracking-widest text-orange-500 font-black block">Usuario Registrado</span>
          <h3 className="text-md font-black text-slate-800 font-mono truncate">{user.phone}</h3>
          <span className="text-[10px] text-slate-400 block mt-0.5">Ingreso: {new Date(user.registeredAt).toLocaleDateString('es-DO')}</span>
        </div>
        <button
          onClick={onLogout}
          id="btn-logout"
          className="h-10 px-3 bg-red-50 hover:bg-rose-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
          title="Cerrar Sesión"
        >
          <LogOut className="h-4 w-4" />
          <span>Salir</span>
        </button>
      </div>

      {/* Profile quick stats boxes */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-inner">
          <span className="text-[9px] uppercase font-black text-slate-405 block">Disponible</span>
          <span className="text-[11.5px] font-black text-slate-800 font-mono block mt-1 leading-none">RD${user.balance.toFixed(0)}</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-inner">
          <span className="text-[9px] uppercase font-black text-slate-405 block">Recargas</span>
          <span className="text-[11.5px] font-black text-slate-800 font-mono block mt-1 leading-none">RD${user.totalRecharged.toFixed(0)}</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-inner">
          <span className="text-[9px] uppercase font-black text-slate-405 block">VIPs Activos</span>
          <span className="text-[11.5px] font-black text-orange-600 font-mono block mt-1 leading-none">{user.vips.length} Autos</span>
        </div>
      </div>

      {/* Recargar / Retirar action bar inside profile */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigateToTab(5)} // Navigate to Recharge
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase py-3 rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-[0.98]"
        >
          <span>Recargar</span>
        </button>
        <button
          onClick={() => onNavigateToTab(6)} // Navigate to Withdraw
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-black uppercase py-3 rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-[0.98]"
        >
          <span>Retirar</span>
        </button>
      </div>

      {/* Segment controls inside Profile */}
      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('cuenta')}
          className={`flex-1 py-2 rounded-xl text-center font-bold text-xs cursor-pointer transition ${activeTab === 'cuenta' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Soporte y Canales
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ganancias')}
          className={`flex-1 py-2 rounded-xl text-center font-bold text-xs cursor-pointer transition ${activeTab === 'ganancias' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-750'}`}
        >
          Tabla de Ganancias VIP
        </button>
      </div>

      {activeTab === 'cuenta' ? (
        <>
          {/* Official Social Customer Support Channels requested */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-650 px-1">Atención al Cliente Oficial</h4>

            <div className="grid grid-cols-1 gap-3 font-sans text-xs">
              
              {/* Telegram link */}
              <a 
                href="https://t.me/autosport_dr" 
                target="_blank" 
                rel="noreferrer"
                id="link-telegram"
                className="bg-white border border-slate-150 p-4 rounded-3xl flex items-center justify-between hover:bg-slate-55/40 transition hover:border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600 flex-shrink-0">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-800">Canal de Telegram Oficial</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Recibe actualizaciones, novedades y sorteos de coches</span>
                  </div>
                </div>
                <span className="text-sky-600 font-extrabold uppercase tracking-wider text-[10px] bg-sky-50 px-2 py-1 rounded">Unirse</span>
              </a>

              {/* Whatsapp group */}
              <a 
                href="https://chat.whatsapp.com/IdTUzS7bjLl7wfFsYl18Kr?s=cl&p=i&mlu=4" 
                target="_blank" 
                rel="noreferrer"
                id="link-whatsapp-group"
                className="bg-white border border-slate-150 p-4 rounded-3xl flex items-center justify-between hover:bg-slate-55/40 transition hover:border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-800">Comunidad de WhatsApp</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Chat grupal oficial de soporte para pilotos de RD</span>
                  </div>
                </div>
                <span className="text-emerald-600 font-extrabold uppercase tracking-wider text-[10px] bg-emerald-50 px-2 py-1 rounded">Entrar</span>
              </a>

              {/* Whatsapp Direct service */}
              <a 
                href="https://wa.me/18493549210" 
                target="_blank" 
                rel="noreferrer"
                id="link-whatsapp-direct"
                className="bg-white border border-slate-150 p-4 rounded-3xl flex items-center justify-between hover:bg-slate-55/40 transition hover:border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 flex-shrink-0">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-800">Soporte Técnico WhatsApp</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Asistencia inmediata al +1 (849) 354-9210</span>
                  </div>
                </div>
                <span className="text-teal-600 font-extrabold uppercase tracking-wider text-[10px] bg-teal-50 px-2 py-1 rounded">Chatear</span>
              </a>

            </div>
          </div>

          {/* Quick links shortcut list */}
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-150/40 text-xs">
            <button
              onClick={() => onNavigateToTab(2)} // Tab 2 is Team (segrefer)
              className="w-full text-left p-4 flex justify-between items-center hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <HeartHandshake className="h-4.5 w-4.5 text-slate-400" />
                <span className="font-bold text-slate-700">Mi Red Escudería (Equipo A, B, C)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold font-mono">10%, 2%, 1% &gt;</span>
            </button>
            
            <button
              onClick={() => onNavigateToTab(4)} // Tab 4 is financial history (fin ledger)
              className="w-full text-left p-4 flex justify-between items-center hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <History className="h-4.5 w-4.5 text-slate-400" />
                <span className="font-bold text-slate-700">Historial Diario de Transacciones</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold font-mono">Ledger &gt;</span>
            </button>
          </div>
        </>
      ) : (
        /* Highly styled VIP details / Profit multipliers pesos table representing AUTO SPORT image */
        <div className="space-y-4">
          <div className="bg-gradient-to-b from-[#1c0604] via-[#260a06] to-[#0f0201] text-white p-4 sm:p-5 rounded-3xl border border-orange-950/45 shadow-2xl flex flex-col gap-5 overflow-hidden">
            
            {/* Header branding block */}
            <div className="text-center py-2 flex flex-col items-center select-none">
              <h1 className="text-xl sm:text-2xl font-black tracking-widest text-white uppercase font-mono">
                AUTO SPORT
              </h1>
              <span className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-orange-400 uppercase mt-0.5 max-w-[280px] sm:max-w-none border-b border-orange-900/30 pb-2 w-full">
                TABLA DE INVERSIÓN ALTA GAMA
              </span>
            </div>

            {/* Top 3 Yield quick cards */}
            <div className="grid grid-cols-3 gap-2 select-none text-center">
              <div className="bg-[#41130a]/70 border border-[#f34515]/20 rounded-xl p-2.5 flex flex-col justify-between shadow-md">
                <span className="text-[7.5px] uppercase font-black tracking-tight text-orange-200">RENDIMIENTO DIARIO</span>
                <span className="text-lg sm:text-xl font-black text-white py-1">5%</span>
                <span className="text-[7px] uppercase font-black tracking-tight text-white/50 block">DIARIO</span>
              </div>
              <div className="bg-[#41130a]/70 border border-[#f34515]/20 rounded-xl p-2.5 flex flex-col justify-between shadow-md">
                <span className="text-[7.5px] uppercase font-black tracking-tight text-orange-200">RENDIMIENTO MENSUAL</span>
                <span className="text-lg sm:text-xl font-black text-white py-1">150%</span>
                <span className="text-[7px] uppercase font-black tracking-tight text-white/50 block">APROX.</span>
              </div>
              <div className="bg-[#41130a]/70 border border-[#f34515]/20 rounded-xl p-2.5 flex flex-col justify-between shadow-md">
                <span className="text-[7.5px] uppercase font-black tracking-tight text-orange-200">RENDIMIENTO ANUAL</span>
                <span className="text-lg sm:text-xl font-black text-white py-1">1825%</span>
                <span className="text-[7px] uppercase font-black tracking-tight text-white/50 block">APROX.</span>
              </div>
            </div>

            {/* The main VIP levels table */}
            <div className="bg-[#120302]/90 rounded-2xl overflow-hidden border border-white/5 shadow-inner">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-0">
                  <thead className="bg-gradient-to-r from-[#cd2609] via-[#cc2409] to-[#eb391a] text-white uppercase text-[8px] sm:text-[8.5px] tracking-wider font-black border-b border-[#eb2d09]/20 text-center">
                    <tr>
                      <th className="p-2.5 text-left font-bold text-orange-100">NIVEL VIP</th>
                      <th className="p-2.5 text-orange-100">INVERSIÓN (RD$)</th>
                      <th className="p-2.5 text-orange-100">GANANCIA DIARIA (5%)</th>
                      <th className="p-2.5 text-orange-100">GANANCIA MENSUAL (30 DÍAS)</th>
                      <th className="p-2.5 text-orange-100">GANANCIA ANUAL (365 DÍAS)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[10.5px] sm:text-[11px] font-bold font-mono text-center">
                    {vipProfitTable.map((col, index) => {
                      const isActive = user.vips.includes(index + 1);
                      return (
                        <tr 
                          key={index} 
                          className={`transition hover:bg-white/5 ${
                            isActive ? 'bg-orange-500/10 text-white' : 'text-slate-300'
                          }`}
                        >
                          <td className="p-2.5 text-left font-sans flex items-center gap-1.5 min-w-[90px]">
                            <span className="px-2.5 py-0.5 text-[10px] bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full font-black tracking-wide text-xs">
                              {col.name}
                            </span>
                          </td>
                          <td className="p-2.5 font-black text-white">
                            RD$ {col.price.toLocaleString('en-US')}
                          </td>
                          <td className="p-2.5 text-orange-400 font-extrabold">
                            RD$ {(col.daily).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-orange-400 font-extrabold">
                            RD$ {(col.monthly).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-orange-400 font-extrabold">
                            RD$ {(col.yearly).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom info banner pills matching the footer */}
            <div className="flex flex-col sm:flex-row gap-2 font-sans select-none text-xs">
              <div className="flex-1 bg-white/[0.03] hover:bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-2 transition">
                <span className="text-yellow-500 text-xs">⭐</span>
                <div className="text-left font-black tracking-tight text-[8.5px] sm:text-[9px] uppercase leading-tight">
                  <span className="text-white block">INVIERTE HOY,</span>
                  <span className="text-orange-500">ACELERA TUS GANANCIAS</span>
                </div>
              </div>
              <div className="flex-1 bg-[#fa4c06]/5 p-2.5 rounded-xl border border-[#fa4c06]/10 flex items-center gap-2 transition">
                <span className="text-emerald-500 text-xs font-black">✔</span>
                <div className="text-left font-black text-[8px] sm:text-[8.5px] uppercase text-slate-300 leading-tight">
                  <span className="text-white block">Plataforma segura y confiable</span>
                  <span className="text-orange-500/90">para inversionistas de alto nivel</span>
                </div>
              </div>
            </div>

            {/* Legal warning/info tooltip matching footer text */}
            <div className="text-left flex items-start gap-1.5 text-[8.5px] text-slate-400 font-medium leading-relaxed select-none border-t border-white/5 pt-2">
              <span className="text-[10px] text-orange-500">ⓘ</span>
              <span>
                Los rendimientos son aproximados y pueden variar de acuerdo con los términos contractuales de cada vehículo en Auto Sport. Calculados con base en un rendimiento diario del 5% compuesto.
              </span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
