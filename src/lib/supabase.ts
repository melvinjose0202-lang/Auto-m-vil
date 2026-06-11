import { createClient } from '@supabase/supabase-js';
import { User, RechargeRequest, WithdrawRequest, HistoryItem } from '../types';

const metaEnv = (import.meta as any).env || {};
let supabaseUrl = (metaEnv.VITE_SUPABASE_URL || "https://xvdiuujhzczanakyyrzb.supabase.co").trim();
const supabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2ZGl1dWpoemN6YW5ha3l5cnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNTI3NTIsImV4cCI6MjA5NjYyODc1Mn0.7LuKwnT-U7cvbYDGlUclN57w4GMfPYxNlDMd-26X0CM").trim();

// Auto-clean URL to make sure it is just the root domain, even if user inputs rest/v1 or trailing slashes
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

const isValidHttpUrl = (url: string) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

let supabaseClient = null;
if (supabaseUrl && supabaseAnonKey && isValidHttpUrl(supabaseUrl)) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
}

export const supabase = supabaseClient;

let lastRlsViolationDetected = false;

export function isRlsViolationDetected(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('autosport_supabase_rls_error') === 'true';
  }
  return lastRlsViolationDetected;
}

export function setRlsViolationDetected(val: boolean) {
  lastRlsViolationDetected = val;
  if (typeof window !== 'undefined') {
    if (val) {
      localStorage.setItem('autosport_supabase_rls_error', 'true');
    } else {
      localStorage.removeItem('autosport_supabase_rls_error');
    }
  }
}

export function checkRlsError(err: any): boolean {
  if (err && err.message) {
    const msg = err.message.toLowerCase();
    if (msg.includes("row-level security") || msg.includes("row level security") || msg.includes("violates row-level security policy") || msg.includes("security policy") || msg.includes("rls")) {
      setRlsViolationDetected(true);
      return true;
    }
  }
  return false;
}

/**
 * Universal 10-digit phone number normalizer for Dominican Republic / US format.
 * Strips formatting + ensures we match the last 10 digits to bypass any country code mismatches.
 */
