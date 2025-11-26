## 1. Kiến trúc tổng thể

**Frontend (Bolt + Antigravity UI)**

* Xây bằng React/Next (Bolt thường generate React/Next)
* Giao diện:

  * Trang đăng nhập/đăng ký
  * Dashboard điểm
  * Trang nhập/chỉnh sửa môn học và điểm
  * Trang quy đổi điểm
  * Trang biểu đồ
  * Chatbot (panel bên phải hoặc popup)

**Backend / Database (Supabase)**

* Authentication: dùng **Supabase Auth**
* Database: PostgreSQL (Supabase)
* Row Level Security (RLS) để mỗi user chỉ thấy dữ liệu của mình
* Realtime (nếu cần cập nhật điểm/biểu đồ realtime)

---

## 2. Thiết kế database Supabase

### Bảng `users` (có thể tận dụng `auth.users` của Supabase)

Nếu dùng thêm bảng profile riêng:

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  fpt_student_code text, -- mã sinh viên
  created_at timestamptz default now()
);
```

### Bảng `semesters` (học kỳ)

```sql
create table semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,          -- VD: "Spring 2025"
  index_order int not null,    -- để sắp xếp các kỳ
  created_at timestamptz default now()
);
```

### Bảng `courses` (môn học)

```sql
create table courses (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid references semesters(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,          -- vd: "AIG"
  credit int not null,         -- số tín chỉ
  created_at timestamptz default now()
);
```

### Bảng `course_components` (các cột điểm: FE, LAB, PE, PT,…)

```sql
create table course_components (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  name text not null,      -- "FE", "LAB", ...
  weight numeric not null, -- trọng số % (ví dụ 30 cho 30%)
  score numeric,           -- điểm số (0–10)
  created_at timestamptz default now()
);
```

> **Tính điểm môn:**
> Điểm tổng môn = Σ( score * weight/100 ).
> Sau đó **làm tròn 1 chữ số thập phân**.

Bạn có thể tính trực tiếp trên FE hoặc làm view / function trong DB.

### View `course_with_total` (gợi ý)

```sql
create view course_with_total as
select
  c.id,
  c.semester_id,
  c.user_id,
  c.name,
  c.credit,
  round((
    select coalesce(sum(cc.score * (cc.weight/100.0)), 0)
    from course_components cc
    where cc.course_id = c.id
  )::numeric, 1) as total_score_10
from courses c;
```

---

## 3. Tính GPA một kỳ

Công thức bạn đưa:

> Điểm tổng của một kì =
> (Σ (điểm trung bình môn * số tín chỉ)) / (tổng số tín chỉ của kì)

Giả sử dùng hệ 10, sau đó có thể convert sang hệ 4.

Ví dụ query:

```sql
select
  s.id as semester_id,
  s.name,
  round(
    sum(cwt.total_score_10 * cwt.credit)::numeric
    / nullif(sum(cwt.credit), 0),
    2
  ) as semester_avg_10
from semesters s
join course_with_total cwt on cwt.semester_id = s.id
where s.user_id = auth.uid()
group by s.id, s.name
order by s.index_order;
```

---

## 4. Quy đổi điểm hệ 10 ↔ hệ 4

Tuỳ bảng quy đổi của FPT (bạn nên dùng đúng thang của trường).
Ví dụ (minh hoạ, bạn thay bằng chuẩn của FPT):

* 8.5–10: 4.0
* 8.0–8.4: 3.7
* 7.0–7.9: 3.0
* 6.5–6.9: 2.5
* ...

Trên FE (Bolt), bạn tạo 1 hàm:

```ts
function convert10to4(score10: number): number {
  if (score10 >= 8.5) return 4.0;
  if (score10 >= 8.0) return 3.7;
  if (score10 >= 7.0) return 3.0;
  if (score10 >= 6.5) return 2.5;
  // ...
  return 0;
}
```

Và ngược lại (4 → 10) có thể lấy range trung bình, hoặc chỉ mang tính tham khảo.

---

## 5. Các màn hình chính trên website

### 5.1. Auth: Đăng ký / Đăng nhập / Đổi mật khẩu

Dùng **Supabase Auth**:

* `signUp({ email, password })`
* `signInWithPassword({ email, password })`
* `updateUser({ password: newPassword })`
* Trang:

  * `/auth/login`
  * `/auth/register`
  * `/auth/reset-password` (nếu muốn)

### 5.2. Dashboard

Hiển thị:

* Danh sách các kỳ
* GPA từng kỳ (hệ 10 & hệ 4)
* GPA tích luỹ
* Biểu đồ đường GPA theo kỳ (dùng chart library, Antigravity/Chart.js/Recharts)

Data cho chart: array như:

```ts
[
  { semester: 'Spring 2025', gpa10: 8.1, gpa4: 3.5 },
  { semester: 'Summer 2025', gpa10: 8.5, gpa4: 3.7 },
  ...
]
```

### 5.3. Quản lý điểm từng môn

Trang ví dụ `/semester/[id]`:

* Danh sách môn trong kỳ:

  * Tên môn
  * Số tín chỉ
  * Điểm tổng (hệ 10, 1 chữ số thập phân)
* Khi click vào một môn:

  * Popup/ trang chi tiết:

    * Danh sách các cột điểm (FE, LAB, PE, PT,…)
    * Input điểm từng cột
    * Input trọng số (%)
    * Tính dynamic: điểm tổng môn hiển thị ngay trên UI

Có nút:

* Thêm cột điểm
* Xoá cột điểm
* Xoá môn
* Chỉnh sửa tên môn, số tín chỉ

### 5.4. Quy đổi điểm

Một trang riêng:

* Ô nhập điểm hệ 10 → ra hệ 4
* Ô nhập điểm hệ 4 → ra hệ 10
* Có thể kèm bảng quy đổi chuẩn để người dùng tham khảo.

---

## 6. Biểu đồ đường theo kỳ

* Data lấy từ query GPA các kỳ.
* Frontend:

  * Dùng component chart (line chart)
  * Trục X: tên kỳ
  * Trục Y: điểm (có thể chọn hiển thị hệ 10 hoặc hệ 4, hoặc 2 line)

---

## 7. Chatbot hỗ trợ

Tuỳ bạn muốn dùng gì:

* Tích hợp ChatGPT API / OpenAI API
* Hoặc 1 chatbot rule-based đơn giản
* Gợi ý feature:

  * Giải thích cách tính GPA
  * Gợi ý “để đạt GPA X thì các môn cần bao nhiêu điểm”
  * Giải thích bảng quy đổi điểm

UI:

* Nút chat dạng bubble ở góc phải
* Khi mở ra có khung chat, input text.

---

## 8. Một số logic tính toán cụ thể

### 8.1. Tính điểm tổng môn (trên FE)

```ts
type Component = { score?: number; weight: number };

function calcCourseTotal(components: Component[]): number {
  const total = components.reduce((sum, c) => {
    if (typeof c.score !== 'number') return sum;
    return sum + c.score * (c.weight / 100);
  }, 0);

  // làm tròn 1 chữ số thập phân
  return Math.round(total * 10) / 10;
}
```

### 8.2. Tính GPA kỳ (FE)

```ts
type Course = { credit: number; totalScore10: number };

function calcSemesterGPA10(courses: Course[]): number {
  const totalCredits = courses.reduce((s, c) => s + c.credit, 0);
  if (totalCredits === 0) return 0;

  const sum = courses.reduce(
    (s, c) => s + c.totalScore10 * c.credit,
    0
  );
  return Math.round((sum / totalCredits) * 100) / 100; // 2 chữ số thập phân
}
```

Sau đó convert sang hệ 4 nếu muốn.

---

## 9. Quyền truy cập & bảo mật (Supabase RLS)

Trên các bảng `semesters`, `courses`, `course_components`:

Ví dụ cho `semesters`:

```sql
alter table semesters enable row level security;

create policy "Users can manage their own semesters"
on semesters
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

Làm tương tự cho các bảng còn lại để đảm bảo mỗi user chỉ nhìn thấy / chỉnh sửa dữ liệu của mình.

---

## 10. Gợi ý plan triển khai

1. **Setup project Bolt + Supabase**

   * Tạo project trên Supabase
   * Setup Supabase client trên Bolt project
   * Tạo bảng + RLS
2. **Auth**

   * Làm xong login / register / logout
3. **CRUD Semesters + Courses + Components**
4. **Tính điểm + hiển thị GPA kỳ**
5. **Biểu đồ GPA**
6. **Trang quy đổi điểm**
7. **Chatbot (API)**
8. **Polish UI với Antigravity (buttons, forms, tables)**


