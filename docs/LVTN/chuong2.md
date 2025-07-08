# [CHƯƠNG 2. PHƯƠNG PHÁP THỰC HIỆN]()

## [2.1 CÁC HỆ THỐNG TƯƠNG TỰ]()

Để hiểu rõ hơn về mô hình hoạt động và các chức năng cần thiết cho một website thương mại điện tử B2C, việc khảo sát một số hệ thống thương mại điện tử hiện có là rất cần thiết. Trong đó, Shopee và Lazada là hai nền tảng tiêu biểu với số lượng người dùng lớn, giao diện thân thiện và hệ thống chức năng phong phú. Việc phân tích hai hệ thống này giúp rút ra những điểm mạnh nên học hỏi và những hạn chế có thể khắc phục trong quá trình xây dựng hệ thống riêng.

### [2.1.1 Shopee]()

#### [2.1.1.1 Ưu điểm]()

Giao diện đơn giản, thân thiện với người dùng, dễ dàng tìm kiếm và lọc sản phẩm.

Hệ thống khuyến mãi đa dạng như mã giảm giá, voucher miễn phí vận chuyển, flash sale... giúp tăng tỉ lệ chuyển đổi.

Quy trình mua hàng mượt mà, hỗ trợ nhiều phương thức thanh toán (ví điện tử, thẻ ngân hàng, COD...).

Tính năng đánh giá và bình luận rõ ràng, giúp người mua đưa ra quyết định chính xác hơn.

Ứng dụng di động tối ưu tốt, đồng bộ trải nghiệm với phiên bản web.

#### [2.1.1.2 Nhược điểm]()

Việc quản lý sản phẩm và đơn hàng với số lượng lớn đôi khi gây khó khăn cho người bán nhỏ lẻ do giao diện quản trị chưa tối ưu.

Hệ thống bị quá tải trong các dịp khuyến mãi lớn dẫn đến tốc độ phản hồi chậm.

Thiếu tùy biến về giao diện cửa hàng cho từng người bán.

### [2.1.2 Lazada]()

#### [2.1.2.1 Ưu điểm]()

Hệ thống phân loại sản phẩm rõ ràng, hỗ trợ tìm kiếm theo bộ lọc chi tiết.

Giao diện chuyên nghiệp, cung cấp trải nghiệm người dùng tốt với nhiều tiện ích như live chat, gợi ý sản phẩm, lịch sử tìm kiếm.

Tích hợp tốt với các dịch vụ vận chuyển và thanh toán, cho phép theo dõi trạng thái đơn hàng chính xác.

Hệ thống quản lý người bán tương đối chi tiết, hỗ trợ nhiều báo cáo, thống kê.

#### [2.1.2.2 Nhược điểm]()

Tốc độ tải trang không thực sự tối ưu, nhất là trên các thiết bị cấu hình thấp.

Một số tính năng bị ẩn sâu trong giao diện, gây khó khăn cho người dùng mới.

Thời gian duyệt sản phẩm lâu hơn so với Shopee, làm chậm quá trình niêm yết hàng.

## [2.2 CÔNG NGHỆ SỬ DỤNG]()

### [2.2.1 VueJS]()

VueJS là một framework JavaScript phổ biến dùng để xây dựng giao diện người dùng (UI) và các ứng dụng web đơn trang (SPA). Với cấu trúc đơn giản, dễ học và khả năng mở rộng cao, VueJS hỗ trợ tổ chức mã nguồn rõ ràng thông qua các thành phần (components). VueJS cũng cung cấp khả năng tương tác mượt mà giữa người dùng và hệ thống, giúp tạo ra trải nghiệm người dùng tốt hơn trên cả máy tính và thiết bị di động.

