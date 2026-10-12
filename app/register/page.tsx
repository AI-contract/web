"use client";

/**
 * app/register/page.tsx — Đăng ký tài khoản.
 *
 * Giao diện đồng bộ với trang đăng nhập (nền kem, viền vàng đồng), dịch đủ 5 ngôn ngữ theo
 * ngôn ngữ dùng chung (lib/lang.ts, lưu localStorage). Người dùng phải tick đồng ý với
 * "Cam kết bảo mật" (/privacy — Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15) trước khi đăng ký.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scale, Languages } from "lucide-react";
import { register, login, ApiError } from "@/lib/api";
import { useLang, type Lang } from "@/lib/lang";
import { PRIVACY } from "@/lib/privacy";

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: "vi", label: "VI" },
  { value: "en", label: "EN" },
  { value: "zh", label: "中文" },
  { value: "ko", label: "한국어" },
  { value: "ja", label: "日本語" },
];

// ---- văn bản tĩnh của trang đăng ký, dịch đủ VI/EN/中文/한국어/日本語 ----
const T: Record<
  Lang,
  {
    logoName: string;
    title: string;
    emailLabel: string;
    passwordLabel: string;
    passwordHint: string;
    consentBefore: string;
    consentAfter: string;
    creating: string;
    submit: string;
    haveAccount: string;
    login: string;
    errConnect: string;
  }
> = {
  vi: {
    logoName: "Legal AI",
    title: "Tạo tài khoản",
    emailLabel: "Email",
    passwordLabel: "Mật khẩu",
    passwordHint: "Tối thiểu 6 ký tự",
    consentBefore: "Tôi đã đọc và đồng ý với ",
    consentAfter: " về xử lý dữ liệu cá nhân của Legal AI.",
    creating: "Đang tạo...",
    submit: "Đăng ký",
    haveAccount: "Đã có tài khoản?",
    login: "Đăng nhập",
    errConnect: "Không thể kết nối tới máy chủ",
  },
  en: {
    logoName: "Legal AI",
    title: "Create account",
    emailLabel: "Email",
    passwordLabel: "Password",
    passwordHint: "At least 6 characters",
    consentBefore: "I have read and agree to Legal AI's ",
    consentAfter: " on personal data processing.",
    creating: "Creating...",
    submit: "Sign up",
    haveAccount: "Already have an account?",
    login: "Log in",
    errConnect: "Couldn't connect to the server",
  },
  zh: {
    logoName: "Legal AI",
    title: "创建账户",
    emailLabel: "电子邮箱",
    passwordLabel: "密码",
    passwordHint: "至少 6 个字符",
    consentBefore: "我已阅读并同意 Legal AI 的",
    consentAfter: "，同意其处理我的个人数据。",
    creating: "正在创建...",
    submit: "注册",
    haveAccount: "已有账户？",
    login: "登录",
    errConnect: "无法连接到服务器",
  },
  ko: {
    logoName: "Legal AI",
    title: "계정 만들기",
    emailLabel: "이메일",
    passwordLabel: "비밀번호",
    passwordHint: "6자 이상",
    consentBefore: "Legal AI의 ",
    consentAfter: "을(를) 읽었으며 개인정보 처리에 동의합니다.",
    creating: "생성 중...",
    submit: "회원가입",
    haveAccount: "이미 계정이 있으신가요?",
    login: "로그인",
    errConnect: "서버에 연결할 수 없습니다",
  },
  ja: {
    logoName: "Legal AI",
    title: "アカウント作成",
    emailLabel: "メールアドレス",
    passwordLabel: "パスワード",
    passwordHint: "6文字以上",
    consentBefore: "Legal AI の",
    consentAfter: "を読み、個人データの取り扱いに同意します。",
    creating: "作成中...",
    submit: "新規登録",
    haveAccount: "すでにアカウントをお持ちの方",
    login: "ログイン",
    errConnect: "サーバーに接続できませんでした",
  },
};

export default function RegisterPage() {
  const router = useRouter();

  const [lang, setLang] = useLang();
  const t = T[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) return;
    setError(null);
    setLoading(true);

    try {
      await register(email, password);
      // Đăng ký xong thì đăng nhập luôn cho tiện.
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t.errConnect;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF8F3] px-4">
      <div className="w-full max-w-sm">
        {/* Bộ chọn ngôn ngữ giao diện (dùng chung với đăng nhập/dashboard) */}
        <div className="flex items-center justify-center gap-1 mb-4">
          <Languages size={14} className="text-[#5B6472] mr-1" />
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLang(opt.value)}
              className={`text-xs px-2 py-1 rounded-md border transition ${
                lang === opt.value
                  ? "bg-[#9C7A3C] border-[#9C7A3C] text-white"
                  : "border-[#DCD7C9] text-[#5B6472] hover:bg-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#9C7A3C]/15 border border-[#9C7A3C]/40">
            <Scale size={20} className="text-[#9C7A3C]" strokeWidth={1.75} />
          </span>
          <span className="text-2xl font-semibold tracking-tight text-[#1C2333]">
            {t.logoName}
          </span>
        </Link>

        <div className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-8">
          <h1 className="text-2xl font-semibold mb-6 text-center text-[#1C2333]">
            {t.title}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#1C2333]">
                {t.emailLabel}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#DCD7C9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9C7A3C]/30 focus:border-[#9C7A3C]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[#1C2333]">
                {t.passwordLabel}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#DCD7C9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9C7A3C]/30 focus:border-[#9C7A3C]"
              />
              <p className="mt-1 text-xs text-[#8A919C]">{t.passwordHint}</p>
            </div>

            {/* Đồng ý Cam kết bảo mật (Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15) */}
            <label className="flex items-start gap-2 text-xs leading-relaxed text-[#5B6472] cursor-pointer">
              <input
                type="checkbox"
                required
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#9C7A3C]"
              />
              <span>
                {t.consentBefore}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9C7A3C] underline"
                >
                  {PRIVACY[lang].linkLabel}
                </Link>
                {t.consentAfter}
              </span>
            </label>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || !agree}
              className="w-full bg-[#16213E] hover:bg-[#0E1629] text-white rounded-md py-2.5 font-medium transition disabled:opacity-50"
            >
              {loading ? t.creating : t.submit}
            </button>
          </form>

          <p className="text-sm text-center mt-5 text-[#5B6472]">
            {t.haveAccount}{" "}
            <Link href="/login" className="text-[#9C7A3C] font-medium hover:underline">
              {t.login}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
