export const getSummary = (content: any) => {
	const text = content.replace(/(<([^>]+)>)/gi, ''); // Loại bỏ HTML
	return text.length > 200 ? text.substring(0, 200) + '...' : text; // Cắt 100 ký tự
};

/**
 * Hàm chuyển đổi chuỗi thành slug.
 * @param value Chuỗi cần chuyển đổi.
 * @param delimiter Ký tự phân cách giữa các từ (mặc định là "-").
 * @returns Chuỗi slug đã chuyển đổi.
 */

export const generateSlug = (value: string, delimiter: string = '-'): string => {
	if (!value) return '';

	// Chuẩn hóa chuỗi, loại bỏ dấu tiếng Việt
	const slug = value
		.normalize('NFD') // Tách dấu khỏi chữ cái
		.replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
		.toLowerCase() // Chuyển thành chữ thường
		.replace(/\s+/g, delimiter) // Thay khoảng trắng bằng ký tự phân cách
		.replace(/[^a-z0-9-]/g, '') // Loại bỏ ký tự đặc biệt
		.replace(new RegExp(`${delimiter}{2,}`, 'g'), delimiter) // Loại bỏ ký tự phân cách dư thừa
		.replace(new RegExp(`^${delimiter}|${delimiter}$`, 'g'), ''); // Loại bỏ ký tự phân cách ở đầu và cuối

	return slug;
};
