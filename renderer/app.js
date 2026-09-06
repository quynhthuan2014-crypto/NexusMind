const state = { memories: [], view: 'home', query: '' };
const $ = (s) => document.querySelector(s);
const content = $('#content');
const dialog = $('#memoryDialog');

function esc(value) { return String(value).replace(/[&<>\"]/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;' }[ch])); }
function formatDate(value) { return new Date(value).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }); }
function tagsHtml(tags=[]) { return tags.map((tag) => `<span class="tag">#${esc(tag)}</span>`).join(''); }
function sorted(memories = state.memories) { return [...memories].sort((a,b) => Number(b.pinned)-Number(a.pinned) || new Date(b.updatedAt)-new Date(a.updatedAt)); }

function memoryCard(m) {
  return `<article class="card memory-card"><span class="pin">${m.pinned ? '◆' : ''}</span><h3>${esc(m.title)}</h3><p>${esc(m.content)}</p><div>${tagsHtml(m.tags)}</div><div class="meta">Updated ${esc(formatDate(m.updatedAt))} · <button class="ghost edit" data-id="${esc(m.id)}">Edit</button> <button class="ghost remove" data-id="${esc(m.id)}">Delete</button></div></article>`;
}

function renderHome() {
  const pinned = state.memories.filter((m) => m.pinned).length;
  const recent = sorted().slice(0,3);
  content.innerHTML = `<div class="hero"><div class="hero-card"><span class="eyebrow">LOCAL-FIRST MEMORY</span><h2>Remember what matters. Find it when you need it.</h2><p>NexusMind turns notes, ideas, decisions and project context into a searchable personal memory. Your data stays local by default.</p><div class="searchbar"><input id="homeSearch" placeholder="Search your memories..."/><button class="primary" id="searchHome">Search</button></div></div><div class="card metric"><span>Total memories</span><strong>${state.memories.length}</strong><span>${pinned} pinned · ${state.memories.length ? 'knowledge base growing' : 'start with your first memory'}</span></div></div><div class="section-title"><h3>Recent memories</h3><button class="ghost" data-view="memories">View all</button></div><div class="grid">${recent.length ? recent.map(memoryCard).join('') : '<div class="empty">No memories yet. Capture your first thought.</div>'}</div>`;
  $('#searchHome')?.addEventListener('click', () => { state.query = $('#homeSearch').value; state.view = 'search'; render(); });
  $('#homeSearch')?.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ state.query = e.target.value; state.view='search'; render(); } });
}

function renderMemories() {
  const items = sorted();
  content.innerHTML = `<div class="section-title"><div><h3>All memories</h3><span style="color:var(--muted);font-size:12px">${items.length} records stored locally</span></div><button class="primary" id="newInline">+ New memory</button></div><div class="grid">${items.length ? items.map(memoryCard).join('') : '<div class="empty">Your memory library is empty.</div>'}</div>`;
  $('#newInline')?.addEventListener('click', openNew);
}

function renderSearch() {
  const q = state.query.trim();
  let results = state.memories;
  if(q){ const { searchMemories } = window.NexusSearch; results = searchMemories(results, q).map((x)=>x.memory); }
  content.innerHTML = `<div class="card" style="padding:18px"><div class="searchbar" style="margin:0"><input id="globalSearch" value="${esc(q)}" placeholder="Search title, content and tags..."/><button class="primary" id="doSearch">Search</button></div></div><div class="section-title"><h3>${q ? `Results for “${esc(q)}”` : 'Discover your memory'}</h3><span style="color:var(--muted);font-size:12px">${results.length} matches</span></div>${q && !results.length ? '<div class="empty">No matching memory found.</div>' : results.map((m)=>`<article class="card result"><span class="score">${m.pinned ? 'PINNED' : ''}</span><h3>${esc(m.title)}</h3><p style="color:#aeb8cb;line-height:1.55">${esc(m.content)}</p><div>${tagsHtml(m.tags)}</div></article>`).join('')}`;
  $('#doSearch')?.addEventListener('click', () => { state.query=$('#globalSearch').value; render(); });
  $('#globalSearch')?.addEventListener('keydown', (e)=>{if(e.key==='Enter'){state.query=e.target.value;render();}});
}

function renderChat() {
  const context = state.query ? state.memories.filter((m)=> (m.title+' '+m.content+' '+(m.tags||[]).join(' ')).toLowerCase().includes(state.query.toLowerCase())).slice(0,3) : [];
  content.innerHTML = `<div class="chat"><div class="messages" id="messages"><div class="bubble ai">Ask Nexus anything about your saved memories. I can retrieve relevant context locally and help you reason over it.</div>${context.length ? `<div class="bubble ai"><strong>Relevant context</strong><br>${context.map((m)=>`• ${esc(m.title)}`).join('<br>')}</div>` : ''}</div><div class="chat-input"><input id="chatInput" placeholder="Ask about your memories..."/><button class="primary" id="askBtn">Ask</button></div></div>`;
  const ask = ()=>{const q=$('#chatInput').value.trim(); if(!q)return; state.query=q; const hit=state.memories.filter((m)=>`${m.title} ${m.content} ${(m.tags||[]).join(' ')}`.toLowerCase().includes(q.toLowerCase())).slice(0,4); $('#messages').insertAdjacentHTML('beforeend', `<div class="bubble user">${esc(q)}</div><div class="bubble ai">${hit.length ? `I found ${hit.length} relevant memory(ies):<br>${hit.map((m)=>`• <strong>${esc(m.title)}</strong> — ${esc(m.content.slice(0,220))}`).join('<br>')}` : 'I couldn’t find an exact match in your local memories. Try a broader keyword or add more context.'}</div>`); $('#chatInput').value='';};
  $('#askBtn').addEventListener('click', ask); $('#chatInput').addEventListener('keydown',(e)=>{if(e.key==='Enter')ask();});
}

