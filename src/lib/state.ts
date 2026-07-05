import { User, VIPConfig, RechargeRequest, WithdrawRequest, HistoryItem } from '../types';
import {
  seedSupabaseIfNeeded,
  fetchFullStateFromSupabase,
  upsertUserToSupabase,
  upsertRechargeToSupabase,
  upsertWithdrawalToSupabase,
  upsertHistoryToSupabase,
  upsertReferralToSupabase,
  syncRegistrationToSupabase,
  supabase,
  normalizePhoneTo10Digits,
  checkSupabaseConnection,
  isRlsViolationDetected,
  setRlsViolationDetected
} from './supabase';

export { normalizePhoneTo10Digits, checkSupabaseConnection, isRlsViolationDetected, setRlsViolationDetected };


export const VIP_LEVELS: VIPConfig[] = [
  {
    id: 1,
    name: "VIP 1",
    price: 300,
    dailyYield: 0.05,
    carName: "SUV Compacto Tucson",
    carCategory: "SUV Sport",
    carImageName: "suv_compact"
  },
  {
    id: 2,
    name: "VIP 2",
    price: 800,
    dailyYield: 0.05,
    carName: "Civic Type R Executive",
    carCategory: "Sedán Deportivo",
    carImageName: "sedan_deportivo"
  },
  {
    id: 3,
    name: "VIP 3",
    price: 2000,
    dailyYield: 0.05,
    carName: "Mustang GT Coupé",
    carCategory: "Muscle Car Lujo",
    carImageName: "muscle_car"
  },
  {
    id: 4,
    name: "VIP 4",
    price: 5000,
    dailyYield: 0.05,
    carName: "Porsche 911 Carrera S",
    carCategory: "Superdeportivo",
    carImageName: "superdeportivo"
  },
  {
    id: 5,
    name: "VIP 5",
    price: 9000,
    dailyYield: 0.05,
    carName: "Lamborghini Huracán Evo",
    carCategory: "Hiperdeportivo VIP",
    carImageName: "hiperdeportivo"
  },
  {
    id: 6,
    name: "VIP 6",
    price: 12000,
    dailyYield: 0.05,
    carName: "Bugatti Chiron Sport",
    carCategory: "Hypercar Exótico",
    carImageName: "exotic_hypercar"
  },
  {
    id: 7,
    name: "VIP 7",
    price: 15000,
    dailyYield: 0.05,
    carName: "Aston Martin Vantage S",
    carCategory: "Gran Turismo Premium",
    carImageName: "aston_vantage"
  },
  {
    id: 8,
    name: "VIP 8",
    price: 19000,
    dailyYield: 0.05,
    carName: "Ferrari F8 Tributo",
    carCategory: "Supercar Italiano",
    carImageName: "ferrari_f8"
  },
  {
    id: 9,
    name: "VIP 9",
    price: 24000,
    dailyYield: 0.05,
    carName: "McLaren 720S Spider",
    carCategory: "Exotic High-End Speedster",
    carImageName: "mclaren_720s"
  },
  {
    id: 10,
    name: "VIP 10",
    price: 30000,
    dailyYield: 0.05,
    carName: "Rolls-Royce Phantom VIII",
    carCategory: "Ultra Lujo Presidencial",
    carImageName: "rr_phantom"
  },
  {
    id: 11,
    name: "VIP 11",
    price: 36000,
    dailyYield: 0.05,
    carName: "Bentley Continental GT Speed",
    carCategory: "Gran Turismo de Élite",
    carImageName: "bentley_continental"
  },
  {
    id: 12,
    name: "VIP 12",
    price: 42000,
    dailyYield: 0.05,
    carName: "Lamborghini Aventador SVJ",
    carCategory: "V12 Hypercar Roadster",
    carImageName: "aventador_svj"
  },
  {
    id: 13,
    name: "VIP 13",
    price: 50000,
    dailyYield: 0.05,
    carName: "Bugatti La Voiture Noire",
    carCategory: "El Santo Grial Automotriz",
    carImageName: "bugatti_noire"
  }
];

interface DBState {
  users: Record<string, User>;
  recharges: RechargeRequest[];
  withdrawals: WithdrawRequest[];
  history: HistoryItem[];
}

const STORAGE_KEY = "autosport_state_db";

const DEFAULT_USERS: Record<string, User> = {
  // Developer/Admin predefined credentials
  "8097617087": {
    phone: "8097617087",
    password: "lafama0213",
    balance: 50000,
    registeredAt: "2026-05-01T12:00:00Z",
    vips: [1, 2, 3],
    totalRecharged: 15000,
    totalWithdrawn: 1000,
    registrationBonusClaimed: true,
    status: 'active'
  },
  // Official Root Referral Account requested by the user
  "8093965618": {
    phone: "8093965618",
    password: "la fama",
    balance: 1000,
    registeredAt: "2026-06-10T12:00:00Z",
    vips: [1, 2],
    totalRecharged: 1100,
    totalWithdrawn: 0,
    registrationBonusClaimed: true,
    status: 'active'
  },
  // Pre-configured partner referral account requested by the user
  "8092359175": {
    phone: "8092359175",
    password: "lafama",
    balance: 100,
    registeredAt: "2026-06-11T12:00:00Z",
    referredBy: "8093965618",
    vips: [],
    totalRecharged: 0,
    totalWithdrawn: 0,
    registrationBonusClaimed: true,
    status: 'active'
  },
  // Sample referred users to seed the team network so it looks stunning immediately
  "8091112222": {
    phone: "8091112222",
    password: "password123",
    balance: 1450,
    registeredAt: "2026-06-01T10:00:00Z",
    referredBy: "8099998888", // referral links
    vips: [1],
    totalRecharged: 300,
    totalWithdrawn: 0,
    registrationBonusClaimed: true,
    status: 'active'
  },
  "8092223333": {
    phone: "8092223333",
    password: "password123",
    balance: 3200,
    registeredAt: "2026-06-02T14:30:00Z",
    referredBy: "8091112222", // A Level B for 8099998888
    vips: [1, 2],
    totalRecharged: 1100,
    totalWithdrawn: 100,
    registrationBonusClaimed: true,
    status: 'active'
  },
  "8093334444": {
    phone: "8093334444",
    password: "password123",
    balance: 600,
    registeredAt: "2026-06-03T09:15:00Z",
    referredBy: "8092223333", // A Level C for 8099998888
    vips: [],
    totalRecharged: 500,
    totalWithdrawn: 0,
    registrationBonusClaimed: true,
    status: 'active'
  }
};

