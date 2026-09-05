import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface FadeInProps {
    children: React.ReactNode;
    delay?: number;
    className?: string;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    fullWidth?: boolean;
}

export function FadeIn({
    children,
    delay = 0,
    className = "",
    direction = 'up',
    fullWidth = false
}: FadeInProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const getInitialDirection = () => {
        switch (direction) {
            case 'up': return { y: 40, opacity: 0 };
            case 'down': return { y: -40, opacity: 0 };
            case 'left': return { x: 40, opacity: 0 };
            case 'right': return { x: -40, opacity: 0 };
            case 'none': return { opacity: 0 };
            default: return { y: 40, opacity: 0 };
        }
    };

    const width = fullWidth ? "100%" : "auto";

    return (
        <div ref={ref} style={{ width }} className={className}>
            <motion.div
                initial={getInitialDirection()}
                animate={isInView ? { y: 0, x: 0, opacity: 1 } : {}}
                transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
                {children}
            </motion.div>
        </div>
    );
}

export function StaggerContainer({ children, className = "", staggerDelay = 0.1 }: { children: React.ReactNode, className?: string, staggerDelay?: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial="hidden"
            animate={isInView ? "show" : "hidden"}
            variants={{
                hidden: {},
                show: {
                    transition: {
                        staggerChildren: staggerDelay
                    }
                }
            }}
        >
            {children}
        </motion.div>
    );
}

export const fadeInVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};
