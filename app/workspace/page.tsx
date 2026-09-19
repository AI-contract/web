"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Loader2,
  UserPlus,
  Trash2,
  LogOut,
} from "lucide-react";
import {
  ApiError,
  OrganizationMemberOut,
  OrganizationOut,
  UserMe,
  acceptOrganizationInvite,
  createOrganization,
  getMe,
  getMyOrganization,
  inviteOrganizationMember,
  leaveOrganization,
  listOrganizationMembers,
  removeOrganizationMember,
} from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị viên",
  member: "Thành viên",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Đang chờ chấp nhận",
  active: "Đang hoạt động",
  removed: "Đã xoá",
};

export default function WorkspacePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<UserMe | null>(null);

  const [org, setOrg] = useState<OrganizationOut | null>(null);
  const [members, setMembers] = useState<OrganizationMemberOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [newOrgName, setNewOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [acceptToken, setAcceptToken] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMe()
      .then((me) => {
        setUser(me);
        setAuthChecked(true);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  function reload() {
    setLoading(true);
    getMyOrganization()
      .then((o) => {
        setOrg(o);
        if (o) {
          return listOrganizationMembers().then(setMembers);
        }
        setMembers([]);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra")
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!authChecked) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  async function handleCreateOrg() {
    if (!newOrgName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createOrganization(newOrgName.trim());
      setNewOrgName("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await inviteOrganizationMember(inviteEmail.trim(), inviteRole);
      setInviteEmail("");
      setInfo("Đã gửi lời mời.");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  async function handleAccept() {
    if (!acceptToken.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await acceptOrganizationInvite(acceptToken.trim());
      setAcceptToken("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(memberId: number) {
    setBusy(true);
    setError(null);
    try {
      await removeOrganizationMember(memberId);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    setBusy(true);
    setError(null);
    try {
      await leaveOrganization();
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="animate-spin text-[#9C7A3C]" size={28} />
      </div>
    );
  }

  const isEnterprise = user?.plan === "ENTERPRISE";

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
          <Building2 size={20} className="text-[#C6A15C]" />
          <h1 className="text-lg font-semibold">Workspace nhiều người dùng</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {info && (
          <p className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            {info}
          </p>
        )}

        {loading ? (
          <p className="text-[#5B6472]">Đang tải...</p>
        ) : !org ? (
          <>
            {!isEnterprise && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-6">
                Tính năng Workspace nhiều người dùng chỉ dành cho gói
                ENTERPRISE. Nâng cấp gói ở trang chính để tạo workspace
                cho công ty/đội của bạn.
              </p>
            )}

            {isEnterprise && (
              <div className="bg-white border border-[#DCD7C9] rounded-lg p-5 mb-6">
                <h3 className="font-medium text-[#1C2333] mb-3">
                  Tạo workspace mới
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Tên workspace, vd: Công ty ABC"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="flex-1 rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleCreateOrg}
                    disabled={busy || !newOrgName.trim()}
                    className="bg-[#9C7A3C] text-white px-4 py-2 rounded-md text-sm hover:bg-[#8A6B34] disabled:opacity-50 transition"
                  >
                    Tạo
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white border border-[#DCD7C9] rounded-lg p-5">
              <h3 className="font-medium text-[#1C2333] mb-3">
                Đã được mời vào workspace?
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Dán mã lời mời (invite_token) vào đây"
                  value={acceptToken}
                  onChange={(e) => setAcceptToken(e.target.value)}
                  className="flex-1 rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
                />
                <button
                  onClick={handleAccept}
                  disabled={busy || !acceptToken.trim()}
                  className="bg-[#16213E] text-white px-4 py-2 rounded-md text-sm hover:bg-[#1C2333] disabled:opacity-50 transition"
                >
                  Tham gia
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[#1C2333]">
                  {org.name}
                </h2>
                <p className="text-sm text-[#5B6472]">
                  {members.filter((m) => m.status === "active").length} thành
                  viên đang hoạt động
                </p>
              </div>
              <button
                onClick={handleLeave}
                disabled={busy}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:underline"
              >
                <LogOut size={14} />
                Rời workspace
              </button>
            </div>

            <div className="bg-white border border-[#DCD7C9] rounded-lg p-5 mb-6">
              <h3 className="font-medium text-[#1C2333] mb-3 flex items-center gap-1.5">
                <UserPlus size={16} />
                Mời thành viên
              </h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="Email thành viên"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
                >
                  <option value="member">Thành viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={busy || !inviteEmail.trim()}
                  className="bg-[#9C7A3C] text-white px-4 py-2 rounded-md text-sm hover:bg-[#8A6B34] disabled:opacity-50 transition"
                >
                  Mời
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="bg-white border border-[#DCD7C9] rounded-md p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-[#1C2333]">{m.email}</p>
                    <p className="text-sm text-[#5B6472]">
                      {ROLE_LABELS[m.role] ?? m.role} ·{" "}
                      {STATUS_LABELS[m.status] ?? m.status}
                    </p>
                  </div>
                  {m.role !== "owner" && (
                    <button
                      onClick={() => handleRemove(m.id)}
                      disabled={busy}
                      className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                    >
                      <Trash2 size={14} />
                      Xoá khỏi workspace
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
