import { PrismaClient } from '@prisma/client';

// tạo và xuất đối tượng Prisma Client để tương tác với cơ sở dữ liệu dựa trên cấu hình trong schema.prisma.
declare global {
	var prisma: PrismaClient | undefined;
}

const client = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = client;

export default client;
