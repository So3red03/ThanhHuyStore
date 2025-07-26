export const truncateText = (str: string, maxLength: number = 25) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};
export const truncateTextArticle = (str: string) => {
  if (str.length < 40) return str;
  return str.substring(0, 55) + '...';
};
