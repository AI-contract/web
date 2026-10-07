// lib/privacy.ts
//
// Cam kết bảo mật dữ liệu cá nhân của Legal AI, đủ 5 ngôn ngữ (vi, en, zh, ko, ja).
// Căn cứ pháp lý: Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (có hiệu lực từ 01/01/2026).
//
// LƯU Ý CHO NGƯỜI VẬN HÀNH: mỗi cam kết dưới đây phải đúng với cách hệ thống thực sự hoạt động
// (mã hóa, thời hạn lưu, nhà cung cấp AI/hạ tầng, quy trình xóa dữ liệu, thủ tục chuyển dữ liệu
// ra nước ngoài...). Hãy rà soát lại với luật sư/bộ phận pháp chế trước khi công bố chính thức và
// cập nhật PRIVACY_UPDATED mỗi khi nội dung thay đổi.
//
// Email liên hệ lấy từ biến môi trường NEXT_PUBLIC_PRIVACY_EMAIL (nếu có); không có thì chỉ hiện
// câu "liên hệ quản trị viên".

import type { Lang } from "@/lib/lang";

export const PRIVACY_UPDATED = "10/2026";
export const PRIVACY_EMAIL = (process.env.NEXT_PUBLIC_PRIVACY_EMAIL || "").trim();

export interface PrivacySection {
  title: string;
  items: string[];
}

export interface PrivacyText {
  linkLabel: string;
  pageTitle: string;
  back: string;
  updatedLabel: string;
  intro: string;
  sections: PrivacySection[];
  contactTitle: string;
  contactWithEmail: (email: string) => string;
  contactNoEmail: string;
  // Hộp cam kết ngắn hiển thị trên trang Tra cứu pháp lý.
  boxTitle: string;
  boxBody: string;
  boxLink: string;
}

