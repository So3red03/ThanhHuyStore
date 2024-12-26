import React from 'react';

const SkeletonLoader = () => {
	return (
		<div className="cursor-pointer border-[1.2px] border-none bg-white rounded-sm p-2 transition text-center text-sm animate-pulse">
			<div className="flex flex-col items-center gap-1 w-full">
				<div className="aspect-square overflow-hidden relative w-full bg-gray-300" />
				<div className="mt-4 w-3/4 h-4 bg-gray-300 rounded" />
				<div className="w-1/2 h-4 bg-gray-300 rounded" />
				<div className="w-1/4 h-4 bg-gray-300 rounded" />
				<div className="w-1/3 h-4 bg-gray-300 rounded" />
			</div>
		</div>
	);
};

export default SkeletonLoader;
