# Patient UI Design System

Tài liệu chuẩn hóa hệ thống thiết kế giao diện Người bệnh (Patient Portal & Public Web) của dự án **LifeHealth**. Tài liệu này đóng vai trò là kim chỉ nam (Single Source of Truth) dành cho lập trình viên (Developer) và Trợ lý lập trình AI (AI Coding Agent) khi xây dựng, mở rộng hoặc tối ưu giao diện trong thư mục `frontend/`.

---

## 1. Product Principles (Nguyên Tắc Thiết Kế Sản Phẩm)

Giao diện Người bệnh phục vụ đối tượng đa dạng: từ người dùng phổ thông, thanh thiếu niên, phụ huynh cho đến người lớn tuổi hoặc người ít có cơ hội tiếp xúc với công nghệ. Do đó, hệ thống thiết kế tuân thủ 4 nguyên tắc cốt lõi:

1. **Thân thiện, Dễ hiểu & Tạo cảm giác An tâm (Calm & Trustworthy)**
   - Tránh cảm giác lạnh lẽo của phần mềm kỹ thuật hoặc giao diện quản trị phức tạp.
   - Sử dụng tông màu y tế êm dịu (*Clinical Teal*, *Care Mist*, *Warm White*) kết hợp với kiểu chữ tròn trịa, ấm áp (*Be Vietnam Pro* và *Nunito*) để xoa dịu tâm lý lo âu khi người bệnh đi khám.
2. **Khả năng Đọc & Thao tác vượt trội (Readability & Usability Over Decoration)**
   - Ưu tiên kích thước chữ lớn, khoảng cách dòng thoáng, vùng nhấn phím (touch target) tối thiểu 44×44px trên thiết bị di động.
   - Giảm thiểu hiệu ứng trang trí rườm rà. Mọi chuyển động (animation) phải có mục đích định hướng hoặc biểu thị trạng thái (loading nhịp tim, thông báo phản hồi).
3. **Minh bạch & An toàn Y tế AI (Clinical Safety & AI Transparency)**
   - **Tuyệt đối không** trình bày kết quả của Trợ lý AI (MedAI, AI Health Coach) như là chẩn đoán y khoa chính thức hay chỉ định điều trị thay thế bác sĩ.
   - Mọi khối nội dung AI phải đi kèm huy hiệu phân loại, icon trực quan (*Bot*, *Sparkles*) và hộp cảnh báo y khoa màu hổ phách (*Amber Disclaimer Box*) bắt buộc.
4. **Bao hàm & Trợ năng (Accessibility & Inclusive Design)**
   - Tuân thủ tiêu chuẩn tương phản màu **WCAG 2.1 AA** (tối thiểu 4.5:1 cho văn bản thông thường, 3:1 cho văn bản lớn và thành phần đồ họa tương tác).
   - Hỗ trợ đầy đủ `prefers-reduced-motion` cho người dùng nhạy cảm với chuyển động và hỗ trợ điều hướng bàn phím, nhãn biểu mẫu rõ ràng.

---

## 2. Design Foundations (Nền Tảng Thiết Kế Từ Code Thực Tế)

Toàn bộ thông số dưới đây được trích xuất trực tiếp từ [frontend/src/index.css](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/src/index.css), [frontend/index.html](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/index.html) và cấu hình Tailwind CSS v4.

### 2.1. Color System (Bảng Màu & Semantic Tokens)

Hệ màu của Patient UI sử dụng mô hình màu hiện đại **OKLCH** kết hợp với bộ màu đặc thù **Calm Clinical Guidance Palette**.

#### A. Calm Clinical Guidance Tokens (Màu Thương Hiệu Y Tế Lâm Sàng)

| Token CSS | Hex Light | Hex Dark | Vai trò / Ngữ cảnh sử dụng |
| :--- | :---: | :---: | :--- |
| `--clinical-teal` | `#159a98` | `#2cd4d1` | Màu chủ đạo thương hiệu LifeHealth, nút CTA chính, icon điểm nhấn |
| `--clinical-teal-hover` | `#117d7b` | `#159a98` | Trạng thái hover của nút bấm và liên kết chính |
| `--clinical-ink` | `#123b45` | `#eaf7f5` | Tiêu đề lớn, chữ có độ tương phản cao nhất trong các khối nổi bật |
| `--care-mist` | `#eaf7f5` | `#152b31` | Nền thứ cấp, nền thẻ card tính năng, nền chip icon mềm mại |
| `--warm-white` | `#fcfdfb` | `#0e1a1e` | Nền canvas trang, tạo cảm giác mềm hơn màu trắng tinh `#ffffff` |
| `--human-coral` | `#ff7966` | `#ff8e7d` | Điểm nhấn ấm áp: tim mạch, nhắc nhở quan trọng, badge sinh động |
| `--neutral-slate` | `#5f6f76` | `#93a6ad` | Văn bản phụ trợ, nhãn mô tả, đường viền nhẹ |

#### B. Semantic Theme Tokens (Theo chuẩn OKLCH)

