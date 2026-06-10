import { createClient } from '@supabase/supabase-js';
import { User, RechargeRequest, WithdrawRequest, HistoryItem } from '../types';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = (metaEnv.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY || "").trim();

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

// Helper to convert snake_case (Supabase) to camelCase (React/types) for users
function mapUserFromDB(row: any): User {
  return {
    phone: row.phone,
    password: row.password,
    balance: Number(row.balance),
    registeredAt: row.registered_at,
    referredBy: row.referred_by || undefined,
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
    phone: user.phone,
    password: user.password,
    balance: user.balance,
    registered_at: user.registeredAt,
    referred_by: user.referredBy || null,
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
    phone: row.phone,
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
    phone: req.phone,
    amount: req.amount,
    payment_method: req.paymentMethod,
    reference: req.reference,
    receipt_name: req.receiptName,
    receipt_url: req.receiptUrl || null,
    status: req.status,
    date: req.date
  };
}

// Helper for withdrawals mapping
function mapWithdrawalFromDB(row: any): WithdrawRequest {
  return {
    id: row.id,
    phone: row.phone,
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
    phone: req.phone,
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
    phone: row.phone,
    type: row.type as ('recarga' | 'retiro' | 'comision' | 'rendimiento' | 'bono'),
    amount: Number(row.amount),
    description: row.description,
    date: row.date
  };
}

function mapHistoryToDB(item: HistoryItem) {
  return {
    id: item.id,
    phone: item.phone,
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
 * Downloads the entire database from Supabase and populates our state
 */
export async function fetchFullStateFromSupabase(): Promise<{
  users: Record<string, User>;
  recharges: RechargeRequest[];
  withdrawals: WithdrawRequest[];
  history: HistoryItem[];
} | null> {
  if (!supabase) return null;

  try {
    const [usersRes, rechargesRes, withdrawalsRes, historyRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('recharges').select('*').order('date', { ascending: false }),
      supabase.from('withdrawals').select('*').order('date', { ascending: false }),
      supabase.from('history').select('*').order('date', { ascending: false })
    ]);

    if (usersRes.error) throw new Error("Users fetch: " + usersRes.error.message);
    if (rechargesRes.error) throw new Error("Recharges fetch: " + rechargesRes.error.message);
    if (withdrawalsRes.error) throw new Error("Withdrawals fetch: " + withdrawalsRes.error.message);
    if (historyRes.error) throw new Error("History fetch: " + historyRes.error.message);

    const usersMap: Record<string, User> = {};
    (usersRes.data || []).forEach(row => {
      usersMap[row.phone] = mapUserFromDB(row);
    });

    return {
      users: usersMap,
      recharges: (rechargesRes.data || []).map(mapRechargeFromDB),
      withdrawals: (withdrawalsRes.data || []).map(mapWithdrawalFromDB),
      history: (historyRes.data || []).map(mapHistoryFromDB)
    };
  } catch (err) {
    console.error("fetchFullStateFromSupabase error:", err);
    return null;
  }
}

/**
 * Upsert user to Supabase
 */
export async function upsertUserToSupabase(user: User) {
  if (!supabase) return;
  try {
    const row = mapUserToDB(user);
    const { error } = await supabase.from('users').upsert(row);
    if (error) console.error("Error upserting user:", error.message);
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
      if (stubErr) console.error("Error upserting stub referrer:", stubErr.message);
    }

    // 2. Upsert the new registered user
    const rowUser = mapUserToDB(newUser);
    const { error: userErr } = await supabase.from('users').upsert(rowUser);
    if (userErr) {
      console.error("Error upserting new user:", userErr.message);
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
        referrer_phone: newUser.referredBy.trim().replace(/\D/g, ''),
        referred_phone: newUser.phone.trim().replace(/\D/g, ''),
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


