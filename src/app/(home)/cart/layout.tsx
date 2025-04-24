import Link from 'next/link';
import CartTracking from './CartTracking';
import { MdArrowBack } from 'react-icons/md';
export const metadata = {
	title: 'Giỏ hàng của bạn - ThanhHuy Store',
};
export default async function CartLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex justify-center items-center flex-col">
			<div className="w-[430px] lg:w-[600px]">
				<Link href={'/'} className="text-[#1982F9] p-4 flex justify-start gap-2 items-center ">
					<MdArrowBack />
					<span>Mua thêm sản phẩm khác</span>
				</Link>
				<div className="flex justify-center items-center flex-col shadow-md  px-1">
					<div className="w-full p-2">
						<CartTracking />
					</div>
					{children}
				</div>
			</div>
		</div>
	);
}