So với ReactJS, VueJS có cú pháp dễ tiếp cận hơn, đặc biệt phù hợp với những người mới bắt đầu hoặc các dự án nhỏ đến trung bình. Bên cạnh đó, VueJS có tài liệu rõ ràng, tích hợp sẵn nhiều tính năng như binding hai chiều và hệ thống directive linh hoạt, giúp giảm thiểu việc cấu hình ban đầu và tăng tốc độ phát triển. Do đó, VueJS được lựa chọn cho đề tài này nhằm tối ưu thời gian phát triển, đồng thời đảm bảo khả năng mở rộng và bảo trì mã nguồn trong tương lai.

Bảng 2‑1. So sánh VueJS và ReactJS

| Tiêu chí             | VueJS                                        | ReactJS                                          |
| -------------------- | -------------------------------------------- | ------------------------------------------------ |
| Cú pháp              | Dễ tiếp cận, gần với HTML/CSS/JS             | JSX phức tạp hơn, cần hiểu sâu hơn về JavaScript |
| Khả năng học         | Thân thiện với người mới                     | Cần thời gian để làm quen                        |
| Tài liệu             | Chi tiết, dễ hiểu                            | Đầy đủ nhưng cần kết hợp nhiều nguồn             |
| Tính năng tích hợp   | Có sẵn hệ thống directive, binding hai chiều | Yêu cầu thêm thư viện ngoài như Redux            |
| Quản lý trạng thái   | Vuex                                         | Redux, Context API                               |
| Cộng đồng            | Đang phát triển                              | Lớn và hoạt động mạnh                            |
| Khả năng mở rộng     | Tốt với cấu trúc rõ ràng                     | Rất linh hoạt nhưng dễ gây phân mảnh             |
| Hiệu năng            | Tốt                                          | Tốt                                              |
| Khả năng tái sử dụng | Component-based                              | Component-based                                  |

### [2.2.2 NodeJS]()

NodeJS là môi trường chạy JavaScript phía máy chủ (server-side), cho phép xây dựng các ứng dụng mạng hiệu năng cao nhờ mô hình xử lý bất đồng bộ (asynchronous) và sự kiện (event-driven). NodeJS đặc biệt phù hợp với các ứng dụng thời gian thực và các hệ thống yêu cầu xử lý nhiều kết nối đồng thời, rất thích hợp để xây dựng các API cho hệ thống thương mại điện tử.

So với PHP, NodeJS có khả năng xử lý non-blocking tốt hơn, giúp cải thiện hiệu suất khi nhiều người dùng truy cập cùng lúc. Ngoài ra, việc sử dụng cùng một ngôn ngữ JavaScript cho cả frontend và backend giúp giảm độ phức tạp trong phát triển, đồng thời tăng tính thống nhất trong toàn bộ dự án. Do đó, NodeJS được lựa chọn trong đề tài nhằm tối ưu hiệu năng hệ thống, hỗ trợ mở rộng linh hoạt và tăng hiệu quả phát triển phần mềm.

### [2.2.3 ExpressJS]()

ExpressJS là một web framework nhẹ và linh hoạt cho NodeJS, giúp xây dựng các API và ứng dụng web một cách nhanh chóng. Express hỗ trợ định tuyến, middleware, và cấu trúc rõ ràng, giúp lập trình viên dễ dàng xây dựng backend RESTful để phục vụ các yêu cầu như đăng nhập, quản lý sản phẩm, đơn hàng, v.v.

### [2.2.4 MySQL]()