const vi: PrivacyText = {
  linkLabel: "Cam kết bảo mật",
  pageTitle: "Cam kết bảo mật và bảo vệ dữ liệu cá nhân",
  back: "Quay lại",
  updatedLabel: "Cập nhật lần cuối",
  intro:
    "Legal AI cam kết bảo vệ dữ liệu cá nhân của bạn theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (có hiệu lực từ ngày 01/01/2026) và các văn bản hướng dẫn thi hành.",
  sections: [
    {
      title: "Dữ liệu chúng tôi xử lý",
      items: [
        "Tài khoản: email đăng nhập và mật khẩu. Mật khẩu được băm bằng thuật toán bcrypt; Legal AI không lưu mật khẩu gốc.",
        "Nội dung bạn đưa vào hệ thống: hợp đồng bạn tạo, tải lên hoặc yêu cầu review; câu hỏi tra cứu pháp lý; lĩnh vực hoạt động bạn nhập để cá nhân hoá.",
        "Thông tin về gói dịch vụ và giao dịch thanh toán (giao dịch do cổng thanh toán đối tác xử lý).",
      ],
    },
    {
      title: "Mục đích và nguyên tắc xử lý",
      items: [
        "Chỉ thu thập và xử lý dữ liệu đúng phạm vi, mục đích cụ thể, rõ ràng: cung cấp tính năng bạn yêu cầu (tạo hợp đồng, review hợp đồng, tra cứu pháp lý, nhắc hạn), quản lý tài khoản và bảo đảm an toàn hệ thống.",
        "Không bán, không trao đổi dữ liệu cá nhân của bạn vì mục đích thương mại.",
        "Không dùng nội dung hợp đồng và câu hỏi của bạn để huấn luyện mô hình AI riêng của Legal AI.",
        "Chỉ xử lý dữ liệu cá nhân khi có sự đồng ý của bạn hoặc trong các trường hợp pháp luật cho phép.",
      ],
    },
    {
      title: "Xử lý bằng AI và bên thứ ba",
      items: [
        "Để tạo hợp đồng, review hợp đồng và tra cứu pháp lý, nội dung bạn gửi được chuyển tới nhà cung cấp dịch vụ AI (OpenAI) để xử lý theo điều khoản API của nhà cung cấp.",
        "Dữ liệu có thể được xử lý, lưu trữ trên hạ tầng đặt ngoài lãnh thổ Việt Nam; Legal AI thực hiện theo quy định của pháp luật Việt Nam về chuyển dữ liệu cá nhân ra nước ngoài.",
        "Bạn không nên nhập thông tin cá nhân hoặc bí mật kinh doanh không cần thiết vào ô tra cứu hoặc nội dung gửi review.",
      ],
    },
    {
      title: "Kho tự lưu văn bản pháp luật",
      items: [
        "Kho chỉ lưu văn bản pháp luật, án lệ, bản án được công bố công khai và đã đối chiếu với trang nguồn; kho không chứa câu hỏi, hợp đồng hay thông tin cá nhân của bạn.",
        "Lịch sử tra cứu chỉ hiển thị cho riêng tài khoản của bạn; bạn có thể xóa từng mục hoặc toàn bộ lịch sử bất cứ lúc nào ngay trên trang Tra cứu pháp lý.",
      ],
    },
    {
      title: "Biện pháp bảo mật",
      items: [
        "Dữ liệu truyền giữa trình duyệt và hệ thống qua kết nối mã hóa (HTTPS).",
        "Mật khẩu được băm (bcrypt); mỗi tài khoản chỉ truy cập được dữ liệu của chính mình; quyền quản trị chỉ giới hạn cho người được phân công.",
        "Khi xảy ra sự cố vi phạm bảo vệ dữ liệu cá nhân, Legal AI sẽ thông báo cho cơ quan có thẩm quyền và người dùng bị ảnh hưởng theo quy định của pháp luật.",
      ],
    },
    {
      title: "Quyền của bạn (theo Luật số 91/2025/QH15)",
      items: [
        "Được biết về hoạt động xử lý dữ liệu; đồng ý hoặc rút lại sự đồng ý.",
        "Truy cập, xem và chỉnh sửa dữ liệu cá nhân của mình.",
        "Yêu cầu xóa, hạn chế xử lý, cung cấp dữ liệu hoặc phản đối việc xử lý.",
        "Khiếu nại, khởi kiện và yêu cầu bồi thường thiệt hại theo quy định của pháp luật.",
      ],
    },
    {
      title: "Lưu trữ, xóa dữ liệu và trẻ em",
      items: [
        "Dữ liệu chỉ được lưu trong thời gian cần thiết để cung cấp dịch vụ hoặc theo yêu cầu của pháp luật; khi bạn yêu cầu xóa, dữ liệu sẽ được xóa hoặc ẩn danh trong thời hạn theo quy định, trừ trường hợp pháp luật yêu cầu lưu giữ.",
        "Dịch vụ không dành cho trẻ em và Legal AI không chủ đích thu thập dữ liệu cá nhân của trẻ em.",
      ],
    },
  ],
  contactTitle: "Liên hệ",
  contactWithEmail: (email) =>
    `Để thực hiện các quyền nêu trên hoặc phản ánh về bảo mật dữ liệu, vui lòng liên hệ: ${email}.`,
  contactNoEmail:
    "Để thực hiện các quyền nêu trên hoặc phản ánh về bảo mật dữ liệu, vui lòng liên hệ quản trị viên Legal AI.",
  boxTitle: "Cam kết bảo mật dữ liệu",
  boxBody:
    "Legal AI xử lý dữ liệu cá nhân theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15: chỉ dùng câu hỏi và nội dung của bạn để thực hiện tính năng bạn yêu cầu, không bán và không dùng để huấn luyện mô hình AI riêng. Lịch sử tra cứu chỉ hiển thị cho riêng bạn và bạn có thể xóa bất cứ lúc nào.",
  boxLink: "Xem cam kết đầy đủ",
};

