// Văn bản giao diện của trang "Tra cứu pháp lý" (page.tsx + các file trong
// _components) dịch đủ 5 ngôn ngữ. Ngôn ngữ lấy từ useLang() (lib/lang.ts),
// dùng chung với dashboard.
//
// KHÔNG dịch: nội dung do backend/AI trả về (tiêu đề văn bản, trích dẫn,
// phân tích, tình trạng hiệu lực, thông báo lỗi từ server...) - đó là văn
// bản pháp luật Việt Nam và giữ nguyên tiếng Việt.

import { useLang, type Lang } from "@/lib/lang";

const vi = {
  // ---- trang chính ----
  pageTitle: "Tra cứu pháp lý",
  back: "Quay lại",
  errShort: "Vui lòng nhập câu hỏi hoặc từ khóa (ít nhất 2 ký tự).",
  errClause: "Đoạn điều khoản cần tối thiểu 10 ký tự.",
  intro:
    "Nhập từ khóa hoặc mô tả tình huống pháp lý của bạn — Legal AI tìm trực tiếp trên nguồn chính thống.",
  placeholder: "Từ khóa/tình huống pháp lý cần tìm kiếm",
  clearText: "Xóa nội dung",
  searchBtn: "Tra cứu",
  recent: "Tra cứu gần đây",
  clearHistory: "Xóa lịch sử",
  removeFromHistory: "Xóa khỏi lịch sử",
  disabledNote: "Tính năng tra cứu trực tiếp đang tạm tắt. Vui lòng quay lại sau.",
  remaining: (n: number) =>
    `Còn ${n} lượt tra cứu hôm nay (mỗi lần tra cứu dùng 5 lượt). `,
  lowQuota: "Số lượt còn ít: một số phần kết quả có thể không tra cứu được.",
  resultsFor: "Kết quả cho:",
  personalize: "Cá nhân hoá: lĩnh vực hoạt động của tôi",
  fieldPlaceholder: "Ví dụ: Bất động sản, Thương mại điện tử, Xây dựng…",
  fieldAria: "Lĩnh vực hoạt động",
  saving: "Đang lưu…",
  save: "Lưu",
  fieldHint:
    "Không bắt buộc. Hệ thống tự nhận biết lĩnh vực từ câu hỏi; lĩnh vực đã lưu chỉ dùng làm bối cảnh để ưu tiên kết quả phù hợp.",
  liveTitle: "Tra cứu trực tiếp trên nguồn chính thống",
  liveBody1: "Legal AI ",
  liveBodyBold: "không lưu trữ",
  liveBody2:
    " văn bản pháp luật, án lệ và bản án. Mỗi lần tra cứu, hệ thống tìm trực tiếp trên các trang chính thống rồi trích lục nội dung liên quan, kèm link nguồn để đối chiếu.",
  disclaimerFallback:
    "Legal AI không lưu trữ văn bản pháp luật, án lệ, bản án; nội dung được tìm trực tiếp trên các trang chính thống và do AI trích lục, chỉ mang tính tham khảo. Hãy mở nguồn gốc để đối chiếu nguyên văn và tình trạng hiệu lực mới nhất.",

  // ---- nhóm nguồn / thẻ kết quả ----
  groups: {
    van_ban: {
      label: "Quy định pháp luật",
      hint: "Văn bản quy phạm pháp luật có liên quan",
      excerptLabel: "Trích dẫn từ nguồn",
    },
    an_le: {
      label: "Án lệ",
      hint: "Án lệ do Tòa án nhân dân tối cao công bố",
      excerptLabel: "Khái quát nội dung án lệ",
    },
    ban_an: {
      label: "Bản án",
      hint: "Bản án, quyết định đã được công bố trên Cổng công bố bản án",
      excerptLabel: "Thông tin về vụ/việc",
    },
    luat_su: {
      label: "Phân tích của văn phòng/công ty luật",
      hint: "Bài viết do văn phòng luật sư, công ty luật công bố trên website của họ — ý kiến của đơn vị đăng bài, không phải của Legal AI",
      excerptLabel: "Trích nguyên văn từ bài viết",
    },
    danh_gia: {
      label: "Kết quả tổng hợp",
      hint: "Phân tích sơ bộ do AI tổng hợp từ quy định pháp luật và nguồn mở — chỉ tham khảo",
      excerptLabel: "Phân tích",
    },
  },
  sectionAnLeBanAn: "Án lệ/Bản án",
  tiers: {
    chinh_thong: {
      label: "Nguồn chính thống",
      note: "Trang của cơ quan nhà nước",
    },
    tham_khao: {
      label: "Nguồn tham khảo",
      note: "Không phải trang chính thức của cơ quan nhà nước; hãy đối chiếu với văn bản gốc",
    },
  },
  risks: {
    cao: "Rủi ro cao",
    trung_binh: "Rủi ro trung bình",
    thap: "Rủi ro thấp",
  },
  genericError: "Có lỗi xảy ra, vui lòng thử lại.",
  citeNo: "số",
  citeSource: "Nguồn",
  copied: "Đã sao chép",
  copyFailed: "Không sao chép được",
  copyBtn: "Sao chép trích dẫn",
  verifiedMsg: "Đã đối chiếu trích dẫn với trang nguồn.",
  unverifiedMsg:
    "Một phần trích dẫn do AI đưa ra không khớp trang nguồn nên đã được ẩn. Hãy mở nguồn gốc để xem nguyên văn.",
  unknownMsg:
    "Chưa đối chiếu được với trang nguồn (trang cần JavaScript, là file PDF hoặc không tải được). Hãy mở nguồn gốc để kiểm tra nguyên văn.",
  citedDocs: "Văn bản được dẫn chiếu",
  docVerified: "Số hiệu đã đối chiếu với trang nguồn",
  docUnverified: "Không thấy số hiệu này trên trang nguồn — cần kiểm tra lại",
  docUnknown: "Chưa đối chiếu được số hiệu với trang nguồn",
  numberPrefix: (n: string) => `Số ${n}`,
  postedOn: (d: string) => `Đăng ${d}`,
  issuedOn: (d: string) => `Ban hành ${d}`,
  effectiveFrom: (d: string) => `Hiệu lực từ ${d}`,
  statusUnverified: "Chưa xác minh tình trạng hiệu lực",
  statusUnverifiedTip:
    "Trang nguồn không ghi rõ tình trạng hiệu lực; hãy kiểm tra tại nguồn.",
  issueLabel: {
    danh_gia: "Phân tích quy định liên quan",
    luat_su: "Vấn đề/quy định được phân tích trong bài viết",
    other: "Vấn đề pháp lý",
  },
  resolutionLabel: {
    danh_gia: "Khuyến nghị / biện pháp giảm rủi ro",
    luat_su: "Kết luận/khuyến nghị của đơn vị đăng bài",
    other: "Giải quyết / Phán quyết",
  },
  refsTitle: "Nguồn tham khảo",
  aiDisclaimer:
    "Nội dung do AI tổng hợp, chỉ mang tính tham khảo, không thay thế ý kiến tư vấn của luật sư/chuyên gia pháp lý.",
  aiHint: (r: string) => `Gợi ý của AI: ${r}`,
  openSource: "Mở nguồn gốc",
  searching: "Đang tìm trên các nguồn chính thống… (có thể mất 10–60 giây)",
  retry: "Thử lại",
  noResults: "Không tìm thấy nội dung phù hợp trên các nguồn chính thống.",
  resultsCount: (n: number) => `(${n} kết quả)`,
  sourceColon: "Nguồn:",

  // ---- tổng quan ----
  overviewTitle: "Tổng quan",
  synthesizing: "Đang tổng hợp kết luận nhanh…",
  aiOverviewNote:
    "Do AI tổng hợp từ các nguồn bên dưới, chỉ mang tính tham khảo; hãy mở nguồn để đối chiếu nguyên văn và tình trạng hiệu lực.",
  noOverview:
    "Chưa có kết luận nhanh cho câu hỏi này. Hãy xem các mục chi tiết bên dưới.",
  followups: "Câu hỏi gợi ý tiếp theo",
  detailTitle: "Phân tích chi tiết",
  legalBasisTitle: "Căn cứ pháp lý",
  sourcesTitle: "Nguồn",
  sourcesNone: "Chưa có nguồn nào được xác thực.",
  sourcesPending: "Các nguồn sẽ hiện khi có kết quả…",
  noteRefs: "Nguồn tham khảo cho phần tổng hợp",
  noteHidden: "Một phần trích dẫn đã bị ẩn",
  notePoster: "Ý kiến của đơn vị đăng bài",
  noteVerified: "Đã đối chiếu trích dẫn",
  noteUnchecked: "Chưa đối chiếu được",

  // ---- ô đóng góp văn bản ----
  contribTitle: "Cập nhật VBPL/Án lệ/Bản án",
  contribDesc:
    "Dán toàn văn văn bản pháp luật, án lệ hoặc bản án (kèm nguồn nếu có). Legal AI sẽ tự phân loại (loại tài liệu, lĩnh vực, chuyên đề) rồi lưu lại để dùng cho các lượt tra cứu sau. Nội dung do bạn cung cấp chưa qua kiểm tra đối chiếu nên ban đầu ở trạng thái \"Chưa xác minh\".",
  contribDocLabel: "Văn bản",
  contribDocPh: "Dán toàn văn văn bản/án lệ/bản án vào đây…",
  contribSourceName: "Tên nguồn",
  contribOptional: "(tuỳ chọn)",
  contribSourceNamePh: "Ví dụ: Thư viện pháp luật",
  contribSourceUrl: "Đường dẫn nguồn",
  contribErrShort: "Vui lòng dán nội dung đầy đủ hơn (tối thiểu 20 ký tự).",
  contribClassifying: "Đang phân loại…",
  contribSubmit: "Cập nhật",
};

