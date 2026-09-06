const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'have', 'your', 'into',
  'cua', 'va', 'cho', 'mot', 'nhung', 'nhu', 'voi', 'nay', 'den', 'duoc', 'trong', 'la'
]);

function normalize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function tokenize(value) {
  return normalize(value).split(/[^a-z0-9]+/).filter((token) => token && !STOP_WORDS.has(token));
}

function scoreMemory(memory, query) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0;
  const titleTokens = new Set(tokenize(memory.title));
  const contentTokens = new Set(tokenize(memory.content));
  const tagTokens = new Set((memory.tags || []).flatMap(tokenize));
  let score = 0;
  for (const token of queryTokens) {
    if (titleTokens.has(token)) score += 5;
    if (tagTokens.has(token)) score += 3;
    if (contentTokens.has(token)) score += 1;
  }
  if (memory.pinned) score += 0.25;
  return score;
}

function searchMemories(memories, query) {
  return memories
    .map((memory) => ({ memory, score: scoreMemory(memory, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.memory.updatedAt) - new Date(a.memory.updatedAt));
}

function buildContext(memories, query, limit = 6) {
  return searchMemories(memories, query).slice(0, limit).map(({ memory }) =>
    `### ${memory.title}\n${memory.content}\nTags: ${(memory.tags || []).join(', ')}`
  ).join('\n\n');
}

module.exports = { normalize, tokenize, searchMemories, buildContext };