const DEFAULT_STATE: DBState = {
  users: DEFAULT_USERS,
  recharges: [
    {
      id: "R-1001",
      phone: "8091112222",
      amount: 300,
      paymentMethod: "Banco Popular",
      reference: "POP-982138",
      receiptName: "comprobante_deposito.jpg",
      status: "aprobado",
      date: "2026-06-01T10:15:00Z"
    },
    {
      id: "R-1002",
      phone: "8092223333",
      amount: 800,
      paymentMethod: "USDT TRC20",
      reference: "0x7bc...22a1",
      receiptName: "usdt_hash_screenshot.png",
      status: "aprobado",
      date: "2026-06-02T14:45:00Z"
    },
    {
      id: "R-1003",
      phone: "8092223333",
      amount: 300,
      paymentMethod: "Banreservas",
      reference: "RES-9912",
      receiptName: "voucher.jpg",
      status: "aprobado",
      date: "2026-06-03T11:00:00Z"
    },
    {
      id: "R-1004",
      phone: "8093334444",
      amount: 500,
      paymentMethod: "BHD",
      reference: "BHD-77402",
      receiptName: "bhd_screenshot.png",
      status: "pendiente",
      date: "2026-06-09T18:40:00Z"
    }
  ],
  withdrawals: [
    {
      id: "W-3001",
      phone: "8092223333",
      amount: 100,
      netAmount: 88,
      commission: 12,
      status: "completado",
      date: "2026-06-05T14:10:00Z"
    }
  ],
  history: [
    {
      id: "H-5001",
      phone: "8091112222",
      type: "bono",
      amount: 20,
      description: "Bono de bienvenida por registro",
      date: "2026-06-01T10:00:00Z"
    },
    {
      id: "H-5002",
      phone: "8092223333",
      type: "bono",
      amount: 20,
      description: "Bono de bienvenida por registro",
      date: "2026-06-02T14:30:00Z"
    },
    {
      id: "H-5003",
      phone: "8093334444",
      type: "bono",
      amount: 20,
      description: "Bono de bienvenida por registro",
      date: "2026-06-03T09:15:00Z"
    },
    {
      id: "H-5004",
      phone: "8091112222",
      type: "comision",
      amount: 80, // 10% of 800 from 8092223333
      description: "Comisión Equipo A - Registro de recarga de 8092223333",
      date: "2026-06-02T14:45:00Z"
    }
  ]
};

// State load helper
export function getDbState(): DBState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  const raw = localStorage.getItem(STORAGE_KEY);
  let stateObj: DBState;
  if (!raw) {
    stateObj = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveDbState(stateObj);
  } else {
    try {
      stateObj = JSON.parse(raw);
    } catch (e) {
      stateObj = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  // Absolute cleanup of duplicate items in runtime arrays to guard against duplicated Key errors
  if (stateObj) {
    if (stateObj.recharges && Array.isArray(stateObj.recharges)) {
      stateObj.recharges = Array.from(new Map(stateObj.recharges.map((r: any) => [r.id, r])).values());
    }
    if (stateObj.withdrawals && Array.isArray(stateObj.withdrawals)) {
      stateObj.withdrawals = Array.from(new Map(stateObj.withdrawals.map((w: any) => [w.id, w])).values());
    }
    if (stateObj.history && Array.isArray(stateObj.history)) {
      stateObj.history = Array.from(new Map(stateObj.history.map((h: any) => [h.id, h])).values());
    }
  }

  // Ensure our official root referer "8093965618" is always available in state
  if (stateObj && stateObj.users && !stateObj.users["8093965618"]) {
    stateObj.users["8093965618"] = {
      phone: "8093965618",
      password: "la fama",
      balance: 1000,
      registeredAt: "2026-06-10T12:00:00Z",
      vips: [1, 2],
      totalRecharged: 1100,
      totalWithdrawn: 0,
      registrationBonusClaimed: true,
      status: 'active'
    };
    saveDbState(stateObj);
  }

  // Ensure our requested user "8092359175" is always available in state with password "lafama"
  if (stateObj && stateObj.users && (!stateObj.users["8092359175"] || stateObj.users["8092359175"].password !== "lafama" || stateObj.users["8092359175"].isStub)) {
    stateObj.users["8092359175"] = {
      phone: "8092359175",
      password: "lafama",
      balance: 100,
      registeredAt: "2026-06-11T12:00:00Z",
      referredBy: "8093965618",
      vips: [],
      totalRecharged: 0,
      totalWithdrawn: 0,
      registrationBonusClaimed: true,
      status: 'active'
    };
    saveDbState(stateObj);
  }

  // Robust property sanitization to guarantee safe fields (like vips active array and numbers)
  if (stateObj && stateObj.users) {
    Object.keys(stateObj.users).forEach(phone => {
      const u = stateObj.users[phone];
      if (u) {
        if (!Array.isArray(u.vips)) {
          u.vips = [];
        }
        if (typeof u.balance !== "number") {
          u.balance = Number(u.balance) || 0;
        }
        if (typeof u.totalRecharged !== "number") {
          u.totalRecharged = Number(u.totalRecharged) || 0;
        }
        if (typeof u.totalWithdrawn !== "number") {
          u.totalWithdrawn = Number(u.totalWithdrawn) || 0;
        }
      }
    });
  }

  return stateObj;
}

// State save helper
function saveDbState(state: DBState) {
  if (typeof window !== "undefined") {
    // Robust deep cleanup: enforce unique IDs for arrays of recharges, withdrawals and history
    if (state.recharges && Array.isArray(state.recharges)) {
      state.recharges = Array.from(new Map(state.recharges.map((r: any) => [r.id, r])).values());
    }
    if (state.withdrawals && Array.isArray(state.withdrawals)) {
      state.withdrawals = Array.from(new Map(state.withdrawals.map((w: any) => [w.id, w])).values());
    }
    if (state.history && Array.isArray(state.history)) {
      state.history = Array.from(new Map(state.history.map((h: any) => [h.id, h])).values());
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.message?.toLowerCase().includes('quota') || e.message?.toLowerCase().includes('exceeded')) {
        console.warn("localStorage quota exceeded! Aggressively pruning non-pending or large base64 receipts from local storage...");
        try {
          const prunedState = JSON.parse(JSON.stringify(state));
          if (prunedState.recharges && Array.isArray(prunedState.recharges)) {
            prunedState.recharges.forEach((r: any) => {
              // Completely clear the base64 receipt for processed items, or truncate if enormous
              if (r.status !== 'pendiente') {
                r.receiptUrl = undefined;
              } else if (r.receiptUrl && r.receiptUrl.length > 200000) {
                // If even a pending receipt is too huge (over 200KB), truncate to avoid crashing
                r.receiptUrl = "comprobante_remoto_grande";
              }
            });
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(prunedState));
          console.info("State successfully saved to localStorage after pruning old/extreme receipt assets.");
        } catch (innerErr) {
          console.error("Critical: Pruning state did not resolve the quota error:", innerErr);
        }
      } else {
        console.error("Error saving state to localStorage:", e);
      }
    }
  }
}

