/**
 * Money Engine — Phase 4
 *
 * The financial core of Muncheez.
 * Implements double-entry wallet logic, automated rider payout calculation,
 * and cancellation/penalty logic — all as pure TypeScript functions.
 *
 * In production: these calculations run as PL/pgSQL triggers on Supabase,
 * fed by the `wallet_ledger` and `order_status_events` tables.
 * This service layer mirrors that logic client-side for the UI.
 */

// ─── Constants ─────────────────────────────────────────────────────────────
export const MUNCHEEZ_COMMISSION_RATE = 0.15;  // 15% platform cut
export const VAT_RATE = 0.16;                   // 16% VAT (Kenya)
export const MPESA_FEE_PER_TXN = 15;           // KES 15 per M-Pesa transaction
export const RIDER_BASE_FEE = 150;             // KES 150 flat base fee per delivery
export const RIDER_DISTANCE_BONUS = 30;        // KES 30 per KM
export const RIDER_PEAK_BONUS_MULTIPLIER = 1.15; // +15% during peak hours
export const CANCELLATION_PENALTY_RATE = 0.5;  // 50% base fee charged on late cancellation
export const RIDER_DROP_PENALTY = 200;          // KES 200 penalty for rider dropping order after pickup


// ─── Type Definitions ──────────────────────────────────────────────────────
export type LedgerEntryType = 'CREDIT' | 'DEBIT';
export type LedgerCategory =
    | 'ORDER_PAYMENT'
    | 'RIDER_PAYOUT'
    | 'MERCHANT_PAYOUT'
    | 'PLATFORM_COMMISSION'
    | 'VAT'
    | 'CANCELLATION_PENALTY'
    | 'RIDER_DROP_PENALTY'
    | 'REFUND'
    | 'MPESA_FEE';

export interface LedgerEntry {
    id: string;
    userId: string;
    orderId?: string;
    type: LedgerEntryType;
    category: LedgerCategory;
    amount: number;         // Always positive
    description: string;
    createdAt: Date;
    balanceAfter?: number;  // Running balance (for display)
}

export interface OrderFinancials {
    orderId: string;
    grossAmount: number;
    platformCommission: number;
    vatAmount: number;
    mpesaFee: number;
    riderPayout: number;
    merchantPayout: number;
    netPlatformRevenue: number;
}

export interface RiderPayoutBreakdown {
    baseFee: number;
    distanceBonus: number;
    peakBonus: number;
    total: number;
    isPeakHour: boolean;
    distanceKm: number;
}

export interface CancellationResult {
    penaltyAmount: number;
    penaltyDescription: string;
    shouldCharge: boolean;
    reason: string;
}

export interface WalletSummary {
    totalCredits: number;
    totalDebits: number;
    balance: number;
    pendingAmount: number;
    entries: LedgerEntry[];
}


// ─── Core Calculation Functions ─────────────────────────────────────────────

/**
 * Calculate all financial splits for a single order.
 * Implements the double-entry principle: every KES is accounted for.
 */
export function calculateOrderFinancials(
    grossAmount: number,
    distanceKm: number = 3,
    paymentMethod: 'MPESA' | 'CASH' | 'CARD' = 'MPESA'
): OrderFinancials {
    const platformCommission = grossAmount * MUNCHEEZ_COMMISSION_RATE;
    const vatAmount = grossAmount * VAT_RATE;
    const mpesaFee = paymentMethod === 'MPESA' ? MPESA_FEE_PER_TXN : 0;
    const riderPayout = calculateRiderPayout(distanceKm).total;
    const merchantPayout = grossAmount - platformCommission - vatAmount - mpesaFee;
    const netPlatformRevenue = platformCommission - riderPayout;

    return {
        orderId: '',
        grossAmount,
        platformCommission,
        vatAmount,
        mpesaFee,
        riderPayout,
        merchantPayout,
        netPlatformRevenue,
    };
}

/**
 * Calculate rider payout for a delivered order.
 * Logic: Base fee + Distance bonus + Optional peak hour bonus.
 * In production: triggered automatically on `DELIVERED` order event.
 */
export function calculateRiderPayout(
    distanceKm: number = 3,
    forceIsPeak: boolean = false
): RiderPayoutBreakdown {
    const hour = new Date().getHours();
    const isPeakHour = forceIsPeak || (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);

    const baseFee = RIDER_BASE_FEE;
    const distanceBonus = Math.round(distanceKm * RIDER_DISTANCE_BONUS);
    const subtotal = baseFee + distanceBonus;
    const peakBonus = isPeakHour ? Math.round(subtotal * (RIDER_PEAK_BONUS_MULTIPLIER - 1)) : 0;
    const total = subtotal + peakBonus;

    return { baseFee, distanceBonus, peakBonus, total, isPeakHour, distanceKm };
}

/**
 * Evaluate whether a cancellation should incur a penalty.
 * Rules:
 * - Before PREPARING: Free cancellation
 * - After PREPARING: 50% of base fee charged to customer
 * - After PICKED_UP: Not cancellable by customer; if Rider drops it = KES 200 rider penalty
 */
