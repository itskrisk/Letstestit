import { RiderScorecard } from "../types/rider.types";
import { RiderTier } from "../features/performance/performanceLogic";

interface DispatchInput {
    distanceToPickupKm: number;
    riderScorecard: RiderScorecard;
    riderTier: RiderTier;
    zoneCongestionMultiplier: number;
    riderFatigueHours: number;
}

export class DispatchIntelligence {
    /**
     * Calculates a priority score for dispatching an order to a rider.
     * Lower score = Higher priority (closer to 0 is better).
     */
    calculateDispatchScore(input: DispatchInput): number {
        const {
            distanceToPickupKm,
            riderScorecard,
            riderTier,
            zoneCongestionMultiplier,
            riderFatigueHours,
        } = input;

        // Weights
        const W_DISTANCE = 0.5;
        const W_RELIABILITY = 0.3;
        const W_TIER = 0.2;

        // Proximity factor (raw distance)
        const distanceFactor = distanceToPickupKm * W_DISTANCE;

        // Reliability factor (inverse of reliability score)
        const reliabilityFactor = (1 - riderScorecard.reliabilityScore / 100) * W_RELIABILITY;

        // Tier multiplier (Platinum riders get a boost)
        const tierMultipliers: Record<RiderTier, number> = {
            PLATINUM: 0.8,
            GOLD: 0.9,
            SILVER: 1.0,
            BRONZE: 1.1,
        };
        const tierFactor = tierMultipliers[riderTier] * W_TIER;

        // Fatigue penalty (prevent burnout)
        const fatiguePenalty = riderFatigueHours > 8 ? (riderFatigueHours - 8) * 0.1 : 0;

        const baseScore = (distanceFactor + reliabilityFactor + tierFactor) * zoneCongestionMultiplier;

        return baseScore + fatiguePenalty;
    }
}
