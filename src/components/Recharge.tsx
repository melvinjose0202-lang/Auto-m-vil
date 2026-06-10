import React, { useState } from 'react';
import { Copy, Check, Upload, Landmark, ShieldCheck, ArrowRight, Wallet2, Coins, DollarSign, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { submitRecharge } from '../lib/state';

interface RechargeProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onNavigateToTab: (index: number) => void;
}

export default function Recharge({ user, onUpdateUser, onNavigateToTab }: RechargeProps) {
  const [amount, setAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<string>("Banco Popular");
  const [activeCategory, setActiveCategory] = useState<'banks' | 'crypto'>('banks');
  const [reference, setReference] = useState<string>("");
  const [receiptName, setReceiptName] = useState<string>("comprobante.jpg");
  const [copied, setCopied] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Preset reference amounts
  const presets = [500, 1000, 3000, 5000, 9000, 12000];

  // Specific bank and crypto configuration with realistic branding metadata
  const bankDetails: Record<string, { 
    account: string; 
    type: string; 
    owner: string; 
    document: string; 
    info: string;
    instructions: string;
    bgClass: string;
    textAccent: string;
    category: 'banks' | 'crypto';
  }> = {
    "Banco Popular": {
      account: "782910392",
      type: "Cuenta de Ahorros RD$",
      owner: "AUTO SPORT EXOTICS S.R.L.",
      document: "RNC: 1-32-45698-1",
      info: "Popular RD$ • Transferencia al Instante",
      instructions: "Realiza la transferencia al instante (vía LBTR o al mismo banco) desde tu App Popular o Sucursal Virtual.",
      bgClass: "from-blue-950 via-blue-900 to-slate-900 text-white border border-blue-800/30",
      textAccent: "text-blue-400",
      category: 'banks'
    },
    "Banreservas": {
      account: "9601321049",
      type: "Cuenta de Ahorros RD$",
      owner: "AUTO SPORT EXOTICS S.R.L.",
      document: "RNC: 1-32-45698-1",
      info: "Banreservas RD$ • Depósito / Transferencia",
      instructions: "Ideal para depósitos rápidos en estafetas o subagentes Banreservas, o transferencia bancaria directa.",
      bgClass: "from-sky-950 via-sky-800 to-slate-900 text-white border border-sky-400/20",
      textAccent: "text-sky-300",
      category: 'banks'
    },
    "BHD": {
      account: "2498103049",
      type: "Cuenta de Ahorros RD$",
      owner: "AUTO SPORT EXOTICS S.R.L.",
      document: "RNC: 1-32-45698-1",
      info: "BHD RD$ • Red Unica al Instante",
      instructions: "Transfiere cómodamente desde tu plataforma de Banco BHD utilizando esta cuenta autorizada.",
      bgClass: "from-emerald-950 via-emerald-800 to-slate-900 text-white border border-emerald-500/20",
      textAccent: "text-emerald-400",
      category: 'banks'
    },
    "USDT BEP20": {
      account: "0x7E3CcDe7C12f384aD8bF85AaD4C2F86f9ee52A4A",
      type: "Red Binance Smart Chain (BEP20)",
      owner: "AUTO SPORT SMART CONTRACT",
      document: "Red BEP20 únicamente",
      info: "Crypto USDT • Fee Ultra Bajo",
      instructions: "Envía USDT por la red BEP20. El sistema aplica la tasa oficial del dólar de forma segura y directa.",
      bgClass: "from-slate-950 via-neutral-900 to-amber-950 text-white border border-amber-500/20",
      textAccent: "text-amber-400",
      category: 'crypto'
    },
    "USDT TRC20": {
      account: "TYfEwLqVfPx3J2p38dAsKLp9eR7YqW6A3s",
      type: "Red TRON (TRC20)",
      owner: "BILLETERA CORPORATIVA USDT",
      document: "Red TRC20 únicamente",
      info: "Crypto USDT • Red TRON Veloz",
      instructions: "Copia la dirección de red TRON (empieza por 'T'). Recuerda seleccionar la red TRC20 al enviar tu retiro.",
      bgClass: "from-slate-950 via-zinc-900 to-teal-950 text-white border border-teal-500/20",
      textAccent: "text-teal-400",
      category: 'crypto'
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentDetails = bankDetails[paymentMethod];

  // Drag-and-drop mechanics
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setReceiptName(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptName(e.target.files[0].name);
    }
  };

  const handleSubmitRechargeForm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const res = submitRecharge(
      user.phone,
      amount,
      paymentMethod,
      reference,
      "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600", // Standard mock invoice receipt photo
      receiptName
    );

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`¡Tu reporte de recarga por RD$ ${amount.toLocaleString()} ha sido enviado correctamente! Nuestro equipo administrativo confirmará la transacción con el banco popular/banreserva/BHD o blockchain en unos minutos.`);
      setReference("");
      // Update local state
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

  const handleCategorySwitch = (category: 'banks' | 'crypto') => {
    setActiveCategory(category);
    // Auto preset the first one in the filtered list
    if (category === 'banks') {
      setPaymentMethod("Banco Popular");
    } else {
      setPaymentMethod("USDT BEP20");
    }
  };

  const handleSelectMethod = (method: string) => {
    setPaymentMethod(method);
  };

  const filteredMethods = Object.keys(bankDetails).filter(key => bankDetails[key].category === activeCategory);

  return (
    <div className="space-y-6 pb-24 font-sans text-left">
      
      {/* Header Info */}
      <div className="px-1">
        <span className="text-[10px] bg-amber-500/10 text-amber-600 font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
          Módulo de Recargas Seguro
        </span>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-1">
          RECARGAR SALDO EXÓTICO
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Carga fondos nacionales mediante bancos dominicanos autorizados o billeteras USDT seguras con aprobación rápida.
        </p>
      </div>

      {/* STEP 1: DEFINE AMOUNT */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
          <div className="h-5 w-5 bg-orange-600 text-white font-mono font-black text-xs rounded-full flex items-center justify-center">
            1
          </div>
          <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Monto de Recarga</h3>
        </div>

        {/* Preset Amounts */}
        <div className="grid grid-cols-3 gap-2">
          {presets.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setAmount(val)}
              className={`py-2.5 px-2 rounded-xl font-mono text-xs font-black transition-all cursor-pointer ${
                amount === val 
                  ? 'bg-orange-600 border border-orange-600 text-white shadow shadow-orange-600/20 scale-[1.03]' 
                  : 'bg-slate-50 border border-slate-200/80 text-slate-700 hover:border-slate-300'
              }`}
            >
              RD$ {val.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Monto personalizado (Mínimo RD$300):</label>
          <div className="relative rounded-2xl">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 text-xs font-black">RD$</span>
            <input
              type="number"
              min="300"
              placeholder="Ej. 1500"
              className="block w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 font-mono text-xs font-black focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={amount || ''}
              onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>
      </div>

      {/* STEP 2: SELECT CHANNEL & DETAIL */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
          <div className="h-5 w-5 bg-orange-600 text-white font-mono font-black text-xs rounded-full flex items-center justify-center">
            2
          </div>
          <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Canal de Pago</h3>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => handleCategorySwitch('banks')}
            className={`flex-1 py-2 text-center rounded-xl cursor-pointer transition ${
              activeCategory === 'banks' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Bancos Dominicanos
          </button>
          <button
            type="button"
            onClick={() => handleCategorySwitch('crypto')}
            className={`flex-1 py-2 text-center rounded-xl cursor-pointer transition ${
              activeCategory === 'crypto' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Billeteras USDT
          </button>
        </div>

        {/* Filtered buttons array selection */}
        <div className="grid grid-cols-1 gap-2 text-xs font-bold text-slate-700">
          {filteredMethods.map((method) => {
            const isSelected = paymentMethod === method;
            let btnClass = "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700";
            
            if (isSelected) {
              if (method === "Banco Popular") {
                btnClass = "bg-blue-900 text-white border-blue-950 shadow shadow-blue-900/20";
              } else if (method === "Banreservas") {
                btnClass = "bg-sky-650 text-white border-sky-750 shadow shadow-sky-600/20";
              } else if (method === "BHD") {
                btnClass = "bg-emerald-700 text-white border-emerald-800 shadow shadow-emerald-700/20";
              } else if (method.startsWith("USDT")) {
                btnClass = "bg-slate-900 text-white border-slate-950 shadow shadow-slate-950/20";
              }
            }

            return (
              <button
                key={method}
                type="button"
                onClick={() => handleSelectMethod(method)}
                className={`py-2.5 px-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${btnClass}`}
              >
                <div className="flex items-center gap-2">
                  {method === "Banco Popular" && (
                    <div className={`h-2 w-2 rounded-full ${isSelected ? 'bg-green-400' : 'bg-blue-900'}`} />
                  )}
                  {method === "Banreservas" && (
                    <div className={`h-2 w-2 rounded-full ${isSelected ? 'bg-sky-300' : 'bg-sky-600'}`} />
                  )}
                  {method === "BHD" && (
                    <div className={`h-2 w-2 rounded-full ${isSelected ? 'bg-lime-400' : 'bg-emerald-700'}`} />
                  )}
                  {method.startsWith("USDT") && (
                    <div className={`h-2 w-2 rounded-full bg-amber-400`} />
                  )}
                  <span className="font-extrabold">{method}</span>
                </div>
                {activeCategory === 'banks' ? (
                  <Landmark className="h-4 w-4 opacity-70" />
                ) : (
                  <Wallet2 className="h-4 w-4 opacity-70" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* DETALLES DE PAGO: CREDIT CARD DESIGNED INNER PLATE */}
      {currentDetails && (
        <div className={`rounded-3xl p-5 space-y-4 shadow-md relative overflow-hidden transition-all bg-gradient-to-br ${currentDetails.bgClass}`}>
          {/* Virtual Card Decorative Accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -ml-6 -mb-6 pointer-events-none" />
          
          <div className="flex justify-between items-start border-b border-white/10 pb-3">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-white/60">
                BENEFICIARIO DE LA OPERACIÓN
              </span>
              <h4 className="text-sm font-black tracking-tight mt-0.5">{currentDetails.owner}</h4>
            </div>
            {activeCategory === 'banks' ? (
              <span className="text-[9px] bg-white/15 text-white font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {currentDetails.info.split('•')[0].trim()}
              </span>
            ) : (
              <span className="text-[9px] bg-amber-500/25 text-amber-300 border border-amber-500/20 font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {currentDetails.info.split('•')[1]?.trim() || "USDT"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-white/50 block font-bold text-[9px] uppercase tracking-wider">Tipo de Destino</span>
              <span className="font-extrabold">{currentDetails.type}</span>
            </div>
            <div>
              <span className="text-white/50 block font-bold text-[9px] uppercase tracking-wider">Identificador / Red</span>
              <span className="font-extrabold">{currentDetails.document}</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-white/50 block font-bold text-[9px] uppercase tracking-wider mb-1">
              {activeCategory === 'banks' ? 'Número de Cuenta Dominicano' : 'Dirección Oficial de Depósito'}
            </span>
            <div className="flex items-center gap-2 bg-slate-900/60 border border-white/10 p-3 rounded-2xl">
              <span id="account-to-copy" className="font-mono text-xs font-black break-all select-all flex-1 tracking-tight">
                {currentDetails.account}
              </span>
              <button
                type="button"
                id="btn-copy-account"
                onClick={() => handleCopy(currentDetails.account)}
                className="h-8 w-8 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl flex items-center justify-center text-white cursor-pointer flex-shrink-0 transition active:scale-95"
                title="Copiar Código"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400 font-bold" /> : <Copy className="h-4 w-4 text-white/80" />}
              </button>
            </div>
          </div>

          {currentDetails.instructions && (
            <div className="text-[10px] text-white/80 leading-snug bg-white/5 p-3 rounded-xl border border-white/5">
              💡 <span className="font-medium">{currentDetails.instructions}</span>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: SUBMIT VOUCHER FORM */}
      <form onSubmit={handleSubmitRechargeForm} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
          <div className="h-5 w-5 bg-orange-600 text-white font-mono font-black text-xs rounded-full flex items-center justify-center">
            3
          </div>
          <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Reportar Depósito</h3>
        </div>

        {/* Input Reference Number */}
        <div>
          <label htmlFor="refInput" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Número de Referencia de la Transacción <span className="text-red-500 font-black">*</span>
          </label>
          <input
            id="refInput"
            type="text"
            required
            placeholder="Ingrese los números del comprobante (Banreservas/Popular/BHD) o Hash de red"
            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 placeholder-slate-450 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>

        {/* Drag and Drop File Upload Area */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition ${
            dragActive ? 'border-orange-500 bg-orange-50/20' : 'border-slate-200 hover:border-slate-350 bg-slate-50/30'
          }`}
        >
          <Upload className="h-8 w-8 text-orange-600 mb-1.5 animate-bounce" />
          <span className="text-xs font-bold text-slate-700 block">Sube una Captura del Comprobante</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Captura de pantalla, PNG, JPG, PDF permitidos • Máx 4MB</span>
          
          <input
            type="file"
            id="file-upload-receipt"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <label 
            htmlFor="file-upload-receipt"
            className="mt-3 inline-block bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg cursor-pointer select-none border border-slate-200 shadow-sm"
          >
            Examinar Archivo
          </label>

          {receiptName && (
            <div className="mt-3 text-[11px] bg-orange-500/10 border border-orange-500/20 text-orange-700 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5">
              ✔️ {receiptName}
            </div>
          )}
        </div>

        {/* Disclaimer terms */}
        <div className="text-[10px] text-slate-400 leading-relaxed flex gap-2 pt-1 border-t border-slate-50">
          <ShieldCheck className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
          <span>Al presionar reportar depósito, confirmas que es un pago legítimo. Adjuntar recibos erróneos o repetidos acarreará la suspensión definitiva del perfil por sospecha de fraude.</span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-bold border border-red-100 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-100 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>¡OPERACIÓN EN REVISIÓN ADMINISTRATIVA!</span>
            </div>
            <p>{success}</p>
          </div>
        )}

        {!success && (
          <button
            type="submit"
            id="btn-upload-receipt"
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-xl shadow shadow-orange-655-20 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
          >
            <span>SUBIR COMPROBANTE DE PAGO</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </form>
      
      {/* Footer Info */}
      <div className="p-4 border border-slate-100/80 rounded-2xl bg-slate-50 text-center space-y-1">
        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Atención las 24 Horas los 365 días</span>
        <p className="text-[10px] text-slate-400">Los depósitos son confirmados de manera manual por nuestros operarios de facturación en República Dominicana en un lapso estimado de 5 a 20 minutos.</p>
      </div>

    </div>
  );
}
