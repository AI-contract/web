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
import { useLang, type Lang } from "@/lib/lang";
import LangSwitcher from "@/app/components/LangSwitcher";

// ---- văn bản giao diện dịch đủ 5 ngôn ngữ. Các mã "owner/admin/member"
// và "pending/active/removed" là giá trị của backend, KHÔNG đổi; chỉ nhãn
// hiển thị được dịch. ----
const TEXT: Record<
  Lang,
  {
    back: string;
    title: string;
    errGeneric: string;
    roles: Record<string, string>;
    statuses: Record<string, string>;
    inviteSent: string;
    loading: string;
    notEnterprise: string;
    createTitle: string;
    orgPlaceholder: string;
    createBtn: string;
    invitedTitle: string;
    tokenPlaceholder: string;
    joinBtn: string;
    activeMembers: (n: number) => string;
    leave: string;
    inviteTitle: string;
    emailPlaceholder: string;
    inviteBtn: string;
    removeBtn: string;
  }
> = {
  vi: {
    back: "Quay lại",
    title: "Workspace nhiều người dùng",
    errGeneric: "Có lỗi xảy ra",
    roles: { owner: "Chủ sở hữu", admin: "Quản trị viên", member: "Thành viên" },
    statuses: {
      pending: "Đang chờ chấp nhận",
      active: "Đang hoạt động",
      removed: "Đã xoá",
    },
    inviteSent: "Đã gửi lời mời.",
    loading: "Đang tải...",
    notEnterprise:
      "Tính năng Workspace nhiều người dùng chỉ dành cho gói ENTERPRISE. Nâng cấp gói ở trang chính để tạo workspace cho công ty/đội của bạn.",
    createTitle: "Tạo workspace mới",
    orgPlaceholder: "Tên workspace, vd: Công ty ABC",
    createBtn: "Tạo",
    invitedTitle: "Đã được mời vào workspace?",
    tokenPlaceholder: "Dán mã lời mời (invite_token) vào đây",
    joinBtn: "Tham gia",
    activeMembers: (n) => `${n} thành viên đang hoạt động`,
    leave: "Rời workspace",
    inviteTitle: "Mời thành viên",
    emailPlaceholder: "Email thành viên",
    inviteBtn: "Mời",
    removeBtn: "Xoá khỏi workspace",
  },
  en: {
    back: "Back",
    title: "Multi-user Workspace",
    errGeneric: "Something went wrong",
    roles: { owner: "Owner", admin: "Admin", member: "Member" },
    statuses: {
      pending: "Pending acceptance",
      active: "Active",
      removed: "Removed",
    },
    inviteSent: "Invitation sent.",
    loading: "Loading...",
    notEnterprise:
      "The multi-user Workspace feature is available only on the ENTERPRISE plan. Upgrade your plan on the main page to create a workspace for your company/team.",
    createTitle: "Create a new workspace",
    orgPlaceholder: "Workspace name, e.g.: ABC Company",
    createBtn: "Create",
    invitedTitle: "Been invited to a workspace?",
    tokenPlaceholder: "Paste your invitation code (invite_token) here",
    joinBtn: "Join",
    activeMembers: (n) => `${n} active member${n === 1 ? "" : "s"}`,
    leave: "Leave workspace",
    inviteTitle: "Invite a member",
    emailPlaceholder: "Member's email",
    inviteBtn: "Invite",
    removeBtn: "Remove from workspace",
  },
  zh: {
    back: "返回",
    title: "多用户工作区",
    errGeneric: "出错了",
    roles: { owner: "所有者", admin: "管理员", member: "成员" },
    statuses: {
      pending: "等待接受",
      active: "活跃",
      removed: "已移除",
    },
    inviteSent: "邀请已发送。",
    loading: "加载中...",
    notEnterprise:
      "多用户工作区功能仅适用于 ENTERPRISE 套餐。请在主页升级套餐，为您的公司/团队创建工作区。",
    createTitle: "创建新工作区",
    orgPlaceholder: "工作区名称，例如：ABC 公司",
    createBtn: "创建",
    invitedTitle: "已被邀请加入工作区？",
    tokenPlaceholder: "在此粘贴邀请码（invite_token）",
    joinBtn: "加入",
    activeMembers: (n) => `${n} 名活跃成员`,
    leave: "退出工作区",
    inviteTitle: "邀请成员",
    emailPlaceholder: "成员邮箱",
    inviteBtn: "邀请",
    removeBtn: "从工作区移除",
  },
  ko: {
    back: "뒤로",
    title: "다중 사용자 워크스페이스",
    errGeneric: "오류가 발생했습니다",
    roles: { owner: "소유자", admin: "관리자", member: "멤버" },
    statuses: {
      pending: "수락 대기 중",
      active: "활성",
      removed: "삭제됨",
    },
    inviteSent: "초대를 보냈습니다.",
    loading: "불러오는 중...",
    notEnterprise:
      "다중 사용자 워크스페이스 기능은 ENTERPRISE 요금제에서만 사용할 수 있습니다. 메인 페이지에서 요금제를 업그레이드하여 회사/팀 워크스페이스를 만드세요.",
    createTitle: "새 워크스페이스 만들기",
    orgPlaceholder: "워크스페이스 이름 예: ABC 회사",
    createBtn: "만들기",
    invitedTitle: "워크스페이스에 초대받으셨나요?",
    tokenPlaceholder: "초대 코드(invite_token)를 여기에 붙여넣으세요",
    joinBtn: "참여",
    activeMembers: (n) => `활성 멤버 ${n}명`,
    leave: "워크스페이스 나가기",
    inviteTitle: "멤버 초대",
    emailPlaceholder: "멤버 이메일",
    inviteBtn: "초대",
    removeBtn: "워크스페이스에서 삭제",
  },
  ja: {
    back: "戻る",
    title: "マルチユーザーワークスペース",
    errGeneric: "エラーが発生しました",
    roles: { owner: "オーナー", admin: "管理者", member: "メンバー" },
    statuses: {
      pending: "承諾待ち",
      active: "有効",
      removed: "削除済み",
    },
    inviteSent: "招待を送信しました。",
    loading: "読み込み中...",
    notEnterprise:
      "マルチユーザーワークスペース機能は ENTERPRISE プラン限定です。メインページでプランをアップグレードして、会社／チーム用のワークスペースを作成してください。",
    createTitle: "新しいワークスペースを作成",
    orgPlaceholder: "ワークスペース名（例：ABC社）",
    createBtn: "作成",
    invitedTitle: "ワークスペースに招待されましたか？",
    tokenPlaceholder: "ここに招待コード（invite_token）を貼り付け",
    joinBtn: "参加",
    activeMembers: (n) => `有効なメンバー ${n} 名`,
    leave: "ワークスペースを退出",
    inviteTitle: "メンバーを招待",
    emailPlaceholder: "メンバーのメールアドレス",
    inviteBtn: "招待",
    removeBtn: "ワークスペースから削除",
  },
};

