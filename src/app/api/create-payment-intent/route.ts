import Stripe from 'stripe';
import prisma from '../../libs/prismadb';
import { CartProductType } from '@/app/(home)/product/[productId]/ProductDetails';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import crypto from 'crypto';
import https from 'https';
const nodemailer = require('nodemailer');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
	apiVersion: '2024-04-10',
});

const calculateOrderAmount = (items: CartProductType[]) => {
	const totalPrice = items.reduce((acc, item) => {
		const itemTotal = item.price * item.quantity;
		return acc + itemTotal;
	}, 0);
	return totalPrice;
};

export async function POST(request: Request): Promise<Response> {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { products, phoneNumber, address, payment_intent_id, shippingFee, paymentMethod } = body;

	const totalVND = calculateOrderAmount(products);

	const orderData = {
		user: { connect: { id: currentUser.id } },
		amount: totalVND,
		currency: 'vnd',
		status: 'pending',
		deliveryStatus: 'pending',
		paymentIntentId: payment_intent_id,
		products: products,
		phoneNumber: phoneNumber,
		address: address,
		shippingFee: shippingFee,
		paymentMethod: paymentMethod,
	};

	try {
		if (paymentMethod === 'stripe') {
			if (payment_intent_id) {
				const current_intent = await stripe.paymentIntents.retrieve(payment_intent_id);
				// Webhook
				if (current_intent && current_intent.status !== 'succeeded') {
					const updated_intent = await stripe.paymentIntents.update(payment_intent_id, { amount: totalVND });
					// Update order
					const existing_order = await prisma.order.findFirst({
						where: { paymentIntentId: payment_intent_id },
					});
					if (!existing_order) {
						return NextResponse.json({ error: 'Lỗi không tìm thấy đơn hàng trong db' }, { status: 404 });
					}
					await prisma.order.update({
						where: { paymentIntentId: payment_intent_id },
						data: {
							amount: totalVND,
							products: products,
						},
					});
					return NextResponse.json({ paymentIntent: updated_intent });
				}
			} else {
				// Create intent bên stripe
				const paymentIntent = await stripe.paymentIntents.create({
					amount: totalVND,
					currency: 'vnd',
					automatic_payment_methods: { enabled: true },
				});

				if (!paymentIntent || !paymentIntent.id) {
					return NextResponse.json({ error: 'Lỗi khi tạo thanh toán.' }, { status: 500 });
				}

				orderData.paymentIntentId = paymentIntent.id;
				// Tạo đơn hàng trong db
				const createdOrder = await prisma.order.create({
					data: orderData,
				});

				if (!createdOrder) {
					return NextResponse.json({ error: 'Lỗi khi tạo đơn hàng trong db.' }, { status: 500 });
				}

				// Gửi email xác nhận đơn hàng
				await sendEmail(currentUser.email, 'Bấm vào link kế bên để theo dỗi đơn hàng: ');

				return NextResponse.json({ paymentIntent });
			}
		} else if (paymentMethod === 'cod') {
			try {
				orderData.paymentIntentId = `${Date.now()}`;

				const createdOrder = await prisma.order.create({
					data: orderData,
				});

				if (!createdOrder) {
					return NextResponse.json({ error: 'Lỗi khi tạo đơn hàng trong db.' }, { status: 500 });
				}

				await sendEmail(currentUser.email, 'Bấm vào link kế bên để theo dỗi đơn hàng: ');

				return NextResponse.json({ createdOrder });
			} catch (error) {
				return NextResponse.json(
					{ error: 'Đã xảy ra lỗi khi xử lý đơn hàng hoặc gửi email.' },
					{ status: 500 }
				);
			}
		} else if (paymentMethod === 'momo') {
			orderData.paymentIntentId = `${Date.now()}`;
			const createdOrder = await prisma.order.create({
				data: orderData,
			});

			if (!createdOrder) {
				return NextResponse.json({ error: 'Lỗi khi tạo đơn hàng trong db.' }, { status: 500 });
			}

			// Gửi email xác nhận đơn hàng
			await sendEmail(currentUser.email, 'Bấm vào link kế bên để theo dõi đơn hàng: ');

			// Tạo thanh toán momo
			const accessKey = 'F8BBA842ECF85';
			const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
			const partnerCode = 'MOMO';
			const partnerName = 'Test';
			const storeId = 'MomoTestStore';
			const redirectUrl = 'localhost:3000/cart/orderconfirmation';
			const ipnUrl = 'localhost:3000/cart/orderconfirmation';
			const orderInfo = 'pay with MoMo';
			const requestType = 'payWithMethod';
			const amount = totalVND;
			const orderId = createdOrder.id;
			const requestId = orderId;
			const extraData = '';
			const orderGroupId = '';
			const autoCapture = true;
			const lang = 'vi';

			// Tạo raw signature
			const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

			// Tạo signature sử dụng HMAC SHA256
			const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

			// JSON object gửi đến MoMo endpoint
			const requestBody = JSON.stringify({
				partnerCode: partnerCode,
				partnerName: partnerName,
				storeId: storeId,
				requestId: requestId,
				amount: amount,
				orderId: orderId,
				orderInfo: orderInfo,
				redirectUrl: redirectUrl,
				ipnUrl: ipnUrl,
				lang: lang,
				requestType: requestType,
				autoCapture: autoCapture,
				extraData: extraData,
				orderGroupId: orderGroupId,
				signature: signature,
			});

			// Tùy chọn của request
			const options = {
				hostname: 'test-payment.momo.vn',
				port: 443,
				path: '/v2/gateway/api/create',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(requestBody),
				},
			};

			// Sử dụng Promises để thực hiện HTTPS request
			return new Promise((resolve, reject) => {
				const req = https.request(options, (res) => {
					let data = '';

					res.on('data', (chunk) => {
						data += chunk;
					});

					res.on('end', () => {
						const jsonResponse = JSON.parse(data);
						if (res.statusCode === 200) {
							resolve(NextResponse.json({ payUrl: jsonResponse.payUrl, createdOrder: createdOrder }));
						} else {
							resolve(NextResponse.json({ error: jsonResponse }, { status: res.statusCode }));
						}
					});
				});

				req.on('error', (e) => {
					reject(NextResponse.json({ error: e.message }, { status: 500 }));
				});

				// Gửi request body
				req.write(requestBody);
				req.end();
			});
		} else {
			// Đảm bảo trả về một Response nếu không khớp với bất kỳ paymentMethod nào
			return NextResponse.json({ error: 'Lỗi không chọn phương thức thanh toán' }, { status: 400 });
		}

		//Lỗi 500
		// Tạo thông báo nếu đặt hàng thành công
		// await prisma.notification.create({
		// 	data: {
		// 		userId: currentUser.id, // ID của người đặt hàng
		// 		productId: products.map((product: any) => product.productId),
		// 		type: 'ORDER_PLACED',
		// 		message: `Đơn hàng của bạn đã được đặt thành công`,
		// 	},
		// });
		return NextResponse.json({ error: 'Đơn hàng được tạo thành công' }, { status: 201 });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
function sendEmail(email: string, content: string) {
	try {
		// Cấu hình transporter
		const transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 587,
			secure: false,
			service: 'gmail',
			auth: {
				user: process.env.GMAIL_USER,
				pass: process.env.GMAIL_PASS,
			},
		});

		const redirectLink = `http://localhost:3000/account/orders`;

		const mailOptions = {
			from: process.env.GMAIL_USER,
			to: email,
			subject: 'Đặt hàng thành công từ ThanhHuy Store',
			text: `${content} ${redirectLink}`,
		};

		// Gửi email
		transporter.sendMail(mailOptions);
	} catch (error) {
		console.error('Lỗi khi gửi email:', error);
		throw new Error('Gửi email thất bại');
	}
}
