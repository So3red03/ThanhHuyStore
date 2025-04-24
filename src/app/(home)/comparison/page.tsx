export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'So sánh các dòng Iphone - ThanhHuy Store',
};
const comparison = () => {
	return (
		<div style={{ height: '100vh', width: '100%' }}>
			<iframe
				src={'/comparison_iphone/iphone-16.html'}
				style={{ height: '100%', width: '100%', border: 'none' }}
				title="Embedded App"
			/>
		</div>
	);
};

export default comparison;
