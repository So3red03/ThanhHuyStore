# 1. Use case chi tiết quản lý bài viết

**Tên Use case:** Quản lý bài viết

**Actor:** Quản trị viên

**Mô tả:** Quản trị viên quản lý các bài viết trên website bao gồm tạo, sửa, xóa và duyệt bài viết.

**Pre-conditions:**

- Quản trị viên đã đăng nhập vào hệ thống
- Có quyền truy cập vào chức năng quản lý bài viết

**Post-conditions:**

- **Success:** Bài viết được quản lý thành công, cơ sở dữ liệu được cập nhật
- **Fail:** Hệ thống hiển thị thông báo lỗi

**Luồng sự kiện chính:**

1. Quản trị viên chọn chức năng "Quản lý bài viết"
2. Hệ thống hiển thị danh sách bài viết
3. Quản trị viên chọn thao tác cần thực hiện
4. Hệ thống xử lý yêu cầu và hiển thị kết quả

**Include Use Case:** Đăng nhập

**Extend Use Case:**

- Thêm bài viết
- Sửa bài viết
- Xóa bài viết
- Duyệt bình luận

**Luồng sự kiện phụ:**
Quản trị viên thực hiện chức năng khác, hệ thống điều hướng sang giao diện tương ứng.

## `<Extend Use Case>`

### Thêm bài viết

**Actor:** Quản trị viên

1. Actor nhấn nút "Thêm bài viết mới"
2. Hệ thống hiển thị form tạo bài viết
3. Actor nhập thông tin bài viết (tiêu đề, nội dung, hình ảnh, danh mục)
4. Actor nhấn nút "Lưu bài viết"
5. Hệ thống lưu bài viết vào cơ sở dữ liệu
6. Hệ thống hiển thị thông báo thành công

### Sửa bài viết

**Actor:** Quản trị viên

1. Actor chọn bài viết cần sửa từ danh sách
2. Actor nhấn nút "Chỉnh sửa"
3. Hệ thống hiển thị form chỉnh sửa với thông tin hiện tại
4. Actor cập nhật thông tin cần thiết
5. Actor nhấn nút "Cập nhật"
6. Hệ thống cập nhật bài viết trong cơ sở dữ liệu
7. Hệ thống hiển thị thông báo thành công

### Xóa bài viết

**Actor:** Quản trị viên

1. Actor chọn bài viết cần xóa từ danh sách
2. Actor nhấn nút "Xóa"
3. Hệ thống hiển thị hộp thoại xác nhận
4. Actor xác nhận xóa bài viết
5. Hệ thống xóa bài viết khỏi cơ sở dữ liệu
6. Hệ thống hiển thị thông báo thành công

### Duyệt bình luận

**Actor:** Quản trị viên

1. Actor chọn bài viết có bình luận cần duyệt
2. Actor xem danh sách bình luận chưa duyệt
3. Actor chọn bình luận và quyết định duyệt hoặc từ chối
4. Hệ thống cập nhật trạng thái bình luận
5. Hệ thống gửi thông báo cho người dùng (nếu cần)

## `<Include Use Case>`

### Đăng nhập

**Actor:** Quản trị viên

1. Actor nhập thông tin đăng nhập
2. Actor nhấn nút "Đăng nhập"
3. Hệ thống kiểm tra thông tin
4. Nếu hợp lệ, chuyển đến giao diện quản lý bài viết
5. Nếu không hợp lệ, hiển thị thông báo lỗi

# 2. Sơ đồ tuần tự quản lý bài viết

