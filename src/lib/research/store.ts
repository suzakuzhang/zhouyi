import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd());
const RESEARCH_FILE = path.join(DATA_DIR, "research_data.json");

export interface ResearchCastCase {
  castId: string;
  capturedAt: string;
  role: string;
  userId: string;
  question: string;
  method: string;
  policy: string;
  originalHexagramName: string;
  changedHexagramName: string | null;
  changingLines: number[];
  promptVersion: string;
  castResult: unknown;
  interpretation: unknown;
}

export interface ResearchInterpretationRecord {
  id: string;
  castId: string;
  capturedAt: string;
  role: string;
  userId: string;
  question: string;
  model: string;
  promptVersion: string;
  structure: unknown;
  readingStrategy: unknown;
  systemPrompt: string;
  userPrompt: string;
  result: unknown;
}

interface ResearchStore {
  castCases: Record<string, ResearchCastCase>;
  interpretationRecords: ResearchInterpretationRecord[];
}

function load(): ResearchStore {
  try {
    if (fs.existsSync(RESEARCH_FILE)) {
      const raw = fs.readFileSync(RESEARCH_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        castCases: parsed.castCases ?? {},
        interpretationRecords: parsed.interpretationRecords ?? [],
      };
    }
  } catch {
    // ignore malformed file and fall back to empty store
  }

  return {
    castCases: {},
    interpretationRecords: [],
  };
}

function save(store: ResearchStore): void {
  fs.writeFileSync(RESEARCH_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function utcNow(): string {
  return new Date().toISOString();
}

export function saveResearchCastCase(
  record: Omit<ResearchCastCase, "capturedAt"> & { capturedAt?: string }
): ResearchCastCase {
  const castId = record.castId.trim();
  if (!castId) {
    throw new Error("缺少 castId");
  }

  const store = load();
  const row: ResearchCastCase = {
    ...record,
    castId,
    capturedAt: record.capturedAt ?? utcNow(),
  };
  store.castCases[castId] = row;
  save(store);
  return row;
}

export function saveResearchInterpretation(
  record: Omit<ResearchInterpretationRecord, "id" | "capturedAt"> & { capturedAt?: string }
): ResearchInterpretationRecord {
  const castId = record.castId.trim();
  if (!castId) {
    throw new Error("缺少 castId");
  }

  const store = load();
  const row: ResearchInterpretationRecord = {
    ...record,
    castId,
    id: `interpret_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    capturedAt: record.capturedAt ?? utcNow(),
  };
  store.interpretationRecords.push(row);
  if (store.interpretationRecords.length > 1000) {
    store.interpretationRecords = store.interpretationRecords.slice(-1000);
  }
  save(store);
  return row;
}

export function exportResearchData(): {
  castCases: ResearchCastCase[];
  interpretationRecords: ResearchInterpretationRecord[];
  counts: { castCases: number; interpretationRecords: number };
} {
  const store = load();
  const castCases = Object.values(store.castCases).sort((a, b) =>
    a.capturedAt.localeCompare(b.capturedAt)
  );
  const interpretationRecords = store.interpretationRecords
    .slice()
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));

  return {
    castCases,
    interpretationRecords,
    counts: {
      castCases: castCases.length,
      interpretationRecords: interpretationRecords.length,
    },
  };
}