| Token | Light Mode Value (OKLCH / Hex) | Dark Mode Value (OKLCH / Hex) | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| `primary` | `oklch(0.66 0.13 176)` | `oklch(0.75 0.12 176)` | Nút bấm chính, checkbox, radio, đường link active |
| `primary-foreground` | `oklch(0.99 0 0)` (`#ffffff`) | `oklch(0.15 0.04 176)` (`#042f2e`) | Chữ trên nền primary (tương phản > 6.0:1) |
| `background` | `oklch(0.99 0.002 180)` | `oklch(0.147 0.004 49.25)` | Nền toàn bộ trang web |
| `foreground` | `oklch(0.18 0.02 240)` | `oklch(0.985 0.001 106.423)` | Màu chữ mặc định của văn bản nội dung |
| `card` | `oklch(1 0 0)` (`#ffffff`) | `oklch(0.216 0.006 56.043)` | Nền thẻ bề mặt (card, modal, dropdown) |
| `card-foreground` | `oklch(0.18 0.02 240)` | `oklch(0.985 0.001 106.423)` | Chữ trên bề mặt card |
| `secondary` | `oklch(0.96 0.015 176)` | `oklch(0.268 0.007 34.298)` | Nền nút phụ, tab thứ cấp |
| `secondary-foreground` | `oklch(0.25 0.05 176)` | `oklch(0.985 0.001 106.423)` | Chữ trên nền secondary |
| `muted` | `oklch(0.965 0.005 240)` | `oklch(0.268 0.007 34.298)` | Nền bị vô hiệu hóa, thanh cuộn, dải ngăn cách |
| `muted-foreground` | `oklch(0.52 0.02 240)` | `oklch(0.709 0.01 56.259)` | Chữ phụ, ngày giờ, placeholder |
| `accent` | `oklch(0.95 0.02 176)` | `oklch(0.268 0.007 34.298)` | Hover trên menu item, bảng lựa chọn |
| `accent-foreground` | `oklch(0.25 0.05 176)` | `oklch(0.985 0.001 106.423)` | Chữ khi hover menu item |
| `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Nút hủy hẹn, xóa hồ sơ, thông báo lỗi nguy hiểm |
| `border` | `oklch(0.92 0.008 240)` | `oklch(1 0 0 / 10%)` | Đường viền ngăn cách giữa các khối |
| `input` | `oklch(0.92 0.008 240)` | `oklch(1 0 0 / 15%)` | Đường viền ô nhập liệu |
| `ring` | `oklch(0.66 0.13 176)` | `oklch(0.75 0.12 176)` | Vòng sáng focus trợ năng bàn phím |

#### C. High-Contrast Text Selection Tokens (Màu Bôi Đen Văn Bản)

Tuân thủ WCAG AA đã được kiểm chứng bằng kiểm thử tự động:
- **Light mode**: `--selection-background: #0f766e`, `--selection-foreground: #ffffff` (Tỉ lệ tương phản **5.0:1**).
- **Dark mode**: `--selection-background: #2dd4bf`, `--selection-foreground: #042f2e` (Tỉ lệ tương phản **8.57:1**).

---

### 2.2. Typography (Hệ Thống Phông Chữ & Phân Cấp)

Được nạp trực tiếp qua Google Fonts trong [frontend/index.html](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/index.html):
- **Phông Tiêu Đề (`h1`–`h6`, `.font-heading`, `.font-display`)**: `"Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Thiết kế hình học hiện đại, hỗ trợ tiếng Việt có dấu hoàn hảo, không bị lỗi dấu thanh hay chân chữ chật chội.
- **Phông Nội Dung Cơ Bản (`body`, inputs, buttons, paragraphs)**: `"Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Đường nét bo tròn nhẹ nhàng, thân thiện, dễ đọc đối với người lớn tuổi, tạo cảm giác nhân văn và ấm áp.

#### Thước Đo Phân Cấp Chữ (Typography Scale)

| Vai trò | Phông chữ | Kích thước | Độ đậm (Weight) | Chiều cao dòng (Leading) | Lớp Tailwind khuyên dùng |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Hero Title** | Be Vietnam Pro | 36px – 48px | 800 (Extrabold) | 1.15 | `text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading` |
| **Section Heading (H2)** | Be Vietnam Pro | 24px – 36px | 800 (Extrabold) | 1.25 | `text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-heading` |
| **Card Heading (H3)** | Be Vietnam Pro | 18px – 20px | 700 (Bold) | 1.30 | `text-lg sm:text-xl font-bold text-slate-900 tracking-tight` |
| **Item Title (H4)** | Be Vietnam Pro / Nunito | 15px – 16px | 700 (Bold) | 1.40 | `text-sm sm:text-base font-bold text-slate-900` |
| **Body Large** | Nunito | 16px – 18px | 500 (Medium) | 1.60 | `text-base sm:text-lg text-slate-600 leading-relaxed` |
| **Body Default** | Nunito | 14px – 15px | 400 / 500 | 1.55 | `text-sm text-slate-600 leading-normal` |
| **Button Text** | Nunito | 14px – 15px | 600 / 700 | 1.00 | `text-sm font-semibold` hoặc `text-sm font-bold` |
| **Caption / Metadata** | Nunito | 12px – 13px | 500 (Medium) | 1.40 | `text-xs text-slate-500` |
| **Micro / Subtext** | Nunito | 10px – 11px | 600 / 700 | 1.30 | `text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-slate-400` |

