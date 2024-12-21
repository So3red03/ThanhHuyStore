import { categories } from '../../../../../utils/Categories';
import { slugConvert } from '../../../../../utils/Slug';

// export async function generateStaticParams() {
// 	// Lấy danh sách danh mục và mục con từ API hoặc database

// 	// Tạo params từ dữ liệu
// 	const params: any = [];
// 	for (const category of categories) {
// 		if (category.subItems) {
// 			category.subItems.forEach((subItem) => {
// 				params.push({
// 					category: slugConvert(category.value),
// 					subitem: slugConvert(subItem),
// 				});
// 			});
// 		}
// 	}
// 	return params;
// }

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
