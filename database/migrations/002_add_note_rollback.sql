-- Bài 4 (Bài tập tự thực hành) - Migration 002 Rollback:
-- - Khi chạy lệnh rollback này (xóa cột note), sẽ làm mất dữ liệu được lưu riêng trong cột note (nếu có dữ liệu cũ đã ghi vào đây).
-- - Tuy nhiên, các cột dữ liệu và thông tin lịch sử sự kiện cốt lõi khác trong bảng enrollment_events hoàn toàn không bị ảnh hưởng hay mất mát gì.
ALTER TABLE enrollment_events DROP COLUMN IF EXISTS note;
