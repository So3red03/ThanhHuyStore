export const getSummary = (content: any) => {
	const text = content.replace(/(<([^>]+)>)/gi, ''); // Loại bỏ HTML
	return text.length > 200 ? text.substring(0, 200) + '...' : text; // Cắt 100 ký tự
};
