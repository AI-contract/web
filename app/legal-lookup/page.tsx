/**
 * app/legal-lookup/page.tsx — mục "Tra cứu pháp lý" (đã gộp với "Tư vấn pháp lý AI").
 *
 * Vào trang là thấy ngay ô nhập từ khóa/tình huống; bấm gửi nhận luôn kết quả tư vấn IRAC kèm
 * nguyên văn điều luật đối chiếu. Nội dung nằm ở ./_components/research-content.tsx.
 * Trang tra cứu trực tiếp cũ: /legal-lookup/live (không còn trên menu).
 */

import ResearchContent from "./_components/research-content";

export default function LegalLookupPage() {
  return <ResearchContent />;
}
