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
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-gradient-to-t from-white via-white/95 to-transparent z-40">
          <nav className="bg-slate-900 border border-slate-800 rounded-2xl py-3.5 px-6 shadow-xl flex justify-between items-center text-white relative">
            
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
