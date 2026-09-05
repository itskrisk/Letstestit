import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Search, X, Home, Briefcase } from 'lucide-react';
import { useState } from 'react';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectLocation: (location: string) => void;
}

export default function LocationModal({ isOpen, onClose, onSelectLocation }: LocationModalProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Mock Saved Addresses
    const SAVED_PLACES = [
        { id: '1', name: 'Home', address: 'Riverside Drive, Nairobi', icon: Home },
        { id: '2', name: 'Work', address: 'Delta Towers, Westlands', icon: Briefcase },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200]"
                    />

                    {/* Modal Wrapper (Flex Centering to avoid Transform conflicts) */}
                    <div className="fixed inset-0 z-[201] flex items-center justify-center pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="w-[90%] max-w-[400px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 pointer-events-auto"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-heading font-bold text-gray-900 tracking-tight">
                                        Delivery Address
                                    </h2>
                                    <button
                                        onClick={onClose}
                                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                    >
                                        <X size={16} className="text-gray-500" />
                                    </button>
                                </div>

                                {/* Search Input */}
                                <div className="relative group mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search street, city, district..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#D4AF37] focus:bg-white transition-all text-sm font-medium"
                                        autoFocus
                                    />
                                </div>

                                {/* Current Location Action */}
                                <button
                                    onClick={() => onSelectLocation('Current Location')}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl bg-[#E8F5E9] hover:bg-[#C8E6C9] transition-all group mb-6"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[#00A082] flex items-center justify-center text-white shadow-sm">
                                        <Navigation size={14} className="fill-current" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-sm font-bold text-[#00A082]">Use Current Location</span>
                                        <span className="block text-[10px] text-gray-500 font-medium">Enable GPS for precision</span>
                                    </div>
                                </button>

                                {/* Saved Places */}
                                {SAVED_PLACES.length > 0 && (
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pl-2">Saved Addresses</span>
                                        <div className="grid gap-1">
                                            {SAVED_PLACES.map((place) => (
                                                <button
                                                    key={place.id}
                                                    onClick={() => onSelectLocation(place.address)}
                                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                        <place.icon size={14} />
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-bold text-gray-900">{place.name}</span>
                                                        <span className="block text-xs text-gray-500 font-medium">{place.address}</span>
                                                    </div>
                                                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {/* Pencil Icon or similar for edit */}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
