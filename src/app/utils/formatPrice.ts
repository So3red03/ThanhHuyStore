export const formatPrice = (amount: any) => {
  // Handle null, undefined, NaN, or invalid values
  if (amount === null || amount === undefined || isNaN(amount) || amount === '') {
    return '0 ₫';
  }

  // Convert to number if it's a string
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Check again after conversion
  if (isNaN(numericAmount)) {
    return '0 ₫';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numericAmount);
};
