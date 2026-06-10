import React, { useState } from 'react';
import { Eye, EyeOff, Phone, Lock, UserPlus, ShieldAlert, KeyRound, Award } from 'lucide-react';
import { registerUser, loginUser } from '../lib/state';
import { User } from '../types';

interface LoginRegisterProps {
  onAuthSuccess: (user: User, isAdmin: boolean) => void;
}

export default function LoginRegister({ onAuthSuccess }: LoginRegisterProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [refCode, setRefCode] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Automatically fetch referral code from URL if present and persist/retrieve using localStorage for universal cross-device compliance
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Broad search on url parameters
        const params = new URLSearchParams(window.location.search);
        let urlRef = params.get('ref');
        
        // Also support hash parameter if we are using an spa hashtag router
        if (!urlRef && window.location.hash) {
          const hashQuery = window.location.hash.split('?')[1];
          if (hashQuery) {
            const hashParams = new URLSearchParams(hashQuery);
            urlRef = hashParams.get('ref');
          }
        }

        if (urlRef) {
          const cleaned = urlRef.trim().replace(/\D/g, ''); // Clean to numeric only
          if (cleaned) {
            setRefCode(cleaned);
            localStorage.setItem('autosport_pending_ref_code', cleaned);
          }
        } else {
          // Retrieve from localStorage if URL didn't have it (device/reloads persistence)
          const storedRef = localStorage.getItem('autosport_pending_ref_code');
          if (storedRef) {
            setRefCode(storedRef);
          }
        }
      } catch (e) {
        console.error("Error reading/writing referral code:", e);
      }
    }
  }, []);

  // Password strength check
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Ninguna', color: 'bg-gray-200' };
    if (pass.length < 5) return { score: 1, text: 'Fácil (Muy Corta)', color: 'bg-red-500 w-1/3' };
    
    // Regular expressions for complexity
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    
    const strengthCount = [hasLetters, hasNumbers, hasSpecial].filter(Boolean).length;
    
    if (pass.length >= 8 && strengthCount >= 3) {
      return { score: 3, text: 'Fuerte (Alta Seguridad)', color: 'bg-emerald-500 w-full' };
    } else if (pass.length >= 6 && strengthCount >= 2) {
      return { score: 2, text: 'Media', color: 'bg-yellow-500 w-2/3' };
    } else {
      return { score: 1, text: 'Fácil / Débil', color: 'bg-orange-500 w-1/2' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic Validations
    if (!phone || phone.length < 8) {
      setError("Por favor, introduce un número de teléfono dominicano válido (mínimo 8 dígitos).");
      return;
    }

    if (!password || password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    if (isRegister) {
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden. Inténtalo de nuevo.");
        return;
      }

      let finalRefCode = refCode.trim();
      if (!finalRefCode && typeof window !== 'undefined') {
        const storedRef = localStorage.getItem('autosport_pending_ref_code');
        if (storedRef) {
          finalRefCode = storedRef.trim();
        }
      }

      const res = registerUser(phone.trim(), password, finalRefCode);
      if (res.error) {
        setError(res.error);
      } else if (res.user) {
        setSuccess("¡Usuario creado exitosamente! Bono de RD$20 acreditado.");
        if (typeof window !== 'undefined') {
          localStorage.removeItem('autosport_pending_ref_code');
        }
        setTimeout(() => {
          onAuthSuccess(res.user!, false);
        }, 1500);
      }
    } else {
      // Check admin credentials first
      if (phone.trim() === "8097617087" && password === "lafama0213") {
        setSuccess("Accediendo al Panel de Administración...");
        const adminUser: User = {
          phone: "8097617087",
          balance: 999999,
          registeredAt: new Date().toISOString(),
          vips: [1,2,3,4,5,6],
          totalRecharged: 999999,
          totalWithdrawn: 0,
          registrationBonusClaimed: true,
          status: 'active'
        };
        setTimeout(() => {
          onAuthSuccess(adminUser, true);
        }, 1000);
        return;
      }

      const res = loginUser(phone.trim(), password);
      if (res.error) {
        setError(res.error);
      } else if (res.user) {
        setSuccess("Iniciando sesión...");
        setTimeout(() => {
          onAuthSuccess(res.user!, false);
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Elite Brand Header */}
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
            <KeyRound className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 id="platform-title" className="mt-4 text-center text-3xl font-black tracking-tight text-slate-900 uppercase">
            Auto <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Sport</span>
          </h2>
          <p className="mt-2 text-center text-xs font-mono uppercase tracking-widest text-slate-500">
            Alta Gama • República Dominicana
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 rounded-2xl sm:px-10">
          
          <div className="flex justify-around mb-8 border-b border-slate-100 pb-4">
            <button
              id="tab-login"
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`pb-2 text-md font-semibold transition-all ${!isRegister ? 'border-b-2 border-orange-600 text-orange-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Iniciar Sesión
            </button>
            <button
              id="tab-register"
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`pb-2 text-md font-semibold transition-all ${isRegister ? 'border-b-2 border-orange-600 text-orange-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Registrarse
            </button>
          </div>

          {isRegister && (
            <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 rounded-xl flex items-center gap-3">
              <Award className="h-10 w-10 text-orange-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Bono de Bienvenida RD$20</h4>
                <p className="text-xs text-slate-500">Te regalamos un saldo de bienvenida grande de de forma instantánea al registrarte.</p>
              </div>
            </div>
          )}

          {error && (
            <div id="auth-error" className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div id="auth-success" className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm rounded flex items-center gap-2">
              <span>{success}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Número de Teléfono
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  placeholder="Ej: 8097617087"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Contraseña
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  required
                  placeholder="Crea tu contraseña"
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  id="toggle-pass-visibility"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-slate-600 text-slate-400 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {isRegister && password && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Complejidad:</span>
                    <span className={strength.score === 3 ? 'text-emerald-600' : strength.score === 2 ? 'text-yellow-600' : 'text-red-500'}>
                      {strength.text}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.color}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password (only for Registration) */}
            {isRegister && (
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Validar Contraseña
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    id="confirmPassword"
                    required
                    placeholder="Repite tu contraseña exacto"
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    id="toggle-confirm-pass"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-slate-600 text-slate-400 cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Referral / Code (only for Registration) */}
            {isRegister && (
              <div>
                <label htmlFor="referrer" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                  <span>Código de Referido (Opcional)</span>
                  <span className="text-slate-400 normal-case font-normal">(Teléfono del patrocinador)</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserPlus className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    name="refCode"
                    id="refCode"
                    placeholder="Ej: 8091112222"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                id="btn-submit-auth"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer shadow-lg shadow-orange-100 transition-all active:scale-[0.98]"
              >
                {isRegister ? "Crear Cuenta de Alta Gama" : "Acceder al Garaje Sport"}
              </button>
            </div>
          </form>



        </div>
      </div>
    </div>
  );
}
