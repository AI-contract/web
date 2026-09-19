"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import {
  ApiError,
  ContractDeadline,
  createDeadline,
  deleteDeadline,
  listDeadlines,
  updateDeadline,
  getMe,
} from "@/lib/api";

const DEADLINE_TYPE_LABELS: Record<string, string> = {
  expiry: "Hết hạn hợp đồng",
  renewal: "Gia hạn",
  payment: "Thanh toán",
  liquidation: "Thanh lý",
  other: "Khác",
};

function badgeColor(daysRemaining: number): string {
  if (daysRemaining < 0) return "bg-red-100 text-red-700 border-red-300";
  if (daysRemaining <= 7)
    return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-emerald-100 text-emerald-700 border-emerald-300";
}

function daysLabel(daysRemaining: number): string {
  if (daysRemaining < 0) return `Đã quá hạn ${-daysRemaining} ngày`;
  if (daysRemaining === 0) return "Đến hạn hôm nay";
  return `Còn ${daysRemaining} ngày`;
}

export default function DeadlinesPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  const [deadlines, setDeadlines] = useState<ContractDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeResolved, setIncludeResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [deadlineType, setDeadlineType] = useState("expiry");
  const [dueDate, setDueDate] = useState("");
  const [notifyOffsets, setNotifyOffsets] = useState("30,7");
  const [note, setNote] = useState("");

  useEffect(() => {
    getMe()
      .then(() => setAuthChecked(true))
      .catch(() => router.push("/login"));
  }, [router]);

  function reload() {
    setLoading(true);
    listDeadlines(includeResolved)
      .then(setDeadlines)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra")
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!authChecked) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, includeResolved]);

  async function handleCreate() {
    if (!title.trim() || !dueDate) return;
    setSaving(true);
    setError(null);
    try {
      await createDeadline({
        title: title.trim(),
        deadline_type: deadlineType,
        due_date: dueDate,
        notify_offsets_days: notifyOffsets,
        note: note.trim() || undefined,
      });
      setTitle("");
      setDueDate("");
      setNote("");
      setNotifyOffsets("30,7");
      setShowForm(false);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve(id: number) {
    try {
      await updateDeadline(id, { is_resolved: true });
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteDeadline(id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra");
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="animate-spin text-[#9C7A3C]" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <header className="bg-[#16213E] text-white px-6 py-4 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft size={16} />
          Quay lại
        </Link>
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-[#C6A15C]" />
          <h1 className="text-lg font-semibold">Nhắc hạn hợp đồng</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2 text-sm text-[#5B6472]">
            <input
              type="checkbox"
              checked={includeResolved}
              onChange={(e) => setIncludeResolved(e.target.checked)}
            />
            Hiện cả mốc đã xử lý
          </label>

          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 bg-[#16213E] text-white px-4 py-2 rounded-md text-sm hover:bg-[#1C2333] transition"
          >
            <Plus size={16} />
            Thêm mốc nhắc hạn
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-[#DCD7C9] rounded-lg p-5 mb-6 space-y-3">
            <input
              type="text"
              placeholder="Tên mốc, vd: Hết hạn hợp đồng dịch vụ với công ty ABC"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={deadlineType}
                onChange={(e) => setDeadlineType(e.target.value)}
                className="rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
              >
                {Object.entries(DEADLINE_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#5B6472] block mb-1">
                Nhắc trước bao nhiêu ngày (phân tách bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={notifyOffsets}
                onChange={(e) => setNotifyOffsets(e.target.value)}
                placeholder="30,7"
                className="w-full rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
              />
            </div>
            <textarea
              placeholder="Ghi chú (không bắt buộc)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
              rows={2}
            />
            <button
              onClick={handleCreate}
              disabled={saving || !title.trim() || !dueDate}
              className="bg-[#9C7A3C] text-white px-4 py-2 rounded-md text-sm hover:bg-[#8A6B34] disabled:opacity-50 transition"
            >
              {saving ? "Đang lưu..." : "Lưu mốc nhắc hạn"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-[#5B6472]">Đang tải...</p>
        ) : deadlines.length === 0 ? (
          <p className="text-[#5B6472]">Chưa có mốc nhắc hạn nào.</p>
        ) : (
          <div className="space-y-3">
            {deadlines.map((d) => (
              <div
                key={d.id}
                className={`bg-white border rounded-lg p-4 ${
                  d.is_resolved ? "opacity-60 border-[#DCD7C9]" : "border-[#DCD7C9]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-[#1C2333]">{d.title}</h3>
                    <p className="text-sm text-[#5B6472] mt-0.5">
                      {DEADLINE_TYPE_LABELS[d.deadline_type] ?? d.deadline_type}{" "}
                      · Hạn: {d.due_date}
                    </p>
                    {d.note && (
                      <p className="text-sm text-[#5B6472] mt-1">{d.note}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full border ${badgeColor(
                      d.days_remaining
                    )}`}
                  >
                    {d.is_resolved ? "Đã xử lý" : daysLabel(d.days_remaining)}
                  </span>
                </div>

                <div className="flex gap-3 mt-3">
                  {!d.is_resolved && (
                    <button
                      onClick={() => handleResolve(d.id)}
                      className="flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                    >
                      <CheckCircle2 size={14} />
                      Đánh dấu đã xử lý
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                  >
                    <Trash2 size={14} />
                    Xoá
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
