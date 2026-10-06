-- Đăng ký trùng một lớp
INSERT INTO enrollments (student_id, class_section_id)
VALUES ('22000001', 'WEB-01');

-- Đăng ký cho sinh viên không tồn tại
INSERT INTO enrollments (student_id, class_section_id)
VALUES ('22999999', 'WEB-01');

-- Đổi sức chứa lớp thành 0
UPDATE class_sections
SET capacity = 0
WHERE id = 'WEB-01';

-- Bỏ trống số tín chỉ
UPDATE courses
SET credits = NULL
WHERE code = 'INT2204';

-- Dùng lại email của sinh viên khác
UPDATE students
SET email = 'anh@example.com'
WHERE id = '22000002';

-- Nhập họ tên chỉ gồm dấu cách
UPDATE students
SET name = '   '
WHERE id = '22000004';

-- Kiểm tra dữ liệu sau các lần bị từ chối
SELECT COUNT(*) AS total_enrollments
FROM enrollments;