export type LLText = typeof vi;

const en: LLText = {
  pageTitle: "Legal Research",
  back: "Back",
  errShort: "Please enter a question or keyword (at least 2 characters).",
  errClause: "The clause excerpt must be at least 10 characters.",
  intro:
    "Enter keywords or describe your legal situation — Legal AI searches directly on official sources.",
  placeholder: "Keywords or legal situation to search for",
  clearText: "Clear text",
  searchBtn: "Search",
  recent: "Recent searches",
  clearHistory: "Clear history",
  removeFromHistory: "Remove from history",
  disabledNote: "Live search is temporarily turned off. Please come back later.",
  remaining: (n: number) =>
    `${n} search${n === 1 ? "" : "es"} left today (each search uses 5). `,
  lowQuota: "Few searches left: some parts of the results may not be searchable.",
  resultsFor: "Results for:",
  personalize: "Personalize: my business field",
  fieldPlaceholder: "E.g.: Real estate, E-commerce, Construction…",
  fieldAria: "Business field",
  saving: "Saving…",
  save: "Save",
  fieldHint:
    "Optional. The system detects the field from your question; the saved field is only used as context to prioritize relevant results.",
  liveTitle: "Live search on official sources",
  liveBody1: "Legal AI ",
  liveBodyBold: "does not store",
  liveBody2:
    " legal documents, precedents or court judgments. With each search, the system looks directly on official websites and extracts the relevant content, together with source links for cross-checking.",
  disclaimerFallback:
    "Legal AI does not store legal documents, precedents or court judgments; content is searched directly on official websites and extracted by AI, for reference only. Please open the original source to check the exact wording and the latest validity status.",

  groups: {
    van_ban: {
      label: "Legal provisions",
      hint: "Relevant legal normative documents",
      excerptLabel: "Excerpt from the source",
    },
    an_le: {
      label: "Precedents",
      hint: "Precedents published by the Supreme People's Court",
      excerptLabel: "Summary of the precedent",
    },
    ban_an: {
      label: "Court judgments",
      hint: "Judgments and decisions published on the Court Judgments Portal",
      excerptLabel: "Case information",
    },
    luat_su: {
      label: "Law firm analysis",
      hint: "Articles published by law offices and law firms on their own websites — the opinion of the publishing firm, not of Legal AI",
      excerptLabel: "Verbatim excerpt from the article",
    },
    danh_gia: {
      label: "Synthesized results",
      hint: "Preliminary analysis compiled by AI from legal provisions and open sources — for reference only",
      excerptLabel: "Analysis",
    },
  },
  sectionAnLeBanAn: "Precedents / Judgments",
  tiers: {
    chinh_thong: {
      label: "Official source",
      note: "Website of a state agency",
    },
    tham_khao: {
      label: "Reference source",
      note: "Not an official state agency website; please check against the original document",
    },
  },
  risks: {
    cao: "High risk",
    trung_binh: "Medium risk",
    thap: "Low risk",
  },
  genericError: "Something went wrong, please try again.",
  citeNo: "No.",
  citeSource: "Source",
  copied: "Copied",
  copyFailed: "Could not copy",
  copyBtn: "Copy citation",
  verifiedMsg: "Citation checked against the source page.",
  unverifiedMsg:
    "Part of the citation provided by the AI did not match the source page and was hidden. Open the original source to read the exact text.",
  unknownMsg:
    "Could not be checked against the source page (the page requires JavaScript, is a PDF file, or failed to load). Open the original source to verify the exact text.",
  citedDocs: "Cited documents",
  docVerified: "Document number checked against the source page",
  docUnverified:
    "This document number was not found on the source page — please check again",
  docUnknown: "Document number could not be checked against the source page",
  numberPrefix: (n: string) => `No. ${n}`,
  postedOn: (d: string) => `Posted ${d}`,
  issuedOn: (d: string) => `Issued ${d}`,
  effectiveFrom: (d: string) => `Effective from ${d}`,
  statusUnverified: "Validity status not verified",
  statusUnverifiedTip:
    "The source page does not state the validity status; please check at the source.",
  issueLabel: {
    danh_gia: "Analysis of relevant provisions",
    luat_su: "Issues/provisions analyzed in the article",
    other: "Legal issue",
  },
  resolutionLabel: {
    danh_gia: "Recommendations / risk-mitigation measures",
    luat_su: "Conclusion/recommendation of the publishing firm",
    other: "Resolution / Ruling",
  },
  refsTitle: "Reference sources",
  aiDisclaimer:
    "Content compiled by AI, for reference only; it does not replace advice from a lawyer/legal expert.",
  aiHint: (r: string) => `AI note: ${r}`,
  openSource: "Open original source",
  searching: "Searching official sources… (may take 10–60 seconds)",
  retry: "Try again",
  noResults: "No matching content found on official sources.",
  resultsCount: (n: number) => `(${n} result${n === 1 ? "" : "s"})`,
  sourceColon: "Source:",

  overviewTitle: "Overview",
  synthesizing: "Compiling a quick conclusion…",
  aiOverviewNote:
    "Compiled by AI from the sources below, for reference only; open the sources to check the exact wording and validity status.",
  noOverview:
    "No quick conclusion for this question yet. See the detailed sections below.",
  followups: "Suggested follow-up questions",
  detailTitle: "Detailed analysis",
  legalBasisTitle: "Legal basis",
  sourcesTitle: "Sources",
  sourcesNone: "No verified sources yet.",
  sourcesPending: "Sources will appear when results are available…",
  noteRefs: "Reference source for the synthesis",
  noteHidden: "Part of the citation was hidden",
  notePoster: "Opinion of the publishing firm",
  noteVerified: "Citation checked",
  noteUnchecked: "Not yet checked",

  contribTitle: "Update legal documents / precedents / judgments",
  contribDesc:
    "Paste the full text of a legal document, precedent or court judgment (with its source, if any). Legal AI will classify it automatically (document type, field, topic) and save it for later searches. Content you provide has not been cross-checked, so it starts as \"Unverified\".",
  contribDocLabel: "Document text",
  contribDocPh: "Paste the full text of the document/precedent/judgment here…",
  contribSourceName: "Source name",
  contribOptional: "(optional)",
  contribSourceNamePh: "Example: Thư viện pháp luật",
  contribSourceUrl: "Source URL",
  contribErrShort: "Please paste fuller content (at least 20 characters).",
  contribClassifying: "Classifying…",
  contribSubmit: "Update",
};

