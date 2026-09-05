import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Product } from '../types/schema';
import { cartApi } from '../lib/api';

export interface CartItem extends Product {
  quantity: number;
  options?: string[];
  image?: string;
}

interface CartContextData {
  items: CartItem[];
  merchantId: string | null;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  loading: boolean;
}

const CartContext = createContext<CartContextData | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load cart from Supabase when user logs in
  useEffect(() => {
    const loadCart = async () => {
      if (!user) {
        // Load from localStorage for anonymous users
        const saved = localStorage.getItem('muncheez_cart_items');
        const savedMerchant = localStorage.getItem('muncheez_cart_merchantId');
        if (saved) setItems(JSON.parse(saved));
        if (savedMerchant) setMerchantId(savedMerchant);
        return;
      }

      setLoading(true);
      try {
        const cartResult = await cartApi.getCart();
        if (cartResult.data) {
          // Map CartItemData to CartItem
          const mappedItems: CartItem[] = (cartResult.data.items || []).map((item: any) => ({
            id: item.productId,
            merchantId: item.merchantId,
            name: item.name,
            description: item.description,
            price: item.price,
            imageUrl: item.image,
            isAvailable: item.isAvailable,
            categoryId: item.categoryId,
            tags: item.tags,
            preparationTimeMin: item.preparationTimeMin,
            stockLevel: item.stockLevel,
            vatRate: item.vatRate,
            quantity: item.quantity,
            options: item.options,
            image: item.image
          }));
          setItems(mappedItems);
          setMerchantId(cartResult.data.merchantId || null);
        } else {
          // No cart in Supabase, check localStorage
          const saved = localStorage.getItem('muncheez_cart_items');
          const savedMerchant = localStorage.getItem('muncheez_cart_merchantId');
          if (saved) setItems(JSON.parse(saved));
          if (savedMerchant) setMerchantId(savedMerchant);
        }
      } catch (error) {
        console.error('Failed to load cart:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user]);

  // Save cart to Supabase when user is logged in and cart changes
  useEffect(() => {
    if (!user || loading) return;

    const saveCart = async () => {
      try {
        if (items.length === 0) {
          await cartApi.clearCart();
        } else {
          await cartApi.updateCart({
            items: items.map(item => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
              name: item.name,
              image: item.imageUrl,
              merchantId: item.merchantId,
            })),
            merchantId: merchantId,
          });
        }
      } catch (error) {
        console.error('Failed to save cart:', error);
      }
    };

    // Debounce save
    const timeout = setTimeout(saveCart, 500);
    return () => clearTimeout(timeout);
  }, [items, merchantId, user, loading]);

  // Persist to localStorage as fallback
  useEffect(() => {
    localStorage.setItem('muncheez_cart_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (merchantId) localStorage.setItem('muncheez_cart_merchantId', merchantId);
    else localStorage.removeItem('muncheez_cart_merchantId');
  }, [merchantId]);

  const addItem = (product: Product, quantity: number = 1) => {
    // Enforce single-merchant cart (Nairobi operational reality)
    if (merchantId && merchantId !== product.merchantId) {
      if (window.confirm("Adding this item will clear your cart from the previous store. Proceed?")) {
        setItems([{ ...product, quantity }]);
        setMerchantId(product.merchantId);
      }
      return;
    }

    setMerchantId(product.merchantId);
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        // Stock Check for Retail
        if (product.stockLevel && existing.quantity >= product.stockLevel) {
          alert(`Sorry, only ${product.stockLevel} units left in stock.`);
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== productId) return item;
      const newQty = Math.max(0, item.quantity + delta);

      // Stock Check for Retail
      if (item.stockLevel && newQty > item.stockLevel) {
        alert(`Cannot exceed ${item.stockLevel} available units.`);
        return item;
      }
      return { ...item, quantity: newQty };
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (productId: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== productId);
      if (newItems.length === 0) setMerchantId(null);
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    setMerchantId(null);
    if (user) {
      cartApi.clearCart().catch(console.error);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      merchantId,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemCount,
      loading
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