---

### 2.3. Radius Scale (Bo Góc Khối)

Cấu hình `@theme inline` trong [frontend/src/index.css](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/src/index.css) với gốc `--radius: 0.75rem` (12px):

| Token | Giá trị | Vai trò / Thành phần áp dụng |
| :--- | :---: | :--- |
| `rounded-sm` | 8px (`calc(--radius - 4px)`) | Nút bấm mini, checkbox, icon indicator nhỏ |
| `rounded-md` | 10px (`calc(--radius - 2px)`) | Tooltip, popover nhỏ |
| `rounded-lg` | 12px (`var(--radius)`) | Nút bấm phụ, ô nhập liệu phụ |
| `rounded-xl` | 16px (`calc(--radius + 4px)`) | **Chuẩn chung**: Nút bấm chính (`Button`), ô nhập (`Input`), `Badge` |
| `rounded-2xl` | 20px (`calc(--radius + 8px)`) | Thẻ bề mặt thông thường (`Card`, `InfoTile`, avatar frame) |
| `rounded-3xl` | 26px (`calc(--radius + 14px)`) | Banner chào đón, Modal lớn (`Dialog`), Section Container lớn, Thanh sidebar |
| `rounded-full` | 9999px | Badge viên thuốc (`pill`), Avatar tròn, Nút filter di động |

---

### 2.4. Elevation & Shadow (Độ Nổi & Đổ Bóng)

Patient UI hướng tới phong cách phẳng, tinh tế và sạch sẽ. Đổ bóng được dùng có chừng mực để phân tầng nội dung:

| Cấp độ | Lớp Tailwind | Ứng dụng |
| :--- | :--- | :--- |
| **Flat / Bordered** | `border border-slate-200/80` (không shadow) | Thẻ thông tin danh sách thường, ô nhập liệu bình thường |
| **Subtle Lift** | `shadow-2xs` hoặc `shadow-xs` | Nút bấm mặc định, thẻ card dashboard, ô search input |
| **Interactive Hover** | `hover:shadow-md hover:border-primary/40 transition-all` | Thẻ bác sĩ, thẻ gói dịch vụ, card bài viết khi rê chuột |
| **Floating Surface** | `shadow-lg` hoặc `shadow-xl` | Modal hộp thoại (`Dialog`), Banner khuyến cáo nổi bật, Menu dropdown |
| **Glassmorphism** | `.glass-card`, `.glass-header` (`backdrop-blur-md bg-white/85`) | Header cố định trên cùng, thanh điều hướng nổi |

---

### 2.5. Icon Conventions (Biểu Tượng Chuẩn Y Tế)

Dự án dùng đồng nhất thư viện **Lucide React** (`lucide-react`). Tuyệt đối không cài thêm bộ icon khác.

#### Quy Tắc Kích Thước & Ngữ Cảnh:
- `size-3` (12px) hoặc `size-3.5` (14px): Dùng bên trong `Badge` hoặc nhãn ngày giờ siêu nhỏ.
- `size-4` (16px) hoặc `size-4.5` (18px): Dùng đồng hành cùng văn bản trong `Button`, Menu Sidebar, Action Row.
- `size-5` (20px) hoặc `size-6` (24px): Dùng làm icon đại diện tính năng trong các thẻ `InfoTile`, Header modal.
- `size-8` (32px) trở lên: Dùng trong các trạng thái rỗng (`NotFoundResult`) hoặc báo lỗi (`ErrorState`).

#### Nhóm Biểu Tượng Y Tế Chuẩn:
- Đặt hẹn / Lịch khám: `CalendarClock`, `CalendarPlus`, `CalendarCheck`, `Clock`
- Bác sĩ & Chuyên khoa: `Stethoscope`, `UserRound`, `UserCheck`, `UsersRound`
- Hồ sơ y tế & Kết quả: `FileHeart`, `FileSearch`, `ClipboardList`, `Activity`, `HeartPulse`
- AI Y tế: `Sparkles` (tính năng AI chung), `Bot` (trợ lý hội thoại), `HeartHandshake` (AI Coach)
- Cảnh báo & Trợ năng: `AlertTriangle` (khiếu nại), `AlertCircle` (cảnh báo y tế), `ShieldCheck` (bảo mật dữ liệu)

---

### 2.6. Responsive Breakpoints & Container

| Breakpoint | Chiều rộng tối thiểu | Bố cục trang chủ | Bố cục Patient Portal |
| :--- | :---: | :--- | :--- |
| **Mobile (`< 640px`)** | 0px | 1 cột, hero xếp dọc, ẩn bớt chi tiết phụ | Menu cuộn ngang dạng viên thuốc (`mobile-nav-scroll`), Card 1 cột |
| **Tablet (`sm: 640px`)** | 640px | 1-2 cột, form 2 cột | Card thống kê 2 cột (`md:grid-cols-2`) |
| **Laptop (`lg: 1024px`)** | 1024px | 3-4 cột, hiển thị trọn vẹn đồ họa AI | Sidebar cố định bên trái (`lg:w-72 sticky top-32`), nội dung bên phải |
| **Desktop (`xl: 1280px`)** | 1280px | Grid tối ưu, lề rộng thông thoáng | Card thống kê 4 cột (`xl:grid-cols-4`) |
| **Container Padding** | — | `px-4 sm:px-6 lg:px-8` | `container mx-auto px-4 sm:px-6` |

