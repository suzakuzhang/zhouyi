"use client";

/**
 * The 太极双鱼 language gate, modelled on yume's full-screen entry.
 * Two clickable fish: the yin (dark, left) fish chooses 中文, the yang
 * (light, right) fish chooses English. Tapping a fish sets the locale and
 * dissolves the gate into the app. Shown until a locale has been chosen.
 *
 * A "?" beneath the taiji opens a short, bilingual primer for newcomers —
 * shown in both languages because no locale has been chosen yet.
 */

import { useState } from "react";
import { useLocale } from "./LocaleProvider";
import { messages } from "@/lib/i18n/messages";

// the two interlocking halves of a taiji, centred at (50,50), R=46.
const YIN_PATH =
  "M50,4 A46,46 0 0,0 50,96 A23,23 0 0,0 50,50 A23,23 0 0,1 50,4 Z"; // dark, left → zh
const YANG_PATH =
  "M50,4 A46,46 0 0,1 50,96 A23,23 0 0,1 50,50 A23,23 0 0,0 50,4 Z"; // light, right → en

export function TaijiGate() {
  const { setLocale, t } = useLocale();
  const [hover, setHover] = useState<"zh" | "en" | null>(null);
  const [intro, setIntro] = useState(false);

  return (
    <div className="zy-gate" role="dialog" aria-label={t.gate.enter}>
      <div className="zy-gate-veil" aria-hidden />

      <div className="zy-gate-inner">
        <p className="zy-gate-title serif">{t.gate.title}</p>
        <p className="zy-gate-sub">{t.gate.subtitle}</p>

        <div className="zy-taiji-wrap" style={{ ["--armed" as string]: hover ?? "none" }}>
          <svg viewBox="0 0 100 100" className="zy-taiji" aria-hidden>
            {/* yin fish — 中文 */}
            <path
              d={YIN_PATH}
              className={`zy-fish zy-yin ${hover === "zh" ? "is-armed" : hover ? "is-dim" : ""}`}
              onClick={() => setLocale("zh")}
              onMouseEnter={() => setHover("zh")}
              onMouseLeave={() => setHover(null)}
            />
            {/* yang fish — English */}
            <path
              d={YANG_PATH}
              className={`zy-fish zy-yang ${hover === "en" ? "is-armed" : hover ? "is-dim" : ""}`}
              onClick={() => setLocale("en")}
              onMouseEnter={() => setHover("en")}
              onMouseLeave={() => setHover(null)}
            />
            {/* eyes — each the opposite tone of the fish it rests in */}
            <circle cx="50" cy="27" r="6" className="zy-eye-light" />
            <circle cx="50" cy="73" r="6" className="zy-eye-dark" />
            <circle cx="50" cy="50" r="46" className="zy-ring" fill="none" />
          </svg>
        </div>

        <div className="zy-gate-labels">
          <button
            className={`zy-label ${hover === "zh" ? "is-armed" : ""}`}
            onClick={() => setLocale("zh")}
            onMouseEnter={() => setHover("zh")}
            onMouseLeave={() => setHover(null)}
          >
            <span className="zy-label-main serif">{t.gate.zhLabel}</span>
            <span className="zy-label-hint">{t.gate.zhHint}</span>
          </button>
          <span className="zy-label-div" aria-hidden />
          <button
            className={`zy-label ${hover === "en" ? "is-armed" : ""}`}
            onClick={() => setLocale("en")}
            onMouseEnter={() => setHover("en")}
            onMouseLeave={() => setHover(null)}
          >
            <span className="zy-label-main serif">{t.gate.enLabel}</span>
            <span className="zy-label-hint">{t.gate.enHint}</span>
          </button>
        </div>

        {/* newcomer primer entry — a quiet "?" below the taiji */}
        <button
          className="zy-qmark"
          onClick={() => setIntro(true)}
          aria-label={messages.en.gate.about.open}
          title={`${messages.zh.gate.about.open} · ${messages.en.gate.about.open}`}
        >
          ?
        </button>

        <p className="zy-gate-foot">{t.gate.footnote}</p>
      </div>

      {intro && (
        <div className="zy-intro" role="dialog" aria-modal="true" onClick={() => setIntro(false)}>
          <div className="zy-intro-card" onClick={(e) => e.stopPropagation()}>
            {([messages.zh.gate.about, messages.en.gate.about]).map((a, i) => (
              <div key={i} className={i === 1 ? "zy-intro-block zy-intro-en" : "zy-intro-block"}>
                <p className="zy-intro-title serif">{a.title}</p>
                {a.body.map((para, j) => (
                  <p key={j} className="zy-intro-para">
                    {para}
                  </p>
                ))}
              </div>
            ))}
            <button className="zy-intro-close" onClick={() => setIntro(false)}>
              {messages.zh.gate.about.close} · {messages.en.gate.about.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
