import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ArrowRight,
    MapPin,
    CreditCard,
    Banknote,
    Smartphone,
    CheckCircle2
} from 'lucide-react';
import { customerApi, paymentApi } from '../../lib/api';

export default function CheckoutView() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { items, total, merchantId, clearCart, itemCount } = useCart();

    const [currentStep, setCurrentStep] = useState<'review' | 'delivery' | 'payment'>('review');
    const [isProcessing, setIsProcessing] = useState(false);
    const [merchant, setMerchant] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Form States
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryInstructions, setDeliveryInstructions] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'cash' | 'card'>('mpesa');
    const [phoneNumber, setPhoneNumber] = useState(profile?.phone || '');
    const [wantsCutlery, setWantsCutlery] = useState(false);

    // Load merchant data
    useEffect(() => {
        loadMerchant();
    }, [merchantId]);

    const loadMerchant = async () => {
        if (!merchantId) return;
        const result = await customerApi.getStore(merchantId);
        if (result.data) {
            setMerchant(result.data);
        }
        setLoading(false);
    };

    // Redirect if cart is empty
    useEffect(() => {
        if (itemCount === 0) {
            navigate('/c/stores');
        }
    }, [itemCount, navigate]);

    if (!merchant) return null;

    const deliveryFee = merchant.deliveryFee || 150;
    const finalTotal = total + deliveryFee;

    const handlePlaceOrder = async () => {
        setIsProcessing(true);

        try {
            if (!merchantId) {
                alert('No merchant selected');
                setIsProcessing(false);
                return;
            }

            // Create order via Supabase
            const orderResult = await customerApi.createOrder({
                merchantId: merchantId,
                items: items.map(i => ({
                    productId: i.id,
                    name: i.name,
                    quantity: i.quantity,
                    price: i.price,
                    options: []
                })),
                deliveryAddress: deliveryAddress || merchant?.address || '',
                paymentMethod: paymentMethod
            });

            if (orderResult.error) {
                alert(orderResult.error);
                setIsProcessing(false);
                return;
            }

            // If M-Pesa, initiate payment
            if (paymentMethod === 'mpesa' && orderResult.data?.id) {
                const paymentResult = await paymentApi.initiate(orderResult.data.id);
                if (paymentResult.error) {
                    alert('Payment initiation failed: ' + paymentResult.error);
                }
            }

            clearCart();
            navigate(`/order/${orderResult.data?.id}`);
        } catch (error) {
            alert('Failed to place order. Please try again.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-sans pb-32">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 px-6 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                    <h1 className="font-heading font-black text-lg tracking-tight">Checkout</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{merchant.businessName}</p>
                </div>
                <div className="w-10" />
            </header>

            <main className="pt-28 px-6 max-w-2xl mx-auto space-y-8">

                {/* Progress Steps */}
                <div className="flex items-center justify-between px-4 mb-8">
                    {['review', 'delivery', 'payment'].map((step, idx) => {
                        const steps = ['review', 'delivery', 'payment'];
                        const isActive = step === currentStep;
                        const isCompleted = steps.indexOf(step) < steps.indexOf(currentStep);

                        return (
                            <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300
                                    ${isActive ? 'bg-gray-900 text-white scale-110 shadow-lg' : isCompleted ? 'bg-[#39B54A] text-white' : 'bg-gray-100 text-gray-400'}
                                `}>
                                    {isCompleted ? <CheckCircle2 size={14} /> : idx + 1}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-gray-900' : 'text-gray-300'}`}>
                                    {step}
                                </span>
                            </div>
                        );
                    })}
                    {/* Progress Bar Background */}
                    <div className="absolute left-10 right-10 h-[2px] bg-gray-100 -z-0 top-[135px] max-w-xl mx-auto md:top-36" />
                </div>

                <AnimatePresence mode='wait'>
                    {currentStep === 'review' && (
                        <motion.div
                            key="review"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h2 className="text-2xl font-heading font-black tracking-tight">Order Summary</h2>
                            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 divide-y divide-gray-100">
                                {items.map(item => (
                                    <div key={item.id} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                                            <img src={item.imageUrl} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                                                <span className="font-bold text-sm">x{item.quantity}</span>
                                            </div>
                                            <p className="text-gray-400 text-xs mt-1">KES {item.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {merchant.type === 'Restaurant' && (
                                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">🍴</div>
                                        <div>
                                            <p className="font-bold text-sm">Cutlery Request</p>
                                            <p className="text-xs text-gray-400">Reduce plastic waste</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={wantsCutlery} onChange={e => setWantsCutlery(e.target.checked)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                                    </label>
                                </div>
                            )}

                            <button
                                onClick={() => setCurrentStep('delivery')}
                                className="w-full bg-gray-900 text-white h-16 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#D4AF37] transition-all flex items-center justify-center gap-2 group"
                            >
                                Continue to Delivery <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    )}

                    {currentStep === 'delivery' && (
                        <motion.div
                            key="delivery"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h2 className="text-2xl font-heading font-black tracking-tight">Delivery Details</h2>

                            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Delivery Location</label>
                                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 focus-within:ring-2 focus-within:ring-[#D4AF37]/20 transition-all">
                                        <MapPin size={20} className="text-[#D4AF37]" />
                                        <input
                                            type="text"
                                            value={deliveryAddress}
                                            onChange={e => setDeliveryAddress(e.target.value)}
                                            placeholder="Enter your delivery address (e.g. Westlands, Nairobi)"
                                            className="bg-transparent border-none text-sm font-bold w-full focus:ring-0 p-0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Delivery Instructions</label>
                                    <textarea
                                        value={deliveryInstructions}
                                        onChange={e => setDeliveryInstructions(e.target.value)}
                                        placeholder="e.g. Call when near, Leave at reception..."
                                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm font-medium focus:ring-[#D4AF37] focus:border-[#D4AF37] h-32 resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Number</label>
                                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 focus-within:ring-2 focus-within:ring-[#D4AF37]/20 transition-all">
                                        <Smartphone size={20} className="text-gray-400" />
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={e => setPhoneNumber(e.target.value)}
                                            className="bg-transparent border-none text-sm font-bold w-full focus:ring-0 p-0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setCurrentStep('payment')}
                                className="w-full bg-gray-900 text-white h-16 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#D4AF37] transition-all flex items-center justify-center gap-2 group"
                            >
                                Continue to Payment <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    )}

                    {currentStep === 'payment' && (
                        <motion.div
                            key="payment"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h2 className="text-2xl font-heading font-black tracking-tight">Payment Method</h2>

                            <div className="space-y-4">
                                <label className={`
                                    flex items-center gap-4 p-6 rounded-[2rem] border-2 cursor-pointer transition-all
                                    ${paymentMethod === 'mpesa' ? 'border-[#39B54A] bg-[#39B54A]/5' : 'border-gray-100 bg-white hover:border-gray-200'}
                                `}>
                                    <input type="radio" name="payment" value="mpesa" checked={paymentMethod === 'mpesa'} onChange={() => setPaymentMethod('mpesa')} className="sr-only" />
                                    <div className="w-12 h-12 rounded-xl bg-[#39B54A]/10 flex items-center justify-center text-[#39B54A]">
                                        <Smartphone size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg">M-Pesa Express</h3>
                                        <p className="text-xs text-gray-500 font-medium">Automatic STK Push to your phone</p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'mpesa' ? 'border-[#39B54A]' : 'border-gray-200'}`}>
                                        {paymentMethod === 'mpesa' && <div className="w-3 h-3 rounded-full bg-[#39B54A]" />}
                                    </div>
                                </label>

                                <label className={`
                                    flex items-center gap-4 p-6 rounded-[2rem] border-2 cursor-pointer transition-all
                                    ${paymentMethod === 'cash' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200'}
                                `}>
                                    <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="sr-only" />
                                    <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-gray-600">
                                        <Banknote size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg">Cash on Delivery</h3>
                                        <p className="text-xs text-gray-500 font-medium">Pay when the order arrives</p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-gray-900' : 'border-gray-200'}`}>
                                        {paymentMethod === 'cash' && <div className="w-3 h-3 rounded-full bg-gray-900" />}
                                    </div>
                                </label>
                            </div>

                            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 mt-8 space-y-3">
                                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    <span>KES {total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <span>Delivery Fee</span>
                                    <span>KES {deliveryFee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-2xl font-heading font-black text-gray-900 pt-4 border-t border-gray-100 uppercase tracking-tighter">
                                    <span>Total</span>
                                    <span>KES {finalTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={isProcessing}
                                className="w-full bg-gray-900 text-white h-20 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-[#D4AF37] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-gray-200 group"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing Payment...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Confirm Order</span>
                                        <CreditCard size={18} className="group-hover:scale-110 transition-transform" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
