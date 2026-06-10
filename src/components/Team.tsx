import React, { useState, useEffect } from 'react';
import { Copy, Check, Users, ShieldAlert, Award, ChevronDown, ChevronUp, Link, Sparkles } from 'lucide-react';
import { User } from '../types';
import { getReferralNetworkDetails, ReferredDetails } from '../lib/state';

interface TeamProps {
  user: User;
}

export default function Team({ user }: TeamProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Segment collapsible states
  const [openA, setOpenA] = useState(true);
  const [openB, setOpenB] = useState(false);
  const [openC, setOpenC] = useState(false);

  const [network, setNetwork] = useState({
    levelA: [] as ReferredDetails[],
    levelB: [] as ReferredDetails[],
    levelC: [] as ReferredDetails[],
    totalEarnings: 0
  });

  useEffect(() => {
    // Fetch network details
    const details = getReferralNetworkDetails(user.phone);
    setNetwork(details);
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
      <div className="px-1">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Mi Red de Afiliados Sport</h2>
        <p className="text-xs text-slate-400 font-medium font-sans">Construye una escudería de referidos de 3 niveles y percibe jugosas comisiones directas sobre cada recarga aprobada.</p>
      </div>

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
