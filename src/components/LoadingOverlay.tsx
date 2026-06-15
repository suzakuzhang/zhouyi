"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale } from "./LocaleProvider";

// 三阶段状态文案
const LOADING_STATES = [
  "正在展开卦象的脉络……",
  "正在把你的问题放进这个卦里……",
  "正在生成解卦……",
];

const LOADING_STATES_EN = [
  "Tracing the structure of the hexagram…",
  "Placing your question inside this hexagram…",
  "Composing the reading…",
];

const COMMON_FACTS_EN = [
  `Each of the 64 hexagrams is a cross-section of a single situation.`,
  `The first line is where things begin, the top line is the end — position itself is information.`,
  `A yang line in an odd place, a yin line in an even place is "correct position"; being out of place often signals a mismatch.`,
  `The judgment speaks to the whole picture; the line statements speak to your specific position within it.`,
  `The Tuan explains why a hexagram is as it is; the Image tells you what to do about it.`,
  `The changing line is the most active force in the hexagram — at once the key and the variable.`,
  `The changed hexagram is not a "result"; it is where this force is heading if it keeps developing.`,
  `The nuclear hexagram hides in the middle — an unseen structure inside the matter.`,
  `The opposite hexagram inverts every line — the reverse side sometimes tells you more than the front.`,
  `The reversed hexagram turns the whole figure upside down — the same thing seen from another angle.`,
  `"Yuan, heng, li, zhen" mark a thing's beginning, flourishing, harvest, and holding firm.`,
  `Qian and Kun underlie all change — one pure creativity, the other pure receptivity.`,
  `The Yijing does not predict the future; it helps you see where you now stand.`,
  `The same hexagram, asked about different matters, lands its weight on different lines.`,
  `The 64 hexagrams form a chain: from Qian and Kun to Before/After Completion — and completion begins anew.`,
];

// 通用碎片知识池
const COMMON_FACTS = [
  `六十四卦，每一卦都是一个处境的切面。`,
  `初爻是事情刚起的时候，上爻是走到尽头——位置本身就是信息。`,
  `阳爻居奇位、阴爻居偶位叫「当位」，不当位往往意味着某种错位。`,
  `卦辞讲的是整体格局，爻辞讲的是你在这个格局里的具体位置。`,
  `彖传解释「为什么这个卦是这样」，象传告诉你「知道了之后该怎么做」。`,
  `动爻是这个卦里最活跃的力量——它既是关键，也是变数。`,
  `变卦不是「结果」，更像是「如果这股力量继续发展，会往哪个方向走」。`,
  `互卦藏在卦的中间，像是事情内部没被看到的结构。`,
  `错卦是每一爻都反过来——你看到的反面，有时比正面更说明问题。`,
  `综卦是整个卦上下翻转——换个角度看同一件事，往往会有不同发现。`,
  `「元亨利贞」四个字，分别对应事物发展的起始、通达、收获、持守。`,
  `乾坤两卦是所有变化的底层——一个是纯粹的创造力，一个是纯粹的承载力。`,
  `《周易》不预测未来，它更像是帮你看清：你现在站在什么位置上。`,
  `同一个卦，问不同的事，重点会落在不同的爻上。`,
  `六十四卦首尾相连：从乾坤开始，到既济未济结束——完成之后又是新的开始。`,
];

// 按卦名匹配的专属碎片
const HEXAGRAM_FACTS: Record<string, string[]> = {
  "乾": [
    `「天行健」——这里的「健」不是刚猛，是持续不停、自己推着自己走的力量。`,
    `乾卦六爻从「潜龙」到「亢龙」，说的是同一股力量在不同阶段的表现。`,
    `用九「见群龙无首」——最高的领导力，是让人看不出谁在领导。`,
  ],
  "坤": [
    `「地势坤」——承载万物不是被动，是一种主动选择的包容。`,
    `坤卦说「先迷后得主」，有时候不急着确定方向，反而能走对路。`,
    `黄裳元吉——最好的位置往往不是最显眼的那个。`,
  ],
  "屯": [
    `屯卦是雷在水下——能量已经有了，但还没找到破土的方向。`,
    `「磐桓」就是在原地打转——但有时候打转是必要的酝酿。`,
  ],
  "蒙": [
    `「山下出泉」——蒙昧不是错，是还在找自己的出口。`,
    `蒙卦说「匪我求童蒙，童蒙求我」——教育的前提是对方自己想学。`,
  ],
};

interface LoadingOverlayProps {
  visible: boolean;
  hexagramName?: string;
}

export default function LoadingOverlay({ visible, hexagramName }: LoadingOverlayProps) {
  const { locale } = useLocale();
  const states = locale === "en" ? LOADING_STATES_EN : LOADING_STATES;
  const [stateText, setStateText] = useState(states[0]);
  const [fact, setFact] = useState("");
  const [progress, setProgress] = useState(0);
  const factPool = useRef<string[]>([]);
  const factIndex = useRef(0);

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      return;
    }

    // Build fact pool (hexagram-specific facts are zh-only; en uses common pool)
    const specific =
      locale === "en" ? [] : hexagramName ? HEXAGRAM_FACTS[hexagramName] ?? [] : [];
    const pool = locale === "en" ? [...COMMON_FACTS_EN] : [...specific, ...COMMON_FACTS];
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    factPool.current = pool;
    factIndex.current = 0;
    setFact(pool[0] ?? "");

    // State transitions
    setStateText(states[0]);
    const t1 = setTimeout(() => setStateText(states[1]), 2000);
    const t2 = setTimeout(() => setStateText(states[2]), 4500);

    // Fact rotation
    const factInterval = setInterval(() => {
      factIndex.current = (factIndex.current + 1) % factPool.current.length;
      setFact(factPool.current[factIndex.current]);
    }, 3000);

    // Progress bar animation
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      // Ease out: fast at start, slow near end, never reaches 100
      const p = Math.min(95, (1 - Math.exp(-elapsed / 8000)) * 100);
      setProgress(p);
    }, 100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(factInterval);
      clearInterval(progressInterval);
    };
  }, [visible, hexagramName, locale]);

  if (!visible) return null;

  return (
    <div className="space-y-4 py-4" aria-live="polite">
      {/* State text */}
      <p className="text-sm text-[var(--muted)] animate-pulse">{stateText}</p>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-[#1a1a1a] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Fact snippet */}
      <p className="text-xs text-[var(--muted)] leading-relaxed min-h-[2.5rem] transition-opacity duration-500">
        {fact}
      </p>
    </div>
  );
}
