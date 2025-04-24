interface BackDropProps {
	onClick: () => void;
}

const BackDrop: React.FC<BackDropProps> = ({ onClick }) => {
	return <div onClick={onClick} className="z-20 bg-slate-200 w-screen h-screen opacity-50 fixed top-0 left-0"></div>;
};

export default BackDrop;
