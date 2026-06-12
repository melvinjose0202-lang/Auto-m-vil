export interface VIPConfig {
  id: number;
  name: string;
  price: number;
  dailyYield: number; // e.g. 0.05 (5%)
  carName: string;
  carImageName: string; // descriptive image key or URL
  carCategory: string;
}

export interface User {
  phone: string;
  password?: string; // stored for demo
  balance: number;
  registeredAt: string;
  referredBy?: string; // phone of the referrer
  vips: number[]; // list of purchased VIP IDs (can't buy same VIP twice)
  totalRecharged: number;
  totalWithdrawn: number;
  registrationBonusClaimed: boolean;
  status: 'active' | 'suspended';
  isStub?: boolean; // temporary referral-placeholder account
  lastYieldClaimedAt?: string; // ISO string of last daily yield claim
}

export interface RechargeRequest {
  id: string;
  phone: string;
  amount: number;
  paymentMethod: string; // e.g. "Banco Popular", "Banreservas", "BHD", "USDT BEP20", "USDT TRC20"
  reference: string;
  receiptName: string; // status placeholder
  receiptUrl?: string; // uploaded image mock-up base64 or URL
  status: 'pendiente' | 'aprobado' | 'denegado';
  date: string;
}

export interface WithdrawRequest {
  id: string;
  phone: string;
  amount: number;
  netAmount: number;
  commission: number; // 12%
  status: 'pendiente' | 'completado' | 'cancelado';
  date: string;
  bankName?: string;
  accountNumber?: string;
  accountOwner?: string;
}

export interface HistoryItem {
  id: string;
  phone: string;
  type: 'recarga' | 'retiro' | 'comision' | 'rendimiento' | 'bono';
  amount: number;
  description: string;
  date: string;
}

export interface ReferralCommission {
  id: string;
  phone: string; // who earned it
  fromPhone: string; // who produced it
  level: 'A' | 'B' | 'C';
  amount: number; // calculated commission
  date: string;
}