---

### 2.7. Motion, Transition & Trợ Năng Giảm Chuyển Động

Tất cả hiệu ứng chuyển động trong Patient UI phải tuân thủ nghiêm ngặt **`prefers-reduced-motion`**:

1. **CSS Animations trong `src/index.css`**:
   - Được bọc bên trong `@media (prefers-reduced-motion: no-preference)`.
   - Các hiệu ứng chuẩn:
     - `animate-ai-pulse-ring`: Vòng sáng xung nhịp AI lan tỏa.
     - `animate-ai-ecg-scroll`: Dòng điện tâm đồ ECG chạy liên tục.
     - `animate-ai-dot`: 3 chấm nhịp nhấp nháy khi AI đang phân tích.
     - `animate-heartbeat-subtle`: Nhịp tim đập nhẹ chu kỳ 3 giây.
2. **Framer Motion**:
   - Sử dụng hook `useReducedMotion()` từ `framer-motion`. Khi người dùng bật reduced motion, loại bỏ hiệu ứng di chuyển (translate), chỉ giữ chuyển đổi mờ dần `opacity`.
3. **GSAP Animations** (như trong [HeroSection.tsx](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/src/components/section/HeroSection.tsx)):
   - Sử dụng `gsap.matchMedia()` với `mm.add("(prefers-reduced-motion: no-preference)", () => { ... })`.
4. **Micro-interactions trên nút bấm**:
   - Mọi nút bấm có `active:scale-[0.98]` và `transition-all duration-200` để phản hồi tức thì khi người bệnh chạm vào màn hình.

---

## 3. Themes & Accessibility (Giao Diện & Trợ Năng)

### 3.1. Chiến Lược Giao Diện (Theme Strategy)
- **Cổng công cộng & Trang khám bệnh mặc định**: Ưu tiên **Light Mode** sáng sủa, sạch sẽ, mang lại cảm giác vệ sinh và an tâm của môi trường bệnh viện chuẩn mực.
- **Hỗ trợ Dark Mode trong hệ thống Token**: Toàn bộ biến CSS `--color-*` và bộ token OKLCH trong `:root` và `.dark` đã được thiết lập đầy đủ.
- **Cơ chế lưu trữ Theme**: Quản lý thông qua hàm tiện ích [frontend/src/utils/theme.ts](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/src/utils/theme.ts) với 3 giá trị: `"SYSTEM" | "LIGHT" | "DARK"`, lưu trữ trong `localStorage` với key `"ui-theme"`.

### 3.2. Tiêu Chuẩn Trợ Năng (Accessibility Standards)
- **Tương phản văn bản**:
  - Chữ đen/xám đậm `text-slate-900` hoặc `text-slate-800` trên nền trắng đạt tỉ lệ > 12:1.
  - Chữ trắng `text-white` trên nút `bg-primary` (`#159a98`) đạt tỉ lệ 4.9:1 (vượt ngưỡng WCAG AA 4.5:1).
  - Placeholder và nhãn phụ `text-slate-400` / `text-slate-500` đạt tỉ lệ tương phản an toàn.
- **Biểu mẫu & Ô nhập liệu**:
  - Luôn có `<label>` liên kết `htmlFor` hoặc được bọc trong component có ngữ nghĩa.
  - Khi có lỗi nhập liệu (`error`), viền chuyển sang màu `border-rose-400`, có dòng thông báo lỗi ngay bên dưới bằng chữ đỏ `text-rose-500` và icon trực quan.
- **Focus ring**:
  - Sử dụng lớp `focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1` cho mọi thành phần có thể tương tác bằng bàn phím (nút bấm, ô input, dropdown).

---

## 4. Components & Patterns (Thành Phần & Mẫu Thiết Kế Giao Diện)

### 4.1. Button (`src/components/ui/button.tsx`)

Thành phần điều hướng và hành động cơ bản của hệ thống.

```tsx
import { Button } from "@/components/ui/button";

// Nút chính kêu gọi hành động (Primary CTA)
<Button variant="default" size="lg" className="rounded-xl font-bold">
  Đặt lịch khám ngay
</Button>

// Nút phụ có viền (Secondary Outline)
<Button variant="outline" size="default" className="rounded-xl">
  Xem hồ sơ bác sĩ
</Button>

// Nút nguy hiểm / Hủy hẹn
<Button variant="destructive" size="default" className="rounded-xl">
  Hủy lịch hẹn
</Button>
```

- **Biến thể (`variant`)**:
  - `default` / `primary`: Nền `bg-primary`, chữ trắng, bóng mờ nhẹ, viền `border-primary/20`.
  - `outline`: Nền trắng, viền xám `border-slate-200/90`, chữ xám đen, hover lên màu primary.
  - `secondary`: Nền `bg-secondary`, chữ xanh đậm `text-secondary-foreground`.
  - `ghost`: Trong suốt, hover có nền xám nhạt `hover:bg-slate-100`.
  - `destructive`: Nền đỏ `bg-destructive`, cảnh báo hành động không thể hoàn tác.
  - `details` / `sky`: Nền pastel dịu mắt (`bg-emerald-50`, `bg-sky-50`) dành cho xem nhanh chi tiết.
