import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Footer from '../../components/layout/Footer';

const team = [
  {
    name: 'Dean Ndere',
    title: 'Founder & CEO',
    note: 'Nairobi, KE',
    bio: 'Webbing the fabric of Nairobi\'s food scene into a digital tapestry. For Dean, this isn\'t just delivery — it\'s the new standard for speed, quality, and urban hospitality.',
  },
  {
    name: 'Kris Kamau',
    title: 'Co-Founder & CTO',
    note: 'Nairobi, KE',
    bio: 'Crafting the binary heartbeat of Muncheez. Architecting real-time dispatch, single-session security, and high-scale infrastructure built for the 254.',
  },
];

export default function OurTeam() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#0277BD', color: '#fff' }}
    >
      {/* ── Back ── */}
      <div className="px-8 md:px-16 pt-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 group"
          style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
        >
          <ArrowLeft size={13} strokeWidth={2} style={{ transition: 'transform 0.2s' }} className="group-hover:-translate-x-1" />
          Back
        </button>
      </div>

      {/* ── Hero ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 md:px-16 py-24 text-center">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '32px',
          }}
        >
          Muncheez Technologies Ltd.
        </motion.p>

        {/* Big heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="font-heading"
          style={{
            fontSize: 'clamp(3.5rem, 10vw, 9rem)',
            fontWeight: 200,
            letterSpacing: '-0.04em',
            lineHeight: 0.9,
            marginBottom: '48px',
          }}
        >
          The Team<span style={{ color: '#FACC15' }}>.</span>
        </motion.h1>

        {/* Thin rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '40px', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: '80px', transformOrigin: 'center' }}
        />

        {/* Team members — pure typography, no cards */}
        <div style={{ width: '100%', maxWidth: '720px' }}>
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{
                paddingTop: '48px',
                paddingBottom: '48px',
                borderTop: '1px solid rgba(255,255,255,0.12)',
                textAlign: 'left',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                alignItems: 'start',
              }}
            >
              {/* Left — Name + Title */}
              <div>
                <p
                  className="font-heading"
                  style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 300, letterSpacing: '-0.02em', marginBottom: '8px' }}
                >
                  {member.name}
                </p>
                <p
                  style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#FACC15', marginBottom: '4px' }}
                >
                  {member.title}
                </p>
                <p
                  style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}
                >
                  {member.note}
                </p>
              </div>

              {/* Right — Bio */}
              <p
                style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.8, color: 'rgba(255,255,255,0.65)', maxWidth: '340px' }}
              >
                {member.bio}
              </p>
            </motion.div>
          ))}

          {/* Bottom rule */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }} />
        </div>
      </div>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
