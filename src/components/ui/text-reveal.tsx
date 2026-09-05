import { motion, useInView, Variants } from 'framer-motion';
import { useRef } from 'react';

interface TextRevealProps {
    children: string;
    className?: string;
    delay?: number;
    duration?: number;
    type?: 'word' | 'char';
}

export function TextReveal({
    children,
    className = "",
    delay = 0,
    duration = 0.5,
    type = 'word'
}: TextRevealProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-10%" });

    const words = children.split(" ");
    const letters = children.split("");

    const container: Variants = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: type === 'word' ? 0.12 : 0.03, delayChildren: delay * i },
        }),
    };

    const child: Variants = {
        hidden: {
            opacity: 0,
            y: 20,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
            },
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
                duration: duration
            },
        },
    };

    if (type === 'word') {
        return (
            <motion.div
                ref={ref}
                style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25em' }} // gap for word spacing
                variants={container}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className={className}
            >
                {words.map((word, index) => (
                    <motion.span variants={child} key={index} className="inline-block relative">
                        {word}
                    </motion.span>
                ))}
            </motion.div>
        );
    }

    return (
        <motion.div
            ref={ref}
            variants={container}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className={className}
        >
            {letters.map((letter, index) => (
                <motion.span variants={child} key={index}>
                    {letter}
                </motion.span>
            ))}
        </motion.div>
    );
}
