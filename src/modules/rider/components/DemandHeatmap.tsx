import { motion } from "framer-motion";
import { Zap, MapPin } from "lucide-react";

interface HeatZone {
    id: string;
    name: string;
    intensity: number;
    orders: number;
    coords: { x: number; y: number };
}

const ZONES: HeatZone[] = [
    { id: "1", name: "Westlands", intensity: 0.9, orders: 42, coords: { x: 30, y: 40 } },
    { id: "2", name: "Kilimani", intensity: 0.7, orders: 28, coords: { x: 60, y: 70 } },
    { id: "3", name: "CBD", intensity: 0.85, orders: 35, coords: { x: 50, y: 30 } },
    { id: "4", name: "Karen", intensity: 0.4, orders: 12, coords: { x: 20, y: 80 } },
    { id: "5", name: "Lavington", intensity: 0.6, orders: 18, coords: { x: 75, y: 45 } },
];

export default function DemandHeatmap() {
    return (
        <div className="bg-[#f0f2f5] rounded-[2.5rem] p-4 shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff] border border-white/40">
            <div className="px-4 py-3 flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Live Demand</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Nairobi Pulse</span>
                    </div>
                </div>
                <div className="p-2 rounded-2xl bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] text-[#D4AF37]">
                    <Zap size={16} />
                </div>
            </div>

            <div className="relative aspect-video bg-[#e6e9ef] rounded-[2rem] overflow-hidden shadow-[inset_8px_8px_16px_#cbd5e0,inset_-8px_-8px_16px_#ffffff]">
                {/* Simulated Grid */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                {/* Heat Zones */}
                {ZONES.map((zone) => (
                    <motion.div
                        key={zone.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${zone.coords.x}%`, top: `${zone.coords.y}%` }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className={`absolute inset-0 rounded-full blur-xl ${zone.intensity > 0.8 ? 'bg-orange-500' : 'bg-yellow-500'
                                }`}
                            style={{ width: `${80 * zone.intensity}px`, height: `${80 * zone.intensity}px`, marginLeft: `-${40 * zone.intensity}px`, marginTop: `-${40 * zone.intensity}px` }}
                        />
                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-md ${zone.intensity > 0.8 ? 'bg-orange-500' : 'bg-yellow-500'
                            }`} />
                    </motion.div>
                ))}

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="p-2 rounded-full bg-black text-white shadow-xl">
                        <MapPin size={14} fill="currentColor" />
                    </div>
                </div>
            </div>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
                {ZONES.map(zone => (
                    <div key={zone.id} className="flex-shrink-0 px-4 py-2 rounded-xl bg-[#f0f2f5] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] flex items-center gap-2 border border-white/20">
                        <div className={`w-1.5 h-1.5 rounded-full ${zone.intensity > 0.8 ? 'bg-orange-500' : 'bg-gray-300'}`} />
                        <span className="text-[9px] font-black uppercase text-gray-500">{zone.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