export default function WorkspacePage() {
  const router = useRouter();
  const [lang] = useLang();
  const t = TEXT[lang];
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
        setError(err instanceof ApiError ? err.message : t.errGeneric)
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
      setError(err instanceof ApiError ? err.message : t.errGeneric);
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
      setInfo(t.inviteSent);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.errGeneric);
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
      setError(err instanceof ApiError ? err.message : t.errGeneric);
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
      setError(err instanceof ApiError ? err.message : t.errGeneric);
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
      setError(err instanceof ApiError ? err.message : t.errGeneric);
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
          {t.back}
        </Link>
        <div className="flex items-center gap-2">
          <Building2 size={20} className="text-[#C6A15C]" />
          <h1 className="text-lg font-semibold">{t.title}</h1>
        </div>
        <LangSwitcher />
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
          <p className="text-[#5B6472]">{t.loading}</p>
        ) : !org ? (
          <>
            {!isEnterprise && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-6">
                {t.notEnterprise}
              </p>
            )}

            {isEnterprise && (
              <div className="bg-white border border-[#DCD7C9] rounded-lg p-5 mb-6">
                <h3 className="font-medium text-[#1C2333] mb-3">
                  {t.createTitle}
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder={t.orgPlaceholder}
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="flex-1 rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleCreateOrg}
                    disabled={busy || !newOrgName.trim()}
                    className="bg-[#9C7A3C] text-white px-4 py-2 rounded-md text-sm hover:bg-[#8A6B34] disabled:opacity-50 transition"
                  >
                    {t.createBtn}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white border border-[#DCD7C9] rounded-lg p-5">
              <h3 className="font-medium text-[#1C2333] mb-3">
                {t.invitedTitle}
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={t.tokenPlaceholder}
                  value={acceptToken}
                  onChange={(e) => setAcceptToken(e.target.value)}
                  className="flex-1 rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
                />
                <button
                  onClick={handleAccept}
                  disabled={busy || !acceptToken.trim()}
                  className="bg-[#16213E] text-white px-4 py-2 rounded-md text-sm hover:bg-[#1C2333] disabled:opacity-50 transition"
                >
                  {t.joinBtn}
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
                  {t.activeMembers(
                    members.filter((m) => m.status === "active").length
                  )}
                </p>
              </div>
              <button
                onClick={handleLeave}
                disabled={busy}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:underline"
              >
                <LogOut size={14} />
                {t.leave}
              </button>
            </div>

            <div className="bg-white border border-[#DCD7C9] rounded-lg p-5 mb-6">
              <h3 className="font-medium text-[#1C2333] mb-3 flex items-center gap-1.5">
                <UserPlus size={16} />
                {t.inviteTitle}
              </h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
                >
                  <option value="member">{t.roles.member}</option>
                  <option value="admin">{t.roles.admin}</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={busy || !inviteEmail.trim()}
                  className="bg-[#9C7A3C] text-white px-4 py-2 rounded-md text-sm hover:bg-[#8A6B34] disabled:opacity-50 transition"
                >
                  {t.inviteBtn}
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
                      {t.roles[m.role] ?? m.role} ·{" "}
                      {t.statuses[m.status] ?? m.status}
                    </p>
                  </div>
                  {m.role !== "owner" && (
                    <button
                      onClick={() => handleRemove(m.id)}
                      disabled={busy}
                      className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                    >
                      <Trash2 size={14} />
                      {t.removeBtn}
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
