import bcrypt from 'bcryptjs';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Invoking data JSON from request
  const body = await request.json();
  const { name, email, password } = body;

  const hashedPassword = await bcrypt.hash(password, 10);
  // create new user in db by Prisma
  const user = await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword
    }
  });
  return NextResponse.json(user);
}
