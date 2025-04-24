import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { User } from '@prisma/client';
import { ChatRoomType } from '../../../types';

export function useOtherUser(conversation: ChatRoomType | { users: User[] }) {
	const { data: session } = useSession();

	const otherUser = useMemo(() => {
		if (!conversation) return null;

		const currentUserEmail = session?.user?.email;
		const otherUser = conversation.users.filter((user) => user.email !== currentUserEmail);

		return otherUser[0];
	}, [session?.user?.email, conversation]);

	return otherUser;
}
