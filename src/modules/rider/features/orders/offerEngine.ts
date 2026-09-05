import { OrderOffer } from "../../types/rider.types";

export class OrderOfferEngine {
    private activeOffers: Map<string, OrderOffer> = new Map();
    private timers: Map<string, NodeJS.Timeout> = new Map();

    createOffer(offer: OrderOffer, onExpiry: (id: string) => void) {
        this.activeOffers.set(offer.id, offer);

        const timeoutMs = offer.expiresAt.getTime() - Date.now();

        if (timeoutMs > 0) {
            const timer = setTimeout(() => {
                this.expireOffer(offer.id);
                onExpiry(offer.id);
            }, timeoutMs);
            this.timers.set(offer.id, timer);
        }
    }

    expireOffer(id: string) {
        this.activeOffers.delete(id);
        const timer = this.timers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(id);
        }
    }

    getOffer(id: string): OrderOffer | undefined {
        return this.activeOffers.get(id);
    }

    isOfferActive(id: string): boolean {
        return this.activeOffers.has(id);
    }
}
