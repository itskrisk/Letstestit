import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * WELCOME SCREEN — "The Baseline Rule"
 * ─────────────────────────────────────────────────────────────
 * Motion concept:
 *  1. A thin horizontal rule draws across the full viewport — left → right.
 *  2. Letters of "Muncheez" rise one-by-one through that rule (clipped reveal).
 *  3. Blue dot springs in as punctuation.
 *  4. Two secondary rule-lines extend outward from center, framing the wordmark.
 *  5. "The 254 Selection" tagline slides up from below.
 *  6. Exit: letters drop back down, rule erases right → left. Clean cut.
 *
 * Design rules:
 *  – Pure flat #000000. No gradients. No glows. No breathing.
 *  – Single accent: brand blue #0277BD on the dot.
 *  – All animation driven by geometry and timing, not effects.
 */

interface WelcomeScreenProps {
    onComplete: () => void;
}

const LETTERS = 'Muncheez'.split('');
const EASE_OUT  = [0.16, 1, 0.3, 1]   as const;
const EASE_IN   = [0.7,  0, 0.84, 0]  as const;
const SPRING    = [0.34, 1.56, 0.64, 1] as const;

// ── Timing constants (seconds) ──────────────────────────────────
const RULE_DRAW      = 0.55;   // how long the baseline rule takes to draw
const LETTER_START   = 0.42;   // when letters start rising (just before rule finishes)
const LETTER_STAGGER = 0.058;  // gap between each letter
const DOT_OFFSET     = 0.08;   // extra pause after last letter before dot appears
const FRAME_DELAY    = 0.18;   // framing rules appear after wordmark settles
const TAGLINE_OFFSET = 0.22;   // tagline after framing rules start

const dotDelay     = LETTER_START + LETTERS.length * LETTER_STAGGER + DOT_OFFSET;
const frameDelay   = dotDelay + FRAME_DELAY;
const taglineDelay = frameDelay + TAGLINE_OFFSET;