const en: PrivacyText = {
  linkLabel: "Privacy Commitment",
  pageTitle: "Privacy and Personal Data Protection Commitment",
  back: "Back",
  updatedLabel: "Last updated",
  intro:
    "Legal AI is committed to protecting your personal data in accordance with Vietnam's Law on Personal Data Protection No. 91/2025/QH15 (effective 1 January 2026) and its implementing regulations.",
  sections: [
    {
      title: "Data we process",
      items: [
        "Account: your login email and password. Passwords are hashed with bcrypt; Legal AI does not store your original password.",
        "Content you submit: contracts you create, upload or ask us to review; legal research questions; the business field you enter for personalisation.",
        "Plan and payment transaction information (payments are processed by a partner payment gateway).",
      ],
    },
    {
      title: "Purposes and principles",
      items: [
        "We collect and process data only within a specific, clear purpose: providing the features you request (contract generation, contract review, legal research, deadline reminders), managing your account and keeping the system secure.",
        "We do not sell or trade your personal data for commercial purposes.",
        "We do not use your contract content or questions to train Legal AI's own AI models.",
        "We process personal data only with your consent or where the law allows.",
      ],
    },
    {
      title: "AI processing and third parties",
      items: [
        "To generate and review contracts and to run legal research, the content you submit is sent to our AI service provider (OpenAI) and processed under the provider's API terms.",
        "Data may be processed and stored on infrastructure located outside Vietnam; Legal AI handles this in accordance with Vietnamese law on cross-border transfer of personal data.",
        "Please avoid entering unnecessary personal information or trade secrets in the search box or in content you send for review.",
      ],
    },
    {
      title: "Legal document library",
      items: [
        "The library stores only publicly published laws, precedents and judgments that have been checked against their source pages; it contains none of your questions, contracts or personal information.",
        "Your search history is visible only to your own account; you can delete individual entries or the entire history at any time on the Legal Research page.",
      ],
    },
    {
      title: "Security measures",
      items: [
        "Data is transmitted between your browser and our system over an encrypted connection (HTTPS).",
        "Passwords are hashed (bcrypt); each account can access only its own data; administrator access is limited to assigned personnel.",
        "If a personal data breach occurs, Legal AI will notify the competent authority and affected users as required by law.",
      ],
    },
    {
      title: "Your rights (under Law No. 91/2025/QH15)",
      items: [
        "To be informed about the processing of your data; to give or withdraw consent.",
        "To access, view and correct your personal data.",
        "To request deletion, restriction of processing or a copy of your data, or to object to processing.",
        "To complain, bring a lawsuit and claim compensation as provided by law.",
      ],
    },
    {
      title: "Retention, deletion and children",
      items: [
        "Data is kept only as long as needed to provide the service or as required by law; when you ask for deletion, your data will be deleted or anonymised within the legal time limit, unless the law requires it to be retained.",
        "The service is not intended for children and Legal AI does not knowingly collect children's personal data.",
      ],
    },
  ],
  contactTitle: "Contact",
  contactWithEmail: (email) =>
    `To exercise the rights above or to report a data security concern, please contact: ${email}.`,
  contactNoEmail:
    "To exercise the rights above or to report a data security concern, please contact the Legal AI administrator.",
  boxTitle: "Data privacy commitment",
  boxBody:
    "Legal AI processes personal data in accordance with the Law on Personal Data Protection No. 91/2025/QH15: your questions and content are used only to deliver the feature you request, are never sold and are not used to train our own AI models. Your search history is visible only to you and can be deleted at any time.",
  boxLink: "Read the full commitment",
};

