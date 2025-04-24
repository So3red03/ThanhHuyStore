interface HeadingProps {
	title: string;
	center?: boolean;
	children: React.ReactNode;
}

const Heading: React.FC<HeadingProps> = ({ title, center, children }) => {
	return (
		<div className={center ? 'text-center' : 'text-start'}>
			<h1 className="font-bold text-2xl">
				{title} {children}
			</h1>
		</div>
	);
};

export default Heading;
