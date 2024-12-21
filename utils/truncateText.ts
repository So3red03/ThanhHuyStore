export const truncateText = (str: string) => {
	if (str.length < 25) return str;
	return str.substring(0, 25) + '...';
};
export const truncateTextArticle = (str: string) => {
	if (str.length < 40) return str;
	return str.substring(0, 55) + '...';
};