// Clear state to defaults
export function resetToDefaults() {
  saveDbState(DEFAULT_STATE);
}

// Synchronize database with Supabase if configured
export async function syncStateWithSupabase(): Promise<DBState> {
  const currentState = getDbState();
  if (!supabase) return currentState;

  try {
    // 1. Seed Supabase if empty and tables are available
    await seedSupabaseIfNeeded(
      DEFAULT_USERS,
      DEFAULT_STATE.recharges,
      DEFAULT_STATE.withdrawals,
      DEFAULT_STATE.history
    );

    // 2. Fetch full state from Supabase
    const supabaseData = await fetchFullStateFromSupabase();
    if (supabaseData) {
      saveDbState(supabaseData);
      return supabaseData;
    }
  } catch (e) {
    console.error("syncStateWithSupabase error:", e);
  }
  return currentState;
}


// Synchronize daily automatic yields (offline-first simulator)
// Checks if the user is due for yields based on elapsed days (or just has a daily yield simulator button)
// We will have a physical interactive yield collection that is highly rewarding! 

/**
 * Register a new user (with real-time Supabase check to avoid collision and stub issues)
 */
export async function registerUser(phone: string, password: string, referrerPhone?: string): Promise<{ error: string | null; user?: User }> {
  const state = getDbState();
  const cleanPhone = normalizePhoneTo10Digits(phone);
  let finalReferrer: string | undefined = undefined;
  const cleanRef = normalizePhoneTo10Digits(referrerPhone);

  if (cleanRef && cleanRef === cleanPhone) {
    return { error: "No puedes utilizar tu propio número como código de referido." };
  }

  // 1. Fetch latest server state to prevent offline state collision
  await syncStateWithSupabase();
  const updatedState = getDbState();

  let userOnState = updatedState.users[cleanPhone];
  let referrerOnState = cleanRef ? updatedState.users[cleanRef] : undefined;

  // 2. Direct real-time verification in Supabase to avoid race conditions or cache latency
  if (supabase) {
    try {
      const { data: dbUser } = await supabase.from('users').select('*').eq('phone', cleanPhone).maybeSingle();
      if (dbUser) {
        userOnState = {
          phone: normalizePhoneTo10Digits(dbUser.phone),
          password: dbUser.password,
          balance: Number(dbUser.balance),
          registeredAt: dbUser.registered_at,
          referredBy: dbUser.referred_by ? normalizePhoneTo10Digits(dbUser.referred_by) : undefined,
          vips: dbUser.vips || [],
          totalRecharged: Number(dbUser.total_recharged || 0),
          totalWithdrawn: Number(dbUser.total_withdrawn || 0),
          registrationBonusClaimed: !!dbUser.registration_bonus_claimed,
          status: dbUser.status as ('active' | 'suspended'),
          isStub: dbUser.password === "la fama"
        };
        updatedState.users[cleanPhone] = userOnState;
      }

      if (cleanRef) {
        const { data: dbRef } = await supabase.from('users').select('*').eq('phone', cleanRef).maybeSingle();
        if (dbRef) {
          referrerOnState = {
            phone: normalizePhoneTo10Digits(dbRef.phone),
            password: dbRef.password,
            balance: Number(dbRef.balance),
            registeredAt: dbRef.registered_at,
            referredBy: dbRef.referred_by ? normalizePhoneTo10Digits(dbRef.referred_by) : undefined,
            vips: dbRef.vips || [],
            totalRecharged: Number(dbRef.total_recharged || 0),
            totalWithdrawn: Number(dbRef.total_withdrawn || 0),
            registrationBonusClaimed: !!dbRef.registration_bonus_claimed,
            status: dbRef.status as ('active' | 'suspended'),
            isStub: dbRef.password === "la fama"
          };
          updatedState.users[cleanRef] = referrerOnState;
        }
      }
    } catch (err) {
      console.error("Direct Supabase verification error during registration:", err);
    }
  }

  // 3. Evaluate registration conditions
  if (userOnState) {
    // If the registered reference on Supabase is a stub user, let them claim/upgrade it!
    if (userOnState.isStub) {
      userOnState.password = password;
      userOnState.isStub = false;
      userOnState.registeredAt = new Date().toISOString();

      let stubReferrer: User | undefined = undefined;
      if (cleanRef) {
        userOnState.referredBy = cleanRef;
        if (!referrerOnState) {
          stubReferrer = {
            phone: cleanRef,
            password: "la fama",
            balance: 20,
            registeredAt: new Date().toISOString(),
            vips: [],
            totalRecharged: 0,
            totalWithdrawn: 0,
            registrationBonusClaimed: true,
            status: 'active',
            isStub: true
          };
          updatedState.users[cleanRef] = stubReferrer;
        }
      }

      updatedState.users[cleanPhone] = userOnState;

      const bonusHistoryId = "H-" + Math.random().toString(36).substr(2, 9).toUpperCase();
      const bonusHistory: HistoryItem = {
        id: bonusHistoryId,
        phone: cleanPhone,
        type: "bono",
        amount: 20,
        description: "Bono de bienvenida Auto Sport",
        date: new Date().toISOString()
      };
      updatedState.history.unshift(bonusHistory);
      saveDbState(updatedState);

      // Submit sequences directly to Supabase as well
      await syncRegistrationToSupabase(userOnState, bonusHistory, stubReferrer);
      return { error: null, user: userOnState };
    }

    return { error: "Este número de teléfono ya está registrado." };
  }

  // 4. Create new user record
  let stubReferrer: User | undefined = undefined;
  if (cleanRef) {
    finalReferrer = cleanRef;
    if (!referrerOnState) {
      stubReferrer = {
        phone: cleanRef,
        password: "la fama",
        balance: 20, // Welcome bonus of 20 pesos!
        registeredAt: new Date().toISOString(),
        vips: [],
        totalRecharged: 0,
        totalWithdrawn: 0,
        registrationBonusClaimed: true,
        status: 'active',
        isStub: true // marked as stub
      };
      updatedState.users[cleanRef] = stubReferrer;
    }
  }

  const newUser: User = {
    phone: cleanPhone,
    password,
    balance: 20, // Welcome bonus of 20 pesos!
    registeredAt: new Date().toISOString(),
    referredBy: finalReferrer,
    vips: [],
    totalRecharged: 0,
    totalWithdrawn: 0,
    registrationBonusClaimed: true,
    status: 'active'
  };

  updatedState.users[cleanPhone] = newUser;

  // Log Welcome bonus in history
  const historyId = "H-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  const bonusHistory: HistoryItem = {
    id: historyId,
    phone: cleanPhone,
    type: "bono",
    amount: 20,
    description: "Bono de bienvenida Auto Sport",
    date: new Date().toISOString()
  };
  updatedState.history.unshift(bonusHistory);

  saveDbState(updatedState);

  // Background sequential sync
  await syncRegistrationToSupabase(newUser, bonusHistory, stubReferrer);

  return { error: null, user: newUser };
}

