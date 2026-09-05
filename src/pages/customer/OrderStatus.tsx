import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ChevronLeft, Package, Bike, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { orderService, riderLocationService } from '../../lib/supabaseService';
import { useAuth } from '../../context/AuthContext';
import OrderTrackingMap from '../../components/ui/shared/OrderTrackingMap';
import { supabase } from '../../lib/supabaseClient';

export default function OrderStatus() {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState<any>(null);
    const [merchant, setMerchant] = useState<any>(null);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrder();
        const timer = setTimeout(() => setProgress(35), 500);
        return () => clearTimeout(timer);
    }, [orderId]);

    const loadOrder = async () => {
        const result = await orderService.getOrder(orderId || '');
        if (result.data) {
            setOrder(result.data);
            // Load merchant info
            if (result.data.merchant_id) {
                const { data: merchantData } = await supabase
                    .from('merchants')
                    .select('*')
                    .eq('id', result.data.merchant_id)
                    .single();
                if (merchantData) {
                    setMerchant(merchantData);
                }
            }
        }
        setLoading(false);
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'CREATED': return 'Order Created';
            case 'PAYMENT_PENDING': return 'Awaiting Payment';
            case 'PAYMENT_CONFIRMED': return 'Payment Confirmed';
            case 'ACCEPTED': return 'Order Accepted';
            case 'PREPARING': return 'Preparing your order';
            case 'READY_FOR_PICKUP': return 'Ready for pickup';
            case 'RIDER_ASSIGNED': return 'Rider assigned';
            case 'PICKED_UP': return 'Picked up';
            case 'OUT_FOR_DELIVERY': return 'Out for delivery';
            case 'DELIVERED': return 'Delivered';
            case 'COMPLETED': return 'Completed';
            case 'CANCELLED': return 'Cancelled';
            default: return status;
        }
    };

    const getStatusIcon = (status: string) => {
        if (status === 'DELIVERED' || status === 'COMPLETED') {
            return <Package size={40} className="text-green-600" />;
        }
        if (status === 'CANCELLED') {
            return <Package size={40} className="text-red-600" />;
        }
        return <Package size={40} className="text-[#D4AF37]" />;
    };

    const showRider = order?.status === 'RIDER_ASSIGNED' || 
                      order?.status === 'PICKED_UP' || 
                      order?.status === 'OUT_FOR_DELIVERY' ||
                      order?.status === 'IN_TRANSIT';

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Order not found</h2>
                    <button onClick={() => navigate('/')} className="text-[#D4AF37] font-bold">
                        Go back home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-sans pb-12">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-xl transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="font-heading font-black tracking-tight">Order #{orderId?.slice(0, 8)}</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
                {/* Status Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-[2.5rem] p-8 shadow-[0_12px_48px_-12px_rgba(0,0,0,0.05)] text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
                        <motion.div
                            className="h-full bg-[#D4AF37]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                        />
                    </div>

                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ${
                        order.status === 'DELIVERED' || order.status === 'COMPLETED' 
                            ? 'bg-green-50 text-green-600 ring-green-50/50' 
                            : order.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-600 ring-red-50/50'
                            : 'bg-green-50 text-green-600 ring-green-50/50'
                    }`}>
                        {getStatusIcon(order.status)}
                    </div>

                    <h2 className="text-3xl font-heading font-black tracking-tighter mb-2">
                        {getStatusText(order.status)}
                    </h2>
                    <p className="text-gray-400 font-medium">
                        {order.status === 'PREPARING' && 'The kitchen is working on your magic.'}
                        {order.status === 'RIDER_ASSIGNED' && 'A rider is on the way to pick up your order.'}
                        {order.status === 'PICKED_UP' && 'Your order has been picked up!'}
                        {order.status === 'OUT_FOR_DELIVERY' && 'Your order is on its way!'}
                        {order.status === 'DELIVERED' && 'Your order has been delivered!'}
                        {order.status === 'CANCELLED' && 'This order has been cancelled.'}
                    </p>

                    {showRider && (
                        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-gray-50 py-3 rounded-xl mx-auto max-w-[200px]">
                            <MapPin size={16} className="text-[#D4AF37]" />
                            <span>Tracking live</span>
                        </div>
                    )}
                </motion.div>

                {/* Map Tracking */}
                {showRider && order.rider_id && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3 className="font-heading font-black text-xl px-2 mb-4">Live Tracking</h3>
                        <OrderTrackingMap
                            orderId={orderId || ''}
                            merchantLat={merchant?.lat}
                            merchantLng={merchant?.lng}
                            customerLat={order.delivery_lat}
                            customerLng={order.delivery_lng}
                        />
                    </motion.div>
                )}

                {/* Rider Card */}
                {showRider && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-[2rem] p-6 border border-gray-100 flex items-center gap-6"
                    >
                        <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center">
                            <Bike size={24} className="text-[#D4AF37]" />
                        </div>
                        <div>
                            <h3 className="font-heading font-black text-lg">Rider Assigned</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                {order.status === 'RIDER_ASSIGNED' && 'Heading to merchant'}
                                {order.status === 'PICKED_UP' && 'Picked up your order'}
                                {order.status === 'OUT_FOR_DELIVERY' && 'Delivering to you'}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Order Details */}
                <div className="space-y-6">
                    <h3 className="font-heading font-black text-xl px-2">Order Summary</h3>
                    <div className="bg-white rounded-[2rem] p-8 border border-gray-100">
                        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden">
                                {merchant?.logo_url && (
                                    <img src={merchant.logo_url} alt={merchant?.business_name} className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg leading-none mb-1">{merchant?.business_name}</h4>
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{merchant?.type}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {order.items?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <span className="font-bold text-gray-300">x{item.quantity}</span>
                                        <span className="font-bold text-gray-900">{item.name}</span>
                                    </div>
                                    <span className="font-medium text-gray-500">{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-100 flex justify-between items-center">
                            <span className="font-black text-xl">Total</span>
                            <span className="font-heading font-black text-2xl tracking-tight">KES {order.total?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8">
                    <button className="text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-[#D4AF37] transition-colors">
                        Need Help? Contact Support
                    </button>
                </div>
            </main>
        </div>
    );
}