- **Kích thước (`size`)**:
  - `default`: Chiều cao `h-10` (40px).
  - `sm`: Chiều cao `h-8.5` (34px) dành cho các bảng dữ liệu hoặc thẻ card phụ.
  - `lg`: Chiều cao `h-11.5` (46px) dành cho các nút kêu gọi hành động lớn trong Hero Banner.
  - `icon`: Kích thước vuông `size-10` (40×40px).

---

### 4.2. Badge (`src/components/ui/badge.tsx`)

Dùng để đánh dấu trạng thái lịch khám, phân loại chuyên khoa hoặc ghi chú phiên bản.

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="success">Đã xác nhận</Badge>
<Badge variant="warning">Chờ duyệt</Badge>
<Badge variant="destructive">Đã hủy</Badge>
<Badge variant="info">Tái khám</Badge>
<Badge variant="outline">Chuyên khoa Tim mạch</Badge>
```

- **Quy chuẩn màu sắc**:
  - `success`: Nền xanh lá nhạt `bg-emerald-50 text-emerald-700 border-emerald-200`.
  - `warning`: Nền vàng nhạt `bg-amber-50 text-amber-700 border-amber-200`.
  - `destructive`: Nền đỏ nhạt `bg-rose-50 text-rose-700 border-rose-200`.
  - `info`: Nền xanh dương nhạt `bg-sky-50 text-sky-700 border-sky-200`.
  - `outline`: Nền trắng viền xám `bg-white text-slate-700 border-slate-200`.

---

### 4.3. Card & InfoTile (Khối Thông Tin Bệnh Nhân)

Mọi card bề mặt trong Patient Portal dùng bo góc `rounded-2xl` hoặc `rounded-3xl` với viền `border-slate-200/80` và nền trắng `bg-white`.

#### Mẫu InfoTile Sinh Trắc Học:
```tsx
const InfoTile: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-primary/40 hover:shadow-2xs">
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {icon}
    </div>
    <p className="mt-2 text-base font-bold text-slate-900">{value}</p>
  </div>
);
```

---

### 4.4. Form & Input (`src/components/ui/input.tsx`)

Ô nhập liệu có tích hợp sẵn hiển thị icon và thông báo lỗi hợp lệ:

```tsx
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

<Input
  type="email"
  placeholder="nhap.email@example.com"
  icon={<Mail className="w-4 h-4" />}
  error={errors.email?.message}
  {...register("email")}
/>
```

- **Quy chuẩn Validation**:
  - Mọi biểu mẫu phải định nghĩa schema xác thực bằng thư viện **Zod** trong thư mục [frontend/src/schemas/](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/src/schemas/) (ví dụ: `auth.schema.ts`, `healthProfile.schema.ts`, `relative.schema.ts`).
  - Sử dụng `react-hook-form` với `@hookform/resolvers/zod`.
  - Tuyệt đối không tự viết validation bằng tay rải rác trong component.

---

### 4.5. Navigation System (Điều Hướng Đa Nền Tảng)

Patient Portal có hệ thống điều hướng hai lớp trong [PatientLayout.tsx](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/src/layouts/PatientLayout.tsx):

1. **Desktop (Màn hình lớn `>= 1024px`)**:
   - Sidebar cố định dọc bên trái `lg:w-72 sticky top-32 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs`.
   - Nút hành động nổi bật trên cùng: `Đặt lịch khám mới` (màu Primary nổi bật).
   - Danh sách menu có icon trong ô vuông bo góc `rounded-xl`. Trạng thái active dùng nền `bg-primary text-white shadow-xs font-semibold`.
2. **Mobile (Màn hình nhỏ `< 1024px`)**:
   - Thanh cuộn ngang dạng viên thuốc mềm mại `.mobile-nav-scroll overflow-x-auto`.
   - Đảm bảo người bệnh có thể lướt ngón tay chọn nhanh các mục: Dashboard, Lịch khám, Hồ sơ, Kết quả khám mà không bị che khuất tầm nhìn.

---

### 4.6. Trạng Thái Hệ Thống: Loading, Error & Empty

Tuyệt đối không tự chế markup loading hay báo lỗi rải rác. Phải sử dụng bộ component dùng chung chuẩn hóa:

1. **Loading State**:
   - **Tải khối / Trang y tế**: Sử dụng [MedicalAiLoading.tsx](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/src/components/loading/MedicalAiLoading.tsx). Hiển thị vòng xung nhịp AI ECG, hiệu ứng nhịp tim và dòng thông điệp rõ ràng (`minHeight="min-h-64"`, hỗ trợ `fullScreen`).
   - **Tải nội dòng nhỏ**: Sử dụng `<Loading size={16} />` ([Loading.tsx](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/src/components/loading/Loading.tsx)).
2. **Error State**:
   - Sử dụng [ErrorState.tsx](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/src/components/notification/ErrorState.tsx) hoặc [StateCard.tsx](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/src/components/notification/StateCard.tsx).
   - Có tiêu đề rõ ràng, mô tả nguyên nhân và nút `Thử lại` (`onRetry`) để người bệnh thực hiện lại thao tác mà không cần tải lại toàn bộ trang.
3. **Empty State**:
   - Sử dụng [NotFoundResult.tsx](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/src/components/notification/NotFoundResult.tsx) với icon `SearchX` và nút đặt lại bộ lọc.

---

### 4.7. Lazy Loading & Viewport Optimization (Tối Ưu Hiệu Năng Cuộn Màn Hình)

Hệ thống áp dụng 4 lớp lazy loading để đảm bảo chỉ số **Core Web Vitals** (LCP, CLS, FID/INP):

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ROUTE LEVEL: React.lazy() + Suspense (AppRoutes.tsx)    │
├─────────────────────────────────────────────────────────────┤
│ 2. SECTION LEVEL: LazyViewport (IntersectionObserver)       │
│    - Chỉ mount chunk khi cuộn cách viewport 100px-150px     │
│    - Giữ chỗ minHeight + SectionSkeleton (Triệt tiêu CLS)   │
│    - Bọc ChunkErrorBoundary để tự phục hồi khi mạng rớt     │
├─────────────────────────────────────────────────────────────┤
│ 3. IMAGE LEVEL: LazyImage (loading="lazy", decoding="async")│
├─────────────────────────────────────────────────────────────┤
│ 4. DATA LEVEL: Chỉ fetch API khi section/tab vào viewport   │
└─────────────────────────────────────────────────────────────┘
```

