import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
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
    <div className="min-h-screen flex flex-col bg-[#4A90E2] text-white selection:bg-white selection:text-black">
      <Navbar />

      {/* ── Back ── */}
      <div className="px-6 md:px-16 pt-32">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white text-[11px] font-bold tracking-[0.3em] uppercase transition-colors group cursor-pointer"
        >
          <ArrowLeft size={14} strokeWidth={2} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
      </div>

      {/* ── Hero ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-16 py-20 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-[10px] font-bold tracking-[0.5em] uppercase text-white/80 mb-8"
        >
          Muncheez Technologies Ltd.
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="font-heading text-6xl sm:text-8xl md:text-9xl font-light tracking-tighter text-white leading-none mb-12"
        >
          The Team<span className="text-[#D4AF37]">.</span>
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-12 h-[1px] bg-white/40 mb-20 origin-center"
        />

        {/* Team members */}
        <div className="w-full max-w-4xl space-y-0">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="py-12 border-t border-white/20 text-left grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
            >
              <div>
                <p className="font-heading text-3xl sm:text-5xl font-light tracking-tight text-white mb-2">
                  {member.name}
                </p>
                <p className="text-xs font-bold tracking-[0.35em] uppercase text-[#D4AF37] mb-1">
                  {member.title}
                </p>
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/70">
                  {member.note}
                </p>
              </div>

              <p className="text-base font-light leading-relaxed text-white/90">
                {member.bio}
              </p>
            </motion.div>
          ))}
          <div className="border-t border-white/20" />
        </div>
      </div>

      <Footer />
    </div>
  );
}
