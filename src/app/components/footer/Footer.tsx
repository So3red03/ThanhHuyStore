import Link from 'next/link';
import Container from '../Container';
import FooterList from './FooterList';
import { MdFacebook } from 'react-icons/md';
import { AiFillTwitterCircle, AiFillInstagram, AiFillYoutube } from 'react-icons/ai';
import Image from 'next/image';

const Footer = () => {
	return (
		<footer className="bg-slate-200 text-slate-700 text-sm mt-16">
			<Container>
				<div className="flex flex-col md:flex-row justify-between pt-16 pb-8">
					<FooterList>
						<h3 className="font-bold text-base mb-2">Danh mục</h3>
						<Link href="/">iPhone</Link>
						<Link href="#">Mac</Link>
						<Link href="#">Desktop</Link>
						<Link href="#">Apple Watch</Link>
						<Link href="#">TV</Link>
						<Link href="#">Phụ Kiện</Link>
						<Link href="/news">Tin tức</Link>
					</FooterList>
					<FooterList>
						<h3 className="font-bold text-base mb-2">Thông Tin</h3>
						<Link href="#">Câu hỏi thường gặp</Link>
						<Link href="#">Về tôi</Link>
						<Link href="#">Hướng dẫn thanh toán</Link>
						<Link href="#">Chính sách giao hàng</Link>
						<Link href="#">Chính sách đổi trả</Link>
						<Link href="#">Chính sách bảo hành</Link>
						<Link href="#">Chương trình Trả góp</Link>
					</FooterList>
					<div className="w-full md:w-1/3 mb-6 md:mb-0">
						<h3 className="font-bold text-base mb-2">Liên hệ</h3>
						<p className="mb-2">
							Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quam fugiat ea, earum quod ipsa
							ipsam nemo illo ab dolore maiores at cum ullam qui cupiditate doloremque, minima animi est
							aliquid.
						</p>
						<p>&copy; {new Date().getFullYear()}Ecommerce Shop. All rights reserved</p>
					</div>
					<FooterList>
						<h3 className="font-bold text-base mb-2">Kết nối với ThanhHuy Store</h3>
						<div className="flex gap-2">
							<Link href="#">
								<MdFacebook size={24} />
							</Link>
							<Link href="#">
								<AiFillTwitterCircle size={24} />
							</Link>
							<Link href="#">
								<AiFillInstagram size={24} />
							</Link>
							<Link href="#">
								<AiFillYoutube size={24} />
							</Link>
						</div>
					</FooterList>
				</div>
				<div className="bg-slate-200 py-8 mt-8 border-t border-gray-300">
					<div className="container mx-auto px-4 flex flex-wrap justify-between items-center">
						<div className="flex items-center space-x-4">
							<h4 className="text-base font-light">KẾT NỐI VỚI CHÚNG TÔI</h4>
							<ul className="flex space-x-3">
								<li>
									<Link href="https://www.facebook.com/gearvnhcm">
										<Image
											src="https://file.hstatic.net/200000636033/file/facebook_1_0e31d70174824ea184c759534430deec.png"
											alt="ThanhHuyStore"
											width={33}
											height={33}
										/>
									</Link>
								</li>

								<li>
									<Link href="https://www.facebook.com/gearvnhcm">
										<Image
											src="https://file.hstatic.net/200000636033/file/youtube_1_d8de1f41ca614424aca55aa0c2791684.png"
											alt="ThanhHuyStore"
											width={33}
											height={33}
										/>
									</Link>
								</li>
								<li>
									<Link href="https://www.facebook.com/gearvnhcm">
										<Image
											src="https://file.hstatic.net/200000722513/file/icon_zalo__1__f5d6f273786c4db4a3157f494019ab1e.png"
											alt="ThanhHuyStore"
											width={33}
											height={33}
										/>
									</Link>
								</li>
								<li>
									<Link href="https://www.facebook.com/gearvnhcm">
										<Image
											src="https://file.hstatic.net/200000636033/file/group_1_54d23abd89b74ead806840aa9458661d.png"
											alt="ThanhHuyStore"
											width={33}
											height={33}
										/>
									</Link>
								</li>
								<li>
									<Link href="https://www.facebook.com/gearvnhcm">
										<Image
											src="https://file.hstatic.net/200000722513/file/tiktok-logo_fe1e020f470a4d679064cec31bc676e4.png"
											alt="ThanhHuyStore"
											width={33}
											height={33}
										/>
									</Link>
								</li>
							</ul>
						</div>

						<div>
							<Link href="http://online.gov.vn/Home/WebDetails/74686">
								<Image
									src="https://theme.hstatic.net/200000722513/1001090675/14/logo-bct.png?v=5911"
									alt="ThanhHuyStore"
									width={133}
									height={52}
								/>
							</Link>
						</div>
					</div>
				</div>
			</Container>
		</footer>
	);
};

export default Footer;