MySQL là hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) mã nguồn mở phổ biến. MySQL sử dụng ngôn ngữ SQL để quản lý và truy vấn dữ liệu, phù hợp với các ứng dụng yêu cầu tính nhất quán cao và dữ liệu có cấu trúc. Trong hệ thống thương mại điện tử, MySQL dùng để lưu trữ thông tin người dùng, sản phẩm, đơn hàng và các dữ liệu liên quan. So với MongoDB – một cơ sở dữ liệu NoSQL hướng tài liệu – MySQL đảm bảo tính toàn vẹn dữ liệu thông qua các ràng buộc quan hệ (foreign key, transaction…), giúp quản lý các mối liên kết chặt chẽ giữa các bảng dữ liệu như người dùng và đơn hàng, sản phẩm và danh mục. Ngoài ra, MySQL phù hợp hơn với các hệ thống có logic nghiệp vụ phức tạp, yêu cầu truy vấn quan hệ nhiều bảng và xử lý dữ liệu chặt chẽ. Do đó, MySQL được lựa chọn để đảm bảo tính ổn định, chính xác và hiệu quả trong quá trình vận hành hệ thống thương mại điện tử.

### [2.2.5 Prisma]()

Prisma là một công cụ ORM (Object Relational Mapping) hiện đại dành cho NodeJS giúp ánh xạ cơ sở dữ liệu sang đối tượng trong mã nguồn. Prisma hỗ trợ tạo truy vấn một cách an toàn, hiệu quả và rõ ràng, giúp giảm thiểu lỗi logic và tăng hiệu suất phát triển. Ngoài ra, Prisma còn hỗ trợ sinh tự động schema từ cơ sở dữ liệu có sẵn, thuận tiện cho việc chuyển đổi từ MySQL hiện tại sang hệ ORM.

So với Sequelize, Prisma có cú pháp trực quan, dễ đọc hơn và cung cấp hệ thống gợi ý mạnh mẽ nhờ tích hợp chặt chẽ với JavaScript, giúp phát hiện lỗi ngay trong quá trình lập trình. Đồng thời, Prisma có hiệu năng cao hơn trong các truy vấn phức tạp và cung cấp công cụ quản lý migration rõ ràng, dễ kiểm soát. Vì vậy, Prisma được lựa chọn nhằm tối ưu trải nghiệm lập trình, tăng độ tin cậy và dễ bảo trì trong quá trình phát triển hệ thống.

## [2.3 PHÂN TÍCH YÊU CẦU]()

### [2.3.1 Các quy trình nghiệp vụ]()

Hệ thống thương mại điện tử mô hình B2C bao gồm nhiều quy trình nghiệp vụ khác nhau nhằm phục vụ các vai trò chính như người mua (khách hàng), người bán (doanh nghiệp) và hệ thống vận hành. Các nghiệp vụ chính được triển khai bao gồm:

#### [2.3.1.1 Đăng ký và đăng nhập người dùng]()

Người dùng có thể đăng ký tài khoản với thông tin cơ bản (họ tên, email, mật khẩu, số điện thoại).

Sau khi đăng ký thành công, người dùng có thể đăng nhập vào hệ thống để sử dụng các chức năng như xem sản phẩm, đặt hàng, theo dõi đơn hàng.

#### [2.3.1.2 Đăng ký và đăng nhập doanh nghiệp]()

Các doanh nghiệp muốn sử dụng nền tảng để bán hàng cần thực hiện đăng ký tài khoản doanh nghiệp. Quá trình đăng ký yêu cầu cung cấp các thông tin như:

Tên doanh nghiệp hoặc tên cửa hàng

Email, số điện thoại liên hệ

Giấy phép kinh doanh hoặc thông tin xác thực khác (nếu có)

Địa chỉ cửa hàng hoặc trụ sở kinh doanh

Phê duyệt tài khoản:

Sau khi đăng ký, tài khoản doanh nghiệp cần được admin hệ thống xét duyệt trước khi có quyền đăng sản phẩm.

Sau khi được phê duyệt, doanh nghiệp có thể đăng nhập vào hệ thống để truy cập trang quản trị cửa hàng riêng.

Trang quản trị doanh nghiệp bao gồm:

Quản lý sản phẩm (thêm, sửa, xóa)

Quản lý đơn hàng, theo dõi trạng thái giao hàng

Quản lý tồn kho và giá bán

Theo dõi doanh thu và báo cáo đơn hàng