/**
 * Login user with real-time state sync from Supabase
 */
export async function loginUser(phone: string, password: string): Promise<{ error: string | null; user?: User }> {
  const cleanPhone = normalizePhoneTo10Digits(phone);
  
  // 1. Always sync latest data on login attempt
  await syncStateWithSupabase();
  const updatedState = getDbState();
  
  let user = updatedState.users[cleanPhone];
  
  if (!user && supabase) {
    try {
      const { data: dbUser } = await supabase.from('users').select('*').eq('phone', cleanPhone).maybeSingle();
      if (dbUser) {
        user = {
          phone: normalizePhoneTo10Digits(dbUser.phone),
          password: dbUser.password,
          balance: Number(dbUser.balance),
          registeredAt: dbUser.registered_at,
          referredBy: dbUser.referred_by ? normalizePhoneTo10Digits(dbUser.referred_by) : undefined,
          vips: dbUser.vips || [],
          totalRecharged: Number(dbUser.total_recharged || 0),
          totalWithdrawn: Number(dbUser.total_withdrawn || 0),
          registrationBonusClaimed: !!dbUser.registration_bonus_claimed,
          status: dbUser.status as ('active' | 'suspended'),
          isStub: dbUser.password === "la fama"
        };
        updatedState.users[cleanPhone] = user;
        saveDbState(updatedState);
      }
    } catch (err) {
      console.error("Direct login Supabase verification error:", err);
    }
  }

  if (!user || user.isStub) {
    return { error: "El usuario no existe o el número de teléfono es incorrecto." };
  }
  if (user.password !== password) {
    return { error: "La contraseña es incorrecta." };
  }
  return { error: null, user };
}

/**
 * Submit a recharging request
 */
export function submitRecharge(
  phone: string,
  amount: number,
  paymentMethod: string,
  reference: string,
  receiptUrl?: string,
  receiptName: string = "comprobante.png"
): { error: string | null; request?: RechargeRequest } {
  if (amount < 300) {
    return { error: "La recarga mínima es de RD$300." };
  }
  if (!reference.trim()) {
    return { error: "Por favor, ingresa el número de referencia del depósito." };
  }

  const state = getDbState();
  const requestId = "R-" + Math.floor(100000 + Math.random() * 900000);

  const newRequest: RechargeRequest = {
    id: requestId,
    phone,
    amount,
    paymentMethod,
    reference: reference.trim(),
    receiptName,
    receiptUrl,
    status: 'pendiente',
    date: new Date().toISOString()
  };

  state.recharges.unshift(newRequest);
  saveDbState(state);

  // Background sync
  upsertRechargeToSupabase(newRequest);

  return { error: null, request: newRequest };
}

