"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LogOut, Loader2 } from "lucide-react";
import {
  ApiError,
  ContractOut,
  UserMe,
  clearToken,
  downloadContractDocx,
  downloadContractPdf,
  generateContract,
  getMe,
  myContracts,
  startCheckout,
} from "@/lib/api";

const FIELDS: { key: string; label: string }[] = [
  { key: "PARTY_A", label: "Bên A" },
  { key: "PARTY_B", label: "Bên B" },
  { key: "CONTRACT_VALUE", label: "Giá trị hợp đồng" },
  { key: "PAYMENT_METHOD", label: "Hình thức thanh toán" },
  { key: "PAYMENT_TERM", label: "Thời hạn thanh toán" },
  { key: "BANK_ACCOUNT", label: "Số tài khoản ngân hàng" },
  { key: "NOTICE_DAYS", label: "Số ngày báo trước (chấm dứt HĐ)" },
  { key: "PENALTY_RATE", label: "Mức phạt vi phạm (%)" },
];

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<UserMe | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [lastContract, setLastContract] = useState<ContractOut | null>(
    null
  );

  const [contracts, setContracts] = useState<ContractOut[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [upgrading, setUpgrading] = useState(false);

  // ---- auth check on mount ----
  useEffect(() => {
    getMe()
      .then((me) => {
        setUser(me);
        setAuthChecked(true);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  // ---- load contract list once authed ----
  useEffect(() => {
    if (!authChecked) return;
    refreshContracts();
  }, [authChecked]);

  const refreshContracts = () => {
    setLoadingList(true);
    myContracts()
      .then(setContracts)
      .catch(() => {
        // non-fatal — just show empty list
      })
      .finally(() => setLoadingList(false));
  };

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError(null);
    setGenerating(true);

    try {
      const payload = { contract_type: "service", ...form };
      const contract = await generateContract(payload);
      setLastContract(contract);
      refreshContracts();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Không thể tạo hợp đồng";
      setGenError(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const { checkout_url } = await startCheckout();
      window.location.href = checkout_url;
    } catch {
      setUpgrading(false);
      alert("Không thể khởi tạo thanh toán, thử lại sau.");
    }
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="animate-spin" size={32} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white p-6 hidden md:flex md:flex-col">
        <h1 className="text-3xl font-bold mb-10">Legal AI</h1>

        <nav className="space-y-4 flex-1">
          <div className="flex items-center gap-3 text-gray-300">
            <FileText size={20} />
            <span>Contract Generator</span>
          </div>
        </nav>

        {user && (
          <div className="border-t border-gray-700 pt-4 text-sm text-gray-300 space-y-2">
            <div>{user.email}</div>
            <div>
              Gói:{" "}
              <span className="font-semibold text-white">
                {user.plan}
              </span>
            </div>
            <div>
              {user.requests_used}/{user.requests_limit} lượt dùng
            </div>
            {user.plan !== "PRO" && (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full bg-white text-black rounded-lg py-2 mt-2 font-medium disabled:opacity-50"
              >
                {upgrading ? "Đang chuyển hướng..." : "Nâng cấp PRO"}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white mt-2"
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <section className="flex-1 p-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <h2 className="text-4xl font-bold mb-3">
              Tạo hợp đồng dịch vụ
            </h2>
            <p className="text-gray-500 text-lg">
              Điền thông tin để AI tạo hợp đồng từ thư viện điều khoản.
            </p>
          </div>

          {/* Generate form */}
          <form
            onSubmit={handleGenerate}
            className="bg-white rounded-3xl shadow-xl p-8 mb-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium mb-1">
                    {f.label}
                  </label>
                  <input
                    value={form[f.key] || ""}
                    onChange={(e) =>
                      handleChange(f.key, e.target.value)
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              ))}
            </div>

            {genError && (
              <p className="text-red-600 text-sm mt-4">{genError}</p>
            )}

            <button
              type="submit"
              disabled={generating}
              className="mt-6 bg-black text-white px-8 py-3 rounded-2xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {generating && (
                <Loader2 size={18} className="animate-spin" />
              )}
              {generating ? "Đang tạo..." : "Tạo hợp đồng"}
            </button>
          </form>

          {/* Just-generated result */}
          {lastContract && (
            <div className="bg-white rounded-2xl shadow p-6 mb-10 border">
              <h3 className="text-xl font-semibold mb-4">
                Hợp đồng vừa tạo: {lastContract.file_name}
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                {lastContract.analysis_result}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() =>
                    downloadContractDocx(
                      lastContract.id,
                      lastContract.file_name
                    )
                  }
                  className="border rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Tải DOCX
                </button>
                <button
                  onClick={() =>
                    downloadContractPdf(
                      lastContract.id,
                      lastContract.file_name
                    )
                  }
                  className="border rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Tải PDF
                </button>
              </div>
            </div>
          )}

          {/* Contract list */}
          <div>
            <h3 className="text-2xl font-semibold mb-4">
              Hợp đồng của tôi
            </h3>

            {loadingList && (
              <p className="text-gray-500">Đang tải...</p>
            )}

            {!loadingList && contracts.length === 0 && (
              <p className="text-gray-500">Chưa có hợp đồng nào.</p>
            )}

            <div className="space-y-3">
              {contracts.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{c.file_name}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(c.created_at).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        downloadContractDocx(c.id, c.file_name)
                      }
                      className="border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      DOCX
                    </button>
                    <button
                      onClick={() =>
                        downloadContractPdf(c.id, c.file_name)
                      }
                      className="border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