#### [2.3.1.3 Quản lý tài khoản người dùng]()

Người dùng có thể cập nhật thông tin cá nhân như địa chỉ giao hàng, số điện thoại.

Cho phép thay đổi mật khẩu hoặc khôi phục mật khẩu.

#### [2.3.1.4 Tìm kiếm và xem chi tiết sản phẩm]()

Người dùng có thể tìm kiếm sản phẩm theo tên, danh mục, mức giá...

Trang chi tiết sản phẩm hiển thị thông tin mô tả, giá bán, đánh giá, hình ảnh và các tùy chọn (màu sắc, kích thước...).

#### [2.3.1.5 Giỏ hàng và đặt hàng]()

Người dùng có thể thêm sản phẩm vào giỏ hàng và điều chỉnh số lượng.

Quy trình đặt hàng gồm: chọn địa chỉ giao hàng, phương thức thanh toán, xác nhận đơn hàng.

#### [2.3.1.6 Quản lý đơn hàng]()

Người dùng có thể theo dõi trạng thái đơn hàng: đã đặt, đang xử lý, đang giao, hoàn thành, hủy.

Người quản trị có thể xác nhận đơn, cập nhật trạng thái giao hàng, hoặc xử lý hoàn/hủy đơn hàng.

#### [2.3.1.7 Quản lý sản phẩm]()

Admin có thể thêm mới, chỉnh sửa, xóa sản phẩm.

Mỗi sản phẩm bao gồm: tên, mô tả, giá, hình ảnh, danh mục, tồn kho, thuộc tính.

Hỗ trợ phân loại theo danh mục sản phẩm để dễ quản lý.

#### [2.3.1.8 Quản lý danh mục sản phẩm]()

Cho phép admin tạo danh mục theo cấp bậc (ví dụ: Thời trang > Nam > Áo).

Hệ thống hỗ trợ chọn danh mục khi thêm sản phẩm để tổ chức dữ liệu logic hơn.

#### [2.3.1.9 Quản lý đánh giá sản phẩm]()

Sau khi nhận hàng, người dùng có thể đánh giá sản phẩm (sao, bình luận).

Các đánh giá được hiển thị công khai và có thể giúp cải thiện uy tín sản phẩm.

#### [2.3.1.10 Quản lý thanh toán]()

Hệ thống hỗ trợ nhiều phương thức thanh toán: thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng.

### [2.3.2 Sơ đồ chức năng]()

![Hình 2-1: Sơ đồ chức năng](image/chuong2_lvtn/so-do-chuc-nang.png)

**Hình 2-1: Sơ đồ chức năng**

### [2.3.3 Sơ đồ Use case tổng quát]()

![Hình 2-2: Sơ đồ usecase tổng quát](image/chuong2_lvtn/so-do-usecase-tong-quat.png)

**Hình 2-2: Sơ đồ usecase tổng quát**

#### [2.3.3.1 Quản trị viên]()

Người điều hành hệ thống, có toàn quyền kiểm soát và giám sát các hoạt động của khách hàng và doanh nghiệp.

Vai trò: Quản lý người dùng, duyệt đăng ký doanh nghiệp, xử lý khiếu nại, cấu hình hệ thống, thống kê báo cáo.

#### [2.3.3.2 Khách hàng]()

Người dùng cuối truy cập vào hệ thống để tìm kiếm, đặt mua sản phẩm và sử dụng dịch vụ.

Vai trò: Đăng ký/đăng nhập, tìm kiếm sản phẩm, thêm vào giỏ hàng, thanh toán, theo dõi đơn hàng, đánh giá sản phẩm.

#### [2.3.3.3 Doanh nghiệp]()

Là người bán hoặc nhà cung cấp sản phẩm/dịch vụ trên nền tảng.

Vai trò: Đăng ký/đăng nhập, tạo và quản lý sản phẩm, xử lý đơn hàng, xem báo cáo doanh thu.
