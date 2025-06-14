import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Tìm user và xóa danh mục đã mua (để không nhận email marketing nữa)
    const user = await prisma.user.findUnique({
      where: { email: decodeURIComponent(email) }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Xóa danh mục đã mua để không nhận email marketing
    await prisma.user.update({
      where: { id: user.id },
      data: { purchasedCategories: [] }
    });

    // Trả về trang HTML thông báo hủy đăng ký thành công
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hủy đăng ký thành công - ThanhHuy Store</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f4f4f4; 
            margin: 0; 
            padding: 20px; 
          }
          .container { 
            max-width: 600px; 
            margin: 50px auto; 
            background: white; 
            padding: 40px; 
            border-radius: 10px; 
            box-shadow: 0 0 20px rgba(0,0,0,0.1); 
            text-align: center; 
          }
          .success-icon { 
            font-size: 64px; 
            color: #27ae60; 
            margin-bottom: 20px; 
          }
          h1 { 
            color: #27ae60; 
            margin-bottom: 20px; 
          }
          .btn { 
            display: inline-block; 
            background: #3498db; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin-top: 20px; 
          }
          .btn:hover { 
            background: #2980b9; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>Hủy đăng ký thành công!</h1>
          <p>Bạn đã hủy đăng ký nhận email marketing từ ThanhHuy Store thành công.</p>
          <p>Chúng tôi sẽ không gửi email thông báo sản phẩm mới cho bạn nữa.</p>
          <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
          <a href="${process.env.NEXT_PUBLIC_API_URL}" class="btn">Quay về trang chủ</a>
        </div>
      </body>
      </html>
    `;

    return new Response(htmlResponse, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
