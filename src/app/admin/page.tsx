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
  extra?: Record<string, unknown>;
}

interface InviteCode {
  code: string;
  usedCount: number;
  maxUses: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

interface FreeUsage {
  used: number;
  limit: number;
  remaining: number;
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

  // Invite codes
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [newCodeInput, setNewCodeInput] = useState("");
  const [newCodeMaxUses, setNewCodeMaxUses] = useState("10");

  // Free usage
  const [freeUsage, setFreeUsage] = useState<FreeUsage | null>(null);

  // Quota editing
  const [editingCode, setEditingCode] = useState("");
  const [editMaxUses, setEditMaxUses] = useState("");

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

  // Restore token
  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
      setAuthed(true);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`/api/admin/logs?access_token=${token}&limit=100`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs ?? []);
      setLogTotal(data.total ?? 0);
    }
  }, [token]);

  const fetchCodes = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`/api/admin/invite-codes?access_token=${token}`);
    if (res.ok) {
      const data = await res.json();
      setCodes(data.items ?? []);
    }
  }, [token]);

  const fetchFreeUsage = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`/api/admin/free-usage?access_token=${token}`);
    if (res.ok) {
      setFreeUsage(await res.json());
    }
  }, [token]);

  useEffect(() => {
    if (authed) {
      fetchLogs();
      fetchCodes();
      fetchFreeUsage();
    }
  }, [authed, fetchLogs, fetchCodes, fetchFreeUsage]);

  const createCode = async () => {
    const res = await fetch("/api/admin/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: token,
        action: "create",
        code: newCodeInput || undefined,
        maxUses: parseInt(newCodeMaxUses) || 10,
      }),
    });
    if (res.ok) {
      setNewCodeInput("");
      fetchCodes();
    }
  };

  const updateQuota = async (code: string) => {
    const res = await fetch("/api/admin/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: token,
        action: "update_quota",
        code,
        maxUses: parseInt(editMaxUses) || 10,
      }),
    });
    if (res.ok) {
      setEditingCode("");
      setEditMaxUses("");
      fetchCodes();
    }
  };

  const toggleCode = async (code: string, isActive: boolean) => {
    await fetch("/api/admin/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: token, action: "toggle", code, isActive }),
    });
    fetchCodes();
  };

  const resetFree = async () => {
    await fetch("/api/admin/free-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: token }),
    });
    fetchFreeUsage();
  };

  if (!authed) {
    return (
      <div className="space-y-4 max-w-sm">
        <h1 className="text-xl font-semibold">管理员登录</h1>
        <input
          type="password"
          value={adminCode}
          onChange={(e) => setAdminCode(e.target.value)}
          placeholder="管理员口令"
          className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          placeholder="验证日期 (YYYY-MM-DD)"
          className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm"
        />
        {authError && <p className="text-sm text-red-600">{authError}</p>}
        <button
          onClick={login}
          className="px-5 py-2 bg-[#1a1a1a] text-white rounded text-sm"
        >
          登录
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">管理后台</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {(["logs", "codes", "free"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              tab === t
                ? "border-[#1a1a1a] font-medium"
                : "border-transparent text-[var(--muted)]"
            }`}
          >
            {t === "logs" ? "使用日志" : t === "codes" ? "邀请码管理" : "免费额度"}
          </button>
        ))}
      </div>

      {/* Logs */}
      {tab === "logs" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">共 {logTotal} 条记录</p>
            <button onClick={fetchLogs} className="text-xs text-[var(--muted)] underline">刷新</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                  <th className="py-2 pr-3">时间</th>
                  <th className="py-2 pr-3">操作</th>
                  <th className="py-2 pr-3">角色</th>
                  <th className="py-2 pr-3">卦象</th>
                  <th className="py-2 pr-3">问题</th>
                  <th className="py-2 pr-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[var(--border)]">
                    <td className="py-2 pr-3 text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("zh-CN")}
                    </td>
                    <td className="py-2 pr-3">{log.action}</td>
                    <td className="py-2 pr-3">{log.role}</td>
                    <td className="py-2 pr-3">{log.hexagramName}</td>
                    <td className="py-2 pr-3 max-w-[200px] truncate">{log.question || "-"}</td>
                    <td className="py-2 pr-3 text-xs text-[var(--muted)]">{log.ip || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && <p className="text-sm text-[var(--muted)]">暂无记录</p>}
        </div>
      )}

      {/* Invite Codes */}
      {tab === "codes" && (
        <div className="space-y-4">
          {/* Create */}
          <div className="flex gap-2 items-end">
            <div>
              <label className="text-xs text-[var(--muted)]">邀请码（可选，留空自动生成）</label>
              <input
                type="text"
                value={newCodeInput}
                onChange={(e) => setNewCodeInput(e.target.value)}
                placeholder="自动生成"
                className="w-full border border-[var(--border)] rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">额度</label>
              <input
                type="number"
                value={newCodeMaxUses}
                onChange={(e) => setNewCodeMaxUses(e.target.value)}
                className="w-20 border border-[var(--border)] rounded px-3 py-1.5 text-sm"
              />
            </div>
            <button
              onClick={createCode}
              className="px-4 py-1.5 bg-[#1a1a1a] text-white rounded text-sm"
            >
              创建
            </button>
          </div>

          {/* List */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                <th className="py-2 pr-3">邀请码</th>
                <th className="py-2 pr-3">已用/额度</th>
                <th className="py-2 pr-3">状态</th>
                <th className="py-2 pr-3">创建时间</th>
                <th className="py-2 pr-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.code} className="border-b border-[var(--border)]">
                  <td className="py-2 pr-3 font-mono text-xs">{c.code}</td>
                  <td className="py-2 pr-3">{c.usedCount}/{c.maxUses}</td>
                  <td className="py-2 pr-3">
                    <span className={c.isActive ? "text-green-600" : "text-red-500"}>
                      {c.isActive ? "有效" : "停用"}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-xs">{new Date(c.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td className="py-2 pr-3 space-x-2">
                    <button
                      onClick={() => toggleCode(c.code, !c.isActive)}
                      className="text-xs underline text-[var(--muted)]"
                    >
                      {c.isActive ? "停用" : "启用"}
                    </button>
                    {editingCode === c.code ? (
                      <span className="inline-flex gap-1 items-center">
                        <input
                          type="number"
                          value={editMaxUses}
                          onChange={(e) => setEditMaxUses(e.target.value)}
                          className="w-16 border border-[var(--border)] rounded px-1 py-0.5 text-xs"
                        />
                        <button onClick={() => updateQuota(c.code)} className="text-xs underline text-blue-600">确认</button>
                        <button onClick={() => setEditingCode("")} className="text-xs underline text-[var(--muted)]">取消</button>
                      </span>
                    ) : (
                      <button
                        onClick={() => { setEditingCode(c.code); setEditMaxUses(String(c.maxUses)); }}
                        className="text-xs underline text-[var(--muted)]"
                      >
                        改额度
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {codes.length === 0 && <p className="text-sm text-[var(--muted)]">暂无邀请码</p>}
        </div>
      )}

      {/* Free Usage */}
      {tab === "free" && freeUsage && (
        <div className="space-y-4">
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
          <button
            onClick={resetFree}
            className="px-4 py-1.5 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50"
          >
            重置免费次数
          </button>
          <p className="text-xs text-[var(--muted)]">
            重置后免费计数归零，所有未激活用户将重新获得 99 次体验机会。
          </p>
        </div>
      )}
    </div>
  );
}