const zh: PrivacyText = {
  linkLabel: "隐私承诺",
  pageTitle: "隐私与个人数据保护承诺",
  back: "返回",
  updatedLabel: "最后更新",
  intro:
    "Legal AI 承诺依照越南《个人数据保护法》（第 91/2025/QH15 号，自 2026 年 1 月 1 日起施行）及其实施规定，保护您的个人数据。",
  sections: [
    {
      title: "我们处理的数据",
      items: [
        "账户：登录邮箱和密码。密码使用 bcrypt 算法进行哈希处理，Legal AI 不保存原始密码。",
        "您提交的内容：您创建、上传或请求审查的合同；法律检索问题；为个性化而填写的业务领域。",
        "服务套餐和支付交易信息（支付由合作支付网关处理）。",
      ],
    },
    {
      title: "处理目的与原则",
      items: [
        "仅在具体、明确的目的范围内收集和处理数据：提供您所请求的功能（生成合同、审查合同、法律检索、到期提醒）、管理账户并保障系统安全。",
        "不会出于商业目的出售或交换您的个人数据。",
        "不会使用您的合同内容和提问来训练 Legal AI 自有的 AI 模型。",
        "仅在取得您同意或法律允许的情形下处理个人数据。",
      ],
    },
    {
      title: "AI 处理与第三方",
      items: [
        "为生成合同、审查合同和进行法律检索，您提交的内容会发送至 AI 服务提供商（OpenAI），并依据该提供商的 API 条款处理。",
        "数据可能在位于越南境外的基础设施上处理和存储；Legal AI 将依照越南有关个人数据出境的法律规定办理。",
        "请避免在检索框或提交审查的内容中输入不必要的个人信息或商业秘密。",
      ],
    },
    {
      title: "法律文件自存库",
      items: [
        "该库仅保存已公开发布且已与来源页面核对的法律文件、判例和判决书，不包含您的提问、合同或个人信息。",
        "您的检索记录仅对您本人账户可见；您可随时在“法律检索”页面删除单条记录或全部记录。",
      ],
    },
    {
      title: "安全措施",
      items: [
        "浏览器与系统之间的数据通过加密连接（HTTPS）传输。",
        "密码经哈希处理（bcrypt）；每个账户只能访问自己的数据；管理权限仅限于被指派的人员。",
        "如发生个人数据泄露事件，Legal AI 将依法通知主管机关和受影响的用户。",
      ],
    },
    {
      title: "您的权利（依据第 91/2025/QH15 号法律）",
      items: [
        "知悉数据处理情况；同意或撤回同意。",
        "访问、查看并更正您的个人数据。",
        "要求删除、限制处理、提供数据副本，或反对处理。",
        "依法投诉、提起诉讼并要求赔偿损失。",
      ],
    },
    {
      title: "存储期限、数据删除与儿童",
      items: [
        "数据仅在提供服务所需或法律要求的期限内保存；当您要求删除时，数据将在法定期限内被删除或匿名化，法律要求保留的除外。",
        "本服务不面向儿童，Legal AI 不会有意收集儿童的个人数据。",
      ],
    },
  ],
  contactTitle: "联系方式",
  contactWithEmail: (email) =>
    `如需行使上述权利或反映数据安全问题，请联系：${email}。`,
  contactNoEmail:
    "如需行使上述权利或反映数据安全问题，请联系 Legal AI 管理员。",
  boxTitle: "数据隐私承诺",
  boxBody:
    "Legal AI 依照第 91/2025/QH15 号《个人数据保护法》处理个人数据：您的提问和内容仅用于实现您所请求的功能，不会出售，也不会用于训练我们自有的 AI 模型。检索记录仅您本人可见，并可随时删除。",
  boxLink: "查看完整承诺",
};

