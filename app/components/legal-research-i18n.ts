// Văn bản giao diện của "Tư vấn pháp lý AI" (LegalResearchWorkspace + trang /legal-lookup/research),
// dịch đủ 5 ngôn ngữ theo ngôn ngữ giao diện (useLang). Các nhãn dùng chung (tình trạng hiệu lực,
// cảnh báo AI, ô tìm kiếm...) lấy từ legal-lookup/_components/i18n.ts để không trùng lặp.
//
// KHÔNG dịch: nội dung do backend trả về (câu trả lời IRAC, nguyên văn điều luật, tiêu đề văn bản).

import type { Lang } from "@/lib/lang";

export interface ResearchText {
  pageTitle: string;
  intro: string;
  placeholder: string;
  submit: string;
  loading: string;
  unavailable: string;
  timeout: string;
  quotaTitle: string;
  quotaBody: string;
  upgrade: string;
  recentTitle: string;
  clearHistory: string;
  removeFromHistory: string;
  entryLink: string;
  answerTitle: string;
  detectedLang: string;
  sourcesTitle: string;
  sourcesHint: string;
  sourcesCount: (n: number) => string;
  noSources: string;
  unknownCite: string;
  missingTitle: string;
  missingHint: string;
  exportDocx: string;
  exportPdf: string;
  exporting: string;
  exportFailed: string;
  ctaTitle: string;
  ctaDesc: string;
  viewSources: (n: number) => string;
  close: string;
  expand: string;
  collapse: string;
  mockBanner: string;
}

