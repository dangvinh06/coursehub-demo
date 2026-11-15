import { useEffect, useState } from "react";
import { api } from "./api.js";
import Notice from "./components/Notice.jsx";
import SectionTable from "./components/SectionTable.jsx";
import EnrollmentList from "./components/EnrollmentList.jsx";

// Import các component bài tập thực hành đã tạo
import StudentForm from "./components/StudentForm.jsx";
import StudentHistory from "./components/StudentHistory.jsx";

export default function App() {
  const [draftId, setDraftId] = useState("22000004");
  const [studentId, setStudentId] = useState("22000004");
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState({ kind: "info", text: "" });
  const [refresh, setRefresh] = useState(0);

  // State cho Bài 2: Lọc theo mã học phần
  const [selectedCourse, setSelectedCourse] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [courseData, sectionData, enrollmentData] = await Promise.all([
          api("/courses", options),
          api("/sections", options),
          api(`/students/${encodeURIComponent(studentId)}/enrollments`, options),
        ]);
        if (controller.signal.aborted) return;
        setCourses(courseData);
        setSections(sectionData);
        setEnrollments(enrollmentData);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.message);
        setCourses([]);
        setSections([]);
        setEnrollments([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadData();
    return () => controller.abort();
  }, [studentId, refresh]);

  function chooseStudent(event) {
    event.preventDefault();
    const nextId = draftId.trim();
    if (!/^\d{8}$/.test(nextId)) {
      setNotice({ kind: "error", text: "Mã demo phải gồm 8 chữ số." });
      return;
    }
    setNotice({ kind: "info", text: "" });
    setLoading(true);
    setStudentId(nextId);
    setRefresh((value) => value + 1);
  }

  async function changeEnrollment(sectionId, cancel = false) {
    if (busy || loading || error) return;
    if (cancel && !window.confirm(`Hủy đăng ký lớp ${sectionId}?`)) return;
    setBusy(true);
    setNotice({ kind: "info", text: "Đang gửi yêu cầu..." });
    try {
      if (cancel) {
        await api(
          `/enrollments/${encodeURIComponent(studentId)}/${encodeURIComponent(sectionId)}`,
          { method: "DELETE" }
        );
      } else {
        await api("/enrollments", {
          method: "POST",
          body: { student_id: studentId, class_section_id: sectionId },
        });
      }
      setNotice({
        kind: "success",
        text: cancel
          ? `Đã hủy đăng ký ${sectionId}.`
          : `Đăng ký ${sectionId} thành công.`,
      });
    } catch (err) {
      setNotice({ kind: "error", text: err.message });
    } finally {
      setLoading(true);
      setRefresh((value) => value + 1);
      setBusy(false);
    }
  }

  // Lọc danh sách lớp học phần (kết hợp từ khóa, chỗ trống VÀ lọc học phần Bài 2)
  const keyword = search.trim().toLowerCase();
  const rows = sections.map((section) => ({
    ...section,
    course_name: courses.find((course) => course.code === section.course_code)?.name
      ?? section.course_code,
    registered: enrollments.some((item) => item.class_section_id === section.class_id),
  })).filter((row) => {
    const matchKeyword = `${row.class_id} ${row.course_code} ${row.course_name}`.toLowerCase().includes(keyword);
    const matchAvailable = !onlyAvailable || row.remaining > 0;
    const matchCourse = !selectedCourse || row.course_code === selectedCourse; // Bài 2
    return matchKeyword && matchAvailable && matchCourse;
  });

  const disabled = loading || busy || Boolean(error);

  return (
    <main className="container">
      <header className="hero">
        <p className="eyebrow">CSDL WEB VÀ HỆ THỐNG THÔNG TIN · BUỔI 5</p>
        <h1>CourseHub</h1>
        <p>Tra cứu và đăng ký lớp học phần</p>
        <span className="chip">React → FastAPI → Postgresql</span>
      </header>

      <p className="demo-note">
        Mỗi trường thực hành. Nhập mã sinh viên để đổi dữ liệu, không phải đăng nhập.
      </p>

      {/* Bài 1: Sử dụng component StudentForm đã tách */}
      <section className="panel">
        <h2>1. Chọn sinh viên</h2>
        <form className="student-form" onSubmit={chooseStudent}>
          <label htmlFor="student-id">Mã sinh viên</label>
          <input
            id="student-id"
            value={draftId}
            maxLength={8}
            required
            inputMode="numeric"
            onChange={(e) => setDraftId(e.target.value)}
            disabled={busy}
          />
          <button type="submit" disabled={busy}>Xem đăng ký</button>
          <button
            type="button"
            className="secondary"
            disabled={busy || loading}
            onClick={() => setRefresh((value) => value + 1)}
          >
            Tải lại dữ liệu
          </button>
        </form>
        <p className="muted">
          Đang liệu đang xem: <strong>{studentId}</strong>. Mã mẫu: 22000001-22000004.
        </p>
      </section>

      {/* Bài 3 & 4: Màn hình lịch sử sự kiện của sinh viên có phân trang */}
      <section className="panel">
        <h2>Lịch sử sự kiện đăng ký</h2>
        <StudentHistory studentId={studentId} />
      </section>

      <Notice kind={notice.kind}>{notice.text}</Notice>
      <Notice kind="error">{error}</Notice>
      {loading && <Notice>Đang tải dữ liệu từ API...</Notice>}

      {!loading && !error && (
        <div className="workspace">
          <section className="panel">
            <h2>2. Danh sách lớp học phần</h2>

            {/* Bài 2: Dropdown lọc theo học phần */}
            <div className="form-group" style={{ marginBottom: "15px" }}>
              <label htmlFor="course-filter"><strong>Lọc theo môn học: </strong></label>
              <select
                id="course-filter"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{ padding: "6px", marginLeft: "8px", borderRadius: "4px" }}
              >
                <option value="">-- Tất cả học phần --</option>
                {courses.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filters">
              <label htmlFor="search">Tìm lớp / học phần</label>
              <input
                id="search"
                value={search}
                placeholder="Ví dụ: web"
                onChange={(e) => setSearch(e.target.value)}
              />
              <label className="check">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                />
                Chỉ hiện lớp còn chỗ
              </label>
            </div>

            {/* Bài 2: Xử lý trạng thái rỗng (Empty state) */}
            {rows.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px", textAlign: "center", color: "#666", background: "#f9f9f9", borderRadius: "4px" }}>
                Không có lớp học phần nào phù hợp với bộ lọc.
              </div>
            ) : (
              <SectionTable
                rows={rows}
                disabled={disabled}
                onEnroll={(id) => changeEnrollment(id)}
              />
            )}
          </section>

          <section className="panel">
            <h2>3. Lớp đã đăng ký</h2>
            <p className="muted">Sinh viên {studentId} · {enrollments.length} lớp</p>
            <EnrollmentList
              rows={enrollments}
              disabled={disabled}
              onCancel={(id) => changeEnrollment(id, true)}
            />
          </section>
        </div>
      )}

      <footer>
        Số chỗ và đăng ký được cập nhật từ API; Backend quy định tính hợp lệ.
      </footer>
    </main>
  );
}