const ko: PrivacyText = {
  linkLabel: "개인정보 보호 약속",
  pageTitle: "개인정보 및 데이터 보호 약속",
  back: "뒤로",
  updatedLabel: "최종 업데이트",
  intro:
    "Legal AI는 베트남 개인정보보호법(제91/2025/QH15호, 2026년 1월 1일 시행) 및 그 시행 규정에 따라 이용자의 개인정보를 보호할 것을 약속합니다.",
  sections: [
    {
      title: "처리하는 데이터",
      items: [
        "계정: 로그인 이메일과 비밀번호. 비밀번호는 bcrypt 알고리즘으로 해시 처리되며 Legal AI는 원래 비밀번호를 저장하지 않습니다.",
        "제출하는 내용: 직접 작성·업로드하거나 검토를 요청한 계약서, 법률 검색 질문, 맞춤 설정을 위해 입력한 사업 분야.",
        "요금제 및 결제 거래 정보(결제는 제휴 결제 게이트웨이가 처리합니다).",
      ],
    },
    {
      title: "처리 목적 및 원칙",
      items: [
        "구체적이고 명확한 목적 범위 내에서만 데이터를 수집·처리합니다: 요청하신 기능(계약서 작성, 계약서 검토, 법률 검색, 기한 알림) 제공, 계정 관리, 시스템 보안 유지.",
        "개인정보를 상업적 목적으로 판매하거나 교환하지 않습니다.",
        "계약서 내용과 질문을 Legal AI 자체 AI 모델 학습에 사용하지 않습니다.",
        "이용자의 동의가 있거나 법률이 허용하는 경우에만 개인정보를 처리합니다.",
      ],
    },
    {
      title: "AI 처리 및 제3자",
      items: [
        "계약서 작성·검토와 법률 검색을 위해 제출하신 내용은 AI 서비스 제공업체(OpenAI)로 전송되어 해당 업체의 API 약관에 따라 처리됩니다.",
        "데이터는 베트남 영토 밖에 있는 인프라에서 처리·저장될 수 있으며, Legal AI는 개인정보의 국외 이전에 관한 베트남 법령에 따라 이를 수행합니다.",
        "검색창이나 검토 요청 내용에 불필요한 개인정보나 영업 비밀을 입력하지 않도록 유의해 주세요.",
      ],
    },
    {
      title: "법령 자동 저장소",
      items: [
        "저장소에는 공개적으로 게시되고 출처 페이지와 대조를 마친 법령, 판례, 판결문만 저장되며, 이용자의 질문, 계약서, 개인정보는 포함되지 않습니다.",
        "검색 기록은 이용자 본인의 계정에만 표시되며, 법률 검색 페이지에서 언제든지 항목별 또는 전체 기록을 삭제할 수 있습니다.",
      ],
    },
    {
      title: "보안 조치",
      items: [
        "브라우저와 시스템 간 데이터는 암호화된 연결(HTTPS)로 전송됩니다.",
        "비밀번호는 해시 처리(bcrypt)되며, 각 계정은 자신의 데이터에만 접근할 수 있고, 관리자 권한은 지정된 담당자에게만 부여됩니다.",
        "개인정보 침해 사고가 발생하면 Legal AI는 법령에 따라 관할 기관과 영향을 받는 이용자에게 통지합니다.",
      ],
    },
    {
      title: "이용자의 권리(제91/2025/QH15호 법률 기준)",
      items: [
        "데이터 처리 현황을 알 권리, 동의 및 동의 철회 권리.",
        "본인의 개인정보에 접근하고 열람·정정할 권리.",
        "삭제, 처리 제한, 데이터 제공을 요청하거나 처리에 반대할 권리.",
        "법령에 따라 민원을 제기하고, 소송을 제기하며, 손해배상을 청구할 권리.",
      ],
    },
    {
      title: "보관, 삭제 및 아동",
      items: [
        "데이터는 서비스 제공에 필요한 기간 또는 법령이 요구하는 기간 동안만 보관되며, 삭제를 요청하시면 법령에서 정한 기한 내에 삭제 또는 익명화됩니다(법령상 보관 의무가 있는 경우 제외).",
        "본 서비스는 아동을 대상으로 하지 않으며 Legal AI는 아동의 개인정보를 의도적으로 수집하지 않습니다.",
      ],
    },
  ],
  contactTitle: "문의",
  contactWithEmail: (email) =>
    `위 권리를 행사하거나 데이터 보안 관련 문의를 하시려면 다음으로 연락해 주세요: ${email}.`,
  contactNoEmail:
    "위 권리를 행사하거나 데이터 보안 관련 문의를 하시려면 Legal AI 관리자에게 연락해 주세요.",
  boxTitle: "개인정보 보호 약속",
  boxBody:
    "Legal AI는 개인정보보호법(제91/2025/QH15호)에 따라 개인정보를 처리합니다. 질문과 내용은 요청하신 기능을 제공하는 데에만 사용되며, 판매하지 않고 자체 AI 모델 학습에도 사용하지 않습니다. 검색 기록은 본인에게만 표시되며 언제든지 삭제할 수 있습니다.",
  boxLink: "전체 약속 보기",
};

