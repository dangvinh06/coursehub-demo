from __future__ import annotations

import logging

from fastapi import FastAPI, Depends, HTTPException, Query, Response, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from .database import engine
from .schemas import EnrollmentCreate

logger = logging.getLogger(__name__)

from sqlalchemy.orm import sessionmaker

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from pydantic import BaseModel
class CapacityUpdate(BaseModel):
    capacity: int

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(
    title="CourseHub API",
    version="0.3.0",
    description="API thuc hanh Buoi 3 - Co so du lieu Web va he thong thong tin",
)

@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "CourseHub API dang hoat dong"}

@app.get("/health")
def health_check() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        logger.exception("Khong ket noi duoc co so du lieu")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Khong ket noi duoc co so du lieu",
        ) from exc
    return {"status": "ok", "database": "connected"}

#3. GET /courses - query parameter
@app.get("/courses")
def list_courses(
    q: str | None = Query(default=None, min_length=1),
    skip: int = 0,
    limit: int = 10,
) -> list[dict[str, object]]:
    sql = """
        SELECT code, name, credits
        FROM courses
    """
    parameters: dict[str, object] = {}

    if q is not None:
        keyword = q.strip().lower()
        if not keyword:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tu khoa tim kiem khong duoc rong",
            )
        
        sql += """
            WHERE LOWER(code) LIKE :keyword
               OR LOWER(name) LIKE :keyword
        """
        parameters["keyword"] = f"%{keyword}%"

    sql += " ORDER BY code OFFSET :skip LIMIT :limit"
    parameters["skip"] = skip
    parameters["limit"] = limit

    with engine.connect() as connection:
        rows = connection.execute(text(sql), parameters).mappings().all()

    return [dict(row) for row in rows]

# 4. GET /courses/{course_code} - path parameter
@app.get("/courses/{course_code}")
def get_course(course_code: str) -> dict[str, object]:
    sql = """
        SELECT code, name, credits
        FROM courses
        WHERE code = :course_code
    """

    with engine.connect() as connection:
        row = connection.execute(
            text(sql),
            {"course_code": course_code.upper()},
        ).mappings().first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Khong tim thay hoc phan",
        )

    return dict(row)

# 5. GET /sections - đọc view của Buổi 2
@app.get("/sections")
def list_sections(
    available_only: bool = False,
) -> list[dict[str, object]]:
    sql = """
        SELECT class_id, course_code, capacity, enrolled, remaining
        FROM v_section_summary
    """

    if available_only:
        sql += " WHERE remaining > 0"

    sql += " ORDER BY class_id"

    with engine.connect() as connection:
        rows = connection.execute(text(sql)).mappings().all()

    return [dict(row) for row in rows]

#6. GET đăng ký của một sinh viên
@app.get("/students/{student_id}/enrollments")
def list_student_enrollments(student_id: str) -> list[dict[str, object]]:
    student_sql = "SELECT id FROM students WHERE id = :student_id"
    enrollment_sql = """
        SELECT e.student_id,
               s.name AS student_name,
               cs.id AS class_section_id,
               c.code AS course_code,
               c.name AS course_name,
               e.registered_at
        FROM enrollments AS e
        JOIN students AS s ON s.id = e.student_id
        JOIN class_sections AS cs ON cs.id = e.class_section_id
        JOIN courses AS c ON c.code = cs.course_code
        WHERE e.student_id = :student_id
        ORDER BY cs.id
    """

    with engine.connect() as connection:
        student = connection.execute(
            text(student_sql),
            {"student_id": student_id},
        ).first()

        if student is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Khong tim thay sinh vien",
            )

        rows = connection.execute(
            text(enrollment_sql),
            {"student_id": student_id},
        ).mappings().all()

    return [dict(row) for row in rows]

# 7. POST /enrollments - request body và nghiệp vụ ghi dữ liệu
@app.post(
    "/enrollments",
    status_code=status.HTTP_201_CREATED,
)
def create_enrollment(payload: EnrollmentCreate) -> dict[str, str]:
    student_sql = "SELECT id FROM students WHERE id = :student_id"
    section_sql = """
        SELECT cs.id,
               cs.capacity,
               COUNT(e.student_id) AS enrolled
        FROM class_sections AS cs
        LEFT JOIN enrollments AS e ON e.class_section_id = cs.id
        WHERE cs.id = :class_section_id
        GROUP BY cs.id, cs.capacity
    """
    duplicate_sql = """
        SELECT 1
        FROM enrollments
        WHERE student_id = :student_id
          AND class_section_id = :class_section_id
    """
    insert_sql = """
        INSERT INTO enrollments (student_id, class_section_id)
        VALUES (:student_id, :class_section_id)
    """
    parameters = {
        "student_id": payload.student_id,
        "class_section_id": payload.class_section_id,
    }

    with engine.begin() as connection:
        student = connection.execute(
            text(student_sql),
            {"student_id": payload.student_id},
        ).first()
        if student is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Khong tim thay sinh vien",
            )

        section = connection.execute(
            text(section_sql),
            {"class_section_id": payload.class_section_id},
        ).mappings().first()
        if section is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Khong tim thay lop hoc phan",
            )

        duplicated = connection.execute(
            text(duplicate_sql),
            parameters,
        ).first()
        if duplicated is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Sinh vien da dang ky lop nay",
            )

        if int(section["enrolled"]) >= int(section["capacity"]):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Lop hoc phan da het cho",
            )

        connection.execute(text(insert_sql), parameters)

    return {
        "message": "Dang ky thanh cong",
        "student_id": payload.student_id,
        "class_section_id": payload.class_section_id,
    }

