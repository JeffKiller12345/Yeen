import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// --- CONFIGURATION ---
const SBA_HIGH_YIELD = ['Microbiology', 'Cardiovascular Medicine', 'Gastrointestinal and Hepatic Medicine', 'Neurology'];
const SAQ_HIGH_YIELD = ['Microbiology', 'Respiratory Medicine', 'Cardiovascular Medicine', 'Gastrointestinal and Hepatic Medicine', 'Neurology'];

const SBA_HIGH_YIELD_COUNT = 10;
const SBA_DEFAULT_COUNT = 5;
const SAQ_OTHER_COUNT = 7; // Number of "Other" cases to add per paper

interface Question {
  id: string;
  topic: string;
  subtopic: string;
  marks?: number;
}

// --- HELPERS ---
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchAll(table: string, columns: string): Promise<Question[]> {
  let allData: Question[] = [];
  let from = 0;
  const step = 999;
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + step);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = [...allData, ...data as unknown as Question[]];
    if (data.length <= step) break;
    from += step + 1;
  }
  return allData;
}

// --- GENERATORS ---
async function generateSBAMock(allQuestions: Question[], mockNumber: number): Promise<void> {
  const byTopic: Record<string, Question[]> = {};
  allQuestions.forEach(q => {
    if (!byTopic[q.topic]) byTopic[q.topic] = [];
    byTopic[q.topic].push(q);
  });

  const selected: string[] = [];
  for (const topic in byTopic) {
    const isHighYield = SBA_HIGH_YIELD.some(hy => topic.includes(hy));
    const count = isHighYield ? SBA_HIGH_YIELD_COUNT : SBA_DEFAULT_COUNT;
    const pool = byTopic[topic];
    const offset = ((mockNumber - 1) * count) % pool.length;
    const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
    selected.push(...rotated.slice(0, count).map(q => q.id));
  }

  const finalIds = shuffle(selected);
  const mock = {
    id: `sba_mock_${String(mockNumber).padStart(3, '0')}`,
    name: `SBA Mock Paper ${mockNumber}`,
    type: 'sba',
    question_ids: finalIds,
    total_questions: finalIds.length,
    time_seconds: finalIds.length * 72,
    is_active: true
  };

  await supabase.from('mocks').upsert(mock);
  console.log(`✅ SBA Mock ${mockNumber} (${finalIds.length} Qs)`);
}

async function generateSAQMock(allSAQs: Question[], mockNumber: number): Promise<void> {
  const cases: Record<string, { topic: string; ids: string[]; totalMarks: number }> = {};
  allSAQs.forEach(q => {
    const caseId = q.id.split('_').slice(0, 2).join('_');
    if (!cases[caseId]) cases[caseId] = { topic: q.topic, ids: [], totalMarks: 0 };
    cases[caseId].ids.push(q.id);
    cases[caseId].totalMarks += (q.marks ?? 0);
  });

  const casesByTopic: Record<string, typeof cases[string][]> = {};
  Object.values(cases).forEach(c => {
    if (!casesByTopic[c.topic]) casesByTopic[c.topic] = [];
    casesByTopic[c.topic].push(c);
  });

  const selectedIds: string[] = [];
  let totalMarks = 0;
  let caseCount = 0;

  // 1. High Yield
  for (const hy of SAQ_HIGH_YIELD) {
    const key = Object.keys(casesByTopic).find(t => t.includes(hy));
    if (!key) continue;
    const pool = casesByTopic[key];
    const picked = pool[(mockNumber - 1) % pool.length];
    selectedIds.push(...picked.ids);
    totalMarks += picked.totalMarks;
    caseCount++;
  }

  // 2. Others
  const otherTopics = Object.keys(casesByTopic).filter(t => !SAQ_HIGH_YIELD.some(hy => t.includes(hy))).sort();
  const offset = (mockNumber - 1) * SAQ_OTHER_COUNT;
  for (let i = 0; i < SAQ_OTHER_COUNT; i++) {
    const topic = otherTopics[(offset + i) % otherTopics.length];
    if (!topic) continue;
    const pool = casesByTopic[topic];
    const picked = pool[Math.floor((offset + i) / otherTopics.length) % pool.length];
    selectedIds.push(...picked.ids);
    totalMarks += picked.totalMarks;
    caseCount++;
  }

  const mock = {
    id: `saq_mock_${String(mockNumber).padStart(3, '0')}`,
    name: `SAQ Mock Paper ${mockNumber}`,
    type: 'saq',
    question_ids: selectedIds,
    total_marks: totalMarks,
    total_questions: selectedIds.length,
    time_seconds: totalMarks * 75,
    is_active: true
  };

  await supabase.from('mocks').upsert(mock);
  console.log(`✅ SAQ Mock ${mockNumber} (${totalMarks} marks, ${caseCount} cases)`);
}

