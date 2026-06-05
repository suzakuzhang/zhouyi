# Zhouyi / Yijing

A web-based *Yijing* (*I Ching*) interpretation prototype. It casts a hexagram, assembles the classical text layers and a transparent rule trace, and then lets an LLM produce a structured, context-specific reading — built as the textual-divinatory counterpart to the [`tarot_local_test`](https://github.com/suzakuzhang/tarot_local_test) prototype.

**Live demo:** https://zhouyi.onrender.com *(interface in Chinese)*

---

## What this is

This is a research prototype for studying **AI-mediated interpretation across distinct symbolic traditions**. Where tarot offers an image-symbol surface, the *Yijing* offers a **text-and-structure** one: a hexagram is built from line values, its trigrams and changing lines are resolved by explicit rules, and the classical judgement/image/line statements form the material the model interprets.

The design question is the same one that runs through the wider project: what happens to interpretive authority when an AI speaks *through* a culturally specific symbolic system rather than simply *about* it — and how does that differ between an emotionally receptive oracle (tarot) and a rule-/commentary-bound one (the *Yijing*)?

## How a reading works

```
cast (coin method)  →  build hexagram + changing lines  →  resolve trigrams / inverse hexagram
        →  select classical text layers  →  build rule trace
        →  LLM structured reading (DeepSeek)
        →  optional multi-turn "spirit" dialogue (Gemini)
```

- **Casting** — the three-coin method produces line values and changing lines (`src/lib/casting/`).
- **Structure** — hexagram construction, trigram resolution, and inverse-hexagram derivation.
- **Text selection** — the relevant judgement, image, and line statements are selected as the interpretive material (`src/lib/explain/`, `selectTexts.ts`).
- **Rule trace** — a transparent record of which rules fired, so a reading can be audited rather than taken on faith (`buildRuleTrace.ts`).
- **Reading engine** — applies reading policies and hands the assembled context to the LLM (`src/lib/reading/`).
- **Spirit panel** — an optional Gemini-based multi-turn dialogue scoped to the current reading.
- **Research store** — readings can be recorded for later cross-comparison (`src/lib/research/store.ts`).

## Tech stack

- **Next.js 14** (App Router) + React 18 + TypeScript
- **Tailwind CSS**
- **DeepSeek** — structured reading model
- **Gemini** — role-played "spirit" dialogue
- Session-token + invite-code access layer; admin panel
- Deployment: **Render** (`render.yaml`)

## Project structure

```
zhouyi/src/
├── app/            # routes: cast, result, hexagrams, search, admin
├── components/     # LineInput, HexagramSymbol, TextLayerLabel, SpiritPanel, LoadingOverlay
├── lib/
│   ├── casting/    # coin method, hexagram build, inverse hexagram
│   ├── explain/    # structure / text-layer / rule-trace builders
│   ├── reading/    # reading engine + policies + text selection
│   ├── spirit/     # spirit session + prompt
│   ├── llm/        # deepseek + gemini wrappers + prompts
│   ├── data/       # hexagrams + trigrams loaders
│   ├── access/     # session + roles
│   └── research/   # research record store
├── data/hexagrams_data.json
└── types/          # hexagram, trigram, casting, reading, explain
```

## Local development

Requires Node 18+.

```bash
npm install
npm run dev
```

Environment variables (read from the environment, never committed):

```bash
DEEPSEEK_API_KEY=...
GEMINI_API_KEY=...
PILOT_ADMIN_CODE=...
PILOT_ADMIN_BIRTH_DATE=...
```

`access_data.json` and `spirit_data.json` are runtime-local files listed in `.gitignore`.

## Scope and limits

A prototype for reflection and research. It does not provide medical, legal, financial, or other professional advice, and its output should not be the sole basis for any high-stakes decision.

## Author

Created by Shumin Zhang, as part of a research program on how AI systems mediate symbolic interpretation. For citation or reuse, please credit the original repository and author.
