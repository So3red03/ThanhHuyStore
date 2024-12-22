'use client';

import { usePathname } from 'next/navigation';
import SearchBar from './SearchBar';
import SearchBarNews from '../news/SearchBarNews';

interface NavbarProps {
	products: any;
	articles: any;
}

const NavbarClient: React.FC<NavbarProps> = ({ products, articles }) => {
	const pathname = usePathname();
	const isNewsOrArticles = pathname?.startsWith('/news') || pathname?.startsWith('/article');

	return (
			isNewsOrArticles ? <SearchBarNews articles={articles} /> : <SearchBar products={products} />
	);
};

export default NavbarClient;
