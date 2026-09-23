# Cập nhật trang "Tra cứu pháp lý" — 23/09/2026

Đây là các file ĐÃ THAY ĐỔI hoặc MỚI, giữ nguyên đường dẫn tương đối so với
gốc repo (`contract-ai-backend/` và `frontend/`). Chép đè vào repo của bạn
theo đúng đường dẫn.

## 1. Đổi nhãn (không cần migration)
- "Lĩnh vực hoạt động" → "Lĩnh vực"
  (`frontend/app/legal-lookup/page.tsx`)
- "Đánh giá pháp lý & rủi ro" → "Kết quả tổng hợp"
  (`frontend/app/legal-lookup/_components/live.tsx`,
  `frontend/app/legal-lookup/page.tsx`)

## 2. Tính năng mới: "Cập nhật VBPL/Án lệ/Bản án"
Ô nhập liệu mới trên trang Tra cứu pháp lý (`frontend/app/legal-lookup/_components/contribute.tsx`,
gắn vào `page.tsx`), mở cho **Admin và khách hàng** đã đăng nhập:
- Dán toàn văn văn bản/án lệ/bản án + tên nguồn/link nguồn (tuỳ chọn).
- Backend (`POST /legal/contribute`) gọi OpenAI để **tự phân loại** (loại
  tài liệu, lĩnh vực, chuyên đề, số hiệu, cơ quan, ngày ban hành, tóm tắt),
  rồi **lưu vào cơ sở dữ liệu** `legal_documents` / `legal_chunks` sẵn có
  (khác với phần tra cứu TRỰC TIẾP phía trên, vốn không lưu trữ).
- Tài liệu được lưu sẽ dùng được ngay cho các lượt tra cứu sau qua
  `GET /legal/search` (module tra cứu có sẵn — `app/api/legal.py`).
- Trạng thái ban đầu luôn là "Chưa xác minh" (kể cả khi AI đọc thấy "Còn
  hiệu lực" trong văn bản) vì đây là nội dung người dùng tự dán vào, chưa
  qua đối chiếu; Admin có thể sửa lại qua `PUT /legal/admin/documents`.
- Có giới hạn lượt/ngày cho khách hàng (`LEGAL_CONTRIBUTE_DAILY_LIMIT`,
  mặc định 20/ngày) để kiểm soát chi phí gọi OpenAI; Admin không giới hạn.

### File mới
- `backend/app/services/legal_classify.py` — gọi OpenAI phân loại văn bản.
- `backend/app/models/legal_contribute_usage.py` — bộ đếm lượt/ngày.
- `backend/alembic/versions/f3a7c1d9b2e4_add_legal_contribute.py` — migration:
  thêm cột `legal_documents.contributed_by_user_id` + bảng
  `legal_contribute_usage`.
- `frontend/app/legal-lookup/_components/contribute.tsx` — ô UI.

### File đã sửa
- `backend/app/core/config.py` — thêm `LEGAL_CONTRIBUTE_*` settings.
- `backend/app/models/legal_document.py` — thêm cột `contributed_by_user_id`.
- `backend/app/main.py`, `backend/alembic/env.py` — đăng ký model mới.
- `backend/app/schemas/legal.py` — thêm `LegalContributeIn`/`LegalContributeOut`.
- `backend/app/api/legal.py` — thêm `POST /legal/contribute`.
- `frontend/lib/api.ts` — thêm `contributeLegalDocument()`.
- `frontend/app/legal-lookup/page.tsx` — gắn `<ContributeBox />`, đổi nhãn.
- `frontend/app/legal-lookup/_components/live.tsx` — đổi nhãn nhóm `danh_gia`.

## 3. Việc cần làm trước khi deploy
1. Chạy migration: `alembic upgrade head` (revision mới `f3a7c1d9b2e4`,
   nối sau `c561b88a40fb`).
2. Đảm bảo `OPENAI_API_KEY` đã cấu hình (dùng chung với tra cứu trực tiếp).
3. (Tuỳ chọn) Chỉnh `LEGAL_CONTRIBUTE_DAILY_LIMIT` /
   `LEGAL_CONTRIBUTE_MODEL` trong biến môi trường nếu muốn khác mặc định.
4. Đã kiểm tra: `python -m py_compile` cho toàn bộ file backend đổi, và
   `tsc --noEmit` cho frontend — không lỗi cú pháp/kiểu. Repo dùng Postgres
   thật nên chưa chạy được test tích hợp `tests/test_legal_search.py`
   (cần `LEGAL_TEST_DATABASE_URL`) trong môi trường này — nên tự chạy lại
   trước khi merge.

## 4. Giới hạn đã biết / có thể mở rộng thêm sau
- Chưa có màn hình Admin để duyệt/gỡ các tài liệu do khách hàng đóng góp
  hàng loạt — hiện dùng chung `DELETE /legal/admin/documents/{id}` đã có.
- Phân loại chỉ dựa trên nội dung người dùng dán vào (không tự tải thêm từ
  `source_url`); nếu muốn AI tự đọc luôn trang nguồn thì cần bổ sung bước
  tải trang tương tự `app/services/legal_live.py`.