/**
 * Submit a withdrawal request
 * - Minimum 100 pesos
 * - Only round/even amounts like 100, 140, 160, 200, 400, 600 (multiples of 20)
 * - 12% commission
 * - Only 1 withdrawal per day
 * - Allowed from 1:00 PM to 6:00 PM (13:00 to 18:00) DR Time
 */
export function submitWithdrawal(
  phone: string, 
  amountStr: string,
  bankName?: string,
  accountNumber?: string,
  accountOwner?: string
): { error: string | null; request?: WithdrawRequest } {
  const amount = parseInt(amountStr, 10);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Monto de retiro inválido." };
  }

  if (amount < 100) {
    return { error: "El mínimo de retiro son RD$100." };
  }

  // Validate "round/redondos" amount check.
  // The user says "solo números redondos, por ejemplo 100, 140, 200, 160, 400, 600".
  // This means the number should be a multiple of 10 or 20, and not uneven fractions like 192, 198.
  // Let's check amounts like 110, 150, 140, which are multiples of 10 or 20.
  // Let's enforce amount must be a multiple of 20 (or 10) to be perfectly "redondo". Multiples of 20 matches all examples (100, 140, 160, 200, 400, 600 are all divisible by 20!).
  if (amount % 20 !== 0) {
    return { error: "Monto inválido. Los retiros solo están permitidos en números redondos (ej. 100, 120, 140, 160, 200, 300, 400, 600)." };
  }

  const state = getDbState();
  const user = state.users[phone];
  if (!user) {
    return { error: "Usuario no encontrado." };
  }

  if (user.balance < amount) {
    return { error: `Saldo insuficiente. Tu saldo disponible para retiro es: RD$${user.balance.toFixed(2)}.` };
  }

  // Check 1 withdrawal per day limit
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const userWithdrawalsToday = state.withdrawals.filter(w => 
    w.phone === phone && 
    new Date(w.date) >= todayStart && 
    w.status !== 'cancelado'
  );

  if (userWithdrawalsToday.length >= 1) {
    return { error: "Límite alcanzado. Solo se permite 1 retiro por día." };
  }

  // Check time frame restriction (1:00 PM to 6:00 PM Dominica Time).
  // DR is GMT-4. Let's look at coordinates.
  // We can evaluate the local hour of the client browser.
  // To protect simplicity and robust testing, let's look at the current date/hour.
  // We can show a toggle or detect the hour using local timezone.
  const now = new Date();
  const currentHour = now.getHours(); // Local hour of browser
  
  // Let's make it check 13 (1:00 PM) to 18 (6:00 PM) inclusive,
  // but let's provide a clear message. Under some test conditions, the user might test this at night,
  // so we should provide a beautiful, friendly override or warning mode, while strictly validating.
  // Let's write the strict validation but allow a "Simulador de Horario" toggle in Profile or Dev settings,
  // OR just calculate the hour in Dominican time (UTC - 4h).
  // Current UTC time is given: 2026-06-10T04:49:01Z.
  // DR Time is UTC - 4 hours. So if UTC is 04:49, DR time is 00:49 (12:49 AM).
  // Let's programmatically obtain the current DR hour:
  const utcOffsetHours = now.getTimezoneOffset() / 60; // e.g. 4 or 5
  // Calculate DR time (UTC-4)
  const drDate = new Date(now.getTime() + (now.getTimezoneOffset() - 240) * 60000);
  const drHour = drDate.getHours();
  const drDay = drDate.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday

  // Enforce Sunday restriction
  if (drDay === 0) {
    return {
      error: "Hoy domingo no se permiten retiros en la plataforma. Los retiros son únicamente de lunes a sábado de 1:00 PM a 6:00 PM."
    };
  }

  if (drHour < 13 || drHour >= 18) {
    // We strictly enforce the hour but provide a visual disclaimer in the error, & let them bypass in "Simular Horario" or have a dev info box
    return { 
      error: `Horario no habilitado. Los retiros solo están habilitados de 1:00 PM a 6:00 PM (Hora de República Dominicana). Hora actual en RD: ${drDate.toLocaleTimeString('es-DO', {hour: '2-digit', minute:'2-digit', hour12: true})}.`
    };
  }

  const commission = Number((amount * 0.12).toFixed(2));
  const netAmount = amount - commission;
  const requestId = "W-" + Math.floor(100000 + Math.random() * 900000);

  const newRequest: WithdrawRequest = {
    id: requestId,
    phone,
    amount,
    netAmount,
    commission,
    status: 'pendiente',
    date: new Date().toISOString(),
    bankName,
    accountNumber,
    accountOwner
  };

  // Deduct user balance immediately to avoid double spend. If rejected, it will be refunded.
  user.balance -= amount;
  user.totalWithdrawn += amount;
  state.users[phone] = user;

  // Log in ledger history
  const historyId = "H-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  const histItem: HistoryItem = {
    id: historyId,
    phone,
    type: "retiro",
    amount,
    description: `Solicitud de Retiro de RD$${amount} (Comisión 12% RD$${commission})`,
    date: new Date().toISOString()
  };
  state.history.unshift(histItem);

  state.withdrawals.unshift(newRequest);
  saveDbState(state);

  // Background sync
  upsertUserToSupabase(user);
  upsertWithdrawalToSupabase(newRequest);
  upsertHistoryToSupabase(histItem);

  return { error: null, request: newRequest };
}

/**
 * Buy a VIP Level
 * - Allows buying multiple VIPs of the same or different levels
 * - Deducts core price from balance
 */
