export default function SubItemPage({ params }: { params: { category: string; subCategory: string } }) {
	const { category, subCategory } = params;

	return (
		<div className="p-4">
			<h1 className="text-xl font-bold">Danh mục: {category}</h1>
			<h2 className="text-lg">Chi tiết: {subCategory}</h2>
			<p>
				Đây là trang hiển thị thông tin chi tiết về mục <b>{subCategory}</b> trong danh mục <b>{category}</b>.
			</p>
		</div>
	);
}
