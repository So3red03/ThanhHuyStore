interface ContainerProps {
	children: React.ReactNode;
	custom?: string;
}

const Container: React.FC<ContainerProps> = ({ children, custom }) => {
	return <div className={`max-w-[1920px] mx-auto xl:px-20 md:px-2 px-4 ${custom}`}>{children}</div>;
};

export default Container;
