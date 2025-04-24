import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
const nodemailer = require('nodemailer');
import crypto from 'crypto';

export async function POST(request: Request) {
	try {
		// Lấy dữ liệu JSON từ request
		const body = await request.json();
		const { email } = body;

		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (!existingUser) {
			return NextResponse.json({ message: 'Email không tồn tại' }, { status: 404 });
		}

		const token = crypto.randomBytes(32).toString('hex');
		const expires = new Date();
		expires.setMinutes(expires.getSeconds() + 30); // Token hết hạn sau 5 phút

		await prisma.user.update({
			where: { email: email },
			data: {
				resetPasswordToken: token,
				resetPasswordExpires: expires,
			},
		});

		// Gửi email
		try {
			// Cấu hình transporter
			const transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: process.env.GMAIL_USER,
					pass: process.env.GMAIL_PASS,
				},
			});

			const redirectLink = `http://localhost:3000/passwordrecovery/${existingUser.id}`;

			const mailOptions = {
				from: process.env.GMAIL_USER,
				to: email,
				subject: 'Thay đổi mật khẩu từ ThanhHuy Store',
				text: `Bấm vào link kế bên để đặt lại mật khẩu: ${redirectLink}`,
			};

			// Gửi email
			transporter.sendMail(mailOptions);
		} catch (error) {
			console.error('Lỗi khi gửi email:', error);
			throw new Error('Gửi email thất bại');
		}

		return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
	} catch (error) {
		console.error('Error sending email:', error);
		return NextResponse.json({ message: 'Failed to send email' }, { status: 500 });
	}
}
