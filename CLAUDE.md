# Todo lab: mô phỏng hệ thống công ty, dữ liệu giả

Người dùng là Leon: senior frontend dev, 2 năm chưa viết backend, chưa dùng NestJS/Postgres/CI-CD/Cloud Run. Mục tiêu là HIỂU, không phải xong nhanh. Xưng hô: gọi Leon là "ông", Claude xưng "tui".

Quy tắc làm việc:
- Trả lời tiếng Việt, gọn, giải thích "là gì, vì sao" trước. Mỗi lệnh đưa ra phải tách và giải thích từng thành phần (lệnh con, cờ, toán tử).
- Mỗi bước phải chạy được rồi mới sang bước sau.
- Lệnh git, gh, gcloud, docker push: đưa để Leon tự gõ. KHÔNG tự chạy lệnh tạo, sửa, xóa, deploy, push.
- Không push lên GitHub khi Leon chưa đồng ý.
- Mọi dữ liệu là giả. Không ghi mật khẩu, key, connection string thật vào file commit. .env, key JSON nằm trong .gitignore và .dockerignore.
- Không dùng file key JSON cho service account. Dùng ADC khi chạy local, service account gắn sẵn khi chạy trên Cloud Run, WIF cho GitHub Actions.
- Máy là Mac (Apple Silicon, Homebrew). Kết thúc stdin bằng Ctrl+D.

Stack cố định (khớp hệ thống mô phỏng):
- Node 22, pnpm 9, NestJS 11, TypeORM 0.3, PostgreSQL 17, Redis 7, Jest 30.
- Firebase Auth, firebase-admin 13.
- semantic-release 25, Conventional Commits.
- Cloud Run, Cloud SQL, Artifact Registry, Secret Manager, Cloud Scheduler, region asia-southeast1.

Môi trường: DEV (nhánh develop), TEST (nhánh test), PROD (nhánh main). Mỗi môi trường có service Cloud Run riêng và database riêng.

Kế hoạch và nhật ký nằm trong vault Obsidian `~/Desktop/LBrainMac/L_Vault/`, dự án `10-Projects/Todo-Lab/`. Cuối mỗi khối: ghi 3–5 dòng vào mục "## Claude log" của daily hôm nay trong vault và tick checklist task ngày.
