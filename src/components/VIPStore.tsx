import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, ChevronRight, Car, HelpCircle, Coins } from 'lucide-react';
import { User } from '../types';
import { VIP_LEVELS, purchaseVIP } from '../lib/state';

interface VIPStoreProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onNavigateToTab: (tabIndex: number) => void;
}

export default function VIPStore({ user, onUpdateUser, onNavigateToTab }: VIPStoreProps) {
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // High-end sports car images corresponding to VIPs
  const carImages: Record<number, string> = {
    1: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=600", // SUV
    2: "https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&q=80&w=600", // sport Civic or Nissan GTR
    3: "https://images.unsplash.com/photo-1611016186353-9af58c69a533?auto=format&fit=crop&q=80&w=600", // Mustang Shelby GT500 Red (Carro Duro)
    4: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=600", // Porsche 911 Coupe
    5: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=600", // Lambo supercar
    6: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600", // Bugatti Chiron Sport (Carro Duro)
  };

  const handleBuy = (id: number) => {
    setError(null);
    setSuccess(null);
    setBuyingId(id);
  };

  const confirmPurchase = () => {
    if (buyingId === null) return;
    
    const res = purchaseVIP(user.phone, buyingId);
    if (res.error) {
      setError(res.error);
    } else if (res.user) {
      setSuccess("¡Felicidades! Has adquirido exitosamente el vehículo VIP.");
      onUpdateUser(res.user);
      setTimeout(() => {
        setBuyingId(null);
        setSuccess(null);
      }, 2000);
    }
  };

  return (
    <div className="space-y-6 pb-24 font-sans">
      
      {/* Page Title */}
      <div className="px-1">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Garaje VIP de Automóviles</h2>
        <p className="text-xs text-slate-400 font-medium">Invierte en vehículos de alta gama y recibe rentabilidad fija del <span className="text-orange-600 font-bold">5% Diario</span> de por vida.</p>
      </div>

      {/* User Balance Check Widget */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Tu Capital de Inversión</span>
          <span className="text-lg font-black text-slate-800 font-mono">RD$ {user.balance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
        </div>
        <button
          onClick={() => onNavigateToTab(5)} // Direct link to Recharge tab
          className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-black py-2 px-4 rounded-xl cursor-pointer shadow-sm active:scale-95 transition"
        >
          Recargar Fondos
        </button>
      </div>

      {/* Error / Success Display */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-xl">
          <span className="font-bold block mb-1">Error de Adquisición:</span>
          {error}
        </div>
      )}

      {/* VIP Product Grid */}
      <div className="space-y-5">
        {VIP_LEVELS.map((vip) => {
          const isOwned = user.vips.includes(vip.id);
          const dailyProfit = vip.price * vip.dailyYield;
          const monthlyProfit = dailyProfit * 30;

          return (
            <div 
              key={vip.id} 
              className={`bg-white border text-left rounded-3xl overflow-hidden shadow-sm transition-all relative ${isOwned ? 'border-orange-200 ring-1 ring-orange-200' : 'border-slate-100'}`}
            >
              {/* Image banner for high-end look */}
              <div className="relative h-44 w-full">
                <img 
                  src={carImages[vip.id]} 
                  alt={vip.carName} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                
                {/* VIP level tag */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md border border-slate-750 text-white text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full flex items-center gap-1.5 shadow">
                  <Car className="h-3 w-3 text-orange-500" />
                  <span>{vip.name}</span>
                </div>

                {/* Return tag */}
                <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-full shadow">
                  5% Diario
                </div>

                {/* Car Spec Title */}
                <div className="absolute bottom-3 left-4 text-white">
                  <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">{vip.carCategory}</span>
                  <h4 className="text-lg font-black tracking-tight mt-0.5">{vip.carName}</h4>
                </div>
              </div>

              {/* Financial metrics & details */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[9px] text-slate-450 uppercase font-black tracking-wider block">Costo Automóvil</span>
                    <span className="text-sm font-black font-mono text-slate-800">RD${vip.price}</span>
                  </div>
                  <div className="border-x border-slate-200/60">
                    <span className="text-[9px] text-slate-450 uppercase font-black tracking-wider block">Retorno Diario</span>
                    <span className="text-sm font-black font-mono text-emerald-600">+RD${dailyProfit.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-450 uppercase font-black tracking-wider block">Retorno Mensual</span>
                    <span className="text-sm font-black font-mono text-slate-800">RD${monthlyProfit.toFixed(0)}</span>
                  </div>
                </div>

                {/* Rules descriptor */}
                <div className="text-[10.5px] text-slate-500 leading-relaxed flex gap-2">
                  <ShieldCheck className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Al adquirir este vehículo, se bloquea el capital invertido y generas inmediatamente el 5% diario. No se puede adquirir el mismo nivel VIP dos veces.
                  </span>
                </div>

                {/* Action button */}
                {isOwned ? (
                  <div className="w-full bg-orange-50 border border-orange-100 text-orange-700 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider select-none">
                    <CheckCircle2 className="h-4 w-4 text-orange-500" />
                    <span>Adquirido • Limite 1 por usuario</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleBuy(vip.id)}
                    className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Comprar VIP por RD$ {vip.price}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Purchase Modal Overlay */}
      {buyingId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in-50 zoom-in-95 duration-200">
            
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3">
                <Coins className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Confirmar Adquisición</h3>
              <p className="text-xs text-slate-500 mt-1">¿Estás seguro de que deseas rentar el coche deportivo {VIP_LEVELS.find(v => v.id === buyingId)?.carName}?</p>
            </div>

            {/* Price block info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-650">Modelo:</span>
              <span className="font-mono font-bold text-slate-800">{VIP_LEVELS.find(v => v.id === buyingId)?.name}</span>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-650">Precio del Contrato:</span>
              <span className="font-mono font-black text-slate-950">RD$ {VIP_LEVELS.find(v => v.id === buyingId)?.price}</span>
            </div>

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 text-[11px] rounded-xl font-medium text-center">
                {success}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-150 text-red-800 text-[11px] rounded-xl font-medium text-center">
                {error}
              </div>
            )}

            {!success && (
              <div className="flex gap-3">
                <button
                  onClick={() => setBuyingId(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmPurchase}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md shadow-orange-100 transition active:scale-95"
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