async function renderSettings() {
  const info = await window.nexus.system.info();
  content.innerHTML = `<div class="settings-grid"><article class="card setting"><h3>Storage</h3><p>Memories are stored in the application data folder on this computer. Import/export uses JSON.</p><button id="clearAll" class="ghost">Clear all memories</button></article><article class="card setting"><h3>Runtime</h3><p>Platform: ${esc(info.platform)} · ${esc(info.arch)}<br>OS: ${esc(info.release)}<br>App: NexusMind ${esc(info.appVersion)}</p></article><article class="card setting"><h3>AI provider</h3><p>The core memory system works without an external model. An AI provider can be connected later without changing the local memory format.</p><input placeholder="Provider endpoint (optional)" disabled /></article><article class="card setting"><h3>Privacy</h3><p>No API key is bundled. No automatic web upload is performed for memory search. External links are opened only through an explicit user action.</p></article></div>`;
  $('#clearAll').addEventListener('click', async ()=>{ if(confirm('Delete every local memory? This cannot be undone.')) { await window.nexus.memories.clear(); await load(); }});
}

async function render(){
  document.querySelectorAll('.nav').forEach((b)=>b.classList.toggle('active',b.dataset.view===state.view));
  const titles={home:'Your second brain',memories:'Memory library',search:'Find anything',chat:'Ask Nexus',settings:'Settings'}; $('#pageTitle').textContent=titles[state.view];
  if(state.view==='home') renderHome(); else if(state.view==='memories') renderMemories(); else if(state.view==='search') renderSearch(); else if(state.view==='chat') renderChat(); else await renderSettings();
  bindCardActions();
}
function bindCardActions(){document.querySelectorAll('.edit').forEach((b)=>b.addEventListener('click',()=>openEdit(b.dataset.id)));document.querySelectorAll('.remove').forEach((b)=>b.addEventListener('click',async()=>{if(confirm('Delete this memory?')){await window.nexus.memories.remove(b.dataset.id);await load();}}));document.querySelectorAll('[data-view]').forEach((b)=>b.addEventListener('click',()=>{state.view=b.dataset.view;render();}));}
function openNew(){ $('#dialogTitle').textContent='Capture a memory'; $('#memoryId').value=''; $('#memoryTitle').value=''; $('#memoryContent').value=''; $('#memoryTags').value=''; $('#memoryPinned').checked=false; dialog.showModal(); }
function openEdit(id){const m=state.memories.find((x)=>x.id===id);if(!m)return;$('#dialogTitle').textContent='Edit memory';$('#memoryId').value=m.id;$('#memoryTitle').value=m.title;$('#memoryContent').value=m.content;$('#memoryTags').value=(m.tags||[]).join(', ');$('#memoryPinned').checked=m.pinned;dialog.showModal();}
async function load(){state.memories=await window.nexus.memories.list();$('#memoryCount').textContent=state.memories.length;await render();}
$('#newBtn').addEventListener('click',openNew); $('#importBtn').addEventListener('click',async()=>{const r=await window.nexus.memories.import();if(r.ok){alert(`Imported ${r.count} memories.`);await load();}}); $('#exportBtn').addEventListener('click',async()=>{await window.nexus.memories.export(state.memories);});
$('#memoryForm').addEventListener('submit',async(e)=>{e.preventDefault();const tags=$('#memoryTags').value.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).slice(0,12);await window.nexus.memories.save({id:$('#memoryId').value||undefined,title:$('#memoryTitle').value,content:$('#memoryContent').value,tags,pinned:$('#memoryPinned').checked,createdAt: state.memories.find((x)=>x.id===$('#memoryId').value)?.createdAt});dialog.close();await load();});
window.NexusSearch = {};
(async()=>{const source = await fetch('../shared/memory.cjs').then((r)=>r.text()).catch(()=>null); if(source){ /* Electron file loading keeps search implementation mirrored in renderer below. */ }})();
window.NexusSearch.searchMemories=(memories,q)=>{const norm=(v)=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const tokens=norm(q).split(/[^a-z0-9]+/).filter(Boolean);return memories.map((memory)=>{const hay=norm([memory.title,memory.content,(memory.tags||[]).join(' ')].join(' '));let score=0;for(const t of tokens)if(hay.includes(t))score+=1;if(memory.pinned)score+=.25;return{memory,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score)};
load();