const zh: LLText = {
  pageTitle: "法律检索",
  back: "返回",
  errShort: "请输入问题或关键词（至少 2 个字符）。",
  errClause: "条款内容至少需要 10 个字符。",
  intro: "输入关键词或描述您的法律情形——Legal AI 将直接在官方来源上检索。",
  placeholder: "要检索的关键词/法律情形",
  clearText: "清除内容",
  searchBtn: "检索",
  recent: "最近检索",
  clearHistory: "清除历史",
  removeFromHistory: "从历史中删除",
  disabledNote: "实时检索功能暂时关闭，请稍后再来。",
  remaining: (n: number) => `今天还剩 ${n} 次检索额度（每次检索消耗 5 次）。 `,
  lowQuota: "剩余额度不多：部分结果可能无法检索。",
  resultsFor: "检索结果：",
  personalize: "个性化：我的业务领域",
  fieldPlaceholder: "例如：房地产、电子商务、建筑……",
  fieldAria: "业务领域",
  saving: "保存中…",
  save: "保存",
  fieldHint:
    "可选。系统会根据您的问题自动识别领域；已保存的领域仅作为背景，用于优先展示相关结果。",
  liveTitle: "在官方来源上实时检索",
  liveBody1: "Legal AI ",
  liveBodyBold: "不存储",
  liveBody2:
    " 法律文件、判例和判决书。每次检索时，系统会直接在官方网站上查找并摘录相关内容，同时附上来源链接以便核对。",
  disclaimerFallback:
    "Legal AI 不存储法律文件、判例和判决书；内容由 AI 直接在官方网站上检索并摘录，仅供参考。请打开原始来源核对原文及最新的效力状态。",

  groups: {
    van_ban: {
      label: "法律规定",
      hint: "相关规范性法律文件",
      excerptLabel: "来源摘录",
    },
    an_le: {
      label: "判例",
      hint: "最高人民法院公布的判例",
      excerptLabel: "判例内容概要",
    },
    ban_an: {
      label: "判决书",
      hint: "已在判决书公布门户上公布的判决书和裁定",
      excerptLabel: "案件信息",
    },
    luat_su: {
      label: "律师事务所分析",
      hint: "律师事务所在其网站上发布的文章——属于发布单位的观点，并非 Legal AI 的观点",
      excerptLabel: "文章原文摘录",
    },
    danh_gia: {
      label: "综合结果",
      hint: "AI 根据法律规定和公开来源汇总的初步分析——仅供参考",
      excerptLabel: "分析",
    },
  },
  sectionAnLeBanAn: "判例/判决书",
  tiers: {
    chinh_thong: {
      label: "官方来源",
      note: "国家机关网站",
    },
    tham_khao: {
      label: "参考来源",
      note: "并非国家机关官方网站，请与原文核对",
    },
  },
  risks: {
    cao: "高风险",
    trung_binh: "中风险",
    thap: "低风险",
  },
  genericError: "出错了，请重试。",
  citeNo: "编号",
  citeSource: "来源",
  copied: "已复制",
  copyFailed: "复制失败",
  copyBtn: "复制引用",
  verifiedMsg: "引用内容已与来源页面核对。",
  unverifiedMsg:
    "AI 提供的部分引用与来源页面不符，已被隐藏。请打开原始来源查看原文。",
  unknownMsg:
    "无法与来源页面核对（页面需要 JavaScript、为 PDF 文件或无法加载）。请打开原始来源核实原文。",
  citedDocs: "引用的文件",
  docVerified: "文号已与来源页面核对",
  docUnverified: "来源页面上未找到此文号——请重新核查",
  docUnknown: "无法将文号与来源页面核对",
  numberPrefix: (n: string) => `编号 ${n}`,
  postedOn: (d: string) => `发布于 ${d}`,
  issuedOn: (d: string) => `颁布于 ${d}`,
  effectiveFrom: (d: string) => `自 ${d} 起生效`,
  statusUnverified: "效力状态未核实",
  statusUnverifiedTip: "来源页面未明确标注效力状态，请在来源处核查。",
  issueLabel: {
    danh_gia: "相关规定分析",
    luat_su: "文章所分析的问题/规定",
    other: "法律问题",
  },
  resolutionLabel: {
    danh_gia: "建议/降低风险的措施",
    luat_su: "发布单位的结论/建议",
    other: "处理结果/裁判结论",
  },
  refsTitle: "参考来源",
  aiDisclaimer: "内容由 AI 汇总，仅供参考，不能替代律师/法律专家的意见。",
  aiHint: (r: string) => `AI 提示：${r}`,
  openSource: "打开原始来源",
  searching: "正在官方来源中检索……（可能需要 10–60 秒）",
  retry: "重试",
  noResults: "在官方来源上未找到相关内容。",
  resultsCount: (n: number) => `（${n} 条结果）`,
  sourceColon: "来源：",

  overviewTitle: "概览",
  synthesizing: "正在汇总快速结论……",
  aiOverviewNote:
    "由 AI 根据下列来源汇总，仅供参考；请打开来源核对原文及效力状态。",
  noOverview: "暂无针对该问题的快速结论，请查看下方的详细内容。",
  followups: "推荐的后续问题",
  detailTitle: "详细分析",
  legalBasisTitle: "法律依据",
  sourcesTitle: "来源",
  sourcesNone: "暂无已验证的来源。",
  sourcesPending: "有结果后将显示来源……",
  noteRefs: "综合分析的参考来源",
  noteHidden: "部分引用已被隐藏",
  notePoster: "发布单位的观点",
  noteVerified: "引用已核对",
  noteUnchecked: "尚未核对",

  contribTitle: "更新法律文件/判例/判决书",
  contribDesc:
    "粘贴法律文件、判例或判决书的全文（如有来源请一并填写）。Legal AI 会自动分类（文件类型、领域、专题）并保存，供之后的检索使用。您提供的内容尚未经过核对，因此初始状态为“未核实”。",
  contribDocLabel: "文本",
  contribDocPh: "在此粘贴文件/判例/判决书的全文……",
  contribSourceName: "来源名称",
  contribOptional: "（可选）",
  contribSourceNamePh: "例如：Thư viện pháp luật",
  contribSourceUrl: "来源链接",
  contribErrShort: "请粘贴更完整的内容（至少 20 个字符）。",
  contribClassifying: "正在分类……",
  contribSubmit: "更新",
};

