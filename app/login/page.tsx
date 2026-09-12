"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scale, Languages } from "lucide-react";
import { login, ApiError } from "@/lib/api";

type Lang = "vi" | "en" | "zh";

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: "vi", label: "VI" },
  { value: "en", label: "EN" },
  { value: "zh", label: "中文" },
];

// ---- văn bản tĩnh của trang đăng nhập, dịch đủ VI/EN/中文 ----
const T: Record<
  Lang,
  {
    logoName: string;
    title: string;
    emailLabel: string;
    passwordLabel: string;
    loggingIn: string;
    login: string;
    noAccount: string;
    register: string;
    errConnect: string;
  }
> = {
  vi: {
    logoName: "Legal AI",
    title: "Đăng nhập",
    emailLabel: "Email",
    passwordLabel: "Mật khẩu",
    loggingIn: "Đang đăng nhập...",
    login: "Đăng nhập",
    noAccount: "Chưa có tài khoản?",
    register: "Đăng ký",
    errConnect: "Không thể kết nối tới máy chủ",
  },
  en: {
    logoName: "Legal AI",
    title: "Log in",
    emailLabel: "Email",
    passwordLabel: "Password",
    loggingIn: "Logging in...",
    login: "Log in",
    noAccount: "Don't have an account?",
    register: "Sign up",
    errConnect: "Couldn't connect to the server",
  },
  zh: {
    logoName: "Legal AI",
    title: "登录",
    emailLabel: "电子邮箱",
    passwordLabel: "密码",
    loggingIn: "正在登录...",
    login: "登录",
    noAccount: "还没有账户？",
    register: "注册",
    errConnect: "无法连接到服务器",
  },
};

export default function LoginPage() {
  const router = useRouter();

  const [lang, setLang] = useState<Lang>("vi");
  const t = T[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
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
        {/* Bộ chọn ngôn ngữ giao diện */}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#DCD7C9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9C7A3C]/30 focus:border-[#9C7A3C]"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#16213E] hover:bg-[#0E1629] text-white rounded-md py-2.5 font-medium transition disabled:opacity-50"
            >
              {loading ? t.loggingIn : t.login}
            </button>
          </form>

          <p className="text-sm text-center mt-5 text-[#5B6472]">
            {t.noAccount}{" "}
            <Link href="/register" className="text-[#9C7A3C] font-medium hover:underline">
              {t.register}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