export function normalizePhoneTo10Digits(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.trim().replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

// Helper to convert snake_case (Supabase) to camelCase (React/types) for users
function mapUserFromDB(row: any): User {
  return {
    phone: normalizePhoneTo10Digits(row.phone),
    password: row.password,
    balance: Number(row.balance),
    registeredAt: row.registered_at,
    referredBy: row.referred_by ? normalizePhoneTo10Digits(row.referred_by) : undefined,
    vips: row.vips || [],
    totalRecharged: Number(row.total_recharged || 0),
    totalWithdrawn: Number(row.total_withdrawn || 0),
    registrationBonusClaimed: !!row.registration_bonus_claimed,
    status: row.status as ('active' | 'suspended'),
    isStub: row.password === "la fama"
  };
}

function mapUserToDB(user: User) {
  return {
    phone: normalizePhoneTo10Digits(user.phone),
    password: user.password,
    balance: user.balance,
    registered_at: user.registeredAt,
    referred_by: user.referredBy ? normalizePhoneTo10Digits(user.referredBy) : null,
    vips: user.vips,
    total_recharged: user.totalRecharged,
    total_withdrawn: user.totalWithdrawn,
    registration_bonus_claimed: user.registrationBonusClaimed,
    status: user.status
  };
}

// Helper for recharges mapping
function mapRechargeFromDB(row: any): RechargeRequest {
  return {
    id: row.id,
    phone: normalizePhoneTo10Digits(row.phone),
    amount: Number(row.amount),
    paymentMethod: row.payment_method,
    reference: row.reference,
    receiptName: row.receipt_name || "comprobante.png",
    receiptUrl: row.receipt_url || undefined,
    status: row.status as ('pendiente' | 'aprobado' | 'denegado'),
    date: row.date
  };
}

function mapRechargeToDB(req: RechargeRequest) {
  return {
    id: req.id,
    phone: normalizePhoneTo15Phone(req.phone),
    amount: req.amount,
    payment_method: req.paymentMethod,
    reference: req.reference,
    receipt_name: req.receiptName,
    receipt_url: req.receiptUrl || null,
    status: req.status,
    date: req.date
  };
}

// Separate helper specifically if database key checks exist or for normal writes
function normalizeToDBPhone(phone: string): string {
  return normalizePhoneTo10Digits(phone);
}

// Keep it clean
function normalizePhoneTo15Phone(phone: string): string {
  return normalizePhoneTo10Digits(phone);
}

// Helper for withdrawals mapping
function mapWithdrawalFromDB(row: any): WithdrawRequest {
  return {
    id: row.id,
    phone: normalizePhoneTo10Digits(row.phone),
    amount: Number(row.amount),
    netAmount: Number(row.net_amount),
    commission: Number(row.commission),
    status: row.status as ('pendiente' | 'completado' | 'cancelado'),
    date: row.date
  };
}

function mapWithdrawalToDB(req: WithdrawRequest) {
  return {
    id: req.id,
    phone: normalizePhoneTo10Digits(req.phone),
    amount: req.amount,
    net_amount: req.netAmount,
    commission: req.commission,
    status: req.status,
    date: req.date
  };
}

// Helper for history mapping
function mapHistoryFromDB(row: any): HistoryItem {
  return {
    id: row.id,
    phone: normalizePhoneTo10Digits(row.phone),
    type: row.type as ('recarga' | 'retiro' | 'comision' | 'rendimiento' | 'bono'),
    amount: Number(row.amount),
    description: row.description,
    date: row.date
  };
}

function mapHistoryToDB(item: HistoryItem) {
  return {
    id: item.id,
    phone: normalizePhoneTo10Digits(item.phone),
    type: item.type,
    amount: item.amount,
    description: item.description,
    date: item.date
  };
}

/**
 * Pushes standard default seed data to Supabase if it's completely fresh and unseeded.
 */
export async function seedSupabaseIfNeeded(
  defaultUsers: Record<string, User>,
  defaultRecharges: RechargeRequest[],
  defaultWithdrawals: WithdrawRequest[],
  defaultHistory: HistoryItem[]
) {
  if (!supabase) return;

  try {
    // Check if users empty
    const { data: existingUsers, error: usersCheckErr } = await supabase
      .from('users')
      .select('phone')
      .limit(1);

    if (usersCheckErr) {
      console.warn("Supabase check error (likely tables not created yet):", usersCheckErr.message);
      return;
    }

    if (!existingUsers || existingUsers.length === 0) {
      console.log("Supabase is clean. Seeding default tables...");
      
      // Seed users
      const usersRows = Object.values(defaultUsers).map(mapUserToDB);
      await supabase.from('users').insert(usersRows);

      // Seed recharges
      const rechargesRows = defaultRecharges.map(mapRechargeToDB);
      await supabase.from('recharges').insert(rechargesRows);

      // Seed withdrawals
      const withdrawalsRows = defaultWithdrawals.map(mapWithdrawalToDB);
      await supabase.from('withdrawals').insert(withdrawalsRows);

      // Seed history
      const historyRows = defaultHistory.map(mapHistoryToDB);
      await supabase.from('history').insert(historyRows);

      console.log("Supabase initial seeding complete!");
    }
  } catch (err) {
    console.error("Failed to seed Supabase:", err);
  }
}

/**
 * Downloads the entire database from Supabase and populates our state.
 * Also syncs any offline/local-only records to Supabase (bidirectional sync).
 */
export async function fetchFullStateFromSupabase(): Promise<{
  users: Record<string, User>;
  recharges: RechargeRequest[];
  withdrawals: WithdrawRequest[];
  history: HistoryItem[];
} | null> {
  if (!supabase) return null;

  // Retrieve current local storage state as an initial fallback
  let localUsers: Record<string, User> = {};
  let localRecharges: RechargeRequest[] = [];
  let localWithdrawals: WithdrawRequest[] = [];
  let localHistory: HistoryItem[] = [];

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem("autosport_state_db") : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.users) localUsers = parsed.users;
      if (parsed.recharges) localRecharges = parsed.recharges;
      if (parsed.withdrawals) localWithdrawals = parsed.withdrawals;
      if (parsed.history) localHistory = parsed.history;
    }
  } catch (e) {
    console.warn("Could not read local backup state for fallback sync:", e);
  }

  const usersMap: Record<string, User> = { ...localUsers };
  let recharges = [...localRecharges];
  let withdrawals = [...localWithdrawals];
  let history = [...localHistory];

  let workedAtLeastOne = false;

  // 1. Fetch Users
  const remoteUsersMap: Record<string, boolean> = {};
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error("Users table fetch failed:", error.message);
    } else if (data) {
      workedAtLeastOne = true;
      data.forEach(row => {
        const normalizedKey = normalizePhoneTo10Digits(row.phone);
        usersMap[normalizedKey] = mapUserFromDB(row);
        remoteUsersMap[normalizedKey] = true;
      });
    }
  } catch (e) {
    console.error("Users fetch exception:", e);
  }

  // Upload local-only users
  const localOnlyUsers = Object.values(localUsers).filter(u => {
    const norm = normalizePhoneTo10Digits(u.phone);
    return norm && !remoteUsersMap[norm];
  });

  if (localOnlyUsers.length > 0) {
    console.log(`[Sync] Pushing ${localOnlyUsers.length} local-only users to Supabase...`);
    try {
      const dbRows = localOnlyUsers.map(mapUserToDB);
      const { error: upsertErr } = await supabase.from('users').upsert(dbRows);
      if (upsertErr) {
        console.error("[Sync] Error upserting local-only users:", upsertErr.message);
        checkRlsError(upsertErr);
      } else {
        // Build live connection structures (referrals constraints)
        for (const lu of localOnlyUsers) {
          if (lu.referredBy) {
            const refLogId = "R-" + Math.random().toString(36).substr(2, 9).toUpperCase();
            await supabase.from('referrals').upsert({
              id: refLogId,
              referrer_phone: normalizePhoneTo10Digits(lu.referredBy),
              referred_phone: normalizePhoneTo10Digits(lu.phone),
              level: 'A',
              date: lu.registeredAt
            });
          }
        }
      }
    } catch (err) {
      console.error("[Sync] Local user upload execution error:", err);
    }
  }

  // 2. Fetch Recharges
  const remoteRechargesMap: Record<string, boolean> = {};
  try {
    const { data, error } = await supabase.from('recharges').select('*').order('date', { ascending: false });
    if (error) {
      console.error("Recharges table fetch failed:", error.message);
    } else if (data) {
      workedAtLeastOne = true;
      recharges = data.map(mapRechargeFromDB);
      data.forEach(row => {
        remoteRechargesMap[row.id] = true;
      });
    }
  } catch (e) {
    console.error("Recharges fetch exception:", e);
  }

  // Upload local-only recharges
  const localOnlyRecharges = localRecharges.filter(r => r.id && !remoteRechargesMap[r.id]);
  if (localOnlyRecharges.length > 0) {
    console.log(`[Sync] Pushing ${localOnlyRecharges.length} local-only recharges to Supabase...`);
    try {
      const rows = localOnlyRecharges.map(mapRechargeToDB);
      await supabase.from('recharges').upsert(rows);
    } catch (err) {
      console.error("[Sync] Recharges upload execution error:", err);
    }
  }

  // 3. Fetch Withdrawals
  const remoteWithdrawalsMap: Record<string, boolean> = {};
  try {
    const { data, error } = await supabase.from('withdrawals').select('*').order('date', { ascending: false });
    if (error) {
      console.error("Withdrawals table fetch failed:", error.message);
    } else if (data) {
      workedAtLeastOne = true;
      withdrawals = data.map(mapWithdrawalFromDB);
      data.forEach(row => {
        remoteWithdrawalsMap[row.id] = true;
      });
    }
  } catch (e) {
    console.error("Withdrawals fetch exception:", e);
  }

  // Upload local-only withdrawals
  const localOnlyWithdrawals = localWithdrawals.filter(w => w.id && !remoteWithdrawalsMap[w.id]);
  if (localOnlyWithdrawals.length > 0) {
    console.log(`[Sync] Pushing ${localOnlyWithdrawals.length} local-only withdrawals to Supabase...`);
    try {
      const rows = localOnlyWithdrawals.map(mapWithdrawalToDB);
      await supabase.from('withdrawals').upsert(rows);
    } catch (err) {
      console.error("[Sync] Withdrawals upload execution error:", err);
    }
  }

  // 4. Fetch History
  const remoteHistoryMap: Record<string, boolean> = {};
  try {
    const { data, error } = await supabase.from('history').select('*').order('date', { ascending: false });
    if (error) {
      console.error("History table fetch failed:", error.message);
    } else if (data) {
      workedAtLeastOne = true;
      history = data.map(mapHistoryFromDB);
      data.forEach(row => {
        remoteHistoryMap[row.id] = true;
      });
    }
  } catch (e) {
    console.error("History fetch exception:", e);
  }

  // Upload local-only history items
  const localOnlyHistory = localHistory.filter(h => h.id && !remoteHistoryMap[h.id]);
  if (localOnlyHistory.length > 0) {
    console.log(`[Sync] Pushing ${localOnlyHistory.length} local-only history items to Supabase...`);
    try {
      const rows = localOnlyHistory.map(mapHistoryToDB);
      await supabase.from('history').upsert(rows);
    } catch (err) {
      console.error("[Sync] History items upload execution error:", err);
    }
  }

  if (workedAtLeastOne) {
    return {
      users: usersMap,
      recharges,
      withdrawals,
      history
    };
  }

  return null;
}

