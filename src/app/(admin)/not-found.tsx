export default function NotFound() {
	return (
		<div className="error-page">
			<div className="container text-defaulttextcolo dark:text-defaulttextcolor/70r text-defaultsize">
				<div className="text-center p-5 my-auto">
					<div className="flex items-center justify-center h-full !text-defaulttextcolor">
						<div className="xl:col-span-3" />
						<div className="xl:col-span-6 col-span-12">
							<p className="error-text sm:mb-0 mb-2">404</p>
							<p className="text-[1.125rem] font-semibold mb-4">
								Oops 😭, trang bạn tìm kiếm không được tìm thấy
							</p>
							<div className="flex justify-center items-center mb-[3rem]">
								<div className="xl:col-span-6 w-[50%]">
									<p className="mb-0 opacity-[0.7]">
										Xin lỗi vì sự bất tiện này, Trang bạn đang cố truy cập đã bị xóa hoặc không tồn
										tại.
									</p>
								</div>
							</div>
							<a
								className="ti-btn bg-slate-200 text-white font-semibold"
								href="/ynex-js-tailwind/preview/dashboards/crm/"
							>
								<i className="ri-arrow-left-line align-middle inline-block" />
								Trở về trang chủ
							</a>
						</div>
						<div className="xl:col-span-3" />
					</div>
				</div>
			</div>
		</div>
	);
}
