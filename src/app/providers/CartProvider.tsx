'use client';

// CartProvider is now just a wrapper - all logic moved to Zustand store
// Keeping for backward compatibility but no Context needed

interface CartProviderProps {
  children: React.ReactNode;
}

const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // No state management needed - Zustand handles everything
  return <>{children}</>;
};

export default CartProvider;
