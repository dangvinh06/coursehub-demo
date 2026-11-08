-- rollback - chỉ dùng khi chấp nhận mất dữ liệu
BEGIN;
DROP TABLE enrollment_events;
DELETE FROM schema_migrations WHERE version = '001';
COMMIT;