```mermaid
sequenceDiagram
    participant A as Quản trị viên
    participant U as Giao diện Admin
    participant H as Hệ thống
    participant DB as Cơ sở dữ liệu
    participant E as Dịch vụ Email

    Note over A,E: Xem danh sách bài viết
    A->>U: 1. Truy cập trang quản lý bài viết
    U->>H: 2. Yêu cầu hiển thị danh sách bài viết
    H->>DB: 3. Truy vấn danh sách bài viết
    DB-->>H: 4. Trả về danh sách bài viết
    H-->>U: 5. Danh sách bài viết
    U-->>A: 6. Hiển thị danh sách

    Note over A,E: Thêm bài viết mới
    A->>U: 7. Nhấn "Thêm bài viết mới"
    U->>H: 8. Yêu cầu form tạo bài viết
    H-->>U: 9. Form tạo bài viết
    U-->>A: 10. Hiển thị form
    A->>U: 11. Nhập thông tin và nhấn "Lưu"
    U->>H: 12. Gửi dữ liệu bài viết mới
    H->>DB: 13. Lưu bài viết vào cơ sở dữ liệu
    DB-->>H: 14. Xác nhận lưu thành công
    H-->>U: 15. Thông báo thành công
    U-->>A: 16. Hiển thị thông báo

    Note over A,E: Sửa bài viết
    A->>U: 17. Chọn bài viết và nhấn "Sửa"
    U->>H: 18. Yêu cầu form chỉnh sửa
    H->>DB: 19. Lấy thông tin bài viết hiện tại
    DB-->>H: 20. Trả về thông tin bài viết
    H-->>U: 21. Form chỉnh sửa với dữ liệu
    U-->>A: 22. Hiển thị form chỉnh sửa
    A->>U: 23. Cập nhật thông tin và nhấn "Cập nhật"
    U->>H: 24. Gửi dữ liệu cập nhật
    H->>DB: 25. Cập nhật bài viết trong cơ sở dữ liệu
    DB-->>H: 26. Xác nhận cập nhật thành công
    H-->>U: 27. Thông báo thành công
    U-->>A: 28. Hiển thị thông báo
```

**Lưu ý:** Vẽ bằng Mermaid

# 3. Sơ đồ hoạt động quản lý bài viết

```mermaid
flowchart TD
    A[Bắt đầu] --> B[Quản trị viên đăng nhập]
    B --> C[Truy cập trang quản lý bài viết]
    C --> D[Hiển thị danh sách bài viết]
    D --> E{Chọn thao tác}

    E -->|Thêm bài viết| F[Nhấn Thêm bài viết mới]
    E -->|Sửa bài viết| G[Chọn bài viết và nhấn Sửa]
    E -->|Xóa bài viết| H[Chọn bài viết và nhấn Xóa]
    E -->|Duyệt bình luận| I[Chọn bài viết có bình luận]
    E -->|Quay lại| D

    %% Luồng thêm bài viết
    F --> J[Hiển thị form tạo bài viết]
    J --> K[Nhập thông tin bài viết]
    K --> L[Nhấn Lưu bài viết]
    L --> M[Lưu vào cơ sở dữ liệu]
    M --> N[Hiển thị thông báo thành công]

    %% Luồng sửa bài viết
    G --> O[Hiển thị form chỉnh sửa]
    O --> P[Cập nhật thông tin]
    P --> Q[Nhấn Cập nhật]
    Q --> R[Cập nhật cơ sở dữ liệu]
    R --> N

    %% Luồng xóa bài viết
    H --> S{Xác nhận xóa?}
    S -->|Có| T[Xóa khỏi cơ sở dữ liệu]
    S -->|Không| D
    T --> N

    %% Luồng duyệt bình luận
    I --> U[Xem danh sách bình luận]
    U --> V{Quyết định duyệt}
    V -->|Duyệt| W[Cập nhật trạng thái duyệt]
    V -->|Từ chối| X[Cập nhật trạng thái từ chối]
    W --> Y[Gửi thông báo cho người dùng]
    X --> Y
    Y --> N

    %% Kết thúc
    N --> Z{Tiếp tục quản lý?}
    Z -->|Có| D
    Z -->|Không| AA[Kết thúc]

    %% Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:1px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:1px

    class A,AA startEnd
    class B,C,D,F,G,H,I,J,K,L,M,N,O,P,Q,R,T,U,W,X,Y process
    class E,S,V,Z decision
```

**Lưu ý:** Vẽ bằng Mermaid