#### Quy Tắc Cho Lập Trình Viên:
- Nội dung **Above-the-fold** (Header, Hero chính, Banner đầu trang) **không được bọc** trong `LazyViewport` để giữ LCP nhanh nhất.
- Toàn bộ các section bên dưới (Bác sĩ nổi bật, Chuyên khoa, Trợ lý AI, Quy trình đặt khám, Footer) bắt buộc bọc trong `LazyViewport`:

```tsx
import { lazy } from "react";
import LazyViewport from "@/components/lazy/LazyViewport";
import SectionSkeleton from "@/components/lazy/SectionSkeleton";

const SpecialtiesSection = lazy(() => import("@/components/section/SpecialtiesSection"));

<LazyViewport
  minHeight={480}
  rootMargin="150px 0px"
  fallback={<SectionSkeleton minHeight="480px" cardsCount={4} />}
>
  <SpecialtiesSection />
</LazyViewport>
```

- Mọi thẻ ảnh phải dùng component [LazyImage.tsx](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/src/components/lazy/LazyImage.tsx) có sẵn thuộc tính `loading="lazy"` và `decoding="async"`.

---

### 4.8. An Toàn Y Tế & Trợ Lý AI (AI Clinical Safety Patterns)

LifeHealth tích hợp các tính năng AI chuyên sâu (MedAI RAG Chatbot, AI Health Coach). Nhằm đảm bảo an toàn tuyệt đối cho người bệnh và tuân thủ nguyên tắc y tế:

#### A. Khung Cảnh Báo Khuyến Cáo Bắt Buộc (Mandatory Medical Disclaimer Box)
Bất kỳ màn hình hay section nào hiển thị thông tin do AI sinh ra phải có khối cảnh báo tiêu chuẩn:

```tsx
<div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
  <p className="leading-relaxed">
    <strong>Khuyến cáo y khoa:</strong> Trợ lý AI đóng vai trò định hướng và hỗ trợ tham khảo sơ bộ. Thông tin từ AI không thay thế việc khám trực tiếp, chẩn đoán bệnh hay chỉ định điều trị từ bác sĩ có chuyên môn.
  </p>
</div>
```

#### B. Modal Miễn Trừ Trách Nhiệm Nghiên Cứu ([EducationalDisclaimerModal.tsx](file:///d:/saved/Project/Medical-Appointment-Booking-System/frontend/src/components/dialog/EducationalDisclaimerModal.tsx))
- Tự động mở khi người dùng truy cập trang chủ lần đầu.
- Nêu rõ: Dự án học tập & nghiên cứu phi thương mại; hình ảnh bác sĩ/cơ sở y tế mang tính chất minh họa giao diện; thông tin AI không dùng cho tình huống cấp cứu khẩn cấp.
- Cho phép người dùng ghi nhận "Không hiển thị lại trong 7 ngày" qua `localStorage`.

---

## 5. Content Voice & Tone (Giọng Điệu & Ngôn Ngữ)

