import { RiderScorecard } from "../../types/rider.types";

export type RiderTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export class PerformanceEngine {
    calculateTier(scorecard: RiderScorecard): RiderTier {
        const { reliabilityScore, rating } = scorecard;

        if (reliabilityScore >= 95 && rating >= 4.8) return "PLATINUM";
        if (reliabilityScore >= 85 && rating >= 4.5) return "GOLD";
        if (reliabilityScore >= 70 && rating >= 4.0) return "SILVER";
        return "BRONZE";
    }

    getDispatchWeight(tier: RiderTier): number {
        switch (tier) {
            case "PLATINUM": return 1.5;
            case "GOLD": return 1.2;
            case "SILVER": return 1.1;
            default: return 1.0;
        }
    }

    updateScorecard(current: RiderScorecard, newDelivery: { onTime: boolean, accepted: boolean }): RiderScorecard {
        // Incremental update logic for rates
        return current;
    }
}
