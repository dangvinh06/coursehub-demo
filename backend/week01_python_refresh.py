
# 3. Mô phỏng dữ liệu bằng list và dictionary
students = [
    {"id": "22000001", "name": "Nguyen Minh Anh", "major": "KHDL"},
    {"id": "22000002", "name": "Tran Duc Long", "major": "KHDL"},
]

courses = [
    {
        "code": "INT2204",
        "name": "Co so du lieu Web va he thong thong tin",
        "capacity": 3,
        "enrolled": 2,
    },
    {
        "code": "INT2205",
        "name": "Khai pha du lieu",
        "capacity": 2,
        "enrolled": 2,
    },
]

enrollments = [
    {"student_id": "22000001", "course_code": "INT2204"}
]

# 4. Duyệt dữ liệu và tính giá trị
for course in courses:
    remaining = course["capacity"] - course["enrolled"]
    print(course["code"], "- con", remaining, "cho")

# 5. Tách xử lý thành hàm
def find_course(course_code):
    for course in courses:
        if course["code"] == course_code:
            return course
    return None

print(find_course("INT2204"))

# 6. Mô phỏng quy tắc đăng ký
def can_enroll(student_id, course_code):
    course = find_course(course_code)

    if course is None:
        return False, "Hoc phan khong ton tai"

    if course["enrolled"] >= course["capacity"]:
        return False, "Lop da du so luong"

    duplicated = any(
        item["student_id"] == student_id and item["course_code"] == course_code
        for item in enrollments
    )
    if duplicated:
        return False, "Sinh vien da dang ky hoc phan nay"

    return True, "Co the dang ky"

print(can_enroll("22000002", "INT2204"))

# 7. Xử lý dữ liệu nhập sai
try:
    limit = int(input("Nhap so luong hoc phan muon hien thi: "))
    print(courses[:limit])
except ValueError:
    print("So luong phai la so nguyen")

# 8. Hàm tìm kiếm học phần
def search_courses(keyword):
    normalized = keyword.strip().lower()
    results = []

    for course in courses:
        code = course["code"].lower()
        name = course["name"].lower()
        if normalized in code or normalized in name:
            results.append(course)

    return results

print(search_courses("web"))




# VII. BÀI TẬP TỰ LUYỆN

#1. Hoàn thiện hàm đăng ký học phần:
# Danh sách lưu các bản ghi đăng ký thành công
enrollments = []

def enroll_student(student_id, course_code):
    # Kiểm tra sinh viên có tồn tại hay không
    student = next((s for s in students if s["id"] == student_id), None)
    if not student:
        return f"Lỗi: Không tìm thấy sinh viên có mã '{student_id}'."

    # Kiểm tra học phần có tồn tại hay không
    course = next((c for c in courses if c["code"].lower() == course_code.strip().lower()), None)
    if not course:
        return f"Lỗi: Không tìm thấy học phần có mã '{course_code}'."

    # Kiểm tra sinh viên đã đăng ký học phần này chưa (trùng lặp)
    already_enrolled = any(
        e["student_id"] == student_id and e["course_code"].lower() == course["code"].lower()
        for e in enrollments
    )
    if already_enrolled:
        return f"Lỗi: Sinh viên '{student['name']}' đã đăng ký học phần '{course['name']}' trước đó."

    # Kiểm tra lớp còn chỗ hay không
    if course["enrolled"] >= course["capacity"]:
        return f"Lỗi: Lớp học phần '{course['name']}' đã đầy (đã đủ {course['capacity']} sinh viên)."

    # 5. Nếu thỏa mãn tất cả: thêm vào enrollments và tăng số lượng enrolled
    new_enrollment = {
        "student_id": student_id,
        "course_code": course["code"]
    }
    enrollments.append(new_enrollment)
    course["enrolled"] += 1

    return f"Thành công: Đã đăng ký học phần '{course['name']}' cho sinh viên '{student['name']}'."


#2. Kiểm tra chương trình với tối thiểu 05 tình huống:
print("\n--- BẮT ĐẦU CHẠY KIỂM THỬ ENROLL_STUDENT ---")

# Giả sử trong file ban đầu có:
# students = [{"id": "SV01", "name": "Nguyen Van A"}, ...]
# courses = [{"code": "CS101", "name": "Lap trinh Python", "capacity": 30, "enrolled": 29}, ...]

# Đăng ký thành công
print("Test 1 (Thành công):", enroll_student(students[0]["id"], "INT2204"))

# Đăng ký trùng
print("Test 2 (Trùng lặp):", enroll_student(students[0]["id"], "INT2204"))

# Lớp đầy (CS101 sau Test 1 đã đạt sức chứa tối đa)
print("Test 3 (Lớp đầy):", enroll_student(students[1]["id"] if len(students) > 1 else students[0]["id"], "INT2205"))

# Mã học phần không tồn tại
print("Test 4 (Mã học phần sai):", enroll_student(students[0]["id"], "UNKNOWN999"))

# Mã sinh viên không tồn tại
print("Test 5 (Mã sinh viên sai):", enroll_student("SV999", "INT2204"))