"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateMsg, setActivateMsg] = useState("");
  const [role, setRole] = useState("normal");
  const [showInviteInput, setShowInviteInput] = useState(false);

  useEffect(() => {
    fetch("/api/free-usage")
      .then((r) => r.json())
      .then((d) => setFreeRemaining(d.remaining ?? null))
      .catch(() => {});

    // Restore access state
    const saved = localStorage.getItem("zhouyi_access");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.accessToken) {
          setRole(parsed.role ?? "normal");
          // Verify token is still valid
          fetch(`/api/access/status?access_token=${parsed.accessToken}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.activated) {
                setRole(d.role);
              } else {
                localStorage.removeItem("zhouyi_access");
                setRole("normal");
              }
            })
            .catch(() => {});
        }
      } catch { /* ignore */ }
    }
  }, []);

  const activateInvite = async () => {
    if (!inviteCode.trim()) return;
    setActivating(true);
    setActivateMsg("");
    try {
      const res = await fetch("/api/access/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "invite", inviteCode: inviteCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        localStorage.setItem("zhouyi_access", JSON.stringify(data));
        setRole(data.role);
        setActivateMsg("激活成功！");
        setShowInviteInput(false);
        setInviteCode("");
      } else {
        setActivateMsg(data.error ?? "激活失败");
      }
    } catch {
      setActivateMsg("网络错误");
    }
    setActivating(false);
  };

  const isActivated = role !== "normal";

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">周易 — 结构化阅读与演卦系统</h1>
        <p className="text-[var(--muted)] leading-relaxed">
          基于《周易本义》文本结构与卦爻系统，提供可验证、可追踪、可解释的周易阅读与演卦工具。
        </p>
      </section>

      {/* Access status */}
      <div className="bg-gray-50 border border-[var(--border)] rounded px-4 py-3 space-y-2">
        {isActivated ? (
          <div className="flex items-center justify-between">
            <span className="text-sm">
              已激活
              <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">
                {role === "admin" ? "管理员" : role === "pilot" ? "先行者" : "邀请码用户"}
              </span>
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">
                免费体验剩余 <strong className="text-[var(--foreground)]">{freeRemaining ?? "..."}</strong> 次
                {freeRemaining !== null && freeRemaining <= 0 && (
                  <span className="ml-2 text-amber-600">（已用完）</span>
                )}
              </span>
              {!showInviteInput && (
                <button
                  onClick={() => setShowInviteInput(true)}
                  className="text-sm px-3 py-1 border border-[var(--border)] rounded hover:border-[var(--accent)] transition-colors"
                >
                  输入邀请码
                </button>
              )}
            </div>

            {showInviteInput && (
              <div className="flex gap-2 items-center pt-1">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && activateInvite()}
                  placeholder="请输入邀请码"
                  maxLength={20}
                  className="flex-1 max-w-[200px] border border-[var(--border)] rounded px-3 py-1.5 text-sm font-mono"
                />
                <button
                  onClick={activateInvite}
                  disabled={activating || !inviteCode.trim()}
                  className="px-4 py-1.5 bg-[#1a1a1a] text-white rounded text-sm disabled:opacity-50"
                >
                  {activating ? "激活中…" : "激活"}
                </button>
                <button
                  onClick={() => { setShowInviteInput(false); setActivateMsg(""); }}
                  className="text-xs text-[var(--muted)]"
                >
                  取消
                </button>
              </div>
            )}

            {activateMsg && (
              <p className={`text-sm ${activateMsg.includes("成功") ? "text-green-600" : "text-red-600"}`}>
                {activateMsg}
              </p>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="/cast"
          className="block border border-[var(--border)] rounded-lg p-6 hover:border-[var(--accent)] transition-colors"
        >
          <h2 className="font-semibold mb-2">起卦</h2>
          <p className="text-sm text-[var(--muted)]">
            铜钱法、梅花易数或复盘，生成本卦、变卦与阅读策略
          </p>
        </a>

        <a
          href="/hexagrams"
          className="block border border-[var(--border)] rounded-lg p-6 hover:border-[var(--accent)] transition-colors"
        >
          <h2 className="font-semibold mb-2">六十四卦</h2>
          <p className="text-sm text-[var(--muted)]">
            浏览六十四卦，查看卦辞、爻辞与经传文本
          </p>
        </a>
      </div>

      <section className="text-xs text-[var(--muted)] space-y-1 pt-4 border-t border-[var(--border)]">
        <p>本项目用于经典文本阅读与结构化解释研究，不构成任何现实决策建议。</p>
        <p>经传文本分层展示，所有解释均标注来源，规则可追踪。</p>
        <p className="pt-2">
          <a href="/admin" className="underline hover:text-[var(--foreground)]">管理后台</a>
        </p>
      </section>
    </div>
  );
}
