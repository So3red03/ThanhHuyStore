import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new Response(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lỗi xác thực - ThanhHuy Store</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: center; max-width: 500px; }
            .error-icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #e74c3c; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; margin-bottom: 30px; }
            .button { display: inline-block; background: #0066CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; transition: all 0.3s ease; }
            .button:hover { background: #004499; transform: translateY(-2px); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">❌</div>
            <h1>Token không hợp lệ</h1>
            <p>Link xác thực không hợp lệ hoặc bị thiếu thông tin.</p>
            <a href="/" class="button">Về trang chủ</a>
          </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Tìm user với token xác thực
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date() // Token chưa hết hạn
        }
      }
    });

    if (!user) {
      return new Response(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Token hết hạn - ThanhHuy Store</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: center; max-width: 500px; }
            .warning-icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #f39c12; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; margin-bottom: 30px; }
            .button { display: inline-block; background: #0066CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; transition: all 0.3s ease; margin: 0 10px; }
            .button:hover { background: #004499; transform: translateY(-2px); }
            .button.secondary { background: #6c757d; }
            .button.secondary:hover { background: #5a6268; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="warning-icon">⏰</div>
            <h1>Token đã hết hạn</h1>
            <p>Link xác thực đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu gửi lại email xác thực.</p>
            <a href="/" class="button">Về trang chủ</a>
            <a href="/" class="button secondary">Đăng nhập</a>
          </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Kiểm tra nếu email đã được xác thực
    if (user.emailVerified) {
      return new Response(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email đã xác thực - ThanhHuy Store</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: center; max-width: 500px; }
            .info-icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #17a2b8; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; margin-bottom: 30px; }
            .button { display: inline-block; background: #0066CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; transition: all 0.3s ease; }
            .button:hover { background: #004499; transform: translateY(-2px); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="info-icon">ℹ️</div>
            <h1>Email đã được xác thực</h1>
            <p>Email của bạn đã được xác thực trước đó. Bạn có thể đăng nhập bình thường.</p>
            <a href="/" class="button">Đăng nhập ngay</a>
          </div>
        </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Xác thực email thành công
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    // Trả về trang thành công
    return new Response(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác thực thành công - ThanhHuy Store</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          .container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: center; max-width: 500px; }
          .success-icon { font-size: 64px; margin-bottom: 20px; animation: bounce 2s infinite; }
          @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } }
          h1 { color: #28a745; margin-bottom: 20px; }
          p { color: #666; line-height: 1.6; margin-bottom: 30px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; transition: all 0.3s ease; }
          .button:hover { background: #218838; transform: translateY(-2px); }
          .countdown { font-size: 14px; color: #6c757d; margin-top: 20px; }
        </style>
        <script>
          let countdown = 5;
          function updateCountdown() {
            document.getElementById('countdown').textContent = countdown;
            countdown--;
            if (countdown < 0) {
              window.location.href = '/';
            }
          }
          setInterval(updateCountdown, 1000);
        </script>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">🎉</div>
          <h1>Xác thực thành công!</h1>
          <p>
            Chúc mừng! Email của bạn đã được xác thực thành công.<br>
            Bây giờ bạn có thể đăng nhập và sử dụng đầy đủ các tính năng của ThanhHuy Store.
          </p>
          <a href="/" class="button">Đăng nhập ngay</a>
          <div class="countdown">
            Tự động chuyển hướng sau <span id="countdown">5</span> giây...
          </div>
        </div>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('Lỗi trong verify-email API:', error);
    return new Response(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lỗi server - ThanhHuy Store</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          .container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: center; max-width: 500px; }
          .error-icon { font-size: 64px; margin-bottom: 20px; }
          h1 { color: #dc3545; margin-bottom: 20px; }
          p { color: #666; line-height: 1.6; margin-bottom: 30px; }
          .button { display: inline-block; background: #0066CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; transition: all 0.3s ease; }
          .button:hover { background: #004499; transform: translateY(-2px); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">💥</div>
          <h1>Lỗi server</h1>
          <p>Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại sau.</p>
          <a href="/" class="button">Về trang chủ</a>
        </div>
      </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}
