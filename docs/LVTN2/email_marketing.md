# 1. Use case chi tiết email marketing

**Tên Use case:** Email Marketing

**Actor:** Quản trị viên

**Mô tả:** Quản trị viên tạo và gửi các chiến dịch email marketing đến khách hàng để quảng bá sản phẩm mới và voucher khuyến mãi.

**Pre-conditions:**

- Quản trị viên đã đăng nhập vào hệ thống
- Có danh sách khách hàng trong cơ sở dữ liệu
- Có sản phẩm hoặc voucher để quảng bá

**Post-conditions:**

- **Success:** Email marketing được gửi thành công đến khách hàng, chiến dịch được lưu trữ
- **Fail:** Hệ thống hiển thị thông báo lỗi

**Luồng sự kiện chính:**

1. Quản trị viên chọn chức năng "Email Marketing"
2. Hệ thống hiển thị giao diện tạo chiến dịch
3. Quản trị viên cấu hình chiến dịch và chọn đối tượng
4. Hệ thống gửi email và lưu thống kê chiến dịch

**Include Use Case:** Đăng nhập

**Extend Use Case:**

- Tạo chiến dịch sản phẩm mới
- Tạo chiến dịch voucher khuyến mãi
- Chọn phân khúc khách hàng
- Theo dõi thống kê chiến dịch

**Luồng sự kiện phụ:**
Quản trị viên thực hiện chức năng khác, hệ thống điều hướng sang giao diện tương ứng.

## <Extend Use Case>

### Tạo chiến dịch sản phẩm mới

**Actor:** Quản trị viên

1. Actor chọn loại chiến dịch "Sản phẩm mới"
2. Actor chọn sản phẩm cần quảng bá
3. Actor nhập tiêu đề và mô tả chiến dịch
4. Actor chọn phân khúc khách hàng mục tiêu
5. Hệ thống tạo nội dung email với thông tin sản phẩm
6. Hệ thống gửi email đến danh sách khách hàng được chọn

### Tạo chiến dịch voucher khuyến mãi

**Actor:** Quản trị viên

1. Actor chọn loại chiến dịch "Voucher khuyến mãi"
2. Actor chọn các voucher cần gửi
3. Actor nhập tiêu đề và mô tả chiến dịch
4. Actor chọn phân khúc khách hàng mục tiêu
5. Hệ thống tạo nội dung email với thông tin voucher
6. Hệ thống gửi email đến danh sách khách hàng được chọn

### Chọn phân khúc khách hàng

**Actor:** Quản trị viên

1. Actor chọn chế độ phân khúc (tự động hoặc thủ công)
2. Nếu tự động: Actor chọn các phân khúc có sẵn (VIP, mới, có nguy cơ rời bỏ)
3. Nếu thủ công: Actor chọn từng khách hàng cụ thể
4. Hệ thống hiển thị số lượng khách hàng được chọn
5. Actor xác nhận danh sách khách hàng

### Theo dõi thống kê chiến dịch

**Actor:** Quản trị viên

1. Actor truy cập trang thống kê chiến dịch
2. Hệ thống hiển thị danh sách các chiến dịch đã gửi
3. Actor chọn chiến dịch cần xem chi tiết
4. Hệ thống hiển thị thống kê: số email gửi, tỷ lệ mở, tỷ lệ click
5. Actor có thể xuất báo cáo thống kê

## <Include Use Case>

### Đăng nhập

**Actor:** Quản trị viên

1. Actor nhập thông tin đăng nhập
2. Actor nhấn nút "Đăng nhập"
3. Hệ thống kiểm tra thông tin
4. Nếu hợp lệ, chuyển đến giao diện email marketing
5. Nếu không hợp lệ, hiển thị thông báo lỗi

# 2. Sơ đồ tuần tự email marketing

```mermaid
sequenceDiagram
    participant A as Quản trị viên
    participant U as Giao diện Admin
    participant H as Hệ thống
    participant DB as Cơ sở dữ liệu
    participant E as Dịch vụ Email

    Note over A,E: Tạo chiến dịch email marketing
    A->>U: 1. Truy cập trang email marketing
    U->>H: 2. Yêu cầu hiển thị giao diện tạo chiến dịch
    H->>DB: 3. Truy vấn danh sách sản phẩm và voucher
    DB-->>H: 4. Trả về danh sách sản phẩm và voucher
    H-->>U: 5. Giao diện tạo chiến dịch
    U-->>A: 6. Hiển thị form tạo chiến dịch

    Note over A,E: Cấu hình và gửi chiến dịch
    A->>U: 7. Chọn loại chiến dịch và cấu hình
    U->>H: 8. Gửi thông tin cấu hình chiến dịch
    H->>DB: 9. Truy vấn danh sách khách hàng theo phân khúc
    DB-->>H: 10. Trả về danh sách khách hàng
    H->>DB: 11. Lưu thông tin chiến dịch
    DB-->>H: 12. Xác nhận lưu chiến dịch
    H->>E: 13. Gửi email đến danh sách khách hàng
    E-->>H: 14. Xác nhận gửi email thành công
    H->>DB: 15. Cập nhật thống kê chiến dịch
    DB-->>H: 16. Xác nhận cập nhật thống kê
    H-->>U: 17. Thông báo gửi email thành công
    U-->>A: 18. Hiển thị kết quả chiến dịch
```

**Lưu ý:** Vẽ bằng Mermaid

# 3. Sơ đồ hoạt động email marketing

```mermaid
flowchart TD
    A[Bắt đầu] --> B[Quản trị viên đăng nhập]
    B --> C[Truy cập trang email marketing]
    C --> D[Hiển thị giao diện tạo chiến dịch]
    D --> E{Chọn loại chiến dịch}

    E -->|Sản phẩm mới| F[Chọn sản phẩm quảng bá]
    E -->|Voucher khuyến mãi| G[Chọn voucher gửi]
    E -->|Quay lại| D

    %% Luồng sản phẩm mới
    F --> H[Nhập tiêu đề và mô tả chiến dịch]
    H --> I[Chọn phân khúc khách hàng]
    I --> J{Chế độ phân khúc}
    J -->|Tự động| K[Chọn phân khúc có sẵn]
    J -->|Thủ công| L[Chọn khách hàng cụ thể]

    %% Luồng voucher
    G --> M[Nhập tiêu đề và mô tả chiến dịch]
    M --> N[Chọn phân khúc khách hàng]
    N --> O{Chế độ phân khúc}
    O -->|Tự động| P[Chọn phân khúc có sẵn]
    O -->|Thủ công| Q[Chọn khách hàng cụ thể]

    %% Gộp luồng
    K --> R[Hiển thị số lượng khách hàng]
    L --> R
    P --> R
    Q --> R

    R --> S[Xác nhận danh sách khách hàng]
    S --> T[Lưu thông tin chiến dịch]
    T --> U[Tạo nội dung email]
    U --> V[Gửi email đến khách hàng]
    V --> W[Cập nhật thống kê chiến dịch]
    W --> X[Hiển thị kết quả gửi email]

    %% Kết thúc
    X --> Y{Tạo chiến dịch khác?}
    Y -->|Có| D
    Y -->|Không| Z[Kết thúc]

    %% Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:1px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:1px

    class A,Z startEnd
    class B,C,D,F,G,H,I,K,L,M,N,P,Q,R,S,T,U,V,W,X process
    class E,J,O,Y decision
```

**Lưu ý:** Vẽ bằng Mermaid
