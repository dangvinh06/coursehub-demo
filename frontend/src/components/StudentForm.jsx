// Bài 1 (Bài tập tự thực hành Buổi 5): Tách form chọn sinh viên thành StudentForm.jsx
export default function StudentForm({ studentId, onStudentIdChange, onFetchStudent }) {
  return (
    <div className="card">
      <h2>Chọn sinh viên</h2>
      <div className="form-group">
        <label htmlFor="student-select">Mã số sinh viên:</label>
        <input
          id="student-select"
          type="number"
          value={studentId}
          onChange={(e) => onStudentIdChange(Number(e.target.value))}
          placeholder="Nhập ID sinh viên..."
        />
        <button onClick={onFetchStudent}>Xem danh sách đăng ký</button>
      </div>
    </div>
  );
}