const ko: LLText = {
  pageTitle: "법률 검색",
  back: "뒤로",
  errShort: "질문 또는 키워드를 입력하세요 (2자 이상).",
  errClause: "조항 내용은 10자 이상이어야 합니다.",
  intro:
    "키워드를 입력하거나 법적 상황을 설명하세요 — Legal AI가 공식 출처에서 직접 검색합니다.",
  placeholder: "검색할 키워드/법적 상황",
  clearText: "내용 지우기",
  searchBtn: "검색",
  recent: "최근 검색",
  clearHistory: "기록 삭제",
  removeFromHistory: "기록에서 삭제",
  disabledNote:
    "실시간 검색 기능이 일시적으로 꺼져 있습니다. 나중에 다시 이용해 주세요.",
  remaining: (n: number) =>
    `오늘 남은 검색 횟수 ${n}회 (검색 1회당 5회 차감). `,
  lowQuota: "남은 횟수가 적습니다. 일부 결과는 검색되지 않을 수 있습니다.",
  resultsFor: "검색 결과:",
  personalize: "맞춤 설정: 내 사업 분야",
  fieldPlaceholder: "예: 부동산, 전자상거래, 건설…",
  fieldAria: "사업 분야",
  saving: "저장 중…",
  save: "저장",
  fieldHint:
    "선택 사항입니다. 시스템이 질문에서 분야를 자동으로 파악하며, 저장된 분야는 관련 결과를 우선 표시하기 위한 배경 정보로만 사용됩니다.",
  liveTitle: "공식 출처에서 실시간 검색",
  liveBody1: "Legal AI는 법령, 판례, 판결문을 ",
  liveBodyBold: "저장하지 않습니다",
  liveBody2:
    ". 검색할 때마다 시스템이 공식 웹사이트에서 직접 찾아 관련 내용을 발췌하고, 대조할 수 있도록 출처 링크를 함께 제공합니다.",
  disclaimerFallback:
    "Legal AI는 법령, 판례, 판결문을 저장하지 않으며, 내용은 공식 웹사이트에서 직접 검색하여 AI가 발췌한 것으로 참고용입니다. 원문과 최신 효력 상태는 원본 출처를 열어 확인하세요.",

  groups: {
    van_ban: {
      label: "법령 규정",
      hint: "관련 법규 문서",
      excerptLabel: "출처 발췌",
    },
    an_le: {
      label: "판례",
      hint: "최고인민법원이 공표한 판례",
      excerptLabel: "판례 내용 개요",
    },
    ban_an: {
      label: "판결문",
      hint: "판결문 공개 포털에 공개된 판결 및 결정",
      excerptLabel: "사건 정보",
    },
    luat_su: {
      label: "법률사무소/로펌 분석",
      hint: "법률사무소·로펌이 자사 웹사이트에 게시한 글 — 게시한 기관의 의견이며 Legal AI의 의견이 아닙니다",
      excerptLabel: "글 원문 발췌",
    },
    danh_gia: {
      label: "종합 결과",
      hint: "AI가 법령 규정과 공개 출처를 바탕으로 정리한 예비 분석 — 참고용",
      excerptLabel: "분석",
    },
  },
  sectionAnLeBanAn: "판례/판결문",
  tiers: {
    chinh_thong: {
      label: "공식 출처",
      note: "국가기관 웹사이트",
    },
    tham_khao: {
      label: "참고 출처",
      note: "국가기관의 공식 웹사이트가 아닙니다. 원문과 대조하세요",
    },
  },
  risks: {
    cao: "높은 위험",
    trung_binh: "중간 위험",
    thap: "낮은 위험",
  },
  genericError: "오류가 발생했습니다. 다시 시도해 주세요.",
  citeNo: "번호",
  citeSource: "출처",
  copied: "복사됨",
  copyFailed: "복사할 수 없습니다",
  copyBtn: "인용 복사",
  verifiedMsg: "인용문을 출처 페이지와 대조했습니다.",
  unverifiedMsg:
    "AI가 제시한 인용문 일부가 출처 페이지와 일치하지 않아 숨겨졌습니다. 원문은 원본 출처를 열어 확인하세요.",
  unknownMsg:
    "출처 페이지와 대조하지 못했습니다 (JavaScript가 필요한 페이지, PDF 파일이거나 불러오지 못함). 원문은 원본 출처를 열어 확인하세요.",
  citedDocs: "인용된 문서",
  docVerified: "문서 번호를 출처 페이지와 대조했습니다",
  docUnverified: "출처 페이지에서 이 문서 번호를 찾을 수 없습니다 — 다시 확인하세요",
  docUnknown: "문서 번호를 출처 페이지와 대조하지 못했습니다",
  numberPrefix: (n: string) => `번호 ${n}`,
  postedOn: (d: string) => `게시 ${d}`,
  issuedOn: (d: string) => `공포 ${d}`,
  effectiveFrom: (d: string) => `${d}부터 시행`,
  statusUnverified: "효력 상태 미확인",
  statusUnverifiedTip:
    "출처 페이지에 효력 상태가 명시되어 있지 않습니다. 출처에서 확인하세요.",
  issueLabel: {
    danh_gia: "관련 규정 분석",
    luat_su: "글에서 분석한 쟁점/규정",
    other: "법적 쟁점",
  },
  resolutionLabel: {
    danh_gia: "권고 사항 / 리스크 완화 조치",
    luat_su: "게시 기관의 결론/권고",
    other: "해결 / 판결",
  },
  refsTitle: "참고 출처",
  aiDisclaimer:
    "AI가 정리한 내용으로 참고용이며, 변호사/법률 전문가의 자문을 대체하지 않습니다.",
  aiHint: (r: string) => `AI 참고: ${r}`,
  openSource: "원본 출처 열기",
  searching: "공식 출처에서 검색 중… (10~60초 걸릴 수 있습니다)",
  retry: "다시 시도",
  noResults: "공식 출처에서 일치하는 내용을 찾지 못했습니다.",
  resultsCount: (n: number) => `(결과 ${n}건)`,
  sourceColon: "출처:",

  overviewTitle: "개요",
  synthesizing: "간단한 결론을 정리하는 중…",
  aiOverviewNote:
    "아래 출처를 바탕으로 AI가 정리한 내용으로 참고용입니다. 원문과 효력 상태는 출처를 열어 확인하세요.",
  noOverview: "이 질문에 대한 간단한 결론이 아직 없습니다. 아래 상세 항목을 확인하세요.",
  followups: "추천 후속 질문",
  detailTitle: "상세 분석",
  legalBasisTitle: "법적 근거",
  sourcesTitle: "출처",
  sourcesNone: "아직 검증된 출처가 없습니다.",
  sourcesPending: "결과가 나오면 출처가 표시됩니다…",
  noteRefs: "종합 분석의 참고 출처",
  noteHidden: "인용문 일부가 숨겨졌습니다",
  notePoster: "게시 기관의 의견",
  noteVerified: "인용문 대조 완료",
  noteUnchecked: "아직 대조하지 못함",

  contribTitle: "법령/판례/판결문 업데이트",
  contribDesc:
    "법령, 판례 또는 판결문의 전문을 붙여넣으세요 (출처가 있으면 함께 입력). Legal AI가 자동으로 분류(문서 유형, 분야, 주제)한 후 이후 검색에 사용할 수 있도록 저장합니다. 제공하신 내용은 아직 대조 검증을 거치지 않았으므로 처음에는 “미확인” 상태입니다.",
  contribDocLabel: "문서",
  contribDocPh: "법령/판례/판결문 전문을 여기에 붙여넣으세요…",
  contribSourceName: "출처 이름",
  contribOptional: "(선택)",
  contribSourceNamePh: "예: Thư viện pháp luật",
  contribSourceUrl: "출처 링크",
  contribErrShort: "내용을 더 자세히 붙여넣으세요 (20자 이상).",
  contribClassifying: "분류 중…",
  contribSubmit: "업데이트",
};

