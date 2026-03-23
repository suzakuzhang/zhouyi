"use client";

import { useState, useEffect, useCallback } from "react";

interface UsageLog {
  id: string;
  timestamp: string;
  action: string;
  role: string;
  userId: string;
  hexagramName: string;
  question: string;
  ip?: string;
}

interface InviteCode {
  code: string;
  type: "whitelist" | "quota";
  usedCount: number;
  maxUses: number;
  isActive: boolean;
  label: string;
  createdBy: string;
  createdAt: string;
}

interface FreeUsage {
  used: number;
  limit: number;
  remaining: number;
}

// 所有 admin API 请求通过 header 传 token，不放 URL
function adminFetch(url: string, token: string, opts?: RequestInit) {
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": token,
      ...(opts?.headers ?? {}),
    },
  });
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [authError, setAuthError] = useState("");

  const [tab, setTab] = useState<"logs" | "codes" | "free">("logs");

  // Logs
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const LOG_PAGE_SIZE = 20;

  // Invite codes
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [newCodeInput, setNewCodeInput] = useState("");
  const [newCodeMaxUses, setNewCodeMaxUses] = useState("10");
  const [newCodeType, setNewCodeType] = useState<"whitelist" | "quota">("quota");
  const [newCodeLabel, setNewCodeLabel] = useState("");
  const [codeError, setCodeError] = useState("");

  // Free usage
  const [freeUsage, setFreeUsage] = useState<FreeUsage | null>(null);
  const [freeLoading, setFreeLoading] = useState(true);

  // Editing
  const [editingCode, setEditingCode] = useState("");
  const [editMaxUses, setEditMaxUses] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editType, setEditType] = useState<"whitelist" | "quota">("quota");

  // ── Auth ──────────────────────────────────────

  const login = async () => {
    setAuthError("");
    try {
      const res = await fetch("/api/access/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "admin", adminCode, birthDate }),
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        setToken(data.accessToken);
        setAuthed(true);
        localStorage.setItem("admin_token", data.accessToken);
      } else {
        setAuthError(data.error ?? "认证失败");
      }
    } catch {
      setAuthError("网络错误");
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken("");
    setAuthed(false);
  };

  // Restore & validate token
  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (!saved) return;

    // Validate token is still alive
    fetch("/api/access/status", {
      headers: { "X-Access-Token": saved },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.activated && d.role === "admin") {
          setToken(saved);
          setAuthed(true);
        } else {
          localStorage.removeItem("admin_token");
        }
      })
      .catch(() => {
        localStorage.removeItem("admin_token");
      });
  }, []);

  // ── Data Fetching ─────────────────────────────

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    const res = await adminFetch(
      `/api/admin/logs?limit=${LOG_PAGE_SIZE}&offset=${logPage * LOG_PAGE_SIZE}`,
      token
    );
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs ?? []);
      setLogTotal(data.total ?? 0);
    } else if (res.status === 403) {
      logout();
    }
  }, [token, logPage]);

  const fetchCodes = useCallback(async () => {
    if (!token) return;
    const res = await adminFetch("/api/admin/invite-codes", token);
    if (res.ok) {
      const data = await res.json();
      setCodes(data.items ?? []);
    }
  }, [token]);

  const fetchFreeUsage = useCallback(async () => {
    if (!token) return;
    setFreeLoading(true);
    const res = await adminFetch("/api/admin/free-usage", token);
    if (res.ok) {
      setFreeUsage(await res.json());
    }
    setFreeLoading(false);
  }, [token]);

  useEffect(() => {
    if (authed) {
      fetchLogs();
      fetchCodes();
      fetchFreeUsage();
    }
  }, [authed, fetchLogs, fetchCodes, fetchFreeUsage]);

  // ── Actions ───────────────────────────────────

  const createCode = async () => {
    setCodeError("");
    const res = await adminFetch("/api/admin/invite-codes", token, {
      method: "POST",
      body: JSON.stringify({
        action: "create",
        type: newCodeType,
        code: newCodeInput || undefined,
        maxUses: parseInt(newCodeMaxUses) || 10,
        label: newCodeLabel,
      }),
    });
    if (res.ok) {
      setNewCodeInput("");
      setNewCodeMaxUses("10");
      setNewCodeLabel("");
      fetchCodes();
    } else {
      const data = await res.json();
      setCodeError(data.error ?? "创建失败");
    }
  };

  const updateCode = async (code: string) => {
    const res = await adminFetch("/api/admin/invite-codes", token, {
      method: "POST",
      body: JSON.stringify({
        action: "update",
        code,
        maxUses: parseInt(editMaxUses) || 10,
        label: editLabel,
        type: editType,
      }),
    });
    if (res.ok) {
      setEditingCode("");
      fetchCodes();
    }
  };

  const toggleCode = async (code: string, isActive: boolean) => {
    await adminFetch("/api/admin/invite-codes", token, {
      method: "POST",
      body: JSON.stringify({ action: "toggle", code, isActive }),
    });
    fetchCodes();
  };

  const delCode = async (code: string) => {
    if (!confirm(`确定删除邀请码 ${code}？`)) return;
    await adminFetch("/api/admin/invite-codes", token, {
      method: "POST",
      body: JSON.stringify({ action: "delete", code }),
    });
    fetchCodes();
  };

  const resetFree = async () => {
    if (!confirm("确定重置免费次数？所有未激活用户将重新获得 99 次。")) return;
    await adminFetch("/api/admin/free-usage", token, {
      method: "POST",
      body: JSON.stringify({}),
    });
    fetchFreeUsage();
  };

  const totalLogPages = Math.ceil(logTotal / LOG_PAGE_SIZE);

  // ── Login Page ────────────────────────────────

  if (!authed) {
    return (
      <div className="space-y-4 max-w-sm">
        <h1 className="text-xl font-semibold">管理员登录</h1>
        <input
          type="password"
          value={adminCode}
          onChange={(e) => setAdminCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          placeholder="管理员口令"
          className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          placeholder="验证日期 (YYYY-MM-DD)"
          className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm"
        />
        {authError && <p className="text-sm text-red-600">{authError}</p>}
        <button onClick={login} className="px-5 py-2 bg-[#1a1a1a] text-white rounded text-sm">
          登录
        </button>
      </div>
    );
  }

  // ── Main Panel ────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">管理后台</h1>
        <button onClick={logout} className="text-xs text-[var(--muted)] hover:text-red-600 underline">
          退出登录
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {([
          { key: "logs" as const, label: "使用日志" },
          { key: "codes" as const, label: "邀请码管理" },
          { key: "free" as const, label: "免费额度" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              tab === t.key ? "border-[#1a1a1a] font-medium" : "border-transparent text-[var(--muted)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 使用日志 ── */}
      {tab === "logs" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">共 {logTotal} 条</p>
            <button onClick={fetchLogs} className="text-xs text-[var(--muted)] underline">刷新</button>
          </div>

          {/* 卡片式日志（移动端友好） */}
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="border border-[var(--border)] rounded p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{log.hexagramName || "-"}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {new Date(log.timestamp).toLocaleString("zh-CN")}
                  </span>
                </div>
                <p className="text-[var(--muted)] text-xs truncate">{log.question || "（无问题）"}</p>
                <div className="flex gap-3 text-xs text-[var(--muted)]">
                  <span>{log.action}</span>
                  <span>{log.role}</span>
                  {log.ip && <span>{log.ip}</span>}
                </div>
              </div>
            ))}
            {logs.length === 0 && <p className="text-sm text-[var(--muted)]">暂无记录</p>}
          </div>

          {/* 分页 */}
          {totalLogPages > 1 && (
            <div className="flex items-center gap-2 justify-center text-sm">
              <button
                disabled={logPage === 0}
                onClick={() => setLogPage((p) => p - 1)}
                className="px-2 py-1 border border-[var(--border)] rounded disabled:opacity-30"
              >
                上一页
              </button>
              <span className="text-[var(--muted)]">{logPage + 1} / {totalLogPages}</span>
              <button
                disabled={logPage >= totalLogPages - 1}
                onClick={() => setLogPage((p) => p + 1)}
                className="px-2 py-1 border border-[var(--border)] rounded disabled:opacity-30"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 邀请码管理 ── */}
      {tab === "codes" && (
        <div className="space-y-4">
          {/* 创建区 */}
          <div className="border border-[var(--border)] rounded p-4 space-y-3">
            <p className="text-sm font-medium">创建邀请码</p>
            <div className="flex gap-2 flex-wrap items-end">
              <div>
                <label className="text-xs text-[var(--muted)]">类型</label>
                <select
                  value={newCodeType}
                  onChange={(e) => setNewCodeType(e.target.value as "whitelist" | "quota")}
                  className="block border border-[var(--border)] rounded px-2 py-1.5 text-sm"
                >
                  <option value="whitelist">白名单（无限）</option>
                  <option value="quota">次数限制</option>
                </select>
              </div>
              {newCodeType === "quota" && (
                <div>
                  <label className="text-xs text-[var(--muted)]">额度</label>
                  <input
                    type="number"
                    value={newCodeMaxUses}
                    onChange={(e) => setNewCodeMaxUses(e.target.value)}
                    className="block w-20 border border-[var(--border)] rounded px-2 py-1.5 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-[var(--muted)]">邀请码（留空自动生成）</label>
                <input
                  type="text"
                  value={newCodeInput}
                  onChange={(e) => setNewCodeInput(e.target.value)}
                  placeholder="自动"
                  className="block w-28 border border-[var(--border)] rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">备注</label>
                <input
                  type="text"
                  value={newCodeLabel}
                  onChange={(e) => setNewCodeLabel(e.target.value)}
                  placeholder="如：张三专属"
                  className="block w-32 border border-[var(--border)] rounded px-2 py-1.5 text-sm"
                />
              </div>
              <button onClick={createCode} className="px-4 py-1.5 bg-[#1a1a1a] text-white rounded text-sm">
                创建
              </button>
            </div>
            {codeError && <p className="text-sm text-red-600">{codeError}</p>}
          </div>

          {/* 列表 */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">{codes.length} 个邀请码</p>
            <button onClick={fetchCodes} className="text-xs text-[var(--muted)] underline">刷新</button>
          </div>

          <div className="space-y-2">
            {codes.map((c) => (
              <div key={c.code} className="border border-[var(--border)] rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{c.code}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      c.type === "whitelist" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {c.type === "whitelist" ? "白名单" : "次数"}
                    </span>
                    <span className={`text-xs ${c.isActive ? "text-green-600" : "text-red-500"}`}>
                      {c.isActive ? "有效" : "停用"}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--muted)]">
                    {c.type === "quota" ? `${c.usedCount}/${c.maxUses}` : `已用 ${c.usedCount} 次`}
                  </span>
                </div>

                {c.label && <p className="text-xs text-[var(--muted)]">备注：{c.label}</p>}

                {editingCode === c.code ? (
                  <div className="flex gap-2 flex-wrap items-end border-t border-[var(--border)] pt-2">
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as "whitelist" | "quota")}
                      className="border border-[var(--border)] rounded px-2 py-1 text-xs"
                    >
                      <option value="whitelist">白名单</option>
                      <option value="quota">次数</option>
                    </select>
                    {editType === "quota" && (
                      <input
                        type="number"
                        value={editMaxUses}
                        onChange={(e) => setEditMaxUses(e.target.value)}
                        placeholder="额度"
                        className="w-16 border border-[var(--border)] rounded px-2 py-1 text-xs"
                      />
                    )}
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="备注"
                      className="w-24 border border-[var(--border)] rounded px-2 py-1 text-xs"
                    />
                    <button onClick={() => updateCode(c.code)} className="text-xs text-blue-600 underline">保存</button>
                    <button onClick={() => setEditingCode("")} className="text-xs text-[var(--muted)] underline">取消</button>
                  </div>
                ) : (
                  <div className="flex gap-3 text-xs">
                    <button
                      onClick={() => toggleCode(c.code, !c.isActive)}
                      className="text-[var(--muted)] underline"
                    >
                      {c.isActive ? "停用" : "启用"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingCode(c.code);
                        setEditMaxUses(String(c.maxUses));
                        setEditLabel(c.label);
                        setEditType(c.type);
                      }}
                      className="text-[var(--muted)] underline"
                    >
                      编辑
                    </button>
                    <button onClick={() => delCode(c.code)} className="text-red-400 underline">
                      删除
                    </button>
                  </div>
                )}
              </div>
            ))}
            {codes.length === 0 && <p className="text-sm text-[var(--muted)]">暂无邀请码</p>}
          </div>
        </div>
      )}

      {/* ── 免费额度 ── */}
      {tab === "free" && (
        <div className="space-y-4">
          {freeLoading && !freeUsage ? (
            <p className="text-sm text-[var(--muted)]">加载中…</p>
          ) : freeUsage ? (
            <>
              <div className="border border-[var(--border)] rounded p-4 space-y-2">
                <p className="text-sm">全局免费额度：<strong>{freeUsage.limit}</strong> 次</p>
                <p className="text-sm">已使用：<strong>{freeUsage.used}</strong> 次</p>
                <p className="text-sm">剩余：<strong>{freeUsage.remaining}</strong> 次</p>
                <div className="w-full bg-gray-200 rounded h-2">
                  <div
                    className="bg-[#1a1a1a] h-2 rounded transition-all"
                    style={{ width: `${Math.min(100, (freeUsage.used / freeUsage.limit) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={resetFree} className="px-4 py-1.5 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50">
                  重置免费次数
                </button>
                <button onClick={fetchFreeUsage} className="text-xs text-[var(--muted)] underline self-center">
                  刷新
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-red-600">加载失败</p>
          )}
        </div>
      )}
    </div>
  );
}
