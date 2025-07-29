1. Use case chi tiết quản lý đơn hàng
   ![1753716790373](image/format/1753716790373.png)
   Tên Use case
   Quản lý đơn hàng
   Actor Quản trị viên
   Mô tả Quản trị viên theo dõi, xử lý và cập nhật trạng thái các đơn hàng mà khách hàng đã đặt.
   Pre-conditions
   Post-conditions Success:
   Fail:
   Luồng sự kiện chính Quản trị viên chọn chức năng “Quản lý đơn hàng”.
   Hệ thống hiển thị danh sách đơn hàng của doanh nghiệp.
   Include Use Case Đăng nhập
   Extend Use Case Xem đơn hàng
   Extend Use Case Sửa trạng thái đơn hàng
   Luồng sự kiện phụ Quản trị viên thực hiện chức năng khác, hệ thống điều hướng sang giao diện tương ứng.
   <Extend Use Case>
   Xem đơn hàng Quản trị viên
   Actor chọn một đơn hàng cụ thể từ danh sách
   Hệ thống hiển thị chi tiết đơn hàng
   Actor có thể quay lại danh sách đơn hàng hoặc tiếp tục thao tác khác
   <Extend Use Case>
   Sửa trạng thái đơn hàng Quản trị viên
   Actor chọn một đơn hàng từ danh sách
   Actor nhấn nút "Cập nhật trạng thái"
   Hệ thống hiển thị các tùy chọn trạng thái đơn hàng
   Actor chọn trạng thái mới và xác nhận
   Hệ thống cập nhật trạng thái đơn hàng trong CSDL và hiển thị thông báo thành công
   <Include Use Case>
   Đăng nhập Quản trị viên
   Actor nhập thông tin vào form đăng nhập
   Actor nhấn nút "Đăng nhập"
   Hệ thống kiểm tra thông tin đăng nhập
   Nếu hợp lệ, chuyển đến giao diện quản lý đơn hàng
   Nếu không hợp lệ, hiển thị thông báo lỗi "Thông tin không đúng"

2. Sơ đồ tuần tự quản lý đơn hàng
   ![1753716837230](image/format/1753716837230.png)
   Lưu ý vẽ bằng plantuml

3. Sơ đồ hoạt động quản lý đơn hàng
   ![1753716865999](image/format/1753716865999.png)
   ![1753716869348](image/format/1753716869348.png)

Lưu ý vẽ bằng mermaid
