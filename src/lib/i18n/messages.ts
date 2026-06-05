/**
 * Bilingual message catalogue for zhouyi. zh is the source of truth for shape;
 * en `satisfies typeof zh` so the two stay structurally in sync.
 * Components consume the whole tree for the active locale via useLocale().t.
 */

export type Locale = "zh" | "en";

type TimeDetailArgs = {
  year: number;
  month: number;
  day: number;
  upperNum: number;
  upperRem: number;
  upperName: string;
  hourName: string;
  hour: number;
  lowerNum: number;
  lowerRem: number;
  lowerName: string;
  changingRem: number;
  changingLine: number;
};
type NumDetailArgs = {
  n1: number;
  n1rem: number;
  upperName: string;
  n2: number;
  n2rem: number;
  lowerName: string;
  sumRem: number;
  changingLine: number;
};
type WordDetailArgs = {
  chars: string;
  upperNum: number;
  upperRem: number;
  upperName: string;
  lowerNum: number;
  lowerRem: number;
  lowerName: string;
  total: number;
  totalRem: number;
  changingLine: number;
};

const zh = {
  brand: "周易",
  brandSub: "结构化阅读与演卦",
  langToggle: "EN",

  nav: {
    cast: "起卦",
    hexagrams: "六十四卦",
    search: "检索",
  },

  // the 太极双鱼 language gate
  gate: {
    title: "周易",
    subtitle: "结构化阅读与演卦系统",
    enter: "请选择语言",
    zhLabel: "中文",
    zhHint: "进入",
    enLabel: "English",
    enHint: "enter",
    footnote: "一套可验证、可追踪、可解释的周易阅读工具",
    about: {
      open: "第一次接触周易？",
      title: "什么是《周易》",
      body: [
        "《周易》是中国最古老的经典之一。它用六十四个由阴爻（断）与阳爻（连）组成的「卦」，映照一种处境，以及它正在变化的方向。",
        "怎么用：① 起卦——投币、报数，或以此刻取一卦；② 得到本卦与变卦；③ 读它的卦辞、爻辞与结构，把它当作自我反思的镜子，而非预言。",
      ],
      close: "明白了",
    },
  },

  home: {
    title: "周易 — 结构化阅读与演卦系统",
    intro:
      "基于《周易本义》文本结构与卦爻系统，提供可验证、可追踪、可解释的周易阅读与演卦工具。",
    castTitle: "起卦",
    castDesc: "铜钱法、梅花易数或复盘，生成本卦、变卦与阅读策略",
    hexTitle: "六十四卦",
    hexDesc: "浏览六十四卦，查看卦辞、爻辞与经传文本",
    disclaimer1: "本项目用于经典文本阅读与结构化解释研究，不构成任何现实决策建议。",
    disclaimer2: "经传文本分层展示，所有解释均标注来源，规则可追踪。",
    admin: "管理后台",
  },

  cast: {
    title: "起卦",
    methods: { coin: "铜钱法", meihua: "梅花易数", manual: "复盘" },
    coin: {
      intro:
        "三枚铜钱六次投掷。字面=3，花面=2。合计 6=老阴(动)、7=少阳、8=少阴、9=老阳(动)。",
      heads: "字",
      tails: "花",
      throwBtn: (n: number, pos: string) => `掷第${n}次（${pos}爻）`,
      reset: "重来",
    },
    lineLabels: { 6: "⚋○ 老阴(动)", 7: "⚊  少阳", 8: "⚋  少阴", 9: "⚊○ 老阳(动)" },
    posLabels: ["初", "二", "三", "四", "五", "上"],
    line: { yang: "阳", yin: "阴", changing: "动" },
    trigrams: ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"],
    branches: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"],
    hourSuffix: "时",
    meihua: {
      intro: "梅花易数以数起卦，万物皆可为数。选择一种起卦方式：",
      modes: { time: "当下时间", two_num: "报二数", word: "文字起卦" },
      timeHint:
        "以当前年月日时辰起卦。年+月+日 → 上卦，年+月+日+时辰 → 下卦，总数 ÷ 6 余数 → 动爻。",
      timeBtn: "以此刻起卦",
      twoNumHint:
        "心中想好问题，随意报两个正整数。第一数 → 上卦，第二数 → 下卦，两数之和 ÷ 6 → 动爻。",
      num1Ph: "第一数",
      num2Ph: "第二数",
      castBtn: "起卦",
      wordHint:
        "输入一个字或一组词。单字以字码取上卦、字码加时辰取下卦；多字前半取上、后半取下，总数取动爻。",
      wordPh: "输入文字",
      resultUpper: "上卦",
      resultLower: "下卦",
      resultChanging: "动爻：第",
      resultChangingTail: "爻",
      recast: "重新起卦",
      timeDetail: (p: TimeDetailArgs) =>
        `年${p.year} + 月${p.month} + 日${p.day} = ${p.upperNum} → 上卦 ${p.upperNum}÷8 余${p.upperRem} = ${p.upperName}；加时辰${p.hourName}(${p.hour}) = ${p.lowerNum} → 下卦 ${p.lowerNum}÷8 余${p.lowerRem} = ${p.lowerName}；动爻 ${p.lowerNum}÷6 余${p.changingRem} = 第${p.changingLine}爻`,
      numDetail: (p: NumDetailArgs) =>
        `第一数 ${p.n1} ÷ 8 余${p.n1rem} → 上卦${p.upperName}；第二数 ${p.n2} ÷ 8 余${p.n2rem} → 下卦${p.lowerName}；(${p.n1}+${p.n2}) ÷ 6 余${p.sumRem} → 动爻第${p.changingLine}爻`,
      wordDetail: (p: WordDetailArgs) =>
        `"${p.chars}" → 上卦数${p.upperNum} ÷ 8 余${p.upperRem} = ${p.upperName}；下卦数${p.lowerNum} ÷ 8 余${p.lowerRem} = ${p.lowerName}；总数${p.total} ÷ 6 余${p.totalRem} → 动爻第${p.changingLine}爻`,
    },
    manual: {
      intro:
        "从下（初爻）往上（上爻）设定六爻的阴阳与动爻。适合已有起卦结果需要录入查看的情况。",
      loadExample: "载入示例",
      exampleQuestion: "示例：乾卦初九动",
    },
    question: { label: "问题（可选）", placeholder: "你想问什么" },
    submit: "演卦",
    submitting: "演卦中…",
    errors: {
      castFailed: "演卦失败",
      network: "网络错误，请重试。",
      twoPositive: "请输入两个正整数",
      atLeastOneChar: "请输入至少一个字",
    },
  },

  layers: {
    "经文": "经文",
    "传文": "传文",
    "系统说明": "系统说明",
    "系统摘要": "系统摘要",
  },

  result: {
    title: "演卦结果",
    emptyPre: "暂无结果。请先",
    emptyLink: "起卦",
    emptyPost: "。",
    original: "本卦",
    changed: "变卦",
    lowerUpper: (lower: string, upper: string) => `${lower}下 ${upper}上`,
    auxTitle: "辅助卦象",
    auxNote: "仅作结构参考，不直接等同主断。",
    mutual: "互卦",
    inverse: "错卦",
    reversed: "综卦",
    structureTitle: "结构层",
    yinyang: (yang: number, yin: number) => `阴阳分布：阳${yang} 阴${yin}`,
    strategyTitle: "阅读策略",
    primaryTitle: "主读文本",
    secondaryTitle: "次读文本",
    llmCta: "赛博解卦",
    llmCtaSub: "AI 深度解读卦象 · 象意 · 卦辞 · 势变 · 今解 · 可行",
    llmFailed: "解读失败",
    llmNetwork: "网络错误",
    fieldXiangyi: "象意",
    fieldGuaci: "卦辞",
    fieldShibian: "势变",
    fieldJinjie: "今解",
    fieldKexing: "可行",
    textsLink: "文本对照",
    debugLink: "开发者视图",
    recast: "重新起卦",
  },

  hexagrams: {
    title: "六十四卦",
    searchPh: "搜索卦名或卦序…",
  },

  search: {
    title: "经文检索",
    intro: "搜索六十四卦的卦辞、爻辞、彖传、象传、文言、序卦传、杂卦传。",
    placeholder: "输入关键词，如：元亨利贞、君子、大川…",
    button: "搜索",
    searching: "搜索中…",
    count: (n: number) => `找到 ${n} 条结果`,
    truncated: "（已截取前 50 条）",
  },

  hexDetail: {
    loading: "加载中…",
    hexagramN: (id: number) => `第${id}卦`,
    sections: { 上经: "上经", 下经: "下经" } as Record<string, string>,
    back: "返回六十四卦",
    tabs: {
      guaCi: "卦辞",
      yaoCi: "爻辞",
      tuan: "彖传",
      xiang: "象传",
      wenyan: "文言",
      other: "序卦·杂卦",
    },
    greatImage: "大象",
    smallImage: "小象",
    lineTag: (pos: number) => `第${pos}爻 (${["初", "二", "三", "四", "五", "上"][pos - 1]})`,
    xugua: "序卦传",
    zagua: "杂卦传",
  },

  foot: "A research prototype",
};

