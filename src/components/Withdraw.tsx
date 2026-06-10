import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, ShieldAlert, ArrowRightLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { submitWithdrawal } from '../lib/state';

interface WithdrawProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

export default function Withdraw({ user, onUpdateUser }: WithdrawProps) {
  const [amountStr, setAmountStr] = useState<string>("");
  const [bankName, setBankName] = useState<string>("Banco Popular");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountOwner, setAccountOwner] = useState<string>("");
  const [drTime, setDrTime] = useState<string>("");
  const [isDrHrValid, setIsDrHrValid] = useState<boolean>(true);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update DR Time programmatics in real-time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Dominican Republic is UTC-4
      const drDate = new Date(now.getTime() + (now.getTimezoneOffset() - 240) * 60000);
      setDrTime(drDate.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      
      const hr = drDate.getHours();
      setIsDrHrValid(hr >= 13 && hr < 18);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!accountNumber.trim()) {
      setError("Por favor, ingresa tu número de cuenta bancaria o dirección de billetera cripto.");
      return;
    }
    if (!accountOwner.trim()) {
      setError("Por favor, ingresa el nombre completo del titular de la cuenta de destino.");
      return;
    }

    const res = submitWithdrawal(user.phone, amountStr);
    if (res.error) {
      setError(res.error);
    } else if (res.request) {
      setSuccess(`¡Solicitud de retiro procesada con éxito! Se ha descontado RD$${res.request.amount} de tu balance. Monto neto a recibir (con 12% de comisión): RD$${res.request.netAmount.toFixed(2)}. Estará acreditado de 1:00 PM a 6:00 PM.`);
      setAmountStr("");
      setAccountNumber("");
      setAccountOwner("");
      
      // Update parent user context
      const rawState = localStorage.getItem("autosport_state_db");
      if (rawState) {
        const stateDb = JSON.parse(rawState);
        const updated = stateDb.users[user.phone];
        if (updated) {
          onUpdateUser(updated);
        }
      }
    }
  };

  // Pre-fill amount shortcuts (round numbers as requested)
  const roundShortcuts = [100, 140, 160, 200, 400, 600, 1000, 2000];

  const amountInt = parseInt(amountStr, 10) || 0;
  const commission = amountInt > 0 ? (amountInt * 0.12) : 0;
  const netValue = amountInt > 0 ? (amountInt - commission) : 0;

  return (
    <div className="space-y-6 pb-24 font-sans text-left">
      
      {/* Page Title */}
      <div className="px-1">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Retirar Fondos / Rendimientos</h2>
        <p className="text-xs text-slate-400 font-medium">Transfiere tus comisiones acumuladas y dividendos diarios directo a tu banco de preferencia con un 12% de comisión de servicio.</p>
      </div>

      {/* Dominican Time frame check status bar */}
      <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left shadow-sm ${isDrHrValid ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
        <div className="flex items-center gap-2.5">
          <Clock className={`h-6 w-6 ${isDrHrValid ? 'text-emerald-600 animate-pulse' : 'text-red-500'}`} />
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider block">Horario de Retiros (Rep. Dom.)</span>
            <span className="text-xs font-bold">Lunes a Domingo — 1:00 PM a 6:00 PM</span>
          </div>
        </div>
        <div className="bg-white/80 px-4 py-2 rounded-2xl border border-slate-200/40 text-center font-mono">
          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">Hora Oficial RD</span>
          <span className={`text-md font-black ${isDrHrValid ? 'text-emerald-700' : 'text-red-650'}`}>{drTime || "Calculando..."}</span>
        </div>
      </div>

      {/* Balance Block */}
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex justify-between items-center">
        <div>
          <span className="text-[10px] text-slate-450 uppercase font-black tracking-widest block">Mi Saldo Disponible</span>
          <span className="text-2xl font-black text-slate-800 font-mono tracking-tight">RD$ {user.balance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">* No se puede retirar el capital bloqueado de VIPs</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-450 uppercase font-black tracking-widest block">Comisión Fija</span>
          <span className="text-md font-extrabold text-orange-600 font-mono">12.00 %</span>
        </div>
      </div>

      {/* Main Submission Form */}
      <form onSubmit={handleWithdrawSubmit} className="bg-white border border-slate-150 rounded-3xl p-5 shadow-sm space-y-4">
        
        {/* Amount Input */}
        <div>
          <label htmlFor="withdrawAmount" className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1 flex justify-between">
            <span>Monto a Retirar (Pesos Dominicas):</span>
            <span className="text-slate-400 normal-case font-normal">(Rojo/Redondo múltiplo de 20. Min: RD$100)</span>
          </label>
          <div className="relative rounded-2xl shadow-sm">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 text-sm font-black">RD$</span>
            <input
              id="withdrawAmount"
              type="number"
              required
              min="100"
              step="20"
              placeholder="Introduce un número redondo múltiplo de 20"
              className="block w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl text-slate-900 bg-slate-50 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
            />
          </div>
        </div>

        {/* Round number shortcuts */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Elegir Monto Redondo de Referencia:</span>
          <div className="grid grid-cols-4 gap-1.5">
            {roundShortcuts.map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => setAmountStr(sc.toString())}
                className="py-1.5 px-1 border border-slate-200 rounded-xl text-[10px] font-mono font-extrabold text-slate-650 hover:bg-slate-50 cursor-pointer"
              >
                RD$ {sc}
              </button>
            ))}
          </div>
        </div>

        {/* Target Bank selector */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label htmlFor="withdrawBank" className="block text-xs font-bold text-slate-600 mb-1">Destino:</label>
            <select
              id="withdrawBank"
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            >
              <option value="Banco Popular">Banco Popular (RD$)</option>
              <option value="Banreservas">Banreservas (RD$)</option>
              <option value="BHD">BHD León (RD$)</option>
              <option value="USDT TRC20">USDT Wallet (TRC20)</option>
              <option value="USDT BEP20">USDT Wallet (BEP20)</option>
            </select>
          </div>
          <div>
            <label htmlFor="accountOwner" className="block text-xs font-bold text-slate-605 mb-1">Titular de Cuenta:</label>
            <input
              id="accountOwner"
              type="text"
              required
              placeholder="Nombre de beneficiario"
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-900 focus:outline-none"
              value={accountOwner}
              onChange={(e) => setAccountOwner(e.target.value)}
            />
          </div>
        </div>

        {/* Account code */}
        <div>
          <label htmlFor="accountNumber" className="block text-xs font-bold text-slate-655 mb-1">Número de Cuenta Bancaria / Dirección TRC-20:</label>
          <input
            id="accountNumber"
            type="text"
            required
            placeholder="Introduce los dígitos o dirección wallet"
            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-900 focus:outline-none"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </div>

        {/* Net receipt breakdown estimates */}
        {amountInt >= 100 && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 space-y-2 text-xs">
            <span className="font-extrabold uppercase text-[9px] tracking-widest text-slate-400 block border-b border-slate-200 pb-1">Desglose Estimado de Retiro</span>
            <div className="flex justify-between">
              <span className="text-slate-500">Monto Bruto:</span>
              <span className="font-mono text-slate-700 font-bold">RD$ {amountInt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Comisión Auto Sport (12%):</span>
              <span className="font-mono text-red-500 font-bold">-RD$ {commission.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-850 font-black">
              <span>Monto Neto a Recibir:</span>
              <span className="font-mono text-emerald-600">RD$ {netValue.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Risk / Limitation notes */}
        <div className="p-3 bg-slate-50 rounded-2xl text-[10px] text-slate-450 leading-normal flex gap-2">
          <ShieldAlert className="h-4 w-4 text-orange-500 flex-shrink-0" />
          <span>Límites operativos: Solo se puede procesar 1 retiro al día. El mínimo de retiro es de RD$100. El retiro del capital invertido primario no está habilitado, solo puedes retirar tus comisiones y rendimientos generados por tus vehículos VIP.</span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-medium border border-emerald-100 leading-relaxed">
            {success}
          </div>
        )}

        {!isDrHrValid && (
          <div className="p-3 bg-orange-50 border border-orange-100/60 rounded-xl text-orange-850 text-[10px] text-center font-bold">
            ⚠️ Retiro temporalmente deshabilitado por horario. Inténtalo de 1:00 PM a 6:00 PM.
          </div>
        )}

        {isDrHrValid && !success && (
          <button
            type="submit"
            id="btn-withdraw-action"
            className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <span>Generar Solicitud de Retiro</span>
          </button>
        )}
      </form>

    </div>
  );
}