export function purchaseVIP(phone: string, vipId: number): { error: string | null; user?: User } {
  const vip = VIP_LEVELS.find(v => v.id === vipId);
  if (!vip) {
    return { error: "El nivel VIP seleccionado es inválido." };
  }

  const state = getDbState();
  const user = state.users[phone];
  if (!user) {
    return { error: "Usuario no encontrado." };
  }

  if (user.balance < vip.price) {
    return { error: `Saldo insuficiente. El costo del ${vip.name} es RD$${vip.price}. Tu saldo actual es RD$${user.balance.toFixed(2)}.` };
  }

  // Deduct balance, add to owned VIPs (multiple of same VIP is allowed)
  user.balance -= vip.price;
  user.vips.push(vipId);
  user.vips.sort((a,b) => a-b);
  user.lastYieldClaimedAt = new Date().toISOString();
  state.users[phone] = user;

  // Log in history
  const historyId = "H-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  const histItem: HistoryItem = {
    id: historyId,
    phone,
    type: "rendimiento", // using this category or custom
    amount: -vip.price,
    description: `Compra de ${vip.name} (${vip.carName})`,
    date: new Date().toISOString()
  };
  state.history.unshift(histItem);

  saveDbState(state);

  // Background sync
  upsertUserToSupabase(user);
  upsertHistoryToSupabase(histItem);

  return { error: null, user };
}

/**
 * Calculates remaining cooldown time in milliseconds for the user's daily yield
 */
export function getTimeLeftForDailyYield(phone: string): number {
  const state = getDbState();
  const user = state.users[phone];
  if (!user) return 0;

  const lastHistoryClaim = state.history.find(h => h.phone === phone && h.type === "rendimiento");
  const lastPropClaim = user.lastYieldClaimedAt;
  const lastClaimDateStr = lastPropClaim || lastHistoryClaim?.date;

  if (!lastClaimDateStr) return 0;

  const elapsedMs = Date.now() - new Date(lastClaimDateStr).getTime();
  const limitMs = 24 * 60 * 60 * 1000;
  if (elapsedMs < limitMs) {
    return limitMs - elapsedMs;
  }
  return 0;
}

/**
 * Interactive engine to collect daily yields for owned VIPs
 */
export function claimDailyVehicleYields(phone: string): { success: boolean; earned: number; message: string } {
  const state = getDbState();
  const user = state.users[phone];
  if (!user) {
    return { success: false, earned: 0, message: "Usuario no encontrado." };
  }

  if (user.vips.length === 0) {
    return { success: false, earned: 0, message: "Aún no tienes ningún vehículo VIP activo para generar rendimientos." };
  }

  // Rate limit: 24h cooldown to prevent duplicates
  const cooldownLeft = getTimeLeftForDailyYield(phone);
  if (cooldownLeft > 0) {
    const hours = Math.floor(cooldownLeft / (1000 * 60 * 60));
    const minutes = Math.floor((cooldownLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((cooldownLeft % (1000 * 60)) / 1000);
    return {
      success: false,
      earned: 0,
      message: `Tus motores ya están en marcha, o has adquirido/recibido un nuevo auto VIP recientemente. Al comprar o recibir un VIP, debes esperar 24 horas para reclamar su rendimiento diario. Tiempo restante: ${hours}h ${minutes}m ${seconds}s.`
    };
  }

  let totalEarned = 0;
  const activatedCars: string[] = [];

  user.vips.forEach(vipId => {
    const vip = VIP_LEVELS.find(v => v.id === vipId);
    if (vip) {
      const yieldAmount = vip.price * vip.dailyYield; // 5% of cost
      totalEarned += yieldAmount;
      activatedCars.push(vip.carName);
    }
  });

  // Credit user available balance & update last claim timestamp
  user.balance += totalEarned;
  user.lastYieldClaimedAt = new Date().toISOString();
  state.users[phone] = user;

  // Log in history
  const historyId = "H-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  const histItem: HistoryItem = {
    id: historyId,
    phone,
    type: "rendimiento",
    amount: totalEarned,
    description: `Rendimiento diario de un 5% de autos: ${activatedCars.join(", ")}`,
    date: new Date().toISOString()
  };
  state.history.unshift(histItem);

  saveDbState(state);

  // Background sync
  upsertUserToSupabase(user);
  upsertHistoryToSupabase(histItem);

  return {
    success: true,
    earned: totalEarned,
    message: `¡Excelentes noticias! Tus motores rugieron y generaron un rendimiento del 5% diario por valor de RD$${totalEarned.toFixed(2)} pesos dominicanos.`
  };
}

/**
 * Admin: Approve a Recharge Request
 * - Adds exactly the requested amount to the user's available balance (stops duplication)
 * - Sets status to 'aprobado'
 * - Distributes referral commissions up to 3 levels:
 *    - Level A (direct referrer): 10%
 *    - Level B (referrer of A): 2%
 *    - Level C (referrer of B): 1%
 */
export function approveRechargeRequest(requestId: string): { error: string | null } {
  const state = getDbState();
  const reqIndex = state.recharges.findIndex(r => r.id === requestId);
  if (reqIndex === -1) {
    return { error: "Solicitud de recarga no encontrada." };
  }

  const recharge = state.recharges[reqIndex];
  if (recharge.status !== 'pendiente') {
    return { error: "Esta solicitud de recarga ya fue procesada anteriormente." };
  }

  const userPhone = recharge.phone;
  const user = state.users[userPhone];
  if (!user) {
    return { error: "El usuario solicitante de la recarga ya no existe." };
  }

  // Update recharge status
  recharge.status = 'aprobado';
  state.recharges[reqIndex] = recharge;

  // Credit the exact amount to user balance
  user.balance += recharge.amount;
  user.totalRecharged += recharge.amount;
  state.users[userPhone] = user;

  // Log in history
  const historyId = "H-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  const rechargeHistoryItem: HistoryItem = {
    id: historyId,
    phone: userPhone,
    type: "recarga",
    amount: recharge.amount,
    description: `Recarga aprobada de RD$${recharge.amount} (${recharge.paymentMethod})`,
    date: new Date().toISOString()
  };
  state.history.unshift(rechargeHistoryItem);

  // Background lists to sync
  const usersToSync: User[] = [user];
  const historyToSync: HistoryItem[] = [rechargeHistoryItem];

  // Calculate and distribute multi-level referral commissions
  // Ensure no duplicate commissions can trigger on double click by verifying recharge status is handled.
  let currentReferrerPhone = user.referredBy ? normalizePhoneTo10Digits(user.referredBy) : undefined;

  // LEVEL A (10%)
  if (currentReferrerPhone && state.users[currentReferrerPhone]) {
    const commissionA = recharge.amount * 0.10;
    const refUserA = state.users[currentReferrerPhone];
    refUserA.balance += commissionA;
    state.users[currentReferrerPhone] = refUserA;
    usersToSync.push(refUserA);

    // Log commission history
    const commIdA = "H-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const commAHistory: HistoryItem = {
      id: commIdA,
      phone: currentReferrerPhone,
      type: "comision",
      amount: commissionA,
      description: `Comisión Equipo A (10%) por recarga de ${userPhone} (RD$${recharge.amount})`,
      date: new Date().toISOString()
    };
    state.history.unshift(commAHistory);
    historyToSync.push(commAHistory);

    // Move to LEVEL B
    currentReferrerPhone = refUserA.referredBy ? normalizePhoneTo10Digits(refUserA.referredBy) : undefined;
    if (currentReferrerPhone && state.users[currentReferrerPhone]) {
      const commissionB = recharge.amount * 0.02;
      const refUserB = state.users[currentReferrerPhone];
      refUserB.balance += commissionB;
      state.users[currentReferrerPhone] = refUserB;
      usersToSync.push(refUserB);

      const commIdB = "H-" + Math.random().toString(36).substr(2, 9).toUpperCase();
      const commBHistory: HistoryItem = {
        id: commIdB,
        phone: currentReferrerPhone,
        type: "comision",
        amount: commissionB,
        description: `Comisión Equipo B (2%) por recarga de ${userPhone} (RD$${recharge.amount})`,
        date: new Date().toISOString()
      };
      state.history.unshift(commBHistory);
      historyToSync.push(commBHistory);

      // Move to LEVEL C
      currentReferrerPhone = refUserB.referredBy ? normalizePhoneTo10Digits(refUserB.referredBy) : undefined;
      if (currentReferrerPhone && state.users[currentReferrerPhone]) {
        const commissionC = recharge.amount * 0.01;
        const refUserC = state.users[currentReferrerPhone];
        refUserC.balance += commissionC;
        state.users[currentReferrerPhone] = refUserC;
        usersToSync.push(refUserC);

        const commIdC = "H-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        const commCHistory: HistoryItem = {
          id: commIdC,
          phone: currentReferrerPhone,
          type: "comision",
          amount: commissionC,
          description: `Comisión Equipo C (1%) por recarga de ${userPhone} (RD$${recharge.amount})`,
          date: new Date().toISOString()
        };
        state.history.unshift(commCHistory);
        historyToSync.push(commCHistory);
      }
    }
  }

  saveDbState(state);

  // Background sync everything
  upsertRechargeToSupabase(recharge);
  usersToSync.forEach(u => upsertUserToSupabase(u));
  historyToSync.forEach(h => upsertHistoryToSupabase(h));

  return { error: null };
}