# 8. DELETE /enrollments/{student_id}/{class_section_id}
@app.delete(
    "/enrollments/{student_id}/{class_section_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_enrollment(student_id: str, class_section_id: str) -> Response:
    sql = """
        DELETE FROM enrollments
        WHERE student_id = :student_id
          AND class_section_id = :class_section_id
    """

    with engine.begin() as connection:
        result = connection.execute(
            text(sql),
            {
                "student_id": student_id,
                "class_section_id": class_section_id,
            },
        )

        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Khong tim thay dang ky",
            )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


## BÀI TẬP TỰ THỰC HÀNH

# Bài 1. API danh sách giảng viên
@app.get("/lecturers")
def get_lecturers(db: Session = Depends(get_db)):
    query = text("""
        SELECT id, name
        FROM lecturers
        ORDER BY id ASC;
    """)
    result = db.execute(query).fetchall()
    return [{"id": row.id, "name": row.name} for row in result]

# Bài 2. API chi tiết một lớp học phần
@app.get("/sections/{section_id}")
def get_section_detail(section_id: str, db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT 
                cs.id AS class_id,
                c.code AS course_code,
                c.name AS course_name,
                s.name AS semester,
                l.id AS lecturer_id,
                l.name AS lecturer,
                cs.capacity,
                COALESCE(v.enrolled, 0) AS enrolled,
                COALESCE(v.remaining, cs.capacity) AS remaining
            FROM class_sections cs
            JOIN courses c ON cs.course_code = c.code
            LEFT JOIN lecturers l ON cs.lecturer_id = l.id
            LEFT JOIN semesters s ON cs.semester_code = s.code
            LEFT JOIN v_section_summary v ON cs.id = v.class_id
            WHERE cs.id = :section_id;
        """)
        result = db.execute(query, {"section_id": section_id}).fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")
        
    if not result:
        raise HTTPException(status_code=404, detail="Khong tim thay lop hoc phan")
        
    row_dict = result._asdict()
    return {
        "class_id": row_dict.get("class_id"),
        "course_code": row_dict.get("course_code"),
        "course_name": row_dict.get("course_name"),
        "semester": row_dict.get("semester"),
        "lecturer_id": row_dict.get("lecturer_id"),
        "lecturer": row_dict.get("lecturer"),
        "capacity": row_dict.get("capacity"),
        "enrolled": row_dict.get("enrolled"),
        "remaining": row_dict.get("remaining")
    }

# Bài 3. API cập nhật sức chứa lớp học phần
@app.patch("/sections/{section_id}/capacity")
def update_section_capacity(section_id: str, payload: CapacityUpdate, db: Session = Depends(get_db)):
    try:
        # Kiểm tra lớp học phần có tồn tại không và lấy số lượng đã đăng ký
        query_check = text("""
            SELECT cs.id, cs.capacity, COALESCE(v.enrolled, 0) AS enrolled
            FROM class_sections cs
            LEFT JOIN v_section_summary v ON cs.id = v.class_id
            WHERE cs.id = :section_id;
        """)
        section = db.execute(query_check, {"section_id": section_id}).fetchone()
        
        if not section:
            raise HTTPException(status_code=404, detail="Khong tim thay lop hoc phan")
            
        # Kiểm tra nếu sức chứa mới nhỏ hơn số sinh viên đã đăng ký -> Báo lỗi 409 Conflict
        if payload.capacity < section.enrolled:
            raise HTTPException(status_code=409, detail="Suc chua moi khong duoc nho hon so sinh vien da dang ky")
            
        # Cập nhật sức chứa mới
        query_update = text("""
            UPDATE class_sections
            SET capacity = :capacity
            WHERE id = :section_id;
        """)
        db.execute(query_update, {"capacity": payload.capacity, "section_id": section_id})
        db.commit()
        
        # Trả về thông tin sau khi cập nhật để test script kiểm tra
        query_result = text("""
            SELECT 
                cs.id AS class_id,
                cs.capacity,
                COALESCE(v.enrolled, 0) AS enrolled,
                COALESCE(v.remaining, cs.capacity - COALESCE(v.enrolled, 0)) AS remaining
            FROM class_sections cs
            LEFT JOIN v_section_summary v ON cs.id = v.class_id
            WHERE cs.id = :section_id;
        """)
        res = db.execute(query_result, {"section_id": section_id}).fetchone()._asdict()
        return res
        
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

# Bài 4. Tìm kiếm và phân trang
@app.get("/courses")
def get_courses(
    q: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    sql = "SELECT code, name, credits FROM courses"
    params = {}
    
    if q is not None:
        if not q.strip():
            raise HTTPException(status_code=400, detail="Tu khoa tim kiem khong duoc rong")
        sql += " WHERE LOWER(name) LIKE :q OR LOWER(code) LIKE :q"
        params["q"] = f"%{q.strip().lower()}%"
        
    sql += " ORDER BY code ASC OFFSET :skip LIMIT :limit;"
    params["skip"] = skip
    params["limit"] = limit
    
    result = db.execute(text(sql), params).fetchall()
    return [{"code": r.code, "name": r.name, "credits": r.credits} for r in result]
