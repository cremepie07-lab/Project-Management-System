export type QACategory = 
  | "All Categories"
  | "1. Authentication"
  | "2. Board & Lists"
  | "3. Card Management"
  | "4. Pomodoro Timer"
  | "5. Filtering & Search";

export interface TestCase {
  id: string;
  category: QACategory;
  scenario: string;
  steps: string[];
  expected: string;
}

export const CATEGORIES: QACategory[] = [
  "All Categories",
  "1. Authentication",
  "2. Board & Lists",
  "3. Card Management",
  "4. Pomodoro Timer",
  "5. Filtering & Search"
];

export const QA_TEST_CASES: TestCase[] = [
  {
    id: "AUTH-01",
    category: "1. Authentication",
    scenario: "Đăng nhập thành công",
    steps: [
      "1. Truy cập trang đăng nhập (/login)",
      "2. Nhập email và mật khẩu hợp lệ",
      "3. Nhấn nút Đăng nhập"
    ],
    expected: "Hệ thống chuyển hướng vào Dashboard, góc trên hiển thị Avatar và Tên người dùng."
  },
  {
    id: "AUTH-02",
    category: "1. Authentication",
    scenario: "Đăng xuất tài khoản",
    steps: [
      "1. Nhấn vào Avatar ở góc trên cùng bên phải",
      "2. Chọn Đăng xuất (Logout)"
    ],
    expected: "Phiên đăng nhập bị hủy, hệ thống chuyển về trang chủ hoặc trang đăng nhập."
  },
  {
    id: "BOARD-01",
    category: "2. Board & Lists",
    scenario: "Tạo List mới",
    steps: [
      "1. Vào một Board bất kỳ",
      "2. Cuộn sang cột cuối cùng bên phải",
      "3. Nhấn '+ Add another list', nhập tên list và Enter"
    ],
    expected: "List mới xuất hiện lập tức trên màn hình với tên vừa nhập."
  },
  {
    id: "BOARD-02",
    category: "2. Board & Lists",
    scenario: "Kéo thả thay đổi thứ tự List",
    steps: [
      "1. Nhấn giữ phần header của một List",
      "2. Kéo thả sang vị trí giữa 2 List khác"
    ],
    expected: "Thứ tự của các List được cập nhật lại chính xác mà không cần reload trang."
  },
  {
    id: "CARD-01",
    category: "3. Card Management",
    scenario: "Tạo Card mới",
    steps: [
      "1. Nhấn '+ Add a card' dưới một List bất kỳ",
      "2. Nhập tiêu đề Card",
      "3. Nhấn Enter hoặc nút Add"
    ],
    expected: "Card mới hiển thị dưới cùng của List đó."
  },
  {
    id: "CARD-02",
    category: "3. Card Management",
    scenario: "Kéo thả Card giữa các List",
    steps: [
      "1. Nhấn giữ một Card",
      "2. Kéo sang một List bên cạnh và thả ra"
    ],
    expected: "Card nằm ở vị trí mới trong List mới một cách mượt mà."
  },
  {
    id: "POMO-01",
    category: "4. Pomodoro Timer",
    scenario: "Bắt đầu chu trình Pomodoro",
    steps: [
      "1. Mở chi tiết một Card",
      "2. Tìm khu vực Pomodoro Timer",
      "3. Nhấn nút 'Start'"
    ],
    expected: "Đồng hồ đếm ngược từ 25:00 bắt đầu chạy, trạng thái chuyển sang Work."
  },
  {
    id: "POMO-02",
    category: "4. Pomodoro Timer",
    scenario: "Đồng hồ tiếp tục chạy khi đóng modal",
    steps: [
      "1. Khi đồng hồ Pomodoro đang chạy, bấm tắt Card Modal (X)",
      "2. Xem Mini Timer xuất hiện ở góc màn hình"
    ],
    expected: "Mini Timer ở góc màn hình tiếp tục đếm ngược đồng bộ với thời gian thực."
  },
  {
    id: "FLTR-01",
    category: "5. Filtering & Search",
    scenario: "Lọc Card theo nhãn (Label)",
    steps: [
      "1. Nhấn nút Filter trên menu bar",
      "2. Tích chọn một hoặc nhiều màu nhãn (Label)"
    ],
    expected: "Board chỉ hiển thị những Card có chứa nhãn tương ứng."
  },
  {
    id: "FLTR-02",
    category: "5. Filtering & Search",
    scenario: "Tìm kiếm bằng từ khóa",
    steps: [
      "1. Mở ô tìm kiếm",
      "2. Nhập từ khóa có trong tiêu đề của một Card"
    ],
    expected: "Board tự động thu gọn lại, chỉ giữ các Card có tiêu đề khớp với từ khóa."
  }
];
