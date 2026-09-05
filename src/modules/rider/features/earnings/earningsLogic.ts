import { EarningsBreakdown } from "../../types/rider.types";

export const calculateTotalEarnings = (breakdown: EarningsBreakdown): number => {
    return (
        breakdown.base +
        breakdown.distance +
        breakdown.surge +
        breakdown.tip +
        breakdown.bonus -
        breakdown.penalty
    );
};

export class EarningsStore {
    private dailyGross: number = 0;
    private history: EarningsBreakdown[] = [];

    addEarnings(entry: EarningsBreakdown) {
        this.history.push(entry);
        this.dailyGross += calculateTotalEarnings(entry);
    }

    getDailyGross(): number {
        return this.dailyGross;
    }

    getEarningRate(onlineHours: number): number {
        if (onlineHours <= 0) return 0;
        return this.dailyGross / onlineHours;
    }

    getHeatmapData() {
        // Logic for peak hour heatmap would go here
        return [];
    }
}
