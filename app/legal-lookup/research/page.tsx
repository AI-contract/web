/**
 * app/legal-lookup/research/page.tsx — đường dẫn cũ của "Tư vấn pháp lý AI".
 * Đã gộp vào "Tra cứu pháp lý" (/legal-lookup); giữ lại để link/bookmark cũ vẫn chạy.
 */

import { redirect } from "next/navigation";

export default function LegacyResearchRedirect() {
  redirect("/legal-lookup");
}
