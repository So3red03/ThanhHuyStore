const ProductDetailsSkeletonLoader = () => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 animate-pulse">
			{/* Product Image Skeleton */}
			<div className="grid grid-cols-5 gap-2 h-full max-h-[300px] min-h-[300px] sm:min-h-[400px]">
				{/* Small Images Skeleton */}
				<div className="flex items-center justify-center flex-col gap-4 cursor-pointer border h-fit max-h-[350px] min-h-[150px] sm:min-h-[300px]">
					{[1, 2, 3, 4].map(index => (
						<div key={index} className="w-[50%] aspect-square bg-slate-300 rounded" />
					))}
				</div>
				{/* Large Image Skeleton */}
				<div className="col-span-3 relative aspect-square bg-slate-300 rounded" />
			</div>

			{/* Product Details Skeleton */}
			<div className="flex flex-col gap-1 text-slate-500 text-sm">
				{/* Title Skeleton */}
				<div className="h-8 bg-slate-300 w-3/4 rounded" />

				{/* Rating Skeleton */}
				<div className="flex items-center gap-2 mt-2">
					<div className="h-4 bg-slate-300 w-1/5 rounded" />
					<div className="h-4 bg-slate-300 w-16 rounded" />
				</div>

				{/* Divider Skeleton */}
				<div className="h-[1px] bg-slate-300 my-4" />

				{/* Price Skeleton */}
				<div className="h-6 bg-slate-300 w-1/4 rounded" />

				{/* Delivery Skeleton */}
				<div className="flex items-center gap-2 mt-4">
					<div className="h-4 w-4 bg-slate-300 rounded-full" />
					<div className="h-4 bg-slate-300 w-1/2 rounded" />
				</div>

				{/* Stock Status Skeleton */}
				<div className="flex items-center gap-2 mt-4">
					<div className="h-4 w-4 bg-slate-300 rounded-full" />
					<div className="h-4 bg-slate-300 w-1/3 rounded" />
				</div>

				{/* Set Color Skeleton */}
				<div className="mt-4 flex gap-2">
					{[1, 2, 3].map(index => (
						<div key={index} className="h-6 w-6 bg-slate-300 rounded-full" />
					))}
				</div>

				{/* Buttons Skeleton */}
				<div className="mt-5 space-y-4">
					<div className="h-10 bg-slate-300 w-full rounded" />
				</div>
			</div>
		</div>
	);
};

export default ProductDetailsSkeletonLoader;