export function evaluateCancellationPenalty(
    orderStatus: string,
    initiatedBy: 'CUSTOMER' | 'RIDER' | 'MERCHANT' | 'ADMIN',
    orderTotal: number
): CancellationResult {
    // Admin/Merchant cancellations are always free
    if (initiatedBy === 'ADMIN' || initiatedBy === 'MERCHANT') {
        return {
            penaltyAmount: 0,
            penaltyDescription: 'No charge — cancelled by operator',
            shouldCharge: false,
            reason: 'Operational cancellation — no penalty applied.',
        };
    }

    // Customer cancellations
    if (initiatedBy === 'CUSTOMER') {
        if (['CREATED', 'PENDING'].includes(orderStatus)) {
            return {
                penaltyAmount: 0,
                penaltyDescription: 'Free cancellation (order not yet being prepared)',
                shouldCharge: false,
                reason: 'Order was cancelled before preparation began.',
            };
        }
        if (orderStatus === 'PREPARING') {
            const penalty = Math.round(RIDER_BASE_FEE * CANCELLATION_PENALTY_RATE);
            return {
                penaltyAmount: penalty,
                penaltyDescription: `Cancellation fee: KES ${penalty} (merchant has started preparing your order)`,
                shouldCharge: true,
                reason: 'Order cancelled after preparation started. 50% base fee applies.',
            };
        }
        if (['READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'DELIVERED'].includes(orderStatus)) {
            const penalty = Math.round(orderTotal * 0.3);
            return {
                penaltyAmount: penalty,
                penaltyDescription: `Late cancellation fee: KES ${penalty}`,
                shouldCharge: true,
                reason: 'Order is already in transit. 30% penalty applies.',
            };
        }
    }

    // Rider drop penalty
    if (initiatedBy === 'RIDER') {
        if (orderStatus === 'PICKED_UP') {
            return {
                penaltyAmount: RIDER_DROP_PENALTY,
                penaltyDescription: `Rider drop penalty: KES ${RIDER_DROP_PENALTY}`,
                shouldCharge: true,
                reason: `Rider dropped the order after pickup. KES ${RIDER_DROP_PENALTY} penalty applied.`,
            };
        }
    }

    return {
        penaltyAmount: 0,
        penaltyDescription: 'No charge',
        shouldCharge: false,
        reason: 'No penalty conditions met.',
    };
}

/**
 * Build a simulated wallet ledger from a list of orders.
 * In production this comes from `wallet_ledger` table in Supabase.
 */
export function buildWalletLedger(
    orders: any[],
    userId: string,
    role: 'merchant' | 'rider' | 'platform'
): WalletSummary {
    const entries: LedgerEntry[] = [];
    let runningBalance = 0;

    const sortedOrders = [...orders].sort(
        (a, b) => new Date(a.placedAt || 0).getTime() - new Date(b.placedAt || 0).getTime()
    );

    sortedOrders.forEach((order, index) => {
        const financials = calculateOrderFinancials(
            order.total,
            order.deliveryDistanceKm || 3,
            order.payment?.method || 'MPESA'
        );

        if (role === 'merchant') {
            if (['DELIVERED', 'COMPLETED'].includes(order.status)) {
                runningBalance += financials.merchantPayout;
                entries.push({
                    id: `tx_${order.id}_m`,
                    userId,
                    orderId: order.id,
                    type: 'CREDIT',
                    category: 'MERCHANT_PAYOUT',
                    amount: financials.merchantPayout,
                    description: `Order payout — #${order.id.slice(-6).toUpperCase()} (after 15% commission + VAT)`,
                    createdAt: new Date(order.placedAt || Date.now()),
                    balanceAfter: runningBalance,
                });
            }
        } else if (role === 'rider') {
            if (['DELIVERED', 'COMPLETED'].includes(order.status)) {
                const payout = calculateRiderPayout(order.deliveryDistanceKm || 3);
                runningBalance += payout.total;
                entries.push({
                    id: `tx_${order.id}_r`,
                    userId,
                    orderId: order.id,
                    type: 'CREDIT',
                    category: 'RIDER_PAYOUT',
                    amount: payout.total,
                    description: `Delivery payout — ${payout.distanceKm}km${payout.isPeakHour ? ' (Peak bonus applied)' : ''}`,
                    createdAt: new Date(order.placedAt || Date.now()),
                    balanceAfter: runningBalance,
                });
            }
        } else if (role === 'platform') {
            if (['DELIVERED', 'COMPLETED'].includes(order.status)) {
                runningBalance += financials.netPlatformRevenue;
                entries.push({
                    id: `tx_${order.id}_p`,
                    userId: 'platform',
                    orderId: order.id,
                    type: 'CREDIT',
                    category: 'PLATFORM_COMMISSION',
                    amount: financials.platformCommission,
                    description: `Commission — Order #${order.id.slice(-6).toUpperCase()} (15% of KES ${order.total})`,
                    createdAt: new Date(order.placedAt || Date.now()),
                    balanceAfter: runningBalance,
                });
            }
        }
    });

    const totalCredits = entries.filter(e => e.type === 'CREDIT').reduce((s, e) => s + e.amount, 0);
    const totalDebits = entries.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0);
    const balance = totalCredits - totalDebits;
    const pendingAmount = sortedOrders
        .filter(o => ['PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP'].includes(o.status))
        .reduce((s, o) => s + (role === 'rider' ? calculateRiderPayout(o.deliveryDistanceKm || 3).total : o.total * 0.69), 0);

    return {
        totalCredits,
        totalDebits,
        balance,
        pendingAmount,
        entries: entries.reverse(), // Most recent first
    };
}

/**
 * Format KES amount with locale formatting.
 */
export function formatKES(amount: number): string {
    return `KES ${Math.round(amount).toLocaleString('en-KE')}`;
}

/**
 * Check if current time is a peak hour.
 * Peak hours: 11am-2pm (lunch), 6pm-9pm (dinner).
 */
export function isPeakHour(): boolean {
    const hour = new Date().getHours();
    return (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);
}
