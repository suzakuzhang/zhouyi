"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [result, setResult] = useState<unknown>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("castResult");
    if (raw) setResult(JSON.parse(raw));
  }, []);

  if (!result) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">开发者视图</h1>
        <p className="text-[var(--muted)]">
          暂无数据。请先<a href="/cast" className="underline">起卦</a>。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">开发者视图</h1>
        <a href="/result" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] underline">
          返回结果
        </a>
      </div>
      <pre className="bg-gray-50 border border-[var(--border)] rounded p-4 text-xs overflow-auto max-h-[80vh] leading-relaxed">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
