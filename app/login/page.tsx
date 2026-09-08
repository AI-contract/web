"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scale } from "lucide-react";
import { login, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

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
      const message =
        err instanceof ApiError
          ? err.message
          : "Không thể kết nối tới máy chủ";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF8F3] px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#9C7A3C]/15 border border-[#9C7A3C]/40">
            <Scale size={20} className="text-[#9C7A3C]" strokeWidth={1.75} />
          </span>
          <span className="text-2xl font-semibold tracking-tight text-[#1C2333]">
            Legal AI
          </span>
        </Link>

        <div className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-8">
          <h1 className="text-2xl font-semibold mb-6 text-center text-[#1C2333]">
            Đăng nhập
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#1C2333]">
                Email
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
                Mật khẩu
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
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="text-sm text-center mt-5 text-[#5B6472]">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-[#9C7A3C] font-medium hover:underline">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
