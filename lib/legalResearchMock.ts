// lib/legalResearchMock.ts
//
// DỮ LIỆU MINH HOẠ để thử giao diện "Tư vấn pháp lý AI" khi backend /legal/research chưa xong
// (CHECKLIST 3.3/3.4). Chỉ được dùng khi đặt NEXT_PUBLIC_LEGAL_RESEARCH_MOCK=1 trong .env.local.
//
// Nội dung hoàn toàn GIẢ: số hiệu "DEMO-xx", điều luật là câu chữ giữ chỗ, KHÔNG phải pháp luật
// thật. Giao diện luôn hiện biển báo "dữ liệu minh hoạ" khi chạy bằng dữ liệu này.
//
// Thử các trạng thái lỗi (CHECKLIST M4.1): gõ câu hỏi có chứa
//   "429" hoặc "hết hạn mức"  -> trả HTTP 429 giả (thẻ "hết hạn mức tháng" + nút nâng cấp, không có "Thử lại")
//   "502"                     -> trả HTTP 502 giả (thông báo "dịch vụ chưa sẵn sàng")
//   "timeout"                 -> trả status 0 giả (thông báo hết thời gian chờ, có "Thử lại")
// Các câu khác trả dữ liệu minh hoạ như cũ.

import { ApiError, type LegalResearchData } from "@/lib/api";

const LONG_FILLER =
  " Nội dung giữ chỗ để thử thu gọn/mở rộng: đoạn văn này được lặp lại nhiều lần nhằm tạo một điều khoản dài hơn ngưỡng thu gọn của giao diện." +
  " Nội dung giữ chỗ để thử thu gọn/mở rộng: đoạn văn này được lặp lại nhiều lần nhằm tạo một điều khoản dài hơn ngưỡng thu gọn của giao diện.";

export const MOCK_RESEARCH: LegalResearchData = {
  query_id: "00000000-demo-0000-0000-000000000000",
  detected_language: "VI",
  answer_markdown: [
    "## 1. Vấn đề pháp lý (Issue)",
    "Đây là **dữ liệu minh hoạ**: người hỏi muốn biết bên A có được chấm dứt hợp đồng mẫu hay không. [cite:art_1]",
    "",
    "## 2. Quy định áp dụng (Rule)",
    "- Điều khoản mẫu thứ nhất nêu điều kiện chấm dứt (giữ chỗ). [cite:art_1]",
    "- Điều khoản mẫu thứ hai là một điều dài để thử nút thu gọn. [cite:art_2, art_1]",
    "- Một luận điểm có thẻ trích dẫn không tồn tại để thử cảnh báo. [cite:art_999]",
    "",
    "## 3. Áp dụng (Application)",
    "Với tình huống mẫu, cần đối chiếu từng điều kiện với dữ kiện người hỏi cung cấp. [cite:art_2]",
    "",
    "## 4. Kết luận (Conclusion)",
    "Kết luận minh hoạ: **chưa đủ dữ kiện** để kết luận chắc chắn; xem các câu hỏi làm rõ bên dưới.",
  ].join("\n"),
  cited_articles: [
    {
      cite_key: "art_1",
      doc_number: "DEMO-01/2026",
      doc_title: "Văn bản minh hoạ số 1 (dữ liệu giả lập)",
      article_number: "Điều 1",
      article_title: "Điều khoản giữ chỗ về chấm dứt hợp đồng",
      content:
        "1. Đây là khoản mở đầu của điều khoản giữ chỗ. 2. Bên A có quyền chấm dứt hợp đồng mẫu khi bên B vi phạm nghĩa vụ giữ chỗ đã thoả thuận. 3. Đây là khoản cuối của điều khoản giữ chỗ.",
      status: "ACTIVE",
      effective_date: "2026-01-01",
      highlight_snippet: "Bên A có quyền chấm dứt hợp đồng mẫu khi bên B vi phạm nghĩa vụ giữ chỗ đã thoả thuận.",
    },
    {
      cite_key: "art_2",
      doc_number: "DEMO-02/2026",
      doc_title: "Văn bản minh hoạ số 2 (dữ liệu giả lập, sửa đổi một phần)",
      article_number: "Điều 2",
      article_title: "Điều khoản giữ chỗ dài",
      content:
        "1. Khoản đầu của điều khoản dài." +
        LONG_FILLER +
        " 2. Câu cần tô vàng nằm sâu bên trong điều khoản dài để thử việc tự cuộn và tự mở rộng khi bấm Badge." +
        LONG_FILLER +
        " 3. Khoản cuối của điều khoản dài.",
      status: "AMENDED",
      effective_date: "2025-07-01",
      highlight_snippet: "Câu cần tô vàng nằm sâu bên trong điều khoản dài để thử việc tự cuộn và tự mở rộng khi bấm Badge.",
    },
  ],
  missing_info_questions: [
    "Hợp đồng mẫu được ký vào ngày nào? (câu hỏi minh hoạ)",
    "Bên B đã nhận được thông báo vi phạm bằng văn bản chưa? (câu hỏi minh hoạ)",
  ],
  suggested_action: {
    type: "CREATE_CONTRACT",
    contract_type: "LABOR",
    label: "Tạo ngay Hợp đồng Lao động chuẩn luật",
  },
};

// Trả về lỗi giả theo từ khoá trong câu hỏi (xem chú thích đầu tệp); null = trả dữ liệu minh hoạ.
function mockFailure(query: string): ApiError | null {
  const q = query.toLowerCase();
  if (q.includes("429") || q.includes("hết hạn mức")) {
    return new ApiError(429, "Bạn đã dùng hết 100 lượt tra cứu AI trong tháng này. (thông báo minh hoạ)");
  }
  if (q.includes("502")) return new ApiError(502, "Bad Gateway (minh hoạ)");
  if (q.includes("timeout")) return new ApiError(0, "Timeout (minh hoạ)");
  return null;
}

export function mockResearch(query: string, signal?: AbortSignal): Promise<LegalResearchData> {
  const failure = mockFailure(query);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => (failure ? reject(failure) : resolve(MOCK_RESEARCH)), failure ? 600 : 1200);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}
