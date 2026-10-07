// app/legal-lookup/_components/i18n-extra.ts
//
// Bổ sung cho i18n.ts (đủ 5 ngôn ngữ): các chuỗi phát sinh sau khi có "kho tự lưu", nhãn tình trạng
// hiệu lực, ghi chú tài liệu trong kho, cam kết bảo mật... i18n.ts gộp EXTRA vào LL nên
// useLL() / LL[lang] có cả hai bộ khóa.
//
// `liveIntro` dùng dấu ** để in đậm một cụm (xem renderBold trong page.tsx).

import type { Lang } from "@/lib/lang";
import { PRIVACY, type PrivacyText } from "@/lib/privacy";

export interface LLExtra {
  liveIntro: string;
  disclaimerText: string;
  storeLabel: string;
  storeCounts: (vanBan: number, anLe: number, banAn: number) => string;
  storeLatest: (d: string) => string;
  storeManage: string;
  storedVerified: (d: string) => string;
  storedUser: (d: string) => string;
  storedAmend: string;
  statusInForce: string;
  statusExpired: string;
  statusPartlyExpired: string;
  statusNotYetInForce: string;
  ctaPrecedents: string;
  findLabel: (t: string) => string;
  noneFound: (t: string) => string;
  privacy: PrivacyText;
}

type Part = Omit<LLExtra, "privacy">;

const vi: Part = {
  liveIntro:
    "Legal AI **tự lưu trữ** những văn bản pháp luật, án lệ và bản án đã được đối chiếu đúng với trang nguồn để phục vụ các lần tìm kiếm sau (nhanh hơn, không tốn thêm lượt tra cứu). Nếu kho chưa đủ kết quả, hệ thống tìm trực tiếp trên các trang chính thống rồi trích lục nội dung liên quan và lưu lại. Dữ liệu tự lưu có thời hạn và được làm mới từ nguồn; không lưu nội dung câu hỏi hay thông tin cá nhân của bạn. Mỗi kết quả đều kèm link nguồn để đối chiếu.",
  disclaimerText:
    "Kết quả tra cứu chỉ mang tính tham khảo, không thay thế tư vấn pháp lý chính thức. Nội dung do AI trích lục từ các trang chính thống; hãy mở nguồn gốc để đối chiếu nguyên văn và tình trạng hiệu lực mới nhất trước khi sử dụng.",
  storeLabel: "Kho tự lưu hiện có:",
  storeCounts: (v, a, b) => `${v} văn bản · ${a} án lệ · ${b} bản án`,
  storeLatest: (d) => `(cập nhật gần nhất ${d})`,
  storeManage: "Xem/xóa tài liệu (Admin)",
  storedVerified: (d) => `Nội dung đã lưu trong kho Legal AI ngày ${d} (đã đối chiếu với trang nguồn lúc lưu). `,
  storedUser: (d) => `Nội dung do người dùng cập nhật vào kho Legal AI ngày ${d}, chưa đối chiếu với trang nguồn. `,
  storedAmend:
    "Văn bản có thể đã được sửa đổi kể từ đó — hãy mở nguồn gốc để kiểm tra tình trạng hiệu lực mới nhất.",
  statusInForce: "Còn hiệu lực",
  statusExpired: "Hết hiệu lực",
  statusPartlyExpired: "Hết hiệu lực một phần",
  statusNotYetInForce: "Chưa có hiệu lực",
  ctaPrecedents: "Tham khảo án lệ và bản án liên quan",
  findLabel: (t) => `Tìm ${t.toLowerCase()}`,
  noneFound: (t) => `Không tìm thấy ${t.toLowerCase()} phù hợp.`,
};

const en: Part = {
  liveIntro:
    "Legal AI **stores on its own** the laws, precedents and judgments that have been checked against their source pages, to serve later searches (faster, without using extra lookups). If the library does not have enough results, the system searches the official sites directly, extracts the relevant content and saves it. Stored data expires and is refreshed from the source; your questions and personal information are not stored in it. Every result comes with a source link so you can verify it.",
  disclaimerText:
    "Search results are for reference only and do not replace formal legal advice. The content is extracted by AI from official sites; open the original source to check the exact wording and the latest validity status before relying on it.",
  storeLabel: "Stored library:",
  storeCounts: (v, a, b) => `${v} laws · ${a} precedents · ${b} judgments`,
  storeLatest: (d) => `(last updated ${d})`,
  storeManage: "View/delete documents (Admin)",
  storedVerified: (d) => `Content stored in the Legal AI library on ${d} (checked against the source page when stored). `,
  storedUser: (d) => `Content added to the Legal AI library by a user on ${d}, not checked against the source page. `,
  storedAmend:
    "The document may have been amended since — open the original source to check the latest validity status.",
  statusInForce: "In force",
  statusExpired: "Expired",
  statusPartlyExpired: "Partly expired",
  statusNotYetInForce: "Not yet in force",
  ctaPrecedents: "See related precedents and court judgments",
  findLabel: (t) => `Find ${t.toLowerCase()}`,
  noneFound: (t) => `No matching ${t.toLowerCase()} found.`,
};