| Yếu tố | Nên Dùng (Do) | Không Nên Dùng (Don't) |
| :--- | :--- | :--- |
| **Xưng hô** | Lịch sự, ân cần: *"Bạn"*, *"Bệnh nhân"*, *"Bác sĩ"*, *"LifeHealth"*. | Trống không, suồng sã (*"Mày/Tao"*), hoặc quá quan liêu (*"Đối tượng khám"*). |
| **Thuật ngữ y khoa** | Giải thích bằng tiếng Việt dễ hiểu kèm thuật ngữ phụ trong ngoặc nếu cần. Ví dụ: *"Chỉ số khối cơ thể (BMI)"*, *"Huyết áp tâm thu"*. | Viết tắt từ viết tắt chuyên ngành không giải thích (*"HA", "CLS", "XN"*). |
| **Thông điệp lỗi** | Trấn an và hướng dẫn cách khắc phục: *"Không thể kết nối với hệ thống đặt lịch. Vui lòng kiểm tra lại mạng hoặc thử lại sau ít phút."* | Báo lỗi kỹ thuật khô khan: *"Error 500: Internal Server Error"*, *"NullPointerException"*. |
| **Thông điệp từ AI** | Gợi ý khiêm tốn: *"Dựa trên các triệu chứng bạn mô tả, bạn có thể cân nhắc thăm khám chuyên khoa Tiêu hóa..."* | Khẳng định chẩn đoán tuyệt đối: *"Bạn đã bị viêm loét dạ dày cấp tính, cần uống thuốc ngay."* |

---

## 6. Do's and Don'ts (Bảng Quy Tắc Dành Cho Developer)

### Do (Nên làm):
1. **Luôn sử dụng biến màu semantic** (`bg-primary`, `text-foreground`, `border-border`, `bg-card`) hoặc bảng màu lâm sàng (`--clinical-teal`, `--care-mist`).
2. **Tái sử dụng các UI primitives có sẵn** trong `src/components/ui/` (`Button`, `Badge`, `Card`, `Input`, `Dialog`).
3. **Mọi biểu mẫu mới phải tạo Zod schema** trong `src/schemas/` và tích hợp `react-hook-form`.
4. **Mọi trang/section nặng phía dưới màn hình phải được bọc trong `LazyViewport`** và có chiều cao giữ chỗ `minHeight` để tránh hiện tượng giật trang (CLS).
5. **Mọi khối nội dung AI phải đi kèm khuyến cáo y khoa** với icon cảnh báo màu hổ phách (`amber`).
6. **Kiểm tra trợ năng**: đảm bảo nút bấm có độ tương phản chữ rõ ràng, hỗ trợ điều hướng bàn phím `focus-visible`.

### Don't (Tuyệt đối không):
1. **Không sao chép máy móc giao diện dark-slate thô cứng của `admin/`** sang giao diện người bệnh. Bệnh nhân cần sự nhẹ nhàng, ấm áp và rõ ràng.
2. **Không dùng mã màu HEX/RGB tùy tiện** (như `text-[#212121]`, `bg-[#f7f6f2]`) trực tiếp trong component khi đã có sẵn token chuẩn.
3. **Không dùng `!important`** để ép màu hoặc vá lỗi CSS khi chưa tìm hiểu nguyên nhân gốc rễ.
4. **Không để nút Primary màu sáng đi chung với chữ trắng kém tương phản** (vi phạm tiêu chuẩn WCAG AA).
5. **Không đặt chữ hay bảng kết luận trông giống như bệnh án chính thức** cho các phản hồi tự động của Chatbot AI.
6. **Không đưa ảnh lớn không nén** trực tiếp vào trang mà không bọc qua `LazyImage`.

---

## 7. Code Examples (Ví Dụ Code Mẫu Chuẩn Chuẩn Hóa)

### 7.1. Thẻ Bác Sĩ Chuẩn (Doctor Card Pattern)

```tsx
import React from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, CalendarPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LazyImage from "@/components/lazy/LazyImage";
import type { Doctor } from "@/types/interface/doctor.interface";

export const DoctorCard: React.FC<{ doctor: Doctor }> = ({ doctor }) => {
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:border-primary/40 hover:shadow-md">
      <div className="relative h-48 w-full bg-slate-100">
        <LazyImage
          src={doctor.user.picture ?? "/default-doctor.png"}
          alt={doctor.user.fullname}
          className="h-full w-full object-cover"
        />
        <Badge
          variant="secondary"
          className="absolute right-3 top-3 bg-white/90 backdrop-blur-xs font-bold text-slate-800"
        >
          <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-1" />
          5.0
        </Badge>
      </div>

      <CardContent className="p-5 space-y-3">
        <div>
          <Badge variant="outline" className="text-primary border-primary/30 text-[11px] mb-1.5">
            {doctor.specialty?.name ?? "Đa khoa"}
          </Badge>
          <h3 className="text-base font-bold text-slate-900 line-clamp-1">
            BS. {doctor.user.fullname}
          </h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{doctor.clinic_address ?? "Bệnh viện LifeHealth"}</span>
          </p>
        </div>

        <Button asChild className="w-full rounded-xl font-bold gap-2">
          <Link to={`/doctors/${doctor.id}`}>
            <CalendarPlus className="h-4 w-4" />
            <span>Đặt lịch hẹn</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
```

---

### 7.2. Hộp Khuyến Cáo AI Chuẩn (AI Medical Disclaimer Pattern)

```tsx
import React from "react";
import { AlertCircle, Sparkles } from "lucide-react";

export const AiMedicalDisclaimer: React.FC<{ context?: string }> = ({ context }) => {
  return (
    <div
      role="note"
      aria-label="Khuyến cáo y khoa"
      className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-3.5 text-xs text-amber-900 dark:text-amber-200 shadow-2xs"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 shrink-0 mt-0.5">
        <AlertCircle className="w-4.5 h-4.5" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-100 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Lưu ý quan trọng từ Cố vấn Y tế LifeHealth</span>
        </div>
        <p className="leading-relaxed text-amber-800 dark:text-amber-300">
          {context ??
            "Các thông tin gợi ý và phân tích từ Trợ lý AI chỉ mang tính chất tham khảo định hướng sức khỏe sơ bộ. Trong trường hợp khẩn cấp hoặc có dấu hiệu bệnh chuyển biến xấu, vui lòng đến ngay cơ sở y tế gần nhất hoặc gọi cấp cứu 115."}
        </p>
      </div>
    </div>
  );
};
```

---

## 8. Known Inconsistencies & Standardization Roadmap (Điểm Chưa Nhất Quán & Hướng Chuẩn Hóa)

Trong quá trình rà soát mã nguồn thực tế của `frontend/`, đã ghi nhận một số điểm chưa đồng bộ giữa các module:

| Điểm chưa nhất quán | Hiện trạng trong Code | Rủi ro / Vấn đề | Đề xuất hướng chuẩn hóa (Không sửa trong task này) |
| :--- | :--- | :--- | :--- |
| **Khởi tạo Theme ở `main.tsx` vs `Settings.tsx`** | `main.tsx` (dòng 12) gọi cố định `applyTheme("LIGHT")`. Nhưng `Settings.tsx` lại có giao diện cho người bệnh chọn `LIGHT / DARK / SYSTEM`. | Khi người bệnh chọn Dark theme và F5 lại trang, `main.tsx` ép về Light mode khiến trải nghiệm bị gián đoạn. | Chuyển `main.tsx` sang gọi `applyStoredTheme()` từ `@/utils/theme.ts` như đã định nghĩa sẵn. |
| **Lớp màu `bg-error` trong `ErrorState.tsx`** | `iconClassName="bg-error/10 text-error"` | Tailwind v4 dùng token chuẩn là `--color-destructive` (`text-destructive`), không có token `--color-error` trong `index.css`. | Đổi thành `bg-destructive/10 text-destructive` để ăn theo CSS variables toàn cục. |
| **Màu chữ xám `text-gray-*` cứng trong `StateCard.tsx`** | Dùng `text-gray-800`, `text-gray-500`, `border-gray-200`. | Khác với hệ quy chiếu `slate` (`text-slate-900`, `text-slate-500`) được dùng ở tất cả các component khác. | Chuẩn hóa toàn bộ về thang màu `slate` (`text-slate-800`, `text-slate-500`, `border-slate-200`). |
| **Lớp override `!bg-primary !text-white`** | Một vài nút trong `PatientLayout.tsx` và `EducationalDisclaimerModal.tsx` dùng tiền tố `!`. | Khó tùy biến hoặc mở rộng theme. | Dùng biến chuẩn `bg-primary text-primary-foreground` đã có trong hệ thống design token. |

---

## 9. Rules for AI Coding Agents (Quy Tắc Dành Cho Agent Lập Trình)

Mọi AI Agent khi nhận yêu cầu sửa đổi hoặc bổ sung màn hình cho `frontend/` **bắt buộc tuân thủ 7 điều răn sau**:

1. **Tuân thủ phân cấp phông chữ**:
   - Sử dụng font heading (`Be Vietnam Pro` hoặc lớp `.font-heading`) cho tất cả các thẻ tiêu đề `<h1>`–`<h3>`.
   - Sử dụng font body (`Nunito`) cho đoạn văn bản, bảng biểu, danh sách và nút bấm.
2. **Không bao giờ tự tạo màu HEX mới**:
   - Chỉ sử dụng các màu ngữ nghĩa (`primary`, `secondary`, `destructive`, `muted`, `accent`) hoặc màu trong `Calm Clinical Guidance Palette` (`--clinical-teal`, `--care-mist`).
3. **Luôn bọc Section bên dưới màn hình trong `LazyViewport`**:
   - Bắt buộc cung cấp `minHeight` ước tính thực tế và `fallback={<SectionSkeleton />}` để không gây nhảy khung hình (CLS).
4. **Luôn dùng `LazyImage` cho hình ảnh**:
   - Cung cấp đầy đủ `src`, `alt` có nghĩa, `aspectRatio` hoặc kích thước khung hình cụ thể.
5. **Giữ nguyên nhãn khuyến cáo y khoa AI**:
   - Không bao giờ xóa hoặc làm giảm độ nổi bật của hộp cảnh báo y khoa màu hổ phách (`amber`) khi chỉnh sửa các tính năng liên quan đến AI.
6. **Mọi form nhập liệu đều phải thông qua Zod Schema**:
   - Định nghĩa schema trong `src/schemas/<feature>.schema.ts`.
   - Đảm bảo hiển thị lỗi rõ ràng ngay dưới ô nhập liệu thông qua prop `error` của component `Input`.
7. **Bảo tồn trợ năng `prefers-reduced-motion`**:
   - Khi viết animation mới bằng GSAP hay Framer Motion, bắt buộc phải kiểm tra điều kiện `prefers-reduced-motion` để có phương án fallback tức thì.
