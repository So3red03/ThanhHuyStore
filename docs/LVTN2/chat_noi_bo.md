# 1. Use case chi tiết chat nội bộ

**Tên Use case:** Chat nội bộ

**Actor:** Quản trị viên, Khách hàng

**Mô tả:** Hệ thống chat realtime cho phép khách hàng và quản trị viên trao đổi trực tiếp thông qua tin nhắn văn bản và hình ảnh.

**Pre-conditions:**

- Người dùng đã đăng nhập vào hệ thống
- Kết nối internet ổn định để sử dụng tính năng realtime

**Post-conditions:**

- **Success:** Tin nhắn được gửi và nhận thành công, trạng thái đã đọc được cập nhật
- **Fail:** Hệ thống hiển thị thông báo lỗi

**Luồng sự kiện chính:**

1. Người dùng truy cập giao diện chat
2. Hệ thống hiển thị danh sách cuộc trò chuyện
3. Người dùng chọn cuộc trò chuyện hoặc tạo mới
4. Hệ thống thiết lập kết nối realtime và hiển thị tin nhắn

**Include Use Case:** Đăng nhập

**Extend Use Case:**

- Tạo cuộc trò chuyện mới
- Gửi tin nhắn văn bản
- Gửi hình ảnh đính kèm
- Đánh dấu đã đọc tin nhắn
- Tìm kiếm tin nhắn

**Luồng sự kiện phụ:**
Người dùng thực hiện chức năng khác, hệ thống duy trì kết nối chat ở chế độ nền.

## `<Extend Use Case>`

### Tạo cuộc trò chuyện mới

**Actor:** Khách hàng, Quản trị viên

1. Actor nhấn nút Tạo chat mới
2. Actor chọn người nhận từ danh sách
3. Hệ thống kiểm tra cuộc trò chuyện đã tồn tại
4. Nếu chưa có, hệ thống tạo chatroom mới
5. Hệ thống gửi thông báo realtime cho người nhận
6. Hệ thống hiển thị giao diện chat

### Gửi tin nhắn văn bản

**Actor:** Khách hàng, Quản trị viên

1. Actor nhập nội dung tin nhắn vào ô chat
2. Actor nhấn Enter hoặc nút Gửi
3. Hệ thống lưu tin nhắn vào cơ sở dữ liệu
4. Hệ thống gửi tin nhắn realtime qua Pusher
5. Hệ thống cập nhật thời gian tin nhắn cuối
6. Hệ thống hiển thị tin nhắn trong giao diện

### Gửi hình ảnh đính kèm

**Actor:** Khách hàng, Quản trị viên

1. Actor nhấn nút đính kèm hình ảnh
2. Actor chọn file hình ảnh từ thiết bị
3. Hệ thống upload hình ảnh lên server
4. Hệ thống tạo tin nhắn với đường dẫn hình ảnh
5. Hệ thống gửi tin nhắn realtime
6. Hệ thống hiển thị hình ảnh trong chat

### Đánh dấu đã đọc tin nhắn

**Actor:** Khách hàng, Quản trị viên

1. Actor mở cuộc trò chuyện
2. Hệ thống tự động đánh dấu tin nhắn cuối là đã đọc
3. Hệ thống cập nhật danh sách người đã đọc
4. Hệ thống gửi cập nhật realtime cho người gửi
5. Hệ thống hiển thị trạng thái đã đọc

### Tìm kiếm tin nhắn

**Actor:** Khách hàng, Quản trị viên

1. Actor nhập từ khóa vào ô tìm kiếm
2. Hệ thống tìm kiếm trong lịch sử tin nhắn
3. Hệ thống highlight các tin nhắn phù hợp
4. Actor chọn tin nhắn để xem chi tiết
5. Hệ thống cuộn đến vị trí tin nhắn được chọn

## `<Include Use Case>`

### Đăng nhập

**Actor:** Khách hàng, Quản trị viên

1. Actor nhập thông tin đăng nhập
2. Actor nhấn nút Đăng nhập
3. Hệ thống kiểm tra thông tin
4. Nếu hợp lệ, chuyển đến giao diện chat
5. Nếu không hợp lệ, hiển thị thông báo lỗi

# 2. Sơ đồ tuần tự chat nội bộ

