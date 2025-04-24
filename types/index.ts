import { ChatRoom, Message, User } from '@prisma/client';

// Kiểu dữ liệu safeUser vẫn có các thuộc tính createAt, updateAt, và emailVerified, nhưng
// được định nghĩa lại với kiểu string thay vì kiểu gốc trong User.

// Định nghĩa lại các type để tránh lỗi nhận diện typescript vì đôi khi join các collection với nhau
// thì sẽ bị lỗi typescript
export type SafeUser = Omit<User, 'createAt' | 'updateAt' | 'emailVerified'> & {
	createAt: string;
	updateAt: string;
	emailVerified: string | null;
};

export type MessageType = Message & {
	sender: User;
	seen: User[];
};
export type ChatRoomType =
	| (ChatRoom & {
			users: User[];
			messages: MessageType[];
	  })
	| undefined;