/**
 * Admin: Deny Recharge Request
 */
export function denyRechargeRequest(requestId: string): { error: string | null } {
  const state = getDbState();
  const reqIndex = state.recharges.findIndex(r => r.id === requestId);
  if (reqIndex === -1) {
    return { error: "Solicitud no encontrada." };
  }

  const recharge = state.recharges[reqIndex];
  if (recharge.status !== 'pendiente') {
    return { error: "Esta solicitud ya fue procesada anteriormente." };
  }

  recharge.status = 'denegado';
  state.recharges[reqIndex] = recharge;
  
  saveDbState(state);

  // Background sync
  upsertRechargeToSupabase(recharge);

  return { error: null };
}

/**
 * Admin: Approve/Complete Withdrawal
 */
export function approveWithdrawalRequest(withdrawId: string): { error: string | null } {
  const state = getDbState();
  const reqIndex = state.withdrawals.findIndex(w => w.id === withdrawId);
  if (reqIndex === -1) {
    return { error: "Retiro no encontrado." };
  }

  const withdrawal = state.withdrawals[reqIndex];
  if (withdrawal.status !== 'pendiente') {
    return { error: "Este retiro ya fue procesado." };
  }

  withdrawal.status = 'completado';
  state.withdrawals[reqIndex] = withdrawal;

  saveDbState(state);

  // Background sync
  upsertWithdrawalToSupabase(withdrawal);

  return { error: null };
}

/**
 * Admin: Deny/Cancel Withdrawal (refunds user)
 */
export function denyWithdrawalRequest(withdrawId: string): { error: string | null } {
  const state = getDbState();
  const reqIndex = state.withdrawals.findIndex(w => w.id === withdrawId);
  if (reqIndex === -1) {
    return { error: "Retiro no encontrado." };
  }

  const withdrawal = state.withdrawals[reqIndex];
  if (withdrawal.status !== 'pendiente') {
    return { error: "Este retiro ya fue procesado." };
  }

  withdrawal.status = 'cancelado';
  state.withdrawals[reqIndex] = withdrawal;

  // Refund the user!
  const user = state.users[withdrawal.phone];
  let histItem: HistoryItem | undefined;
  if (user) {
    user.balance += withdrawal.amount;
    user.totalWithdrawn -= withdrawal.amount;
    state.users[withdrawal.phone] = user;

    // Log the refund
    const refundHistoryId = "H-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    histItem = {
      id: refundHistoryId,
      phone: withdrawal.phone,
      type: "bono",
      amount: withdrawal.amount,
      description: `Reembolso de Retiro Rechazado o Cancelado por Admin (RD$${withdrawal.amount})`,
      date: new Date().toISOString()
    };
    state.history.unshift(histItem);
  }

  saveDbState(state);

  // Background sync
  upsertWithdrawalToSupabase(withdrawal);
  if (user) {
    upsertUserToSupabase(user);
    if (histItem) {
      upsertHistoryToSupabase(histItem);
    }
  }

  return { error: null };
}