async function main() {
  try {
    const sbaData = await fetchAll('questions', 'id, topic, subtopic');
    const saqData = await fetchAll('saq_questions', 'id, topic, subtopic, marks');

    // Calculate Limits
    const sbaCounts: Record<string, number> = {};
    sbaData.forEach(q => sbaCounts[q.topic] = (sbaCounts[q.topic] || 0) + 1);
    const maxSBAMocks = Math.min(...Object.keys(sbaCounts).map(t => Math.floor(sbaCounts[t] / (SBA_HIGH_YIELD.some(hy => t.includes(hy)) ? SBA_HIGH_YIELD_COUNT : SBA_DEFAULT_COUNT))));
console.log('\n📊 SBA Topic Capacity:');
const sbaCapacity = Object.keys(sbaCounts).map(t => {
  const isHighYield = SBA_HIGH_YIELD.some(hy => t.includes(hy));
  const required = isHighYield ? SBA_HIGH_YIELD_COUNT : SBA_DEFAULT_COUNT;
  const capacity = Math.floor(sbaCounts[t] / required);
  return { topic: t, questions: sbaCounts[t], required, capacity };
});
sbaCapacity
  .sort((a, b) => a.capacity - b.capacity)
  .forEach(({ topic, questions, required, capacity }) =>
    console.log(`  ${capacity === maxSBAMocks ? '🔴' : '  '} ${topic}: ${questions}q ÷ ${required} = ${capacity} mocks`)
  );
console.log(`  → SBA limit: ${maxSBAMocks} mocks\n`);
    const saqCaseCounts: Record<string, number> = {};
    const seen = new Set<string>();
    saqData.forEach(q => {
      const cid = q.id.split('_').slice(0, 2).join('_');
      if (!seen.has(cid)) { saqCaseCounts[q.topic] = (saqCaseCounts[q.topic] || 0) + 1; seen.add(cid); }
    });
    const hyLimits = SAQ_HIGH_YIELD.map(hy => saqCaseCounts[Object.keys(saqCaseCounts).find(t => t.includes(hy))!] || 0);
    const otherTotal = Object.keys(saqCaseCounts).filter(t => !SAQ_HIGH_YIELD.some(hy => t.includes(hy))).reduce((s, t) => s + saqCaseCounts[t], 0);
    const maxSAQMocks = Math.min(...hyLimits, Math.floor(otherTotal / SAQ_OTHER_COUNT));
console.log('📊 SAQ Topic Capacity:');
SAQ_HIGH_YIELD.forEach(hy => {
  const key = Object.keys(saqCaseCounts).find(t => t.includes(hy));
  const caseCount = key ? saqCaseCounts[key] : 0;
  console.log(`  ${caseCount === Math.min(...hyLimits) ? '🔴' : '  '} [HY] ${hy}: ${caseCount} cases = ${caseCount} mocks`);
});


console.log(`  ${Math.floor(otherTotal / SAQ_OTHER_COUNT) === maxSAQMocks ? '🔴' : '  '} [Other] ${otherTotal} cases ÷ ${SAQ_OTHER_COUNT} per paper = ${Math.floor(otherTotal / SAQ_OTHER_COUNT)} mocks`);
console.log(`  → SAQ limit: ${maxSAQMocks} mocks\n`);
    const FINAL_COUNT = Math.max(maxSBAMocks, maxSAQMocks);
    console.log(`Generating ${FINAL_COUNT} mocks...`);

    const sbaPool = shuffle(sbaData);
    const saqPool = shuffle(saqData);

    for (let i = 1; i <= FINAL_COUNT; i++) {
      if (i <= maxSBAMocks) await generateSBAMock(sbaPool, i);
      if (i <= maxSAQMocks) await generateSAQMock(saqPool, i);
    }
  } catch (e) { console.error(e); }
}

main();
