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
  // Kết luận trực tiếp + căn cứ + số Điều (nhóm Đánh giá pháp lý & rủi ro).
  conclusionTitle: string;
  verdictLabel: { hop_phap: string; hop_phap_mot_phan: string; khong_hop_phap: string };
  basisTitle: string;
  conditionsTitle: string;
  conditionsMissing: string;
  legitimizingNotice: string;
  fixedBonusWarning: string;
  articleVerified: string;
  articleUnverified: string;
  articleUnknown: string;
  citedArticles: string;
  articleMissing: string;
  conclusionAdjusted: string;
  // Bố cục kết quả theo lối diễn dịch: Kết luận -> Định hướng giải quyết -> Phân tích chi tiết -> Căn cứ pháp lý.
  directionTitle: string;
  directionHint: string;
  legalBasisNote: string;
  basisMissingNote: string;
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
  conclusionTitle: "Kết luận",
  verdictLabel: { hop_phap: "Hợp pháp", hop_phap_mot_phan: "Hợp pháp một phần", khong_hop_phap: "Không hợp pháp" },
  basisTitle: "Căn cứ",
  conditionsTitle: "Điều kiện áp dụng",
  conditionsMissing:
    "Lưu ý: 'hợp pháp một phần' nghĩa là kết luận phụ thuộc mục đích/hoàn cảnh cụ thể, nhưng hệ thống chưa nêu được điều kiện cụ thể có căn cứ trên nguồn đã đọc — hãy đọc phần phân tích chi tiết bên dưới và tham khảo ý kiến luật sư trước khi áp dụng.",
  legitimizingNotice:
    "Lưu ý: nội dung trái luật không trở thành hợp pháp chỉ vì được đưa vào nội quy hay ban hành đúng trình tự; hệ thống đã lược bỏ các bước khuyến nghị theo hướng đó.",
  fixedBonusWarning:
    "Cảnh báo: khoản thưởng cố định, trả đều hằng kỳ có thể bị coi là một phần tiền lương; khi đó việc cắt giảm vẫn chịu quy định về khấu trừ tiền lương.",
  articleVerified: "Số Điều đã đối chiếu với trang nguồn",
  articleUnverified: "Không thấy Điều này trên trang nguồn — cần kiểm tra lại",
  articleUnknown: "Chưa đối chiếu được số Điều với trang nguồn",
  citedArticles: "Điều luật được dẫn chiếu",
  articleMissing: "Phân tích này chưa nêu số Điều cụ thể — hãy mở nguồn để xác định căn cứ.",
  conclusionAdjusted:
    "Kết luận đã được điều chỉnh sang mức thận trọng hơn cho thống nhất với mức rủi ro đánh giá — xem phân tích chi tiết.",
  directionTitle: "Định hướng giải quyết",
  directionHint: "Các hướng xử lý nên cân nhắc, rút ra từ phần phân tích bên dưới — chỉ mang tính tham khảo.",
  legalBasisNote:
    "Văn bản mà trang nguồn ghi rõ đã hết hiệu lực không được dùng làm căn cứ; văn bản không ghi rõ tình trạng được đánh dấu \"Chưa xác minh\". Hãy mở nguồn để kiểm tra hiệu lực trước khi áp dụng.",
  basisMissingNote:
    "Văn bản hoặc Điều luật chưa có trong hệ thống, hoặc chưa đối chiếu được, sẽ do quản trị viên bổ sung sau.",
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
  conclusionTitle: "Conclusion",
  verdictLabel: { hop_phap: "Lawful", hop_phap_mot_phan: "Partly lawful", khong_hop_phap: "Unlawful" },
  basisTitle: "Basis",
  conditionsTitle: "Conditions of application",
  conditionsMissing:
    "Note: 'partly lawful' means the conclusion depends on the specific purpose or circumstances, but the system could not state a specific, source-backed condition — read the detailed analysis below and consult a lawyer before relying on it.",
  legitimizingNotice:
    "Note: unlawful content does not become lawful just because it is put into internal regulations or promulgated through the proper procedure; steps recommending that have been removed.",
  fixedBonusWarning:
    "Warning: a fixed bonus paid regularly may be treated as part of wages; reducing it would then still be subject to the rules on wage deductions.",
  articleVerified: "Article number checked against the source page",
  articleUnverified: "This article was not found on the source page — please check again",
  articleUnknown: "Article number could not be checked against the source page",
  citedArticles: "Cited articles",
  articleMissing: "This analysis does not cite a specific article — open the source to identify the legal basis.",
  conclusionAdjusted:
    "The conclusion was adjusted to a more cautious level to stay consistent with the assessed risk — see the detailed analysis.",
  directionTitle: "Recommended course of action",
  directionHint: "Approaches to consider, drawn from the analysis below — for reference only.",
  legalBasisNote:
    "A document that its source page clearly states is no longer in force is not used as a basis; a document whose status is not stated is marked \"Validity not verified\". Open the source to check validity before relying on it.",
  basisMissingNote:
    "Documents or articles that are not yet in the system, or could not be checked, will be added later by the administrator.",
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
  conclusionTitle: "结论",
  verdictLabel: { hop_phap: "合法", hop_phap_mot_phan: "部分合法", khong_hop_phap: "不合法" },
  basisTitle: "依据",
  conditionsTitle: "适用条件",
  conditionsMissing:
    "提示：“部分合法”表示结论取决于具体目的或情形，但系统尚未给出有来源依据的具体条件——请查看下方详细分析，并在适用前咨询律师。",
  legitimizingNotice:
    "提示：违法内容不会因为写入内部规章或按程序颁布而变为合法；系统已删除此类建议步骤。",
  fixedBonusWarning:
    "警告：固定且定期发放的奖金可能被视为工资的一部分，届时扣减仍须遵守工资扣除的规定。",
  articleVerified: "条文号已与来源页面核对",
  articleUnverified: "来源页面上未找到该条文——请重新核查",
  articleUnknown: "无法将条文号与来源页面核对",
  citedArticles: "引用的条文",
  articleMissing: "该分析未列明具体条文——请打开来源确定法律依据。",
  conclusionAdjusted: "为与评估的风险等级保持一致，结论已调整为更谨慎的级别——请查看详细分析。",
  directionTitle: "处理方向",
  directionHint: "可考虑的处理思路，源自下方的分析——仅供参考。",
  legalBasisNote:
    "来源页面明确标注已失效的文件不会被用作依据；未标明效力状态的文件会标记为“效力状态未核实”。适用前请打开来源核查效力。",
  basisMissingNote: "系统中尚未收录或无法核对的文件或条文，将由管理员日后补充。",
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
  conclusionTitle: "결론",
  verdictLabel: { hop_phap: "적법", hop_phap_mot_phan: "일부 적법", khong_hop_phap: "위법" },
  basisTitle: "근거",
  conditionsTitle: "적용 조건",
  conditionsMissing:
    "참고: '일부 적법'은 결론이 구체적인 목적이나 상황에 따라 달라진다는 뜻이지만, 시스템이 출처에 근거한 구체적인 조건을 제시하지 못했습니다 — 아래 상세 분석을 확인하고 적용하기 전에 변호사와 상담하세요.",
  legitimizingNotice:
    "참고: 위법한 내용은 사내 규정에 넣거나 절차에 따라 공포한다고 해서 적법해지지 않습니다. 그런 방향의 권고 단계는 제외했습니다.",
  fixedBonusWarning:
    "경고: 고정적으로 정기 지급되는 상여는 임금의 일부로 간주될 수 있으며, 이 경우 감액에도 임금 공제 규정이 적용됩니다.",
  articleVerified: "조문 번호를 출처 페이지와 대조했습니다",
  articleUnverified: "출처 페이지에서 이 조문을 찾을 수 없습니다 — 다시 확인하세요",
  articleUnknown: "조문 번호를 출처 페이지와 대조하지 못했습니다",
  citedArticles: "인용된 조문",
  articleMissing: "이 분석에는 구체적인 조문 번호가 없습니다 — 출처를 열어 법적 근거를 확인하세요.",
  conclusionAdjusted:
    "평가된 위험 수준과 일관되도록 결론이 더 신중한 수준으로 조정되었습니다 — 상세 분석을 확인하세요.",
  directionTitle: "해결 방향",
  directionHint: "아래 분석에서 도출한, 고려할 만한 대응 방향 — 참고용입니다.",
  legalBasisNote:
    "출처 페이지에 효력 상실로 명시된 문서는 근거로 사용하지 않으며, 효력 상태가 명시되지 않은 문서는 “효력 상태 미확인”으로 표시합니다. 적용하기 전에 출처를 열어 효력을 확인하세요.",
  basisMissingNote:
    "시스템에 아직 없거나 대조하지 못한 문서·조문은 관리자가 추후 보완합니다.",
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
  conclusionTitle: "結論",
  verdictLabel: { hop_phap: "適法", hop_phap_mot_phan: "一部適法", khong_hop_phap: "違法" },
  basisTitle: "根拠",
  conditionsTitle: "適用条件",
  conditionsMissing:
    "注意：「一部適法」は結論が具体的な目的や状況によって変わることを意味しますが、システムは出典に基づく具体的な条件を示せませんでした — 下の詳細分析をご確認のうえ、適用前に弁護士にご相談ください。",
  legitimizingNotice:
    "注意：違法な内容は、社内規程に盛り込んだり手続きに従って公布したりしても適法にはなりません。そのような方向の推奨手順は除外しました。",
  fixedBonusWarning:
    "警告：固定額で定期的に支払う賞与は賃金の一部とみなされる可能性があり、その場合は減額にも賃金控除の規定が適用されます。",
  articleVerified: "条文番号を出典ページと照合済み",
  articleUnverified: "出典ページにこの条文が見当たりません — 再確認してください",
  articleUnknown: "条文番号を出典ページと照合できませんでした",
  citedArticles: "引用された条文",
  articleMissing: "この分析には具体的な条文番号がありません — 出典元を開いて法的根拠をご確認ください。",
  conclusionAdjusted:
    "評価したリスクと整合するよう、結論をより慎重な水準に調整しました — 詳細分析をご覧ください。",
  directionTitle: "解決の方向性",
  directionHint: "下の分析から導いた、検討すべき対応の方向性 — 参考情報です。",
  legalBasisNote:
    "出典ページが失効と明記している文書は根拠として使用しません。効力状況が明記されていない文書は「効力状況は未確認」と表示します。適用前に出典元を開いて効力をご確認ください。",
  basisMissingNote:
    "システムにまだない、または照合できなかった文書・条文は、管理者が後日追加します。",
};

export const EXTRA: Record<Lang, LLExtra> = {
  vi: { ...vi, privacy: PRIVACY.vi },
  en: { ...en, privacy: PRIVACY.en },
  zh: { ...zh, privacy: PRIVACY.zh },
  ko: { ...ko, privacy: PRIVACY.ko },
  ja: { ...ja, privacy: PRIVACY.ja },
};
