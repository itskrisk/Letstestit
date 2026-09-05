-- ============================================================
-- ORDER STATE MACHINE
-- Enforces valid transitions at the database level
-- ============================================================

-- State transition rules: allowed transitions map
-- Format: current_status -> allowed_next_statuses
CREATE OR REPLACE FUNCTION public.can_transition_order(
    p_current_status TEXT,
    p_new_status TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Terminal states: no transitions allowed
    IF p_current_status IN ('DELIVERED', 'CANCELLED', 'REFUNDED') THEN
        RETURN FALSE;
    END IF;

    -- From CREATED
    IF p_current_status = 'CREATED' THEN
        RETURN p_new_status IN ('PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'CANCELLED');
    END IF;

    -- From PAYMENT_PENDING
    IF p_current_status = 'PAYMENT_PENDING' THEN
        RETURN p_new_status IN ('PAYMENT_CONFIRMED', 'CANCELLED', 'FAILED');
    END IF;

    -- From PAYMENT_CONFIRMED
    IF p_current_status = 'PAYMENT_CONFIRMED' THEN
        RETURN p_new_status IN ('ACCEPTED', 'CANCELLED', 'REFUND_PENDING');
    END IF;

    -- From ACCEPTED
    IF p_current_status = 'ACCEPTED' THEN
        RETURN p_new_status IN ('PREPARING', 'CANCELLED', 'REFUND_PENDING');
    END IF;

    -- From PREPARING
    IF p_current_status = 'PREPARING' THEN
        RETURN p_new_status IN ('READY_FOR_PICKUP', 'CANCELLED', 'REFUND_PENDING');
    END IF;

    -- From READY_FOR_PICKUP
    IF p_current_status = 'READY_FOR_PICKUP' THEN
        RETURN p_new_status IN ('RIDER_ASSIGNED', 'CANCELLED', 'REFUND_PENDING');
    END IF;

    -- From RIDER_ASSIGNED
    IF p_current_status = 'RIDER_ASSIGNED' THEN
        RETURN p_new_status IN ('PICKED_UP', 'CANCELLED', 'REFUND_PENDING');
    END IF;

    -- From PICKED_UP
    IF p_current_status = 'PICKED_UP' THEN
        RETURN p_new_status IN ('OUT_FOR_DELIVERY', 'CANCELLED', 'REFUND_PENDING');
    END IF;

    -- From OUT_FOR_DELIVERY
    IF p_current_status = 'OUT_FOR_DELIVERY' THEN
        RETURN p_new_status IN ('DELIVERED', 'CANCELLED', 'REFUND_PENDING');
    END IF;

    -- From REFUND_PENDING
    IF p_current_status = 'REFUND_PENDING' THEN
        RETURN p_new_status IN ('REFUNDED', 'PAYMENT_CONFIRMED');
    END IF;

    -- From FAILED
    IF p_current_status = 'FAILED' THEN
        RETURN p_new_status IN ('CREATED', 'PAYMENT_PENDING');
    END IF;

    -- Unknown state: deny
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to enforce state transitions
CREATE OR REPLACE FUNCTION public.enforce_order_state_transition()
RETURNS TRIGGER AS $$
DECLARE
    v_old_status TEXT;
BEGIN
    -- Only check on status change
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    v_old_status := OLD.status;

    -- Validate transition
    IF NOT public.can_transition_order(v_old_status, NEW.status) THEN
        RAISE EXCEPTION 'Invalid order state transition: % -> %', v_old_status, NEW.status;
    END IF;

    -- Auto-set timestamps based on status
    IF NEW.status = 'DELIVERED' AND NEW.delivered_at IS NULL THEN
        NEW.delivered_at := NOW();
    END IF;

    IF NEW.status = 'CANCELLED' AND NEW.cancelled_at IS NULL THEN
        NEW.cancelled_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to orders table
DROP TRIGGER IF EXISTS enforce_order_state_transition ON orders;
CREATE TRIGGER enforce_order_state_transition
    BEFORE UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_order_state_transition();

-- ============================================================
-- ORDER STATUS HISTORY AUTO-LOG
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_changed_by UUID;
BEGIN
    -- Get the current user ID from the session
    v_changed_by := auth.uid();

    -- If no authenticated user, use the customer_id as fallback
    IF v_changed_by IS NULL THEN
        v_changed_by := NEW.customer_id;
    END IF;

    INSERT INTO public.order_status_history (order_id, status, changed_by, note)
    VALUES (NEW.id, NEW.status, v_changed_by, 'Status changed from ' || OLD.status || ' to ' || NEW.status);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_order_status_change ON orders;
CREATE TRIGGER log_order_status_change
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION public.log_order_status_change();
