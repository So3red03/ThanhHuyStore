import slugify from 'slugify';

export const slugConvert = (value: string) => {
	if (!value) return;
	return slugify(value, {
		lower: true,
		locale: 'vi',
		trim: true,
		strict: true,
	});
};
