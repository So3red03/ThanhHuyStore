'use client';

import { useCallback, useEffect, useState } from 'react';
import SelectImage from './SelectImage';
import Button from '../Button';
import { ImageType } from '@/app/(admin)/admin/manage-products/AddProductModal';

interface SelectColorProps {
	item: ImageType;
	addImageToState: (value: ImageType) => void;
	removeImageToState: (value: ImageType) => void;
	isProductCreated: boolean;
}

const SelectColor: React.FC<SelectColorProps> = ({ item, addImageToState, removeImageToState, isProductCreated }) => {
	const [isSelected, setIsSelected] = useState(false);
	const [files, setFiles] = useState<File[]>([]);

	useEffect(() => {
		if (isProductCreated) {
			setIsSelected(false);
			setFiles([]);
		}
	}, [isProductCreated]);

	const handleFileChange = useCallback((newFiles: File[]) => {
		setFiles((prevFiles) => [...prevFiles, ...newFiles]);
		newFiles.forEach((file) => {
			addImageToState({ ...item, image: [file] });
		});
	}, []);

	const handleCheck = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setIsSelected(e.target.checked);

		if (!e.target.checked) {
			setFiles([]);
			removeImageToState(item);
		}
	}, []);

	return (
		<div className="grid grid-cols-1 overflow-y-auto border-b-[1.2px] border-slate-200 items-center p-5">
			<div className="flex flex-col gap-2 justify-stretch-center h-auto">
				<div className="flex gap-2 items-center">
					<input
						id={item.color}
						type="checkbox"
						checked={isSelected}
						onChange={handleCheck}
						className="cursor-pointer"
					/>
					<label htmlFor={item.color} className="font-medium cursor-pointer">
						{item.color}
					</label>
				</div>
				<div>
					{isSelected && (
						<div className="col-span-2 text-center">
							<SelectImage item={item} handleFileChange={handleFileChange} />
						</div>
					)}
					{files.length > 0 && (
						<div className="flex flex-col gap-2 text-sm col-span-2 items-center">
							{files.map((file, index) => (
								<div key={index} className="flex flex-row gap-2 items-center justify-between">
									<img
										src={URL.createObjectURL(file)} // Tạo URL từ đối tượng file
										alt={`image-${index}`}
										className="w-16 h-16 object-contain"
									/>
									<div className="w-[70px]">
										<Button
											label="Remove"
											small
											outline
											onClick={() => {
												setFiles(files.filter((_, i) => i !== index));
												removeImageToState({ ...item, image: [file] });
											}}
										/>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SelectColor;