/**
 * Returns referral information separated into three tiers explicitly:
 * Level A (direct referred), Level B (grandchildren), Level C (great-grandchildren)
 * with details on total amount recharged by each.
 */
export interface ReferredDetails {
  phone: string;
  registeredAt: string;
  totalRecharged: number;
}

export function getReferralNetworkDetails(phone: string): {
  levelA: ReferredDetails[];
  levelB: ReferredDetails[];
  levelC: ReferredDetails[];
  totalEarnings: number;
} {
  const cleanPhone = normalizePhoneTo10Digits(phone);
  const state = getDbState();
  const users = Object.values(state.users);

  // Level A: referredBy matched to cleanPhone
  const levelA = users
    .filter(u => {
      if (!u.referredBy) return false;
      const refClean = normalizePhoneTo10Digits(u.referredBy);
      return refClean === cleanPhone;
    })
    .map(u => ({
      phone: normalizePhoneTo10Digits(u.phone),
      registeredAt: u.registeredAt,
      totalRecharged: u.totalRecharged
    }));

  // Level B: referredBy owned by anyone in Level A
  const levelAPhones = levelA.map(u => u.phone);
  const levelB = users
    .filter(u => {
      if (!u.referredBy) return false;
      const refClean = normalizePhoneTo10Digits(u.referredBy);
      return levelAPhones.includes(refClean);
    })
    .map(u => ({
      phone: normalizePhoneTo10Digits(u.phone),
      registeredAt: u.registeredAt,
      totalRecharged: u.totalRecharged
    }));

  // Level C: referredBy owned by anyone in Level B
  const levelBPhones = levelB.map(u => u.phone);
  const levelC = users
    .filter(u => {
      if (!u.referredBy) return false;
      const refClean = normalizePhoneTo10Digits(u.referredBy);
      return levelBPhones.includes(refClean);
    })
    .map(u => ({
      phone: normalizePhoneTo10Digits(u.phone),
      registeredAt: u.registeredAt,
      totalRecharged: u.totalRecharged
    }));

  // Calculate total commission earned from history for this user using cleaned phone
  const totalEarnings = state.history
    .filter(h => {
      const histPhoneClean = normalizePhoneTo10Digits(h.phone);
      return histPhoneClean === cleanPhone && h.type === 'comision';
    })
    .reduce((acc, current) => acc + current.amount, 0);

  return { levelA, levelB, levelC, totalEarnings };
}

/**
 * Admin: Update user balances explicitly (disponibles, recargas, retiros)
 */
export function updateUserBalances(
  phone: string, 
  balance: number, 
  totalRecharged: number, 
  totalWithdrawn: number
): { error: string | null } {
  const cleanPhone = normalizePhoneTo10Digits(phone);
  const state = getDbState();
  const user = state.users[cleanPhone];
  if (!user) {
    return { error: "Usuario no encontrado." };
  }

  user.balance = Number(balance);
  user.totalRecharged = Number(totalRecharged);
  user.totalWithdrawn = Number(totalWithdrawn);
  
  state.users[cleanPhone] = user;
  saveDbState(state);

  // Background sync
  upsertUserToSupabase(user);

  return { error: null };
}

/**
 * Admin: Update user password
 */
export function updateUserPassword(phone: string, newPassword: string): { error: string | null } {
  const cleanPhone = normalizePhoneTo10Digits(phone);
  const state = getDbState();
  const user = state.users[cleanPhone];
  if (!user) {
    return { error: "Usuario no encontrado." };
  }

  user.password = newPassword;
  state.users[cleanPhone] = user;
  saveDbState(state);

  // Background sync
  upsertUserToSupabase(user);

  return { error: null };
}

/**
 * Admin: Add or remove VIP levels
 */
export function updateUserVips(phone: string, vips: number[]): { error: string | null } {
  const cleanPhone = normalizePhoneTo10Digits(phone);
  const state = getDbState();
  const user = state.users[cleanPhone];
  if (!user) {
    return { error: "Usuario no encontrado." };
  }

  // Ensure sorted list of numbers (can have multiple of the same VIP elements)
  const oldVips = user.vips || [];
  const newVips = vips.map(Number).sort((a, b) => a - b);
  const addedNewVip = newVips.length > oldVips.length;

  user.vips = newVips;
  if (addedNewVip) {
    user.lastYieldClaimedAt = new Date().toISOString();
  }
  state.users[cleanPhone] = user;
  saveDbState(state);

  // Background sync
  upsertUserToSupabase(user);

  return { error: null };
}

/**
 * Admin: Permanently delete a user from the local state and Supabase
 */
export function deleteUserFromPlatform(phone: string): { error: string | null } {
  const cleanPhone = normalizePhoneTo10Digits(phone);
  const state = getDbState();
  
  if (!state.users[cleanPhone]) {
    return { error: "Usuario no encontrado en la plataforma." };
  }

  // Delete from local memory mapping
  delete state.users[cleanPhone];
  
  // Save local updates first
  saveDbState(state);

  // Execute deletion in remote DB asynchronously
  if (supabase) {
    supabase.from('users').delete().eq('phone', cleanPhone).then(({ error }) => {
      if (error) {
        console.error("Failed to delete user in Supabase:", error.message);
      } else {
        console.log(`[Sync] User ${cleanPhone} deleted from Supabase.`);
      }
    });
  }

  return { error: null };
}