const ja: LLText = {
  pageTitle: "法令・判例検索",
  back: "戻る",
  errShort: "質問またはキーワードを入力してください（2文字以上）。",
  errClause: "条項の文章は10文字以上必要です。",
  intro:
    "キーワードを入力するか、法的な状況を説明してください — Legal AI が公式ソースを直接検索します。",
  placeholder: "検索するキーワード／法的状況",
  clearText: "入力内容を消去",
  searchBtn: "検索",
  recent: "最近の検索",
  clearHistory: "履歴を消去",
  removeFromHistory: "履歴から削除",
  disabledNote: "リアルタイム検索は一時的に停止中です。後ほどお試しください。",
  remaining: (n: number) =>
    `本日の残り検索回数：${n} 回（1回の検索で5回分を消費）。 `,
  lowQuota: "残り回数が少ないため、一部の結果は検索できない場合があります。",
  resultsFor: "検索結果：",
  personalize: "パーソナライズ：私の事業分野",
  fieldPlaceholder: "例：不動産、Eコマース、建設…",
  fieldAria: "事業分野",
  saving: "保存中…",
  save: "保存",
  fieldHint:
    "任意です。システムは質問から分野を自動的に判別します。保存した分野は、関連性の高い結果を優先するための背景情報としてのみ使用されます。",
  liveTitle: "公式ソースでのリアルタイム検索",
  liveBody1: "Legal AI は法令・判例・判決を",
  liveBodyBold: "保存しません",
  liveBody2:
    "。検索のたびに、システムが公式サイトを直接検索して関連内容を抜粋し、照合用の出典リンクを添えて表示します。",
  disclaimerFallback:
    "Legal AI は法令・判例・判決を保存しません。内容は公式サイトを直接検索して AI が抜粋したもので、参考情報です。原文と最新の効力状況は、出典元を開いて確認してください。",

  groups: {
    van_ban: {
      label: "法令の規定",
      hint: "関連する法規文書",
      excerptLabel: "出典からの引用",
    },
    an_le: {
      label: "判例",
      hint: "最高人民裁判所が公表した判例",
      excerptLabel: "判例内容の概要",
    },
    ban_an: {
      label: "判決",
      hint: "判決公表ポータルで公表された判決・決定",
      excerptLabel: "事件情報",
    },
    luat_su: {
      label: "法律事務所の分析",
      hint: "法律事務所が自社ウェブサイトで公表した記事 — 掲載元の見解であり、Legal AI の見解ではありません",
      excerptLabel: "記事からの原文引用",
    },
    danh_gia: {
      label: "総合結果",
      hint: "法令の規定とオープンソースを基に AI がまとめた予備的分析 — 参考用",
      excerptLabel: "分析",
    },
  },
  sectionAnLeBanAn: "判例・判決",
  tiers: {
    chinh_thong: {
      label: "公式ソース",
      note: "国の機関のサイト",
    },
    tham_khao: {
      label: "参考ソース",
      note: "国の機関の公式サイトではありません。原文と照合してください",
    },
  },
  risks: {
    cao: "高リスク",
    trung_binh: "中リスク",
    thap: "低リスク",
  },
  genericError: "エラーが発生しました。もう一度お試しください。",
  citeNo: "番号",
  citeSource: "出典",
  copied: "コピーしました",
  copyFailed: "コピーできませんでした",
  copyBtn: "引用をコピー",
  verifiedMsg: "引用を出典ページと照合済みです。",
  unverifiedMsg:
    "AI が示した引用の一部が出典ページと一致しなかったため、非表示にしました。原文は出典元を開いてご確認ください。",
  unknownMsg:
    "出典ページと照合できませんでした（JavaScript が必要なページ、PDF ファイル、または読み込み不可）。原文は出典元を開いて確認してください。",
  citedDocs: "引用された文書",
  docVerified: "文書番号を出典ページと照合済み",
  docUnverified: "出典ページにこの文書番号が見当たりません — 再確認してください",
  docUnknown: "文書番号を出典ページと照合できませんでした",
  numberPrefix: (n: string) => `番号 ${n}`,
  postedOn: (d: string) => `掲載 ${d}`,
  issuedOn: (d: string) => `公布 ${d}`,
  effectiveFrom: (d: string) => `${d} から施行`,
  statusUnverified: "効力状況は未確認",
  statusUnverifiedTip:
    "出典ページに効力状況の記載がありません。出典元でご確認ください。",
  issueLabel: {
    danh_gia: "関連規定の分析",
    luat_su: "記事で分析されている問題／規定",
    other: "法的論点",
  },
  resolutionLabel: {
    danh_gia: "推奨事項／リスク軽減策",
    luat_su: "掲載元の結論／推奨",
    other: "解決／判断",
  },
  refsTitle: "参考ソース",
  aiDisclaimer:
    "AI がまとめた内容であり参考情報です。弁護士／法律専門家の助言に代わるものではありません。",
  aiHint: (r: string) => `AI のメモ：${r}`,
  openSource: "出典元を開く",
  searching: "公式ソースを検索中…（10～60秒かかる場合があります）",
  retry: "再試行",
  noResults: "公式ソースに該当する内容が見つかりませんでした。",
  resultsCount: (n: number) => `（${n} 件）`,
  sourceColon: "出典：",

  overviewTitle: "概要",
  synthesizing: "簡易な結論をまとめています…",
  aiOverviewNote:
    "以下の出典を基に AI がまとめたもので、参考情報です。原文と効力状況は出典元でご確認ください。",
  noOverview:
    "この質問に対する簡易な結論はまだありません。下の詳細項目をご覧ください。",
  followups: "おすすめの追加質問",
  detailTitle: "詳細分析",
  legalBasisTitle: "法的根拠",
  sourcesTitle: "出典",
  sourcesNone: "検証済みの出典はまだありません。",
  sourcesPending: "結果が出ると出典が表示されます…",
  noteRefs: "総合分析の参考ソース",
  noteHidden: "引用の一部を非表示にしました",
  notePoster: "掲載元の見解",
  noteVerified: "引用を照合済み",
  noteUnchecked: "未照合",

  contribTitle: "法令・判例・判決の更新",
  contribDesc:
    "法令・判例・判決の全文を貼り付けてください（出典があれば併せて入力）。Legal AI が自動で分類（文書の種類、分野、テーマ）し、今後の検索で使えるように保存します。ご提供の内容は照合確認を経ていないため、初期状態は「未確認」です。",
  contribDocLabel: "文書",
  contribDocPh: "ここに法令・判例・判決の全文を貼り付け…",
  contribSourceName: "出典名",
  contribOptional: "（任意）",
  contribSourceNamePh: "例：Thư viện pháp luật",
  contribSourceUrl: "出典URL",
  contribErrShort: "もう少し詳しい内容を貼り付けてください（20文字以上）。",
  contribClassifying: "分類中…",
  contribSubmit: "更新",
};

export const LL: Record<Lang, LLText> = { vi, en, zh, ko, ja };

// Hook: lấy bộ văn bản theo ngôn ngữ giao diện đang chọn.
export function useLL(): LLText {
  const [lang] = useLang();
  return LL[lang];
}
