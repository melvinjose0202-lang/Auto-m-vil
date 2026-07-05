import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, ChevronRight, Car, HelpCircle, Coins, Flame, Timer, Sparkles, RefreshCw } from 'lucide-react';
import { User } from '../types';
import { VIP_LEVELS, purchaseVIP, isVipPromoActive, getVipPromoEndTime, getVipPrice } from '../lib/state';

interface VIPStoreProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onNavigateToTab: (tabIndex: number) => void;
}

export default function VIPStore({ user, onUpdateUser, onNavigateToTab }: VIPStoreProps) {
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [timeLeftStr, setTimeLeftStr] = useState<string>("");
  const [promoActive, setPromoActive] = useState<boolean>(isVipPromoActive());

  useEffect(() => {
    const updateTimer = () => {
      const endTime = getVipPromoEndTime();
      const now = Date.now();
      const active = isVipPromoActive();
      setPromoActive(active);

      if (!active || endTime <= now) {
        setTimeLeftStr("00:00:00");
        return;
      }

      const diff = endTime - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const hStr = String(hours).padStart(2, '0');
      const mStr = String(minutes).padStart(2, '0');
      const sStr = String(seconds).padStart(2, '0');

      setTimeLeftStr(`${hStr}:${mStr}:${sStr}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const resetPromoForTesting = () => {
    const nowTime = Date.now();
    const sixteenHours = 16 * 60 * 60 * 1000;
    localStorage.setItem("vip_promo_end_time", (nowTime + sixteenHours).toString());
    setPromoActive(true);
    // Force direct trigger of the timer state
    const diff = sixteenHours;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    setTimeLeftStr(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
  };

  // High-end sports car images corresponding to VIPs
  const carImages: Record<number, string> = {
    1: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=600", // SUV
    2: "https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&q=80&w=600", // sport Civic or Nissan GTR
    3: "https://images.unsplash.com/photo-1611016186353-9af58c69a533?auto=format&fit=crop&q=80&w=600", // Mustang Shelby GT500 Red (Carro Duro)
    4: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=600", // Porsche 911 Coupe
    5: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=600", // Lambo supercar
    6: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600", // Bugatti Chiron Sport (Carro Duro)
    7: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600", // Aston martin
    8: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=600", // Ferrari F8
    9: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=600", // McLaren
    10: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600", // Rolls-Royce
    11: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&q=80&w=600", // Bentley
    12: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600", // Aventador SVJ
    13: "https://images.unsplash.com/photo-1627454820516-dc767bcb4d3e?auto=format&fit=crop&q=80&w=600", // Bugatti La Voiture Noire (Matte Black Studio Hypercar)
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

      {/* Promo countdown clock if active */}
      {promoActive && (
        <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 p-4.5 rounded-3xl text-white shadow-lg relative overflow-hidden animate-pulse border border-orange-400/20 text-left">
          {/* Animated decorative sparks */}
          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center justify-center -mr-6 scale-150 pointer-events-none">
            <Flame className="w-40 h-40 text-white" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/35 text-[10px] font-black uppercase tracking-widest text-yellow-350 border border-yellow-350/20">
                <Sparkles className="w-3 h-3 text-yellow-400" /> ¡OFERTA SÚPER DOMINGO!
              </span>
              <h3 className="text-base font-black tracking-tight uppercase">50% DESCUENTO EN TODOS LOS VIP</h3>
              <p className="text-[11px] text-red-50 font-medium leading-tight">
                Compra cualquier nivel VIP a mitad de precio. ¡La rentabilidad del 5% diario sigue calculándose sobre el valor original del auto!
              </p>
            </div>
            
            {/* Clock element */}
            <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex-shrink-0 min-w-[150px] justify-center">
              <Timer className="w-5 h-5 text-yellow-300 animate-spin-slow" />
              <div>
                <span className="text-[9px] uppercase font-black text-slate-300 block tracking-wider leading-none">Termina en:</span>
                <span className="text-lg font-black font-mono text-yellow-300 tracking-wider leading-none block mt-1">{timeLeftStr || "Calculando..."}</span>
              </div>
            </div>
          </div>

          {/* Tester Helper Button */}
          <button 
            onClick={resetPromoForTesting}
            title="Reiniciar temporizador a 16 horas para demostración"
            className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-[8px] font-bold px-2 py-0.5 rounded border border-white/10 opacity-60 hover:opacity-100 transition flex items-center gap-1"
          >
            <RefreshCw className="w-2 h-2" /> Reiniciar 16h
          </button>
        </div>
      )}

      {/* VIP Product Grid */}
      <div className="space-y-5">
        {VIP_LEVELS.map((vip) => {
          const ownedCount = user.vips.filter(id => id === vip.id).length;
          const dailyProfit = vip.price * vip.dailyYield;
          const monthlyProfit = dailyProfit * 30;
          const activePrice = getVipPrice(vip.id);

          return (
            <div 
              key={vip.id} 
              className={`bg-white border text-left rounded-3xl overflow-hidden shadow-sm transition-all relative ${ownedCount > 0 ? 'border-orange-200 ring-1 ring-orange-200' : 'border-slate-100'}`}
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
                    {promoActive ? (
                      <div className="flex flex-col items-center justify-center leading-none">
                        <span className="text-[9.5px] line-through text-slate-400 font-mono font-bold">RD${vip.price}</span>
                        <span className="text-sm font-black font-mono text-orange-600">RD${activePrice}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-black font-mono text-slate-800">RD${vip.price}</span>
                    )}
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
                    Renta este vehículo para obtener un retorno diario del 5%. Puedes comprar todos los vehículos que desees para maximizar tus ingresos diarios.
                  </span>
                </div>

                {/* Action buttons & quantity */}
                <div className="space-y-2.5">
                  {ownedCount > 0 && (
                    <div className="w-full bg-emerald-50 border border-emerald-100 text-emerald-800 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider select-none">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{ownedCount} {ownedCount === 1 ? 'Auto Activo' : 'Autos Activos'} • Ganando RD$ {(dailyProfit * ownedCount).toLocaleString('es-DO')} / día</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleBuy(vip.id)}
                    className="w-full bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>
                      {ownedCount > 0 
                        ? `Comprar otro coche por RD$ ${activePrice.toLocaleString('es-DO')}` 
                        : `Comprar coche por RD$ ${activePrice.toLocaleString('es-DO')}`}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
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
              {promoActive && buyingId !== null ? (
                <div className="text-right">
                  <span className="text-[10px] line-through text-slate-400 block font-mono leading-none">RD$ {VIP_LEVELS.find(v => v.id === buyingId)?.price}</span>
                  <span className="font-mono font-black text-orange-600 text-sm leading-tight block">
                    RD$ {getVipPrice(buyingId)} <span className="text-[9px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md ml-1">50% OFF</span>
                  </span>
                </div>
              ) : (
                <span className="font-mono font-black text-slate-950">RD$ {buyingId !== null ? VIP_LEVELS.find(v => v.id === buyingId)?.price : 0}</span>
              )}
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
