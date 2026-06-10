import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Award, Plus, Minus, Landmark, Coins, HeartHandshake } from 'lucide-react';
import { User, HistoryItem } from '../types';
import { getDbState } from '../lib/state';

interface FinanceHistoryProps {
  user: User;
}

export default function FinanceHistory({ user }: FinanceHistoryProps) {
  const [activeSegment, setActiveSegment] = useState<'todo' | 'recargas' | 'retiros' | 'comisiones'>('todo');
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const state = getDbState();
    // Filter history belonging strictly to this user
    const filtered = state.history.filter(h => h.phone === user.phone);
    setItems(filtered);
  }, [user.phone]);

  const getFilteredItems = () => {
    switch (activeSegment) {
      case 'recargas':
        return items.filter(h => h.type === 'recarga' || (h.type === 'bono' && h.amount > 20));
      case 'retiros':
        return items.filter(h => h.type === 'retiro');
      case 'comisiones':
        return items.filter(h => h.type === 'comision' || h.type === 'rendimiento');
      default:
        return items;
    }
  };

  const currentItems = getFilteredItems();

  return (
    <div className="space-y-6 pb-24 font-sans text-left">
      
      {/* Page Title */}
      <div className="px-1">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Historial Financiero</h2>
        <p className="text-xs text-slate-400 font-medium">Lleva un control estricto de todas tus operaciones autorizadas, recompensas de referidos y dividendos de vehículos.</p>
      </div>

      {/* Structured Category/Segment Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
        {(['todo', 'recargas', 'retiros', 'comisiones'] as const).map((seg) => (
          <button
            key={seg}
            type="button"
            onClick={() => setActiveSegment(seg)}
            className={`flex-1 py-2 rounded-xl text-center font-bold text-xs capitalize cursor-pointer transition ${activeSegment === seg ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {seg}
          </button>
        ))}
      </div>

      {/* Ledger Feed */}
      <div className="space-y-3">
        {currentItems.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-sm">
            <span className="text-xs text-slate-400 font-bold block">No se encontraron movimientos registrados en esta categoría.</span>
            <span className="text-[10px] text-slate-350 block mt-1">Todas las transacciones procesadas se listarán en detalle aquí.</span>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-50">
            {currentItems.map((item) => {
              const isPositive = item.amount > 0;
              
              // Custom background and icons styling based on type
              let iconTheme = { bg: "bg-orange-100 text-orange-650", icon: <Award className="h-4 w-4" /> };
              if (item.type === 'recarga') {
                iconTheme = { bg: "bg-sky-100 text-sky-700", icon: <Landmark className="h-4 w-4" /> };
              } else if (item.type === 'retiro') {
                iconTheme = { bg: "bg-rose-100 text-rose-700", icon: <ArrowUpRight className="h-4 w-4" /> };
              } else if (item.type === 'comision') {
                iconTheme = { bg: "bg-emerald-100 text-emerald-700", icon: <HeartHandshake className="h-4 w-4" /> };
              } else if (item.type === 'rendimiento') {
                iconTheme = { bg: "bg-amber-100 text-amber-700", icon: <Coins className="h-4 w-4" /> };
              }

              return (
                <div key={item.id} className="p-4 flex gap-3.5 items-center hover:bg-slate-50/50 transition duration-150">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconTheme.bg}`}>
                    {iconTheme.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-mono font-bold text-slate-400 block tracking-widest">{item.id}</span>
                    <h5 className="text-xs font-extrabold text-slate-800 tracking-tight leading-4 truncate mt-0.5">{item.description}</h5>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{new Date(item.date).toLocaleString('es-DO', {month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'})}</span>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className={`text-sm font-mono font-black ${isPositive ? 'text-emerald-650' : 'text-slate-800'}`}>
                      {isPositive ? '+' : ''}RD$ {item.amount.toLocaleString('es-DO', { minimumFractionDigits: 1 })}
                    </span>
                    <span className="text-[9.5px] uppercase font-extrabold block text-slate-400 tracking-wider mt-0.5">{item.type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