const ja: PrivacyText = {
  linkLabel: "プライバシーに関する約束",
  pageTitle: "プライバシーおよび個人データ保護に関する約束",
  back: "戻る",
  updatedLabel: "最終更新",
  intro:
    "Legal AI は、ベトナムの個人データ保護法（第91/2025/QH15号、2026年1月1日施行）およびその施行規則に従い、お客様の個人データを保護することをお約束します。",
  sections: [
    {
      title: "取り扱うデータ",
      items: [
        "アカウント：ログイン用メールアドレスとパスワード。パスワードは bcrypt でハッシュ化され、Legal AI は元のパスワードを保存しません。",
        "お客様が入力する内容：作成・アップロード・レビュー依頼した契約書、法令検索の質問、パーソナライズのために入力した事業分野。",
        "プランおよび決済取引の情報（決済は提携する決済ゲートウェイが処理します）。",
      ],
    },
    {
      title: "利用目的と原則",
      items: [
        "具体的かつ明確な目的の範囲内でのみデータを収集・処理します：ご依頼の機能（契約書作成、契約書レビュー、法令検索、期限リマインダー）の提供、アカウント管理、システムの安全確保。",
        "お客様の個人データを商業目的で販売・交換することはありません。",
        "契約書の内容や質問を、Legal AI 独自の AI モデルの学習に使用しません。",
        "お客様の同意がある場合、または法令で認められる場合にのみ個人データを処理します。",
      ],
    },
    {
      title: "AI による処理と第三者",
      items: [
        "契約書の作成・レビューおよび法令検索のため、送信された内容は AI サービス提供事業者（OpenAI）に送られ、同事業者の API 規約に従って処理されます。",
        "データはベトナム国外にあるインフラで処理・保存される場合があり、Legal AI は個人データの国外移転に関するベトナムの法令に従って対応します。",
        "検索ボックスやレビュー依頼の内容に、不要な個人情報や営業秘密を入力しないようご注意ください。",
      ],
    },
    {
      title: "法令の自動保存ライブラリ",
      items: [
        "ライブラリには、公開されており出典ページとの照合を終えた法令・判例・判決のみを保存し、お客様の質問、契約書、個人情報は含まれません。",
        "検索履歴はお客様自身のアカウントにのみ表示され、法令・判例検索ページでいつでも個別または全件を削除できます。",
      ],
    },
    {
      title: "安全管理措置",
      items: [
        "ブラウザとシステム間のデータは、暗号化された接続（HTTPS）で送信されます。",
        "パスワードはハッシュ化（bcrypt）され、各アカウントは自分のデータにのみアクセスでき、管理者権限は指名された担当者に限定されます。",
        "個人データの侵害が発生した場合、Legal AI は法令に従い、所管当局および影響を受けるユーザーに通知します。",
      ],
    },
    {
      title: "お客様の権利（第91/2025/QH15号法に基づく）",
      items: [
        "データ処理について知る権利、同意および同意を撤回する権利。",
        "ご自身の個人データにアクセスし、閲覧・訂正する権利。",
        "削除、処理の制限、データの提供を求める権利、または処理に異議を唱える権利。",
        "法令に従い、苦情の申立て、訴訟の提起、損害賠償の請求を行う権利。",
      ],
    },
    {
      title: "保存期間、削除、児童",
      items: [
        "データは、サービス提供に必要な期間または法令が求める期間に限り保存します。削除を依頼された場合は、法令で定める期限内に削除または匿名化します（法令により保存が義務付けられている場合を除く）。",
        "本サービスは児童を対象としておらず、Legal AI は児童の個人データを意図的に収集しません。",
      ],
    },
  ],
  contactTitle: "お問い合わせ",
  contactWithEmail: (email) =>
    `上記の権利を行使する場合、またはデータセキュリティに関するご連絡は、次の宛先までお願いします：${email}。`,
  contactNoEmail:
    "上記の権利を行使する場合、またはデータセキュリティに関するご連絡は、Legal AI の管理者までお願いします。",
  boxTitle: "プライバシーに関する約束",
  boxBody:
    "Legal AI は個人データ保護法（第91/2025/QH15号）に従って個人データを取り扱います。質問や内容はご依頼の機能の提供にのみ使用し、販売せず、独自の AI モデルの学習にも使用しません。検索履歴はご本人にのみ表示され、いつでも削除できます。",
  boxLink: "約束の全文を見る",
};

export const PRIVACY: Record<Lang, PrivacyText> = { vi, en, zh, ko, ja };
