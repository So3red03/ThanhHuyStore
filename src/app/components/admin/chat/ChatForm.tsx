'use client';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { MdSend } from 'react-icons/md';
import Input from '../../inputs/Input';
import { useState } from 'react';

interface ChatFormProps {
	chatRoomId: string;
}

const ChatForm: React.FC<ChatFormProps> = ({ chatRoomId }) => {
	const [isLoading, setIsLoading] = useState(false);
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors }
	} = useForm<FieldValues>({
		defaultValues: {
			message: ''
		}
	});

	const onSubmit: SubmitHandler<FieldValues> = async data => {
		// Xóa rỗng input sau khi gửi
		setValue('message', '');

		try {
			setIsLoading(true);
			await axios.post('/api/messages', {
				...data,
				chatRoomId
			});
		} catch (error) {
			console.error('Error posting message:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(onSubmit)();
		}
	};

	return (
		<div className="py-2 px-4 border-t border-gray-300 w-full bg-[#F7F6FA] ">
			<div className="flex items-center gap-2 lg:gap-4">
				<Input
					id="message"
					placeholder="Nhập nội dung..."
					disabled={isLoading}
					register={register}
					errors={errors}
					onKeyDown={handleKeyDown}
					className="!border-slate-300 !focus:border-slate-300 !font-light !text-black !py-2 !px-4 !w-full !rounded-full !focus:outline-none"
					required
				/>
				<button
					onClick={handleSubmit(onSubmit)}
					className="rounded-full p-2 bg-[#16b1ff] cursor-pointer hover:bg-sky-600 transition"
				>
					<MdSend size={18} className="text-white" />
				</button>
			</div>
		</div>
	);
};

export default ChatForm;
