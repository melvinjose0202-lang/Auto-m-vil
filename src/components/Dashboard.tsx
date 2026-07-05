import React, { useState, useEffect } from 'react';
import { Play, TrendingUp, Sparkles, Navigation, Award, Wallet, CircleDollarSign, CheckCircle2, RefreshCw, Flame, Timer } from 'lucide-react';
import { User, VIPConfig } from '../types';
import { VIP_LEVELS, claimDailyVehicleYields, getTimeLeftForDailyYield, isVipPromoActive, getVipPrice, getVipPromoEndTime } from '../lib/state';

interface DashboardProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onNavigateToTab: (tabIndex: number) => void;
}

export default function Dashboard({ user, onUpdateUser, onNavigateToTab }: DashboardProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<{ success: boolean; earned: number; message: string } | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  const [timeLeftStr, setTimeLeftStr] = useState<string>("");
  const [promoActive, setPromoActive] = useState<boolean>(isVipPromoActive());

  // Promo Timer Effect
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

  // Live countdown update
  useEffect(() => {
    setCooldownRemaining(getTimeLeftForDailyYield(user.phone));

    const interval = setInterval(() => {
      const remaining = getTimeLeftForDailyYield(user.phone);
      setCooldownRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [user.phone, user.lastYieldClaimedAt]);

  const formatCooldown = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Custom slide elements matching the image styling
  const slides = [
    {
      title: "Comfort 3-Wheel Buggy Sport",
      subtitle: "Side short-distance adventure rides for premium families",
      image: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=1200",
      badge: "Nivel Inicial RD$300"
    },
    {
      title: "Civic Type R High Performance",
      subtitle: "Turbocharged track precision tailored for Caribbean asphalt",
      image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=1200",
      badge: "Lujo Avanzado RD$800"
    },
    {
      title: "Porsche GT3 RS Racing Heritage",
      subtitle: "Unmatched performance precision, elite aerodynamic grip",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200",
      badge: "Superdeportivo RD$5,000"
    }
  ];

  // Auto rotate slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleClaimYields = () => {
    if (user.vips.length === 0) {
      setClaimResult({
        success: false,
        earned: 0,
        message: "No tienes vehículos VIP activos. Ve a la pestaña 'VIP' y adquiere tu primer coche de alta gama desde RD$300 pesos para iniciar los rendimientos."
      });
      return;
    }

    setClaiming(true);
    setClaimResult(null);

    // Simulated micro-delay to let the virtual engine Rev sound / render a professional progress bar
    setTimeout(() => {
      const result = claimDailyVehicleYields(user.phone);
      if (result.success) {
        // Fetch updated user state from localStorage
        const rawState = localStorage.getItem("autosport_state_db");
        if (rawState) {
          const stateDb = JSON.parse(rawState);
          const updated = stateDb.users[user.phone];
          if (updated) {
            onUpdateUser(updated);
          }
        }
      }
      setClaimResult(result);
      setClaiming(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-24 font-sans">
      
      {/* Top Header Row matching style of image */}
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-orange-600 flex items-center justify-center font-black text-white text-sm tracking-tighter">AS</span>
          <div>
            <h1 className="text-md font-black uppercase text-slate-800 tracking-tight leading-4">AUTO SPORT</h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">República Dominicana</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* DR Flag Country Badge */}
          <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-700 transition cursor-help">
            <span className="text-xs">🇩🇴</span>
            <span>Español</span>
          </div>
          
          {/* Active Status Header Indicator */}
          <div className="relative">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping absolute top-0.5 right-0.5" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
        </div>
      </div>

      {/* DR VIP Greeting Banner including enormous RD$20 registration claim */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl p-5 text-white shadow-xl shadow-orange-100 relative overflow-hidden">
        {/* Abstract background shape for premium asset look */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-6 -mb-6" />

        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest bg-white/20 text-white py-1 px-2.5 rounded-full backdrop-blur-md">
              Bienvenido Piloto
            </span>
            <p className="text-lg font-bold mt-1.5 font-mono">{user.phone}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-orange-200 font-extrabold uppercase tracking-widest">Saldo Disponible</span>
            <p className="text-3xl font-black font-mono tracking-tighter mt-1">
              RD$ {user.balance.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Big visual number 20 as requested "bono de bienvenida que se vea grande el 20" */}
        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-white text-orange-600 font-black text-lg rounded-xl flex items-center justify-center shadow-inner scale-105 animate-bounce">
              20
            </div>
            <div className="text-[11px]">
              <span className="font-extrabold block text-white">Bono de Bienvenida RD$20</span>
              <span className="text-orange-100">Acreditado instantáneamente para invertir</span>
            </div>
          </div>
          <button 
            onClick={() => onNavigateToTab(3)} // navigate to profile
            className="text-xs bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-lg font-extrabold uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer"
          >
            Detalles
          </button>
        </div>
      </div>

      {/* Promo countdown clock if active on Home screen */}
      {promoActive && (
        <div 
          onClick={() => onNavigateToTab(1)}
          className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 p-4.5 rounded-3xl text-white shadow-lg relative overflow-hidden animate-pulse border border-orange-400/20 text-left cursor-pointer hover:scale-[1.01] transition-transform"
        >
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
        </div>
      )}

      {/* Quick Action Grid for Recargar and Retirar */}
      <div className="grid grid-cols-2 gap-3 px-1">
        <button
          onClick={() => onNavigateToTab(5)} // Tab 5 is Recharge
          id="quick-recharge-btn"
          className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold uppercase py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm text-xs transition active:scale-95 border border-slate-850"
        >
          <div className="h-5 w-5 bg-orange-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">
            +
          </div>
          <span>Recargar Saldo</span>
        </button>
        <button
          onClick={() => onNavigateToTab(6)} // Tab 6 is Withdraw
          id="quick-withdraw-btn"
          className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold uppercase py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm text-xs transition active:scale-95"
        >
          <div className="h-5 w-5 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-bold text-xs">
            -
          </div>
          <span>Retirar Ganancias</span>
        </button>
      </div>

      {/* Hero Vehicle Slider (Matching Photo exactly) */}
      <div className="relative h-60 w-full overflow-hidden rounded-3xl bg-slate-100 shadow-md">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-transform duration-700 ease-in-out ${index === activeSlide ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ transform: `translateX(${(index - activeSlide) * 100}%)` }}
          >
            {/* Background Image of Luxury Vehicle */}
            <img
              src={slide.image}
              alt={slide.title}
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover brightness-[0.45]"
            />
            {/* Slide info overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
              <span className="self-start text-[10px] font-black uppercase tracking-widest bg-orange-600 px-2.5 py-1 rounded-full mb-2">
                {slide.badge}
              </span>
              <h3 className="text-xl font-extrabold tracking-tight text-white leading-tight">
                {slide.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm line-clamp-2">
                {slide.subtitle}
              </p>
            </div>
          </div>
        ))}

        {/* Bullet page Indicators to match image */}
        <div className="absolute bottom-4 right-4 flex space-x-1.5 z-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeSlide ? 'w-5 bg-sky-400' : 'w-1.5 bg-slate-400/80'}`}
            />
          ))}
        </div>
      </div>

      {/* Action Shortcut Buttons (Sleek High-End Card Options) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Deposit card directly copying photo text format: "Fondos de inversión..." */}
        <div 
          onClick={() => onNavigateToTab(1)} // navigate to VIP/Recarga
          className="bg-gradient-to-br from-sky-450 via-sky-500 to-indigo-600 text-white rounded-3xl p-5 shadow-lg shadow-sky-100 cursor-pointer overflow-hidden relative group hover:scale-[1.02] transition-transform"
          style={{ backgroundImage: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' }}
        >
          <div className="absolute top-2 right-2 opacity-15 text-white transform translate-x-3 -translate-y-2">
            <TrendingUp className="h-20 w-20" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
            Inversión Directa
          </span>
          <h4 className="text-md font-extrabold mt-3 text-white leading-5">Fondos de inversión</h4>
          <p className="text-[10px] text-sky-100 mt-1.5 line-clamp-2">
            Diversifica tus inversiones con nuestros fondos especializados en autos deportivos.
          </p>
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-white bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm self-start inline-block">
            <span>Ver todo &gt;</span>
          </div>
        </div>

        {/* Lucky wheel card directly copying photo: "¡Gira la ruleta de la suerte...!" */}
        <div 
          onClick={cooldownRemaining > 0 ? undefined : handleClaimYields}
          className={`bg-gradient-to-br text-white rounded-3xl p-5 shadow-md overflow-hidden relative group hover:scale-[1.02] transition-transform ${
            cooldownRemaining > 0 
              ? 'from-slate-600 via-slate-700 to-slate-800 cursor-not-allowed shadow-none' 
              : 'from-orange-400 via-orange-500 to-red-600 cursor-pointer shadow-orange-100'
          }`}
        >
          <div className="absolute top-2 right-2 opacity-15 text-white transform translate-x-3 -translate-y-2">
            <Sparkles className="h-20 w-20" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/20 text-white px-2 py-0.5 rounded-full">
            {cooldownRemaining > 0 ? 'En Marcha' : 'Interactivo'}
          </span>
          <h4 className="text-md font-extrabold mt-3 text-white leading-5">Generador Diario</h4>
          <p className="text-[10px] text-orange-100 mt-1.5 line-clamp-2">
            {cooldownRemaining > 0 
              ? 'Tus motores ya están operando hoy. Espera el próximo intervalo diario de 24 horas.'
              : '¡Pulsa para rugir motores y cobrar tus dividendos garantizados del 5% al instante!'
            }
          </p>
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-white bg-black/20 px-3 py-1.5 rounded-xl backdrop-blur-sm self-start inline-block">
            <span>{cooldownRemaining > 0 ? formatCooldown(cooldownRemaining) : 'Rugir Motores >'}</span>
          </div>
        </div>
      </div>

      {/* Interactive Yield Claim Engine Box */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center space-y-4">
        <div className="mx-auto h-12 w-12 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-orange-100">
          <Play className="h-6 w-6 animate-pulse" />
        </div>
        
        <div>
          <h4 className="text-md font-extrabold uppercase tracking-tight text-slate-800">
            Operar Vehículos
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            El sistema VIP otorga un <span className="font-bold text-orange-600">5.0% diario</span> de rendimiento. Enciende tus motores cada 24 horas para acreditar tus ganancias.
          </p>
        </div>

        {/* Yield claims interaction feedback */}
        {claimResult && (
          <div className={`p-4 rounded-2xl text-xs text-left flex gap-3 border ${claimResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-orange-50 border-orange-100 text-orange-800'}`}>
            {claimResult.success ? <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" /> : <Award className="h-5 w-5 text-orange-600 flex-shrink-0" />}
            <div>
              <p className="font-bold">{claimResult.success ? '¡Operación Completada!' : 'Aviso del Sistema'}</p>
              <p className="mt-0.5 leading-relaxed">{claimResult.message}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleClaimYields}
          disabled={claiming || cooldownRemaining > 0}
          className={`w-full py-3.5 px-4 rounded-xl font-bold uppercase tracking-wider text-xs transition duration-300 shadow-md flex items-center justify-center gap-2 ${
            claiming 
              ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed' 
              : cooldownRemaining > 0
                ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-none cursor-not-allowed'
                : 'bg-slate-900 hover:bg-black text-white cursor-pointer'
          }`}
        >
          {claiming ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Iniciando Transmisión... SP-5%</span>
            </>
          ) : cooldownRemaining > 0 ? (
            <>
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping mr-1" />
              <span>Motores en marcha — Volver en {formatCooldown(cooldownRemaining)}</span>
            </>
          ) : (
            <span>Poner Garaje en Marcha (5% Diario)</span>
          )}
        </button>

        <div className="flex justify-around items-center pt-2 text-[10px] font-bold text-slate-400 capitalize border-t border-slate-100">
          <div>Autos Activos: <span className="text-slate-800 text-xs font-mono">{user.vips.length}</span></div>
          <div className="h-3 w-[1px] bg-slate-200" />
          <div>Retorno Estimado: <span className="text-emerald-600 text-xs font-mono">5% Diarios</span></div>
        </div>
      </div>

      {/* Active VIP Cars Inventory */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">Mi Garaje VIP Activo</h4>
          <button 
            onClick={() => onNavigateToTab(1)} // tab 1 is VIP list
            className="text-xs font-bold text-orange-600 cursor-pointer"
          >
            Adquirir más +
          </button>
        </div>

        {user.vips.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-6 text-center">
            <p className="text-xs text-slate-500 font-medium">Aún no posees ningún vehículo VIP alquilado.</p>
            <p className="text-[10px] text-slate-400 mt-1">Sube de nivel VIP adquiriendo coches desde RD$300.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {user.vips.map((vipId, index) => {
              const vip = VIP_LEVELS.find(v => v.id === vipId);
              if (!vip) return null;
              return (
                <div key={`${vipId}-${index}`} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-1.5 right-1.5 bg-orange-600 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded">
                    5% Diario
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {vip.name}
                  </div>
                  <div className="text-sm font-black text-slate-850 mt-1 truncate">
                    {vip.carName}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-extrabold mt-0.5">
                    +RD$ {(vip.price * 0.05).toFixed(0)}/día
                  </div>
                  <div className="mt-3 flex justify-between items-center text-[10px] font-bold text-slate-400 border-t border-slate-100 pt-2">
                    <span>Inversión</span>
                    {isVipPromoActive() ? (
                      <span className="font-mono text-orange-600 flex items-center gap-1">
                        <span className="line-through text-slate-400 font-normal">RD${vip.price}</span>
                        <span>RD${getVipPrice(vip.id)}</span>
                      </span>
                    ) : (
                      <span className="font-mono text-slate-700">RD${vip.price}</span>
                    )}
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
