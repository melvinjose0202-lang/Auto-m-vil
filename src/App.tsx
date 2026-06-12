import React, { useState, useEffect } from 'react';
import { Home, Trophy, Users, User as UserIcon, Calendar, Clock, DollarSign, History, KeyRound } from 'lucide-react';
import { User } from './types';
import { getDbState, syncStateWithSupabase } from './lib/state';


// Modulo imports
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';
import VIPStore from './components/VIPStore';
import Team from './components/Team';
import Profile from './components/Profile';
import FinanceHistory from './components/FinanceHistory';
import AdminPanel from './components/AdminPanel';
import Recharge from './components/Recharge';
import Withdraw from './components/Withdraw';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab ] = useState<number>(0); // 0: Inicio, 1: VIP, 2: Equipo, 3: Perfil, 4: Historial

  // Load cached user session on build / startup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("autosport_logged_user");
      const wasAdmin = localStorage.getItem("autosport_is_admin") === "true";
      
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Revise current states from the main DB to sync balance in case admin changed it
          const mainState = getDbState();
          const syncedUser = mainState.users[parsed.phone];
          
          if (syncedUser) {
            setCurrentUser(syncedUser);
            setIsAdmin(wasAdmin && parsed.phone === "8097617087");
          } else if (wasAdmin && parsed.phone === "8097617087") {
            setCurrentUser(parsed);
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (e) {
          localStorage.removeItem("autosport_logged_user");
        }
      }

      // Sync with Supabase on startup and update current user if found
      syncStateWithSupabase().then((syncedState) => {
        const freshCached = localStorage.getItem("autosport_logged_user");
        if (freshCached) {
          try {
            const parsed = JSON.parse(freshCached);
            const syncedUser = syncedState.users[parsed.phone];
            if (syncedUser) {
              setCurrentUser(syncedUser);
            }
          } catch (e) {}
        }
      });
    }
  }, []);

  const handleAuthSuccess = (user: User, adminMode: boolean) => {
    setCurrentUser(user);
    setIsAdmin(adminMode);
    setActiveTab(0);
    
    if (typeof window !== "undefined") {
      localStorage.setItem("autosport_logged_user", JSON.stringify(user));
      localStorage.setItem("autosport_is_admin", adminMode ? "true" : "false");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setActiveTab(0);
    
    if (typeof window !== "undefined") {
      localStorage.removeItem("autosport_logged_user");
      localStorage.removeItem("autosport_is_admin");
    }
  };

  const handleUpdateUser = (updated: User) => {
    setCurrentUser(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("autosport_logged_user", JSON.stringify(updated));
    }
  };

  // If no session, prompt login
  if (!currentUser) {
    return <LoginRegister onAuthSuccess={handleAuthSuccess} />;
  }

  // Admin routing
  if (isAdmin) {
    return <AdminPanel onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center text-slate-800 font-sans antialiased overflow-x-hidden">
      {/* Maximum scale viewport frame for elegant mock preview */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col justify-between border-x border-slate-205/60 pb-24">
        
        {/* Core dynamic content render frame */}
        <div className="flex-1 p-5 overflow-y-auto">
          {activeTab === 0 && (
            <Dashboard 
              user={currentUser} 
              onUpdateUser={handleUpdateUser} 
              onNavigateToTab={(tabIdx) => setActiveTab(tabIdx)} 
            />
          )}

          {activeTab === 1 && (
            <VIPStore 
              user={currentUser} 
              onUpdateUser={handleUpdateUser} 
              onNavigateToTab={(tabIdx) => setActiveTab(tabIdx)} 
            />
          )}

          {activeTab === 2 && (
            <Team user={currentUser} onUpdateUser={handleUpdateUser} />
          )}

          {activeTab === 3 && (
            <Profile 
              user={currentUser} 
              onLogout={handleLogout} 
              onNavigateToTab={(tabIdx) => setActiveTab(tabIdx)} 
            />
          )}

          {activeTab === 4 && (
            <div className="space-y-4">
               <button 
                onClick={() => setActiveTab(3)} // Return to profile
                className="text-xs font-bold text-orange-600 mb-2 cursor-pointer inline-block"
              >
                &lt; Volver a Perfil
              </button>
              <FinanceHistory user={currentUser} />
            </div>
          )}

          {activeTab === 5 && (
            <div className="space-y-4">
              <button 
                onClick={() => setActiveTab(0)} // Return to Inicio page
                className="text-xs font-bold text-orange-600 mb-2 cursor-pointer inline-block"
              >
                &lt; Volver al Inicio
              </button>
              <Recharge 
                user={currentUser} 
                onUpdateUser={handleUpdateUser} 
                onNavigateToTab={(tabIdx) => setActiveTab(tabIdx)} 
              />
            </div>
          )}

          {activeTab === 6 && (
            <div className="space-y-4">
              <button 
                onClick={() => setActiveTab(0)} // Return to Inicio page
                className="text-xs font-bold text-orange-600 mb-2 cursor-pointer inline-block"
              >
                &lt; Volver al Inicio
              </button>
              <Withdraw 
                user={currentUser} 
                onUpdateUser={handleUpdateUser} 
              />
            </div>
          )}
        </div>

        {/* 
          Floating Bottom Navigation Bar matching the image formatting 
          Sleek, transparent background curved pill design
        */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-gradient-to-t from-white via-white/95 to-transparent z-40 pointer-events-none">
          
          {/* Floating WhatsApp Community Button */}
          <a
            href="https://chat.whatsapp.com/IFo1Gv20vY0Ipk4vJs3KKj?s=cl&p=i&mlu=4"
            target="_blank"
            rel="noreferrer"
            id="whatsapp-floating-community-btn"
            className="absolute bottom-22 right-6 p-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-full shadow-2xl transition duration-300 pointer-events-auto flex items-center justify-center animate-bounce group z-50 border border-emerald-400/20"
            title="Únete a la Comunidad Auto Sport"
          >
            <svg
              className="h-6 w-6 stroke-none fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out text-[11px] font-black uppercase tracking-wider whitespace-nowrap ml-0 group-hover:ml-2">
              Grupo Oficial
            </span>
          </a>

          <nav className="bg-slate-900 border border-slate-800 rounded-2xl py-3.5 px-6 shadow-xl flex justify-between items-center text-white relative pointer-events-auto">
            
            {/* Tab 0: Inicio */}
            <button
              onClick={() => setActiveTab(0)}
              id="nav-home"
              type="button"
              className={`flex flex-col items-center gap-1 cursor-pointer transition ${activeTab === 0 ? 'text-orange-500 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Home className="h-5 w-5" />
              <span className="text-[10px] tracking-tight uppercase font-medium">Inicio</span>
            </button>

            {/* Tab 1: VIP Store */}
            <button
              onClick={() => setActiveTab(1)}
              id="nav-vip"
              type="button"
              className={`flex flex-col items-center gap-1 cursor-pointer transition ${activeTab === 1 ? 'text-orange-500 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Trophy className="h-5 w-5" />
              <span className="text-[10px] tracking-tight uppercase font-medium">VIP</span>
            </button>

            {/* Tab 2: Team */}
            <button
              onClick={() => setActiveTab(2)}
              id="nav-team"
              type="button"
              className={`flex flex-col items-center gap-1 cursor-pointer transition ${activeTab === 2 ? 'text-orange-500 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Users className="h-5 w-5" />
              <span className="text-[10px] tracking-tight uppercase font-medium">Equipo</span>
            </button>

            {/* Tab 3: Profile */}
            <button
              onClick={() => setActiveTab(3)}
              id="nav-profile"
              type="button"
              className={`flex flex-col items-center gap-1 cursor-pointer transition ${activeTab === 3 || activeTab === 4 ? 'text-orange-500 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <UserIcon className="h-5 w-5" />
              <span className="text-[10px] tracking-tight uppercase font-medium">Perfil</span>
            </button>

          </nav>
        </div>

      </div>
    </div>
  );
}