const zh: Part = {
  liveIntro:
    "Legal AI **自动存储**已与来源页面核对一致的法律文件、判例和判决书，供后续检索使用（更快，且不额外消耗查询次数）。如果库中结果不足，系统会直接在官方网站检索，提取相关内容并保存。自动存储的数据有时效并会从来源刷新；不会保存您的提问内容或个人信息。每条结果都附有来源链接，便于核对。",
  disclaimerText:
    "检索结果仅供参考，不能替代正式的法律意见。内容由 AI 从官方网站提取；使用前请打开原始来源核对原文及最新效力状态。",
  storeLabel: "自存库现有：",
  storeCounts: (v, a, b) => `${v} 份法规 · ${a} 项判例 · ${b} 份判决书`,
  storeLatest: (d) => `（最近更新 ${d}）`,
  storeManage: "查看/删除文件（管理员）",
  storedVerified: (d) => `内容已于 ${d} 存入 Legal AI 库（存入时已与来源页面核对）。`,
  storedUser: (d) => `内容由用户于 ${d} 更新至 Legal AI 库，尚未与来源页面核对。`,
  storedAmend: "该文件此后可能已被修订——请打开原始来源查看最新效力状态。",
  statusInForce: "现行有效",
  statusExpired: "已失效",
  statusPartlyExpired: "部分失效",
  statusNotYetInForce: "尚未生效",
  ctaPrecedents: "查看相关判例和判决书",
  findLabel: (t) => `查找${t}`,
  noneFound: (t) => `未找到相关${t}。`,
};

const ko: Part = {
  liveIntro:
    "Legal AI는 출처 페이지와 대조를 마친 법령, 판례, 판결문을 **자동으로 저장**하여 이후 검색에 활용합니다(더 빠르고 추가 조회 횟수가 소모되지 않음). 저장소에 결과가 부족하면 공식 사이트에서 직접 검색해 관련 내용을 발췌하고 저장합니다. 자동 저장된 데이터에는 유효 기간이 있으며 출처에서 갱신됩니다. 질문 내용이나 개인정보는 저장하지 않습니다. 모든 결과에는 대조할 수 있는 출처 링크가 포함됩니다.",
  disclaimerText:
    "검색 결과는 참고용이며 공식적인 법률 자문을 대체하지 않습니다. 내용은 AI가 공식 사이트에서 발췌한 것이므로, 사용 전에 원본 출처를 열어 원문과 최신 효력 상태를 확인하세요.",
  storeLabel: "자동 저장소 현황:",
  storeCounts: (v, a, b) => `법령 ${v}건 · 판례 ${a}건 · 판결문 ${b}건`,
  storeLatest: (d) => `(최근 업데이트 ${d})`,
  storeManage: "문서 보기/삭제(관리자)",
  storedVerified: (d) => `${d}에 Legal AI 저장소에 저장된 내용입니다(저장 시 출처 페이지와 대조함). `,
  storedUser: (d) => `${d}에 사용자가 Legal AI 저장소에 업데이트한 내용으로, 출처 페이지와 대조하지 않았습니다. `,
  storedAmend: "그 이후 문서가 개정되었을 수 있습니다 — 원본 출처를 열어 최신 효력 상태를 확인하세요.",
  statusInForce: "시행 중",
  statusExpired: "효력 상실",
  statusPartlyExpired: "일부 효력 상실",
  statusNotYetInForce: "시행 전",
  ctaPrecedents: "관련 판례 및 판결문 보기",
  findLabel: (t) => `${t} 찾기`,
  noneFound: (t) => `일치하는 ${t}을(를) 찾지 못했습니다.`,
};

const ja: Part = {
  liveIntro:
    "Legal AI は、出典ページとの照合を終えた法令・判例・判決を**自動的に保存**し、以降の検索に活用します（高速で、追加の検索回数を消費しません）。保存分で結果が足りない場合は、公式サイトを直接検索して関連内容を抜粋し、保存します。自動保存データには有効期限があり、出典から更新されます。質問内容や個人情報は保存しません。各結果には照合用の出典リンクが付きます。",
  disclaimerText:
    "検索結果は参考情報であり、正式な法的助言に代わるものではありません。内容は AI が公式サイトから抜粋したものです。ご利用の前に、出典元を開いて原文と最新の効力状況をご確認ください。",
  storeLabel: "自動保存ライブラリの件数：",
  storeCounts: (v, a, b) => `法令 ${v} 件 · 判例 ${a} 件 · 判決 ${b} 件`,
  storeLatest: (d) => `（最終更新 ${d}）`,
  storeManage: "文書の表示/削除（管理者）",
  storedVerified: (d) => `${d} に Legal AI ライブラリへ保存された内容です（保存時に出典ページと照合済み）。`,
  storedUser: (d) => `${d} にユーザーが Legal AI ライブラリへ追加した内容で、出典ページとは照合していません。`,
  storedAmend: "その後に改正されている可能性があります — 出典元を開いて最新の効力状況をご確認ください。",
  statusInForce: "施行中",
  statusExpired: "失効",
  statusPartlyExpired: "一部失効",
  statusNotYetInForce: "施行前",
  ctaPrecedents: "関連する判例・判決を見る",
  findLabel: (t) => `${t}を検索`,
  noneFound: (t) => `該当する${t}は見つかりませんでした。`,
};

export const EXTRA: Record<Lang, LLExtra> = {
  vi: { ...vi, privacy: PRIVACY.vi },
  en: { ...en, privacy: PRIVACY.en },
  zh: { ...zh, privacy: PRIVACY.zh },
  ko: { ...ko, privacy: PRIVACY.ko },
  ja: { ...ja, privacy: PRIVACY.ja },
};
