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
          className="h-10 px-3 bg-red-50 hover:bg-rose-100 border border-red-200 text-red-650 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
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
          <span className="text-[11.5px] font-black text-orange-650 font-mono block mt-1 leading-none">{user.vips.length} Autos</span>
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
                href="https://chat.whatsapp.com/autosport_dominicana" 
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
                href="https://wa.me/18097617087" 
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
                    <span className="font-extrabold text-slate-800">Soporte Técnico 1-a-1</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Atención especializada sobre tus recargas o retiros</span>
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
        /* Highly styled VIP details / Profit multipliers pesos table */
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-650">Calculadora de Ganancias VIP</h4>
            <span className="text-[10px] bg-emerald-150 text-emerald-800 font-extrabold uppercase px-2 py-0.5 rounded">Rendimiento Fijo: 5%</span>
          </div>

          <div className="bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-xs text-slate-800">
              <thead className="bg-slate-900 text-white uppercase text-[9px] tracking-wider text-left border-b border-slate-200">
                <tr>
                  <th className="p-3">Rango</th>
                  <th className="p-3 text-right">Inversión</th>
                  <th className="p-3 text-right">Día (5%)</th>
                  <th className="p-3 text-right">Mes (30d)</th>
                  <th className="p-3 text-right hidden sm:table-cell">Año (365d)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {vipProfitTable.map((col, k) => (
                  <tr key={k} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-sans">
                      <span className="font-extrabold text-slate-900 block">{col.name}</span>
                      <span className="text-[9.5px] text-slate-400 block mt-0.5">{col.car}</span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">RD$ {col.price}</td>
                    <td className="p-3 text-right text-emerald-600 font-extrabold">+RD$ {col.daily.toFixed(0)}</td>
                    <td className="p-3 text-right font-bold">RD$ {col.monthly.toLocaleString('es-DO')}</td>
                    <td className="p-3 text-right text-slate-500 hidden sm:table-cell font-medium">RD$ {col.yearly.toLocaleString('es-DO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table terms disclaimer */}
          <div className="p-4 bg-orange-50 border border-orange-100/60 text-orange-850 rounded-2xl flex gap-2 text-[10.5px] leading-relaxed">
            <ShieldCheck className="h-4.5 w-4.5 text-orange-600 flex-shrink-0 mt-0.5" />
            <span>
              Los cálculos mostrados asumen la duración indefinida del contrato de vehículos de alta gama de Auto Sport. Las comisiones ganadas de sus respectivos referidos se abonan de manera adicional en tiempo real.
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