const en = {
  brand: "I Ching",
  brandSub: "Structured Reading & Casting",
  langToggle: "中",

  nav: {
    cast: "Cast",
    hexagrams: "64 Hexagrams",
    search: "Search",
  },

  gate: {
    title: "I Ching",
    subtitle: "A structured reading & casting system",
    enter: "Choose a language",
    zhLabel: "中文",
    zhHint: "进入",
    enLabel: "English",
    enHint: "enter",
    footnote: "A verifiable, traceable, explainable way to read the Yijing",
    about: {
      open: "New to the Yijing?",
      title: "What is the Yijing?",
      body: [
        "The Yijing (I Ching, the “Book of Changes”) is one of China’s oldest classics. It uses sixty-four hexagrams — figures of broken (yin) and solid (yang) lines — to mirror a situation and the direction in which it is moving.",
        "How it works: ① Cast a hexagram (with coins, numbers, or the present moment); ② receive a primary hexagram and a changing one; ③ read its judgment, line statements and structure as a mirror for reflection, not a prediction.",
      ],
      close: "Got it",
    },
  },

  home: {
    title: "I Ching — Structured Reading & Casting",
    intro:
      "Built on the textual structure of the Zhouyi Benyi and the hexagram/line system, offering a verifiable, traceable and explainable way to read and cast the Yijing.",
    castTitle: "Cast a hexagram",
    castDesc:
      "Coin method, plum-blossom numerology, or replay — derive the primary and changing hexagrams with a reading strategy",
    hexTitle: "The 64 Hexagrams",
    hexDesc:
      "Browse all sixty-four hexagrams with their judgments, line statements and canonical commentary",
    disclaimer1:
      "This project is for reading classical texts and researching structured interpretation. It is not advice for any real-world decision.",
    disclaimer2:
      "Canonical text is shown in layers; every interpretation is sourced and every rule is traceable.",
    admin: "Admin",
  },

  cast: {
    title: "Cast a hexagram",
    methods: { coin: "Coin method", meihua: "Plum-blossom", manual: "Replay" },
    coin: {
      intro:
        "Three coins, six throws. Inscribed face = 3, reverse face = 2. Sums: 6 = old yin (changing), 7 = young yang, 8 = young yin, 9 = old yang (changing).",
      heads: "H",
      tails: "T",
      throwBtn: (n: number, pos: string) => `Throw ${n} · ${pos} line`,
      reset: "Reset",
    },
    lineLabels: {
      6: "⚋○ Old Yin (changing)",
      7: "⚊  Young Yang",
      8: "⚋  Young Yin",
      9: "⚊○ Old Yang (changing)",
    },
    posLabels: ["1st", "2nd", "3rd", "4th", "5th", "top"],
    line: { yang: "Yang", yin: "Yin", changing: "chg" },
    trigrams: ["Heaven", "Lake", "Fire", "Thunder", "Wind", "Water", "Mountain", "Earth"],
    branches: ["Zi", "Chou", "Yin", "Mao", "Chen", "Si", "Wu", "Wei", "Shen", "You", "Xu", "Hai"],
    hourSuffix: "",
    meihua: {
      intro:
        "Plum-blossom numerology casts from numbers — anything can become a number. Choose a method:",
      modes: { time: "Present time", two_num: "Two numbers", word: "From text" },
      timeHint:
        "Cast from the current date and hour. Year + month + day → upper trigram; + hour → lower trigram; total mod 6 → changing line.",
      timeBtn: "Cast from now",
      twoNumHint:
        "Hold your question in mind and name any two positive integers. First → upper trigram, second → lower trigram, their sum mod 6 → changing line.",
      num1Ph: "First",
      num2Ph: "Second",
      castBtn: "Cast",
      wordHint:
        "Enter a character or a few words. One character: its code → upper, code + hour → lower. Several: first half → upper, second half → lower, total → changing line.",
      wordPh: "Enter text",
      resultUpper: "Upper",
      resultLower: "Lower",
      resultChanging: "Changing line:",
      resultChangingTail: "",
      recast: "Cast again",
      timeDetail: (p: TimeDetailArgs) =>
        `Year ${p.year} + month ${p.month} + day ${p.day} = ${p.upperNum} → upper ${p.upperNum} mod 8 = ${p.upperRem} = ${p.upperName}; + hour ${p.hourName} (${p.hour}) = ${p.lowerNum} → lower ${p.lowerNum} mod 8 = ${p.lowerRem} = ${p.lowerName}; changing line ${p.lowerNum} mod 6 = ${p.changingRem} = line ${p.changingLine}`,
      numDetail: (p: NumDetailArgs) =>
        `First ${p.n1} mod 8 = ${p.n1rem} → upper ${p.upperName}; second ${p.n2} mod 8 = ${p.n2rem} → lower ${p.lowerName}; (${p.n1} + ${p.n2}) mod 6 = ${p.sumRem} → changing line ${p.changingLine}`,
      wordDetail: (p: WordDetailArgs) =>
        `"${p.chars}" → upper value ${p.upperNum} mod 8 = ${p.upperRem} = ${p.upperName}; lower value ${p.lowerNum} mod 8 = ${p.lowerRem} = ${p.lowerName}; total ${p.total} mod 6 = ${p.totalRem} → changing line ${p.changingLine}`,
    },
    manual: {
      intro:
        "Set the yin/yang and changing state of all six lines, from bottom (1st) to top. Useful for entering a hexagram you already cast elsewhere.",
      loadExample: "Load example",
      exampleQuestion: "Example: Qian, first line changing",
    },
    question: { label: "Question (optional)", placeholder: "What do you wish to ask?" },
    submit: "Cast",
    submitting: "Casting…",
    errors: {
      castFailed: "Casting failed",
      network: "Network error, please retry.",
      twoPositive: "Please enter two positive integers",
      atLeastOneChar: "Please enter at least one character",
    },
  },

  layers: {
    "经文": "Classic",
    "传文": "Commentary",
    "系统说明": "System note",
    "系统摘要": "Summary",
  },

  result: {
    title: "Casting result",
    emptyPre: "No result yet. Please ",
    emptyLink: "cast a hexagram",
    emptyPost: " first.",
    original: "Primary",
    changed: "Changed",
    lowerUpper: (lower: string, upper: string) => `${lower} below · ${upper} above`,
    auxTitle: "Auxiliary hexagrams",
    auxNote: "For structural reference only; not the primary judgment.",
    mutual: "Nuclear",
    inverse: "Opposite",
    reversed: "Reversed",
    structureTitle: "Structure",
    yinyang: (yang: number, yin: number) => `Yin–Yang: ${yang} yang · ${yin} yin`,
    strategyTitle: "Reading strategy",
    primaryTitle: "Primary texts",
    secondaryTitle: "Secondary texts",
    llmCta: "AI reading",
    llmCtaSub: "An AI close reading — image · judgment · change · today · action",
    llmFailed: "Reading failed",
    llmNetwork: "Network error",
    fieldXiangyi: "Image",
    fieldGuaci: "Judgment",
    fieldShibian: "Change",
    fieldJinjie: "Today",
    fieldKexing: "Action",
    textsLink: "Text comparison",
    debugLink: "Developer view",
    recast: "Cast again",
  },

  hexagrams: {
    title: "The 64 Hexagrams",
    searchPh: "Search by name or number…",
  },

  search: {
    title: "Text search",
    intro:
      "Search judgments, line statements and commentaries across all sixty-four hexagrams.",
    placeholder: "Enter a keyword…",
    button: "Search",
    searching: "Searching…",
    count: (n: number) => `${n} result${n === 1 ? "" : "s"} found`,
    truncated: " (first 50 shown)",
  },

  hexDetail: {
    loading: "Loading…",
    hexagramN: (id: number) => `Hexagram ${id}`,
    sections: { 上经: "Upper Canon", 下经: "Lower Canon" } as Record<string, string>,
    back: "Back to the 64 hexagrams",
    tabs: {
      guaCi: "Judgment",
      yaoCi: "Lines",
      tuan: "Tuan",
      xiang: "Images",
      wenyan: "Wenyan",
      other: "Sequence & Miscellany",
    },
    greatImage: "Great Image",
    smallImage: "Small Image",
    lineTag: (pos: number) => `Line ${pos}`,
    xugua: "Sequence (Xu Gua)",
    zagua: "Miscellaneous (Za Gua)",
  },

  foot: "A research prototype",
} satisfies typeof zh;

export type Messages = typeof zh;

export const messages: Record<Locale, Messages> = { zh, en };