/**
 * Upsert user to Supabase
 */
export async function upsertUserToSupabase(user: User) {
  if (!supabase) return;
  try {
    const row = mapUserToDB(user);
    const { error } = await supabase.from('users').upsert(row);
    if (error) {
      console.error("Error upserting user:", error.message);
      checkRlsError(error);
    }
  } catch (err) {
    console.error("upsertUserToSupabase error:", err);
  }
}

/**
 * Upsert recharge request to Supabase
 */
export async function upsertRechargeToSupabase(req: RechargeRequest) {
  if (!supabase) return;
  try {
    const row = mapRechargeToDB(req);
    const { error } = await supabase.from('recharges').upsert(row);
    if (error) console.error("Error upserting recharge:", error.message);
  } catch (err) {
    console.error("upsertRechargeToSupabase error:", err);
  }
}

/**
 * Upsert withdrawal request to Supabase
 */
export async function upsertWithdrawalToSupabase(req: WithdrawRequest) {
  if (!supabase) return;
  try {
    const row = mapWithdrawalToDB(req);
    const { error } = await supabase.from('withdrawals').upsert(row);
    if (error) console.error("Error upserting withdrawal:", error.message);
  } catch (err) {
    console.error("upsertWithdrawalToSupabase error:", err);
  }
}

