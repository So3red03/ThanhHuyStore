'use client';
interface FormWrapProps {
	children: React.ReactNode;
	custom?: string;
}
const FormWarp: React.FC<FormWrapProps> = ({ children, custom }) => {
	return (
		<div className={`min-h-fit h-full flex items-center justify-center pb-12 pt-24`}>
			<div
				className={`max-w-[650px] w-full ${custom} flex flex-col items-center shadow-xl rounded-md shadow-slate-200 p-4 md:p-8 gap-6`}
			>
				{children}
			</div>
		</div>
	);
};

export default FormWarp;
