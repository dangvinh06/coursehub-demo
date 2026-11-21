# Buổi 6 - Docker, Testing, CI

## Môi trường
- OS:
- Docker version:
- Python / Node version: 3.12 (Docker + CI) / 22.12

## Kết quả local
- pytest backend/tests -q:
- npm test:
- npm run build:
- docker compose up --build:

## Một luồng tích hợp đã kiểm tra
- Request:
- HTTP status:
- SQL xác nhận:

## Debug / AI
- Lỗi gặp phải:
- Bằng chứng đã xem:
- Nếu dùng AI: gợi ý nào đã dùng và đã xác minh thế nào?

## Pull Request / CI
- PR:
- Reviewer:
- CI run: pass/fail và nguyên nhân nếu fail

## Ghi chú
- CI cấp biến DB_* qua GitHub Actions Variables (Settings > Secrets and variables > Actions > Variables): DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD. Giá trị giả, test contract không kết nối DB thật.
