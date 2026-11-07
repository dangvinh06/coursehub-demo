# CourseHub - Buoi 4
- Migration 001: enrollment_events.
- Demo class: RACE-01, capacity = 1.
- POST /enrollments: lock class_sections bang FOR UPDATE.
- Concurrency test: 1 request 201, 1 request 409.
- Performance data: 100000 rows, dataset=performance.
- Index: idx_enrollment_events_dataset_student_time.
- Execution Time truoc va sau khi tao Index:
  + Truoc khi tao Index (Seq Scan): 15.469 ms
  + Sau khi tao Index (Index Scan): 0.226 ms

Khong commit backend/.env.