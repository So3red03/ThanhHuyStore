import Link from 'next/link';
import Container from '../Container';
import Categories from './Categories';
import { Redressed } from 'next/font/google';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getProductsNoCondition } from '@/app/actions/getProductsNoCondition';
import MobileNavbar from './MobileNavbar';
import { getArticles } from '@/app/actions/getArticlesData';
import SearchBarClient from './SearchBarClient';

const redressed = Redressed({ subsets: ['latin'], weight: ['400'] });

const Navbar = async () => {
	const currentUser = await getCurrentUser();
	const products = await getProductsNoCondition();
	const articles = await getArticles();
	return (
		<div className="sticky top-0 w-full bg-slate-200 z-30 shadow-sm">
			<div className="p-4 lg:px-0 border-b-[1px]">
				<Container>
					<div className="flex items-center justify-between lg:gap-3 gap-2">
						<Link
							href="/"
							className={`${redressed.className} whitespace-nowrap font-bold text-xl lg:text-3xl`}
						>
							ThanhHuy Store
						</Link>
						<div className="w-[50%]">
							<SearchBarClient products={products} articles={articles} />
						</div>
						<div className="w-[35%] flex justify-end">
							<MobileNavbar currentUser={currentUser} />
						</div>
					</div>
				</Container>
			</div>
			<Categories />
		</div>
	);
};

export default Navbar;
