const test = require('node:test');
const assert = require('node:assert/strict');
const { searchMemories, buildContext, tokenize } = require('../shared/memory.cjs');

const memories = [
  { id:'1', title:'Minecraft project', content:'Build a realistic voxel world with three dimensions.', tags:['game','3d'], pinned:false, updatedAt:'2026-09-01T00:00:00Z' },
  { id:'2', title:'NexusVoice', content:'Desktop voice assistant with safe commands and speech recognition.', tags:['ai','voice'], pinned:true, updatedAt:'2026-09-02T00:00:00Z' },
  { id:'3', title:'School ideas', content:'Organize study notes and homework goals.', tags:['school'], pinned:false, updatedAt:'2026-09-03T00:00:00Z' }
];

test('tokenize removes accents and common Vietnamese stop words', () => {
  assert.deepEqual(tokenize('Học tập và Minecraft'), ['hoc','tap','minecraft']);
});

test('search ranks title hits above content-only hits', () => {
  const result = searchMemories(memories, 'NexusVoice');
  assert.equal(result[0].memory.id, '2');
  assert.ok(result[0].score > 1);
});

test('search supports tags', () => {
  const result = searchMemories(memories, 'school');
  assert.equal(result[0].memory.id, '3');
});

test('buildContext returns readable context blocks', () => {
  const context = buildContext(memories, 'voxel', 1);
  assert.match(context, /Minecraft project/);
  assert.match(context, /three dimensions/);
});

test('empty query returns no context', () => {
  assert.equal(buildContext(memories, '', 3), '');
});
