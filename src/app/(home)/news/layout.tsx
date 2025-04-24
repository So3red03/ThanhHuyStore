import React from 'react';
import NewsMenu from '@/app/components/news/Menu';
import axios from 'axios';

export default async function NewsLayout({ children }: { children: React.ReactNode }) {
	const { data: articeCategory } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/articleCategory`);
	return (
		<div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row pb-10 lg:mt-5 mt-2 relative">
			<div className="lg:w-[20%] lg:pr-9 px-4 lg:px-0">
				<NewsMenu newsMenu={articeCategory} />
			</div>
			<div className="lg:w-[80%]">{children}</div>
		</div>
	);
}
