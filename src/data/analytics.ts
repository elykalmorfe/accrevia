export const repositoryStats = {
  total: 1248,
  processing: 23,
  chunks: 48302
};

export const evidenceByFramework = [
{ id: 'ia', label: 'Institutional Accreditation', value: 412 },
{ id: 'pa', label: 'Program Accreditation', value: 386 },
{ id: 'copc', label: 'Certificate of Program Compliance (COPC)', value: 178 },
{ id: 'iso', label: 'ISO 9001:2015', value: 168 },
{ id: 'pqa', label: 'Philippine Quality Award (PQA)', value: 104 }];


export const evidenceByArea = [
{ label: 'Faculty', value: 198 },
{ label: 'Curriculum and Instruction', value: 176 },
{ label: 'Governance and Administration', value: 164 },
{ label: 'Research', value: 142 },
{ label: 'Extension / Community Engagement', value: 118 },
{ label: 'Student Services', value: 109 },
{ label: 'Quality Assurance', value: 102 },
{ label: 'Facilities and Physical Resources', value: 96 },
{ label: 'Library and Learning Resources', value: 74 },
{ label: 'Institutional Planning', value: 69 }];


export const evidenceByYear = [
{ label: '2025–2026', value: 364 },
{ label: '2024–2025', value: 318 },
{ label: '2023–2024', value: 236 },
{ label: '2022–2023', value: 188 },
{ label: '2021–2022', value: 142 }];


export const evidenceByCriterion = [
{ criterionId: 'c-ia-2', value: 126 },
{ criterionId: 'c-ia-3', value: 104 },
{ criterionId: 'c-ia-1', value: 92 },
{ criterionId: 'c-ia-4', value: 81 },
{ criterionId: 'c-pa-2', value: 77 },
{ criterionId: 'c-ia-5', value: 66 },
{ criterionId: 'c-iso-9', value: 58 },
{ criterionId: 'c-copc-1', value: 52 }];


export const recentSearchActivity = [
{ query: 'faculty qualification', user: 'Liza M. Cabrera', time: '2026-10-01T08:51:00', results: 14 },
{ query: 'research productivity', user: 'Maria L. Santos', time: '2026-10-01T08:37:00', results: 9 },
{ query: 'student services evidence', user: 'Jun Carlo P. Esteban', time: '2026-09-30T16:12:00', results: 11 },
{ query: 'ISO internal audit', user: 'Ana Marie T. Ochoa', time: '2026-09-30T14:03:00', results: 6 },
{ query: 'Criterion 2.2 faculty development', user: 'Maria L. Santos', time: '2026-09-30T10:26:00', results: 12 }];


export const searchStats = {
  totalSearches: 3482,
  last30Days: 412,
  avgResponseMs: 420,
  zeroResultRate: 3.1,
  clickThroughRate: 78
};

export const topSearchTerms = [
{ label: 'faculty qualification', value: 186 },
{ label: 'faculty development', value: 171 },
{ label: 'research productivity', value: 132 },
{ label: 'ISO internal audit', value: 97 },
{ label: 'student services', value: 88 },
{ label: 'curriculum review', value: 74 },
{ label: 'library holdings', value: 61 }];


export const mostRetrievedDocuments = [
{ docId: 'd-001', value: 142 },
{ docId: 'd-002', value: 128 },
{ docId: 'd-005', value: 96 },
{ docId: 'd-014', value: 81 },
{ docId: 'd-010', value: 74 }];


export const requestedCriteria = [
{ criterionId: 'c-ia-2', value: 238 },
{ criterionId: 'c-ia-4', value: 164 },
{ criterionId: 'c-iso-9', value: 112 },
{ criterionId: 'c-ia-6', value: 91 },
{ criterionId: 'c-copc-1', value: 77 }];


export const retrievalMetrics = [
{ label: 'Precision@10', value: '0.86', hint: 'Share of top-10 results judged relevant' },
{ label: 'Recall@10', value: '0.81', hint: 'Share of relevant documents found in the top 10' },
{ label: 'nDCG@10', value: '0.88', hint: 'Quality of the ranking order' },
{ label: 'MRR', value: '0.91', hint: 'How early the first relevant result appears' },
{ label: 'Avg. response', value: '420 ms', hint: 'End-to-end query time' }];


export const retrievalComparison = [
{ config: 'Lexical only (BM25)', precision: 0.64, recall: 0.58, ndcg: 0.66, mrr: 0.71, latency: 38 },
{ config: 'Semantic only (BGE-M3 + Qdrant)', precision: 0.72, recall: 0.74, ndcg: 0.75, mrr: 0.78, latency: 112 },
{ config: 'Hybrid (BM25 + BGE-M3)', precision: 0.79, recall: 0.8, ndcg: 0.82, mrr: 0.85, latency: 160 },
{ config: 'Hybrid + accreditation-aware scoring', precision: 0.83, recall: 0.81, ndcg: 0.85, mrr: 0.88, latency: 175 },
{ config: 'Hybrid + scoring + cross-encoder reranking', precision: 0.86, recall: 0.81, ndcg: 0.88, mrr: 0.91, latency: 420 }];


export const latencyBreakdown = [
{ label: 'Query encoding', value: 34 },
{ label: 'BM25 lexical retrieval', value: 38 },
{ label: 'Qdrant vector search', value: 74 },
{ label: 'Accreditation-aware scoring', value: 15 },
{ label: 'Cross-encoder reranking', value: 245 },
{ label: 'Result assembly', value: 14 }];


export const notifications = [
{ id: 'n-1', title: 'New uploads await classification', detail: 'Assign framework, area, and criterion to make them searchable.', to: '/evidence/pending', time: '12 min ago' },
{ id: 'n-2', title: 'OCR failed for Old_Faculty_Records_1998.pdf', detail: 'Low recognition confidence. Re-scan or retry with enhanced OCR.', to: '/evidence/processing', time: '54 min ago' },
{ id: 'n-3', title: 'Criterion 6.2 has no indexed evidence', detail: 'Student development and activities needs supporting documents.', to: '/reports?tab=coverage', time: 'Yesterday' }];