const BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export async function api(path, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Không nhận được phản hồi từ API. Kiểm tra Backend/CORS " +
      "và kết nối dữ liệu khi gọi thao tác."
    );
  }

  // DELETE thành công trả 204: không có JSON trả về.
  if (response.status === 204) return null;
  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`HTTP ${response.status}: phản hồi không phải JSON.`);
  }
  if (!response.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join("; ")
      : typeof detail === "string" ? detail : "Yêu cầu không thành công.";
    const error = new Error(`HTTP ${response.status}: ${message}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

const API_BASE_URL = "http://localhost:8000";

// Bài 2 (Bài tập tự thực hành Buổi 5): Lấy danh sách học phần
export async function getCourses() {
  const res = await fetch(`${API_BASE_URL}/courses`);
  if (!res.ok) throw new Error("Không thể tải danh sách học phần");
  return res.json();
}

// Bài 3 (Bài tập tự thực hành Buổi 5): Lấy lịch sử sự kiện đăng ký có phân trang
export async function getStudentHistory(studentId, page = 1, limit = 10) {
  const res = await fetch(
    `${API_BASE_URL}/enrollment-events?student_id=${studentId}&page=${page}&limit=${limit}`
  );
  if (!res.ok) throw new Error("Không thể tải nhật ký đăng ký");
  return res.json();
}