/**
 * Upsert history entry to Supabase
 */
export async function upsertHistoryToSupabase(item: HistoryItem) {
  if (!supabase) return;
  try {
    const row = mapHistoryToDB(item);
    const { error } = await supabase.from('history').upsert(row);
    if (error) console.error("Error upserting history:", error.message);
  } catch (err) {
    console.error("upsertHistoryToSupabase error:", err);
  }
}

/**
 * Upsert referral relationship to Supabase (Referral Track Table)
 */
export async function upsertReferralToSupabase(id: string, referrerPhone: string, referredPhone: string, level: string, date: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('referrals').upsert({
      id,
      referrer_phone: referrerPhone,
      referred_phone: referredPhone,
      level,
      date
    });
    if (error) {
      console.warn("Could not insert referral log into Supabase (referrals table may need SQL query):", error.message);
    }
  } catch (err) {
    console.error("upsertReferralToSupabase error:", err);
  }
}

/**
 * Synchronize complete registration sequence in proper order:
 * 1. Upsert optional stub referrer user
 * 2. Upsert newly registered user
 * 3. Upsert welcome bonus history item
 * 4. Upsert referral line to satisfy constraints
 */
export async function syncRegistrationToSupabase(newUser: User, bonusHistory: HistoryItem, stubReferrer?: User) {
  if (!supabase) return;
  try {
    // 1. If there's a stub referrer, we must upsert it FIRST so foreign keys are satisfied!
    if (stubReferrer) {
      const rowStub = mapUserToDB(stubReferrer);
      const { error: stubErr } = await supabase.from('users').upsert(rowStub);
      if (stubErr) {
        console.error("Error upserting stub referrer:", stubErr.message);
        checkRlsError(stubErr);
      }
    }

    // 2. Upsert the new registered user
    const rowUser = mapUserToDB(newUser);
    const { error: userErr } = await supabase.from('users').upsert(rowUser);
    if (userErr) {
      console.error("Error upserting new user:", userErr.message);
      checkRlsError(userErr);
    }

    // 3. Insert welcome bonus history item
    const rowHist = mapHistoryToDB(bonusHistory);
    const { error: histErr } = await supabase.from('history').upsert(rowHist);
    if (histErr) console.error("Error upserting registration history bonus:", histErr.message);

    // 4. Finally, insert the referral line
    if (newUser.referredBy) {
      const refLogId = "R-" + Math.random().toString(36).substr(2, 9).toUpperCase();
      const { error: refErr } = await supabase.from('referrals').upsert({
        id: refLogId,
        referrer_phone: normalizePhoneTo10Digits(newUser.referredBy),
        referred_phone: normalizePhoneTo10Digits(newUser.phone),
        level: 'A',
        date: newUser.registeredAt
      });
      if (refErr) {
        console.warn("Could not insert referral log into Supabase referrals table:", refErr.message);
      }
    }
  } catch (err) {
    console.error("syncRegistrationToSupabase error:", err);
  }
}

/**
 * Perform direct real-time diagnostic checks on the Supabase connection quality and tables.
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  hasTables: boolean;
  error: string | null;
}> {
  if (!supabase) {
    return { connected: false, hasTables: false, error: "Base de datos (Supabase) no inicializada. Revisa URL/Clave." };
  }
  try {
    const { data, error } = await supabase.from('users').select('phone').limit(1);
    if (error) {
      const msg = error.message;
      if (msg.includes("Could not find the table") || msg.includes("does not exist") || error.code === "P0001" || msg.includes("relation \"public.users\" does not exist")) {
        return { connected: true, hasTables: false, error: "Tablas inexistentes. Ejecuta el script SQL en el SQL Editor de tu consola de Supabase." };
      }
      return { connected: false, hasTables: false, error: msg };
    }
    return { connected: true, hasTables: true, error: null };
  } catch (err: any) {
    return { connected: false, hasTables: false, error: err.message || String(err) };
  }
}