export const RS: Record<Lang, ResearchText> = {
  vi: {
    pageTitle: "Tư vấn pháp lý AI",
    intro:
      "Mô tả tình huống pháp lý của bạn — Legal AI phân tích theo cấu trúc IRAC, chỉ dựa trên điều luật còn hiệu lực trong cơ sở dữ liệu và dẫn nguồn để bạn đối chiếu từng luận điểm.",
    placeholder: "Mô tả tình huống hoặc đặt câu hỏi cần tra cứu pháp lý",
    submit: "Tra cứu",
    loading: "Đang tìm điều luật còn hiệu lực và soạn tư vấn… (có thể mất vài chục giây)",
    unavailable: "Tính năng Tư vấn pháp lý AI chưa sẵn sàng. Vui lòng thử lại sau.",
    timeout: "Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.",
    quotaTitle: "Đã hết lượt Tra cứu pháp lý AI",
    quotaBody:
      "Chế độ demo giới hạn số lượt mỗi ngày cho mỗi tài khoản và ngân sách chung mỗi tháng. Hạn mức theo ngày được làm mới lúc 0 giờ (giờ Việt Nam); vui lòng quay lại sau.",
    recentTitle: "Tra cứu gần đây",
    clearHistory: "Xóa lịch sử",
    removeFromHistory: "Xóa khỏi lịch sử",
    upgrade: "Nâng cấp gói",
    entryLink: "Thử Tư vấn pháp lý AI (phân tích IRAC, dẫn nguồn đối chiếu) →",
    answerTitle: "Tư vấn của Legal AI",
    detectedLang: "Ngôn ngữ nhận diện",
    sourcesTitle: "Đối chiếu nguồn",
    sourcesHint: "Nguyên văn điều luật được trích dẫn",
    sourcesCount: (n) => `${n} điều luật`,
    noSources: "Câu trả lời này không có điều luật nào được trích dẫn nên chưa thể đối chiếu.",
    unknownCite: "Nguồn trích dẫn này không có trong danh sách đối chiếu — hãy kiểm tra lại",
    missingTitle: "Cần làm rõ thêm thông tin",
    missingHint: "Bổ sung các thông tin sau vào câu hỏi rồi tra cứu lại để có kết luận chính xác hơn:",
    exportDocx: "Tải DOCX",
    exportPdf: "Tải PDF",
    exporting: "Đang xuất…",
    exportFailed: "Không xuất được tệp, vui lòng thử lại.",
    ctaTitle: "Bước tiếp theo",
    ctaDesc: "Chuyển ngay tư vấn này thành hợp đồng chuẩn theo quy định pháp luật.",
    viewSources: (n) => `Xem nguồn (${n})`,
    close: "Đóng",
    expand: "Xem toàn bộ Điều",
    collapse: "Thu gọn",
    mockBanner: "Dữ liệu minh họa (chế độ thử giao diện) — không phải nội dung pháp luật thật.",
  },
  en: {
    pageTitle: "AI Legal Advice",
    intro:
      "Describe your legal situation — Legal AI analyzes it in the IRAC structure, relying only on in-force provisions in its database and citing sources so you can verify every point.",
    placeholder: "Describe your situation or ask the legal question you want to look up",
    submit: "Search",
    loading: "Finding in-force provisions and drafting the advice… (this may take a few dozen seconds)",
    unavailable: "AI Legal Advice is not available yet. Please try again later.",
    timeout: "The request took too long. Please try again.",
    quotaTitle: "You have used up your AI legal research requests",
    quotaBody:
      "The demo limits each account to a number of requests per day, plus a shared monthly budget. The daily limit resets at 00:00 (Vietnam time); please come back later.",
    recentTitle: "Recent searches",
    clearHistory: "Clear history",
    removeFromHistory: "Remove from history",
    upgrade: "Upgrade plan",
    entryLink: "Try AI Legal Advice (IRAC analysis with verifiable sources) →",
    answerTitle: "Legal AI advice",
    detectedLang: "Detected language",
    sourcesTitle: "Source verification",
    sourcesHint: "Verbatim text of the cited provisions",
    sourcesCount: (n) => `${n} provision${n === 1 ? "" : "s"}`,
    noSources: "No provisions are cited in this answer, so there is nothing to verify yet.",
    unknownCite: "This citation is not in the verification list — please double-check it",
    missingTitle: "More information needed",
    missingHint: "Add the following details to your question and search again for a more accurate conclusion:",
    exportDocx: "Download DOCX",
    exportPdf: "Download PDF",
    exporting: "Exporting…",
    exportFailed: "Could not export the file. Please try again.",
    ctaTitle: "Next step",
    ctaDesc: "Turn this advice into a contract that follows the law.",
    viewSources: (n) => `View sources (${n})`,
    close: "Close",
    expand: "Show full article",
    collapse: "Collapse",
    mockBanner: "Sample data (UI test mode) — not real legal content.",
  },
  zh: {
    pageTitle: "AI 法律咨询",
    intro:
      "描述您的法律情形——Legal AI 按 IRAC 结构分析，仅依据数据库中现行有效的条文，并附上来源，方便您逐点核对。",
    placeholder: "描述情形或提出需要检索的法律问题",
    submit: "检索",
    loading: "正在查找现行有效条文并撰写咨询意见…（可能需要几十秒）",
    unavailable: "AI 法律咨询功能暂未开放，请稍后再试。",
    timeout: "请求耗时过长，请重试。",
    quotaTitle: "AI 法律检索次数已用完",
    quotaBody: "演示模式限制每个账户每日的检索次数，并设有每月共用预算。每日次数在越南时间 0 点重置，请稍后再来。",
    recentTitle: "最近检索",
    clearHistory: "清除历史",
    removeFromHistory: "从历史中移除",
    upgrade: "升级套餐",
    entryLink: "试用 AI 法律咨询（IRAC 分析，来源可核对）→",
    answerTitle: "Legal AI 咨询意见",
    detectedLang: "识别语言",
    sourcesTitle: "来源核对",
    sourcesHint: "所引条文原文",
    sourcesCount: (n) => `${n} 条`,
    noSources: "本回答未引用任何条文，暂无可核对的来源。",
    unknownCite: "此引用不在核对列表中——请再次确认",
    missingTitle: "需要补充信息",
    missingHint: "请在问题中补充以下信息后重新检索，以获得更准确的结论：",
    exportDocx: "下载 DOCX",
    exportPdf: "下载 PDF",
    exporting: "正在导出…",
    exportFailed: "无法导出文件，请重试。",
    ctaTitle: "下一步",
    ctaDesc: "将此咨询意见直接转为符合法律规定的合同。",
    viewSources: (n) => `查看来源（${n}）`,
    close: "关闭",
    expand: "查看全文",
    collapse: "收起",
    mockBanner: "示例数据（界面测试模式）——并非真实法律内容。",
  },
  ko: {
    pageTitle: "AI 법률 자문",
    intro:
      "법률 상황을 설명해 주세요. Legal AI가 IRAC 구조로 분석하며, 데이터베이스의 현행 유효 조문만 근거로 삼고 출처를 제시해 각 논점을 직접 대조할 수 있습니다.",
    placeholder: "상황을 설명하거나 조회하려는 법률 질문을 입력하세요",
    submit: "조회",
    loading: "현행 유효 조문을 찾고 자문을 작성하는 중… (수십 초가 걸릴 수 있습니다)",
    unavailable: "AI 법률 자문 기능을 아직 사용할 수 없습니다. 나중에 다시 시도해 주세요.",
    timeout: "요청 시간이 너무 오래 걸렸습니다. 다시 시도해 주세요.",
    quotaTitle: "AI 법률 조회 횟수를 모두 사용했습니다",
    quotaBody:
      "데모 모드에서는 계정당 일일 이용 횟수와 월 공동 예산이 제한됩니다. 일일 횟수는 베트남 시간 0시에 초기화되니 나중에 다시 이용해 주세요.",
    recentTitle: "최근 조회",
    clearHistory: "기록 삭제",
    removeFromHistory: "기록에서 삭제",
    upgrade: "요금제 업그레이드",
    entryLink: "AI 법률 자문 체험 (IRAC 분석, 출처 대조 가능) →",
    answerTitle: "Legal AI 자문",
    detectedLang: "감지된 언어",
    sourcesTitle: "출처 대조",
    sourcesHint: "인용된 조문 원문",
    sourcesCount: (n) => `${n}개 조문`,
    noSources: "이 답변에는 인용된 조문이 없어 아직 대조할 수 없습니다.",
    unknownCite: "이 인용은 대조 목록에 없습니다. 다시 확인해 주세요",
    missingTitle: "추가 정보가 필요합니다",
    missingHint: "아래 정보를 질문에 보충한 뒤 다시 검색하면 더 정확한 결론을 얻을 수 있습니다:",
    exportDocx: "DOCX 다운로드",
    exportPdf: "PDF 다운로드",
    exporting: "내보내는 중…",
    exportFailed: "파일을 내보내지 못했습니다. 다시 시도해 주세요.",
    ctaTitle: "다음 단계",
    ctaDesc: "이 자문 내용을 법령에 맞는 계약서로 바로 만드세요.",
    viewSources: (n) => `출처 보기 (${n})`,
    close: "닫기",
    expand: "조문 전체 보기",
    collapse: "접기",
    mockBanner: "샘플 데이터(UI 테스트 모드) — 실제 법률 내용이 아닙니다.",
  },
  ja: {
    pageTitle: "AI法律相談",
    intro:
      "法的な状況をご記入ください。Legal AI が IRAC の構成で分析し、データベース内の現行有効な条文のみを根拠に、出典を示して各論点を照合できるようにします。",
    placeholder: "状況の説明、または調べたい法的な質問を入力",
    submit: "検索",
    loading: "現行有効な条文を探して回答を作成中…（数十秒かかる場合があります）",
    unavailable: "AI法律相談はまだ利用できません。しばらくしてからお試しください。",
    timeout: "リクエストに時間がかかりすぎました。もう一度お試しください。",
    quotaTitle: "AI法律検索の利用回数を使い切りました",
    quotaBody:
      "デモモードではアカウントごとの1日の利用回数と、月間の共通予算が制限されています。1日の回数はベトナム時間0時にリセットされますので、後ほどお試しください。",
    recentTitle: "最近の検索",
    clearHistory: "履歴を削除",
    removeFromHistory: "履歴から削除",
    upgrade: "プランをアップグレード",
    entryLink: "AI法律相談を試す（IRAC分析・出典照合つき）→",
    answerTitle: "Legal AI の回答",
    detectedLang: "検出された言語",
    sourcesTitle: "出典の照合",
    sourcesHint: "引用された条文の原文",
    sourcesCount: (n) => `${n} 条`,
    noSources: "この回答には引用された条文がないため、まだ照合できません。",
    unknownCite: "この引用は照合リストにありません。再度ご確認ください",
    missingTitle: "追加情報が必要です",
    missingHint: "次の情報を質問に追記して再検索すると、より正確な結論が得られます：",
    exportDocx: "DOCX をダウンロード",
    exportPdf: "PDF をダウンロード",
    exporting: "出力中…",
    exportFailed: "ファイルを出力できませんでした。もう一度お試しください。",
    ctaTitle: "次のステップ",
    ctaDesc: "この回答をそのまま、法令に沿った契約書にしましょう。",
    viewSources: (n) => `出典を見る（${n}）`,
    close: "閉じる",
    expand: "条文全体を表示",
    collapse: "折りたたむ",
    mockBanner: "サンプルデータ（UIテストモード）— 実際の法的内容ではありません。",
  },
};
