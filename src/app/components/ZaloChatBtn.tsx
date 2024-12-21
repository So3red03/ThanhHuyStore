import Image from 'next/image';

const ZaloChatBtn = () => {
	return (
		<a
			href="https://zalo.me/0707887106"
			target="_blank"
			//Tối ưu về SEO
			rel="nofollow"
			className="flex items-center justify-center fixed bottom-12 right-[calc(50%-680px)] w-11 h-11 bg-blue-600 rounded-full shadow-none transform scale-100 z-10 animate-pulse-blue"
		>
			<Image
				src="https://file.hstatic.net/200000722513/file/icon_zalo__1__f5d6f273786c4db4a3157f494019ab1e.png"
				alt="ThanhHuy Store"
				width={44}
				height={44}
			/>
		</a>
	);
};

export default ZaloChatBtn;