```mermaid
sequenceDiagram
    participant A as Người dùng
    participant U as Giao diện Chat
    participant H as Hệ thống
    participant DB as Cơ sở dữ liệu
    participant P as Pusher Realtime

    Note over A,P: Tạo cuộc trò chuyện mới
    A->>U: 1. Truy cập giao diện chat
    U->>H: 2. Yêu cầu danh sách cuộc trò chuyện
    H->>DB: 3. Truy vấn chatrooms của người dùng
    DB-->>H: 4. Trả về danh sách chatrooms
    H-->>U: 5. Danh sách cuộc trò chuyện
    U-->>A: 6. Hiển thị danh sách chat

    Note over A,P: Gửi tin nhắn realtime
    A->>U: 7. Nhập tin nhắn và nhấn Gửi
    U->>H: 8. Gửi dữ liệu tin nhắn
    H->>DB: 9. Lưu tin nhắn vào cơ sở dữ liệu
    DB-->>H: 10. Xác nhận lưu tin nhắn
    H->>P: 11. Gửi tin nhắn realtime qua Pusher
    P-->>H: 12. Xác nhận gửi realtime
    H->>DB: 13. Cập nhật thời gian tin nhắn cuối
    DB-->>H: 14. Xác nhận cập nhật thời gian
    H-->>U: 15. Thông báo gửi thành công
    U-->>A: 16. Hiển thị tin nhắn trong chat

    Note over A,P: Nhận tin nhắn realtime
    P->>U: 17. Nhận tin nhắn mới từ Pusher
    U->>H: 18. Yêu cầu đánh dấu đã đọc
    H->>DB: 19. Cập nhật trạng thái đã đọc
    DB-->>H: 20. Xác nhận cập nhật trạng thái
    H->>P: 21. Gửi cập nhật trạng thái realtime
    P-->>H: 22. Xác nhận gửi cập nhật
    H-->>U: 23. Cập nhật giao diện
    U-->>A: 24. Hiển thị tin nhắn mới
```

**Lưu ý:** Vẽ bằng Mermaid

# 3. Sơ đồ hoạt động chat nội bộ

```mermaid
flowchart TD
    A[Bắt đầu] --> B[Người dùng đăng nhập]
    B --> C[Truy cập giao diện chat]
    C --> D[Hiển thị danh sách cuộc trò chuyện]
    D --> E{Chọn hành động}

    E -->|Tạo chat mới| F[Nhấn Tạo chat mới]
    E -->|Chọn chat có sẵn| G[Chọn cuộc trò chuyện]
    E -->|Tìm kiếm| H[Nhập từ khóa tìm kiếm]
    E -->|Quay lại| D

    %% Luồng tạo chat mới
    F --> I[Chọn người nhận]
    I --> J{Chatroom đã tồn tại?}
    J -->|Có| K[Mở chatroom hiện có]
    J -->|Không| L[Tạo chatroom mới]
    L --> M[Gửi thông báo realtime]
    M --> N[Hiển thị giao diện chat]
    K --> N

    %% Luồng chat hiện có
    G --> O[Thiết lập kết nối Pusher]
    O --> P[Tải lịch sử tin nhắn]
    P --> Q[Đánh dấu đã đọc tự động]
    Q --> N

    %% Luồng tìm kiếm
    H --> R[Tìm kiếm trong lịch sử]
    R --> S[Highlight kết quả]
    S --> T{Chọn tin nhắn?}
    T -->|Có| U[Cuộn đến vị trí tin nhắn]
    T -->|Không| H
    U --> N

    %% Giao diện chat chính
    N --> V{Hành động trong chat}
    V -->|Gửi tin nhắn| W[Nhập nội dung tin nhắn]
    V -->|Gửi hình ảnh| X[Chọn file hình ảnh]
    V -->|Quay lại danh sách| D

    %% Luồng gửi tin nhắn
    W --> Y[Nhấn Gửi hoặc Enter]
    Y --> Z[Lưu tin nhắn vào database]
    Z --> AA[Gửi realtime qua Pusher]
    AA --> BB[Cập nhật giao diện]
    BB --> CC[Hiển thị tin nhắn mới]

    %% Luồng gửi hình ảnh
    X --> DD[Upload hình ảnh]
    DD --> EE[Tạo tin nhắn với đường dẫn]
    EE --> AA

    %% Kết thúc
    CC --> FF{Tiếp tục chat?}
    FF -->|Có| V
    FF -->|Không| GG[Kết thúc]

    %% Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:1px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:1px
    classDef realtime fill:#e8f5e8,stroke:#1b5e20,stroke-width:1px

    class A,GG startEnd
    class B,C,D,F,G,H,I,K,L,M,N,O,P,Q,R,S,U,W,X,Y,Z,BB,CC,DD,EE process
    class E,J,T,V,FF decision
    class AA realtime
```

**Lưu ý:** Vẽ bằng Mermaid