const VISIBLE_SEC = 4.0;   // hold time before exit
const EXIT_SEC    = 0.75;  // exit animation duration

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [exiting,   setExiting]   = useState(false);

    useEffect(() => {
        const hold = setTimeout(() => {
            setExiting(true);
            // give the exit animations a head-start, then unmount
            setTimeout(() => {
                setIsVisible(false);
                setTimeout(onComplete, EXIT_SEC * 1000);
            }, 80);
        }, VISIBLE_SEC * 1000);
        return () => clearTimeout(hold);
    }, [onComplete]);

    // ── helper: letter animation props ──────────────────────────
    const letterAnim = (i: number) => ({
        initial: { y: '105%' },
        animate: { y: exiting ? '105%' : '0%' },
        transition: exiting
            ? { duration: 0.28, ease: EASE_IN,  delay: (LETTERS.length - 1 - i) * 0.025 }
            : { duration: 0.72, ease: EASE_OUT, delay: LETTER_START + i * LETTER_STAGGER },
    });

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                        background: '#000000',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        userSelect: 'none',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        transition: { duration: EXIT_SEC, ease: EASE_IN },
                    }}
                    transition={{ duration: 0.15 }}
                >

                    {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        BASELINE RULE
                        Draws left→right first. On exit erases right→left.
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            height: 1,
                            background: 'rgba(255,255,255,0.18)',
                            transformOrigin: exiting ? 'right center' : 'left center',
                        }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: exiting ? 0 : 1 }}
                        transition={
                            exiting
                                ? { duration: 0.45, ease: EASE_IN,  delay: 0.15 }
                                : { duration: RULE_DRAW, ease: EASE_OUT }
                        }
                    />

                    {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        WORDMARK ZONE
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

                        {/* Letters + dot */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.01em' }}>

                            {LETTERS.map((letter, i) => (
                                // overflow:hidden clips the letter — creates the "rise through the rule" illusion
                                <span key={i} style={{ display: 'inline-block', overflow: 'hidden', lineHeight: 1.05 }}>
                                    <motion.span
                                        {...letterAnim(i)}
                                        style={{
                                            display: 'inline-block',
                                            fontFamily: 'Outfit, sans-serif',
                                            fontWeight: 800,
                                            fontSize: 'clamp(48px, 9.5vw, 92px)',
                                            letterSpacing: '-0.04em',
                                            color: '#ffffff',
                                            lineHeight: 1.05,
                                        }}
                                    >
                                        {letter}
                                    </motion.span>
                                </span>
                            ))}

                            {/* Blue dot — springs in as the final punctuation mark */}
                            <span style={{ display: 'inline-block', overflow: 'hidden', lineHeight: 1.05 }}>
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: exiting ? 0 : 1, opacity: exiting ? 0 : 1 }}
                                    transition={
                                        exiting
                                            ? { duration: 0.15, ease: EASE_IN }
                                            : { duration: 0.5, ease: SPRING, delay: dotDelay }
                                    }
                                    style={{
                                        display: 'inline-block',
                                        fontFamily: 'Outfit, sans-serif',
                                        fontWeight: 800,
                                        fontSize: 'clamp(48px, 9.5vw, 92px)',
                                        letterSpacing: '-0.04em',
                                        color: '#0277BD',
                                        lineHeight: 1.05,
                                    }}
                                >
                                    .
                                </motion.span>
                            </span>
                        </div>

                        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            FRAMING RULES
                            Two thin lines extend outward from center after wordmark
                            settles — like a typographer placing rules above/below.
                        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                        <div style={{ position: 'relative', width: '100%', height: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/* Left arm */}
                            <motion.div
                                style={{
                                    position: 'absolute',
                                    right: '50%',
                                    top: 0,
                                    height: 1,
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.10)',
                                    transformOrigin: 'right center',
                                }}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: exiting ? 0 : 1 }}
                                transition={
                                    exiting
                                        ? { duration: 0.2, ease: EASE_IN }
                                        : { duration: 0.55, ease: EASE_OUT, delay: frameDelay }
                                }
                            />
                            {/* Right arm */}
                            <motion.div
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: 0,
                                    height: 1,
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.10)',
                                    transformOrigin: 'left center',
                                }}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: exiting ? 0 : 1 }}
                                transition={
                                    exiting
                                        ? { duration: 0.2, ease: EASE_IN }
                                        : { duration: 0.55, ease: EASE_OUT, delay: frameDelay }
                                }
                            />
                        </div>

                        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            TAGLINE
                        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                        <div style={{ overflow: 'hidden' }}>
                            <motion.p
                                initial={{ y: '100%', opacity: 0 }}
                                animate={{ y: exiting ? '100%' : '0%', opacity: exiting ? 0 : 1 }}
                                transition={
                                    exiting
                                        ? { duration: 0.2, ease: EASE_IN }
                                        : { duration: 0.85, ease: EASE_OUT, delay: taglineDelay }
                                }
                                style={{
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    fontWeight: 600,
                                    fontSize: 10,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.52em',
                                    color: 'rgba(255,255,255,0.32)',
                                    paddingRight: '0.52em', // compensate last-char tracking
                                    margin: 0,
                                }}
                            >
                                The 254 Selection
                            </motion.p>
                        </div>
                    </div>

                    {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        RING PROGRESS — bottom-right corner
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    <div style={{ position: 'absolute', bottom: 36, right: 36, zIndex: 10 }}>
                        <svg
                            width="26"
                            height="26"
                            viewBox="0 0 26 26"
                            fill="none"
                            style={{ transform: 'rotate(-90deg)', display: 'block' }}
                        >
                            <circle
                                cx="13" cy="13" r="11"
                                stroke="rgba(255,255,255,0.07)"
                                strokeWidth="1.5"
                            />
                            <motion.circle
                                cx="13" cy="13" r="11"
                                stroke="#0277BD"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeDasharray={69.115}   /* 2π × 11 */
                                initial={{ strokeDashoffset: 69.115 }}
                                animate={{ strokeDashoffset: 0 }}
                                transition={{ duration: VISIBLE_SEC, ease: 'linear' }}
                            />
                        </svg>
                    </div>

                    {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        INLINE FILM GRAIN — depth without glow
                        Very low opacity so it reads as texture not noise.
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    <svg
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, opacity: 0.032 }}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <filter id="fg">
                            <feTurbulence type="fractalNoise" baseFrequency="0.88" numOctaves="4" stitchTiles="stitch" />
                        </filter>
                        <rect width="100%" height="100%" filter="url(#fg)" />
                    </svg>

                </motion.div>
            )}
        </AnimatePresence>
    );
}
