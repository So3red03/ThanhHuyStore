'use client';

import { CartContextProvider } from '../hooks/useCart';

interface CartContextProvider {
	children: React.ReactNode;
}

const CartProvider: React.FC<CartContextProvider> = ({ children }) => {
	return <CartContextProvider>{children}</CartContextProvider>;
};

export default CartProvider;
