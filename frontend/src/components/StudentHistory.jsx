// Bài 3 (Bài tập tự thực hành Buổi 5): Màn hình lịch sử của sinh viên có phân trang
import { useState, useEffect } from "react";
import { api } from "../api";

export default function StudentHistory({ studentId }) {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 5;

  useEffect(() => {
    api(`/enrollment-events?student_id=${studentId}&page=${page}&limit=${limit}`)
      .then((data) => setEvents(data))
      .catch((err) => console.error("Lỗi tải lịch sử sự kiện:", err));
  }, [studentId, page]);

  return (
    <div className="card" style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "6px" }}>
      <h3>Bài 3 & 4: Lịch sử sự kiện đăng ký (Phân trang)</h3>
      {events.length === 0 ? (
        <p style={{ color: "#666" }}>Không có lịch sử sự kiện nào cho sinh viên này.</p>
      ) : (
        <ul style={{ paddingLeft: "20px" }}>
          {events.map((ev, idx) => (
            <li key={idx} style={{ marginBottom: "6px" }}>
              <strong>{ev.timestamp ? new Date(ev.timestamp).toLocaleString() : "Vừa xong"}</strong>: 
              Sinh viên <strong>{ev.student_id || studentId}</strong> đã 
              <span style={{ color: (ev.action === "REGISTER" || ev.action === "Đăng ký") ? "green" : "red", fontWeight: "bold" }}> 
                {" " + (ev.action || "Thao tác") + " "} 
              </span> 
              lớp học phần <code>{ev.class_section_id || ev.class_id || ev.section_id || "N/A"}</code>
            </li>
          ))}
        </ul>
      )}
      
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
        <button 
          disabled={page <= 1} 
          onClick={() => setPage((p) => p - 1)}
          style={{ padding: "4px 10px", cursor: page <= 1 ? "not-allowed" : "pointer" }}
        >
          Trang trước
        </button>
        <span>Trang {page}</span>
        <button 
          onClick={() => setPage((p) => p + 1)}
          style={{ padding: "4px 10px", cursor: "pointer" }}
        >
          Trang sau
        </button>
      </div>
    </div>
  );
}