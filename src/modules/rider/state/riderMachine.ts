import { RiderPresence } from "../types/rider.types";

export const riderTransitions: Record<RiderPresence, RiderPresence[]> = {
    OFFLINE: ["ONLINE_IDLE"],
    ONLINE_IDLE: ["OFFER_RECEIVED", "OFFLINE", "ON_BREAK"],
    OFFER_RECEIVED: ["ASSIGNED", "ONLINE_IDLE"],
    ASSIGNED: ["ARRIVED_AT_PICKUP"],
    ARRIVED_AT_PICKUP: ["PICKED_UP"],
    PICKED_UP: ["EN_ROUTE"],
    EN_ROUTE: ["ARRIVED_AT_CUSTOMER"],
    ARRIVED_AT_CUSTOMER: ["COMPLETED"],
    COMPLETED: ["ONLINE_IDLE"],
    ON_BREAK: ["ONLINE_IDLE"],
    SUSPENDED: ["OFFLINE"], // Only admins can unsuspend but flow is back to offline
};

export class RiderStateMachine {
    private currentStatus: RiderPresence = "OFFLINE";

    constructor(initialStatus?: RiderPresence) {
        if (initialStatus) this.currentStatus = initialStatus;
    }

    getStatus(): RiderPresence {
        return this.currentStatus;
    }

    canTransitionTo(nextStatus: RiderPresence): boolean {
        const possibleTransitions = riderTransitions[this.currentStatus];
        return possibleTransitions.includes(nextStatus);
    }

    transitionTo(nextStatus: RiderPresence): boolean {
        if (this.canTransitionTo(nextStatus)) {
            this.currentStatus = nextStatus;
            console.log(`[RiderOS] Transitioned to ${nextStatus}`);
            return true;
        }
        console.error(`[RiderOS] Illegal transition: ${this.currentStatus} -> ${nextStatus}`);
        return false;
    }
}
