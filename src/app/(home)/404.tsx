import { FaArrowLeft } from 'react-icons/fa';

export default function NotFound() {
	return (
		<div className="mx-auto max-w-[540px] sm:max-w-[720px] md:max-w-[960px]">
			<div className="text-center p-5">
				<div className="flex flex-col items-center">
					<div>
						<h1 className="text-[50px] sm:text-[170px] leading-[150px] text-blue-500 font-[700]">404</h1>
						<p className="text-[1.125rem] font-semibold mb-4">
							Oops 😭, trang bạn tìm kiếm không được tìm thấy
						</p>
						<p className="mb-[1.5rem] w-[50%] opacity-[0.7] mx-auto">
							Xin lỗi vì sự bất tiện này, Trang bạn đang cố truy cập đã bị xóa hoặc không tồn tại.
						</p>
						<a
							className="hover:cursor-pointer mb-1 inline-flex items-center justify-center gap-2 rounded border border-transparent px-3 py-2 text-sm transition-all duration-150 ease-in-out bg-blue-600 hover:bg-blue-500 text-white font-semibold"
							href="/news"
						>
							<FaArrowLeft />
							Về trang chủ
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
