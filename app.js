import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

const h = React.createElement;
// Backend API base. Same-origin by default; window.__API_BASE__ (config.js) points
// at the deployed backend URL when the admin is hosted as its own service.
const API = ((typeof window !== 'undefined' && window.__API_BASE__) || '') + '/api/v1';

async function api(path, options = {}) {
  const response = await fetch(API + path, {
    credentials: 'include',
    headers: {'Content-Type': 'application/json', ...(options.headers || {})},
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `Request failed (${response.status})`);
  return data;
}

function formatNumber(value) { return new Intl.NumberFormat().format(Number(value || 0)); }
function formatBytes(value) {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDate(value) {
  if (!value) return '—';
  return new Date(Number(value) * 1000).toLocaleString([], {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});
}
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}
function safeMarkdownUrl(value) {
  try {
    const parsed = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch { return null; }
}
function markdownPreview(markdown = '') {
  let html = escapeHtml(markdown)
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, url) => {
      const href = safeMarkdownUrl(url);
      return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${label}</a>` : label;
    })
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>');
  return `<p>${html}</p>`;
}

function Icon({name}) {
  const paths = {
    grid:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    pen:'M4 20l4.2-1 9.9-9.9a2 2 0 0 0-2.8-2.8l-9.9 9.9L4 20zM14.8 7.2l2 2',
    users:'M16 20v-1.8a3.2 3.2 0 0 0-3.2-3.2H7.2A3.2 3.2 0 0 0 4 18.2V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM16 4.5a3.5 3.5 0 0 1 0 6.8M20 20v-1.8a3.2 3.2 0 0 0-2.4-3.1',
    globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.2 2.4 3.4 5.4 3.4 9s-1.2 6.6-3.4 9c-2.2-2.4-3.4-5.4-3.4-9S9.8 5.4 12 3z',
    shield:'M12 3l7 3v5c0 4.5-3 7.8-7 10-4-2.2-7-5.5-7-10V6l7-3zM9 12l2 2 4-4',
    chart:'M4 19V5M4 19h17M8 16v-3M12 16V8M16 16v-6M20 16v-9',
    settings:'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.7 1.7-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.7v.1h-2.4V20a1.8 1.8 0 0 0-1.1-1.7 1.8 1.8 0 0 0-2 .4l-.1.1-1.7-1.7.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 6.6 14h-.1v-2.4h.1a1.8 1.8 0 0 0 1.7-1.1 1.8 1.8 0 0 0-.4-2l-.1-.1 1.7-1.7.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 12.7 5v-.1h2.4V5a1.8 1.8 0 0 0 1.1 1.7 1.8 1.8 0 0 0 2-.4l.1-.1L20 7.9l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.7 1.1h.1v2.4h-.1a1.8 1.8 0 0 0-1.8 1.5z',
    refresh:'M20 11a8 8 0 1 0 1 5M20 5v6h-6',
    clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  };
  return h('svg', {viewBox:'0 0 24 24', className:'icon', fill:'none', stroke:'currentColor', strokeWidth:'1.7', strokeLinecap:'round', strokeLinejoin:'round'}, h('path', {d: paths[name] || paths.grid}));
}

const nav = [
  ['overview','Overview','grid','owner,support,editor,security'],
  ['posts','Blog posts','pen','owner,editor'],
  ['regions','Relay cells','globe','owner,security'],
  ['sessions','Sessions','users','owner,support,security'],
  ['abuse','Abuse desk','shield','owner,support,security'],
  ['usage','Usage','chart','owner,support,security'],
  ['settings','Settings','settings','owner'],
];

function routeState(pathname = window.location.pathname) {
  const path = pathname.replace(/^\/admin\/?/, '').replace(/\/$/, '');
  if (!path) return {active: 'overview'};
  if (path === 'posts' || path === 'posts/new') return {active: 'posts', editor: path === 'posts/new' ? 'new' : null};
  const editMatch = path.match(/^posts\/([^/]+)\/edit$/);
  if (editMatch) return {active: 'posts', editor: decodeURIComponent(editMatch[1])};
  const known = nav.map(item => item[0]);
  return {active: known.includes(path) ? path : 'overview'};
}

function navigate(path) {
  const destination = path.startsWith('/admin') ? path : `/admin/${path}`;
  if (window.location.pathname !== destination) window.history.pushState({}, '', destination);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function Login({onLogin}) {
  const [email,setEmail] = useState('owner@relaynorth.local');
  const [password,setPassword] = useState('change-me-now');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { onLogin(await api('/admin/auth/login', {method:'POST', body:JSON.stringify({email,password})})); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return h('main',{className:'login-page'},h('section',{className:'login-card'},
    h('div',{className:'admin-brand'},h('span',{className:'admin-mark'},'↗'),h('span',null,'RelayNorth / Control Room')),
    h('span',{className:'eyebrow'},'private operations'), h('h1',null,'Keep the relay clear.'),
    h('p',{className:'muted'},'Manage field notes, monitor cells, and keep a clean line between the public experience and the infrastructure beneath it.'),
    h('form',{onSubmit:submit,className:'login-form'},
      h('label',null,'Email',h('input',{type:'email',value:email,onChange:e=>setEmail(e.target.value),required:true,autoComplete:'username'})),
      h('label',null,'Password',h('input',{type:'password',value:password,onChange:e=>setPassword(e.target.value),required:true,autoComplete:'current-password'})),
      error && h('div',{className:'alert danger',role:'alert'},error), h('button',{className:'button primary wide',disabled:busy},busy?'Signing in…':'Enter control room')),
    h('p',{className:'login-note'},'Development credentials are prefilled. Change them before deployment.'),
  ));
}

function Layout({active,setActive,user,onLogout,children}) {
  const canSee = roleList => roleList.split(',').includes(user.role);
  return h('div',{className:'app-shell'},
    h('aside',{className:'sidebar'},
      h('div',{className:'admin-brand'},h('span',{className:'admin-mark'},'↗'),h('span',null,'RelayNorth')),
      h('div',{className:'side-label'},'Control room'),
      h('nav',{className:'side-nav', 'aria-label':'Admin navigation'},nav.map(([id,label,icon,roles])=>h('button',{key:id,className:active===id?'active':'',disabled:!canSee(roles),title:canSee(roles)?label:`${label} is unavailable for ${user.role}`,onClick:()=>{if(canSee(roles)){setActive(id);navigate(id);}}},h(Icon,{name:icon}),h('span',null,label)))),
      h('div',{className:'side-bottom'},
        h('div',{className:'cell-summary'},h('span',{className:'pulse'}),h('div',null,h('strong',null,'3 cells online'),h('small',null,'Live control plane'))),
        h('button',{className:'user-chip',onClick:onLogout,title:'Sign out'},h('span',{className:'avatar'},'RN'),h('span',null,h('strong',null,user.email.split('@')[0]),h('small',null,user.role),'↪')),
      ),
    ),
    h('main',{className:'main'},h('header',{className:'main-header'},
      h('div',null,h('span',{className:'eyebrow'},'Operations / '+(nav.find(x=>x[0]===active)?.[1] || 'Overview')),h('h2',null,active==='overview'?'Good morning, operator.':nav.find(x=>x[0]===active)?.[1])),
      h('a',{className:'view-public',href:'/',target:'_blank',rel:'noreferrer'},'View public site ↗'),
    ), children),
  );
}

function StatCard({label,value,detail,accent}) { return h('article',{className:'stat-card'},h('span',{className:'stat-label'},label),h('strong',{className:'stat-value '+(accent||'')},value),h('span',{className:'stat-detail'},detail)); }

function Overview({usage,regions,posts,abuse,audit}) {
  const bars=[48,62,41,75,59,84,66,72,51,87,70,92];
  const trafficBars = bars.map((bar,i) => h('div',{className:'bar-wrap',key:i},h('div',{className:'bar',style:{height:bar+'%'}})));
  const healthRows = regions.map(region => h('div',{className:'health-row',key:region.cell_id},
    h('span',{className:'health-icon'},h(Icon,{name:'globe'})),
    h('div',null,h('strong',null,region.display_name),h('small',null,`${region.capacity}% capacity`)),
    h('span',{className:'status-pill '+region.health_state},region.health_state),
  ));
  const activity = audit.length ? audit.slice(0,4) : posts.slice(0,4).map(post => ({action:'post.update',target:post.slug,actor:post.author,at:post.updated_at}));
  const activityRows = activity.map((item,index) => h('div',{className:'recent-item',key:item.id||item.target||index},
    h('span',{className:'recent-dot'}),
    h('div',null,h('strong',null,item.action),h('small',null,`${item.target} · ${formatDate(item.at)}`)),
  ));
  return h('div',{className:'page-content'},
    h('section',{className:'welcome-banner'},
      h('div',null,h('span',{className:'eyebrow'},'today at a glance'),h('h3',null,'A steady line across every cell.'),h('p',null,'Keep an eye on the public relay, the editorial queue, and the boundaries that make both useful.')),
      h('div',{className:'banner-stamp'},h('span',null,'RN'),h('small',null,'v0.1 / dev')),
    ),
    h('div',{className:'stats-grid'},
      h(StatCard,{label:'Active sessions',value:formatNumber(usage.active_sessions),detail:'across relay cells',accent:'blue'}),
      h(StatCard,{label:'Requests today',value:formatNumber(usage.requests),detail:`${formatBytes(usage.bytes_out)} delivered`,accent:'coral'}),
      h(StatCard,{label:'Published notes',value:posts.filter(p=>p.status==='published').length,detail:`${posts.length} total in CMS`,accent:'green'}),
      h(StatCard,{label:'Blocked requests',value:formatNumber(usage.blocked),detail:abuse.length ? `${abuse.length} abuse reports open` : 'No reports filed',accent:'ink'}),
    ),
    h('div',{className:'dashboard-grid'},
      h('article',{className:'panel chart-panel'},
        h('div',{className:'panel-head'},h('div',null,h('span',{className:'eyebrow'},'traffic / 24 hours'),h('h3',null,'Requests through the relay')),h('span',{className:'panel-value'},'live sample')),
        h('div',{className:'chart'},trafficBars),
        h('div',{className:'chart-axis'},h('span',null,'00:00'),h('span',null,'12:00'),h('span',null,'now')),
      ),
      h('article',{className:'panel'},
        h('div',{className:'panel-head'},h('div',null,h('span',{className:'eyebrow'},'cell health'),h('h3',null,'Relay cells')),h('button',{className:'panel-link',onClick:()=>navigate('regions')},'View all ↗')),
        h('div',{className:'health-list'},healthRows),
      ),
      h('article',{className:'panel recent-panel'},
        h('div',{className:'panel-head'},h('div',null,h('span',{className:'eyebrow'},'activity'),h('h3',null,'Recent control events')),h('button',{className:'panel-link',onClick:()=>navigate('abuse')},'Safety desk ↗')),
        h('div',{className:'recent-list'},activityRows),
      ),
    ),
  );
}

const emptyPost = () => ({title:'',slug:'',excerpt:'',body_markdown:'',category:'Guides',tags:[],seo_title:'',seo_description:'',status:'draft'});

function Revisions({revisions,onUse}) {
  const rows = revisions.slice().reverse().map(revision => h('div',{className:'revision-row',key:revision.revision_id},
    h('div',null,
      h('strong',null,revision.revision_id),
      h('small',null,`${revision.author} · ${formatDate(revision.created_at)}`),
      h('p',null,revision.body_markdown.split('\n')[0].slice(0,100)),
    ),
    h('button',{className:'button small ghost',onClick:()=>onUse(revision)},'Use text'),
  ));
  return h('div',{className:'revision-panel'},
    h('div',{className:'panel-head'},h('div',null,h('span',{className:'eyebrow'},'revision history'),h('h3',null,revisions.length ? `${revisions.length} saved versions` : 'No saved versions yet'))),
    revisions.length ? h('div',{className:'revision-list'},rows) : h('p',{className:'muted'},'Save a revision to make rollback-friendly copies available.'),
  );
}

function Posts({posts,onRefresh,user}) {
  const route = routeState();
  const [editing,setEditing] = useState(route.editor || null);
  const [form,setForm] = useState(() => route.editor && route.editor !== 'new' ? (posts.find(post=>post.slug===route.editor) || emptyPost()) : emptyPost());
  const [revisions,setRevisions] = useState([]);
  const [notice,setNotice] = useState(null);
  const [saving,setSaving] = useState(false);
  const [filter,setFilter] = useState('all');
  const canPublish = user.role === 'owner' || user.role === 'editor';
  const visiblePosts = useMemo(() => filter === 'all' ? posts : posts.filter(post=>post.status===filter), [posts,filter]);

  useEffect(() => {
    if (!editing || editing === 'new') { setRevisions([]); return; }
    const post = posts.find(item=>item.slug===editing);
    if (post) setForm({...post, tags:post.tags || []});
    api(`/admin/posts/${encodeURIComponent(editing)}/revisions`).then(setRevisions).catch(error=>setNotice({type:'danger',text:error.message}));
  }, [editing,posts]);

  function updateField(field,value) { setForm(previous=>({...previous,[field]:value})); setNotice(null); }
  function open(post) {
    const slug = post?.slug || 'new'; setEditing(slug); setForm(post ? {...post,tags:post.tags || []} : emptyPost()); setNotice(null); navigate(slug === 'new' ? 'posts/new' : `posts/${encodeURIComponent(slug)}/edit`);
  }
  function closeEditor() { setEditing(null); setRevisions([]); navigate('posts'); }
  async function save(event) {
    event.preventDefault(); setSaving(true); setNotice(null);
    try {
      const saved = editing === 'new' ? await api('/admin/posts',{method:'POST',body:JSON.stringify(form)}) : await api(`/admin/posts/${encodeURIComponent(editing)}`,{method:'PATCH',body:JSON.stringify(form)});
      await onRefresh(); setEditing(saved.slug); setForm({...saved,tags:saved.tags || []}); setNotice({text:'Saved. A new revision is available in the history panel.'}); navigate(`posts/${encodeURIComponent(saved.slug)}/edit`);
      setRevisions(await api(`/admin/posts/${encodeURIComponent(saved.slug)}/revisions`));
    } catch(error) { setNotice({type:'danger',text:error.message}); }
    finally { setSaving(false); }
  }
  async function publish(slug) { setSaving(true); setNotice(null); try { await api(`/admin/posts/${encodeURIComponent(slug)}/publish`,{method:'POST'}); await onRefresh(); setNotice({text:'Published. The public article is live now.'}); } catch(error) { setNotice({type:'danger',text:error.message}); } finally { setSaving(false); } }
  async function archive(slug) { if (!window.confirm('Archive this article? It will disappear from the public blog.')) return; setSaving(true); setNotice(null); try { await api(`/admin/posts/${encodeURIComponent(slug)}/archive`,{method:'POST'}); await onRefresh(); setForm(previous=>({...previous,status:'archived'})); setNotice({text:'Archived. The article remains available in revision history.'}); } catch(error) { setNotice({type:'danger',text:error.message}); } finally { setSaving(false); } }

  if (editing) return h('section',{className:'editor-layout'},
    h('form',{className:'panel editor-form',onSubmit:save},
      h('div',{className:'editor-top'},h('button',{type:'button',className:'back-button',onClick:closeEditor},'← All posts'),h('span',{className:'status-pill '+(form.status || 'draft')},editing==='new'?'new draft':form.status)),
      h('label',null,'Title',h('input',{value:form.title,onChange:e=>updateField('title',e.target.value),placeholder:'A useful, human title',required:true})),
      h('div',{className:'two-col'},h('label',null,'Slug',h('input',{value:form.slug,onChange:e=>updateField('slug',e.target.value),placeholder:'clear-little-slug',required:true})),h('label',null,'Category',h('select',{value:form.category,onChange:e=>updateField('category',e.target.value)},['Guides','Privacy','Comparisons','Security','Product updates'].map(x=>h('option',{key:x},x))))),
      h('label',null,'Excerpt',h('textarea',{rows:3,value:form.excerpt,onChange:e=>updateField('excerpt',e.target.value),placeholder:'A short description for the index and search results.'})),
      h('label',null,'Markdown body',h('textarea',{className:'markdown-input',rows:15,value:form.body_markdown,onChange:e=>updateField('body_markdown',e.target.value),placeholder:'# Start writing\n\nA clear paragraph…'})),
      h('div',{className:'two-col'},h('label',null,'SEO title',h('input',{value:form.seo_title || '',onChange:e=>updateField('seo_title',e.target.value),placeholder:'Optional search title'})),h('label',null,'Tags',h('input',{value:(form.tags || []).join(', '),onChange:e=>updateField('tags',e.target.value.split(',').map(tag=>tag.trim()).filter(Boolean)),placeholder:'privacy, guide'}))),
      h('div',{className:'two-col'},h('label',null,'Workflow status',h('select',{value:form.status || 'draft',onChange:e=>updateField('status',e.target.value)},['draft','scheduled','published','archived'].map(x=>h('option',{key:x},x)))),h('label',null,'SEO description',h('input',{value:form.seo_description || '',onChange:e=>updateField('seo_description',e.target.value),placeholder:'Optional search description'}))),
      h('div',{className:'editor-actions'},h('button',{type:'button',className:'button ghost',onClick:closeEditor},'Cancel'),canPublish && form.status !== 'published' && editing !== 'new' && h('button',{type:'button',className:'button coral',disabled:saving,onClick:()=>publish(form.slug)},'Publish'),canPublish && form.status === 'published' && editing !== 'new' && h('button',{type:'button',className:'button ghost',disabled:saving,onClick:()=>archive(form.slug)},'Archive'),h('button',{className:'button primary',disabled:saving},saving?'Saving…':'Save revision')),notice&&h('div',{className:'alert '+(notice.type || ''),role:notice.type==='danger'?'alert':'status'},notice.text)),
    h('aside',{className:'editor-side'},h('div',{className:'panel preview-panel'},h('div',{className:'preview-heading'},h('span',{className:'eyebrow'},'live preview'),h('span',{className:'preview-mode'},'sanitized')),h('div',{className:'preview-paper',dangerouslySetInnerHTML:{__html:markdownPreview(form.body_markdown)}})),editing !== 'new' && h('div',{className:'panel'},h(Revisions,{revisions,onUse:revision=>{updateField('body_markdown',revision.body_markdown);setNotice({text:`Loaded ${revision.revision_id}. Save revision to keep it.`});}})),
    ),
  );

  return h('section',{className:'page-content'},
    h('div',{className:'toolbar'},h('div',null,h('span',{className:'muted'},`${posts.length} articles in the library`)),h('div',{className:'toolbar-actions'},h('select',{className:'filter-select',value:filter,onChange:e=>setFilter(e.target.value),'aria-label':'Filter posts'},['all','draft','scheduled','published','archived'].map(value=>h('option',{key:value},value === 'all' ? 'All statuses' : value))),h('button',{className:'button primary',onClick:()=>open()},'+ New field note'))),
    h('div',{className:'post-table panel'},h('div',{className:'table-head'},h('span',null,'Article'),h('span',null,'Status'),h('span',null,'Updated'),h('span',null,'')),visiblePosts.length ? visiblePosts.map(post=>h('div',{className:'table-row',key:post.slug},h('div',{className:'post-title'},h('span',{className:'post-glyph'},'✦'),h('div',null,h('strong',null,post.title),h('small',null,`${post.category} · /blog/${post.slug}`))),h('span',{className:'status-pill '+post.status},post.status),h('span',{className:'muted'},formatDate(post.updated_at)),h('div',{className:'row-actions'},h('button',{onClick:()=>open(post)},'Edit'),post.status!=='published'&&canPublish&&h('button',{onClick:()=>publish(post.slug),disabled:saving},'Publish'),post.status==='published'&&canPublish&&h('button',{onClick:()=>archive(post.slug),disabled:saving},'Archive')))) : h('div',{className:'table-empty'},h('strong',null,'No articles in this view.'),h('span',{className:'muted'},'Try another status or create a field note.'))),
  );
}

function Regions({regions,onRefresh,user}) {
  const [notice,setNotice]=useState(null); const canOperate=user.role==='owner'||user.role==='security';
  async function setState(cell_id,state) { if (state === 'unavailable' && !window.confirm(`Pause ${cell_id.toUpperCase()} for new and existing traffic?`)) return; try { await api(`/admin/regions/${cell_id}/state?state=${state}`,{method:'PATCH'}); setNotice({text:`${cell_id.toUpperCase()} is now ${state}.`}); await onRefresh(); } catch(error) { setNotice({type:'danger',text:error.message}); } }
  const cards = regions.map(region => h('article',{className:'panel region-card',key:region.cell_id},
    h('div',{className:'region-top'},h('div',{className:'region-icon'},h(Icon,{name:'globe'})),h('span',{className:'status-pill '+region.health_state},region.health_state)),
    h('span',{className:'eyebrow'},region.cell_id.toUpperCase()),
    h('h3',null,region.display_name),
    h('p',{className:'muted'},`Policy v${region.policy_version} · ${region.country} · ${region.capacity}% capacity`),
    region.drain_deadline && h('p',{className:'drain-note'},h(Icon,{name:'clock'}),`Drain deadline ${formatDate(region.drain_deadline)}`),
    h('div',{className:'capacity-line'},h('span',null,'capacity'),h('span',null,region.capacity+'%'),h('div',{className:'capacity-track'},h('i',{style:{width:region.capacity+'%'}}))),
    h('div',{className:'region-actions'},
      canOperate && region.health_state!=='draining' && h('button',{className:'button small ghost',onClick:()=>setState(region.cell_id,'draining')},'Drain'),
      canOperate && region.health_state!=='unavailable' && h('button',{className:'button small danger-button',onClick:()=>setState(region.cell_id,'unavailable')},'Pause'),
      canOperate && region.health_state!=='ready' && h('button',{className:'button small primary',onClick:()=>setState(region.cell_id,'ready')},'Mark ready'),
    ),
  ));
  return h('section',{className:'page-content'},
    h('div',{className:'toolbar'},h('div',null,h('span',{className:'muted'},'New sessions use ready cells. Existing sessions stay pinned.')),h('div',{className:'toolbar-actions'},notice&&h('span',{className:'notice '+(notice.type || '')},notice.text),h('button',{className:'button ghost',onClick:onRefresh},h(Icon,{name:'refresh'}),'Refresh'))),
    h('div',{className:'region-grid'},cards),
  );
}

function Abuse({reports,onRefresh,error}) {
  const cards = reports.map(report => h('article',{className:'panel abuse-card',key:report.report_id},
    h('div',{className:'abuse-top'},h('div',null,h('span',{className:'eyebrow'},report.report_id),h('h3',null,report.category)),h('span',{className:'status-pill '+report.status},report.status)),
    h('p',null,report.description),
    h('small',{className:'muted'},`Received ${formatDate(report.created_at)}`),
    h('div',{className:'abuse-actions'},h('button',{className:'button small ghost',disabled:true,title:'The status mutation endpoint is not enabled in this backend build.'},'Queue review'),h('span',{className:'muted'},'Read-only workflow')),
  ));
  const empty = h('div',{className:'empty-state operational-empty'},h('span',{className:'eyebrow'},'safety / clear'),h('h3',null,'The abuse desk is quiet.'),h('p',{className:'muted'},'New reports will appear here with their category, status, and received time. Refresh after filing a report.'));
  return h('section',{className:'page-content'},
    h('div',{className:'toolbar'},h('div',null,h('span',{className:'muted'},'Review reports without exposing secrets or request bodies.')),h('button',{className:'button ghost',onClick:onRefresh},h(Icon,{name:'refresh'}),'Refresh')),
    error && h('div',{className:'alert danger',role:'alert'},error),
    reports.length ? h('div',{className:'abuse-list'},cards) : empty,
  );
}

function Usage({usage,regions}) {
  const requestBudget = 10000; const percent = Math.min(100, Math.round((Number(usage.requests || 0) / requestBudget) * 100));
  const regionRows = regions.map(region => h('div',{className:'region-usage',key:region.cell_id},
    h('div',null,h('strong',null,region.display_name),h('span',{className:'status-pill '+region.state},region.state)),
    h('div',{className:'budget-track'},h('i',{style:{width:region.capacity+'%'}})),
    h('small',{className:'muted'},`${region.capacity}% capacity ceiling`),
  ));
  return h('section',{className:'page-content'},
    h('div',{className:'usage-hero panel'},h('div',null,h('span',{className:'eyebrow'},'traffic / cost guardrail'),h('h3',null,'A bounded relay is a dependable relay.'),h('p',{className:'muted'},'Usage telemetry is live in this build. Billing and hard spend enforcement should attach to the same counters before production.')),h('span',{className:'status-pill ready'},'telemetry online')),
    h('div',{className:'usage-grid'},h(StatCard,{label:'Requests',value:formatNumber(usage.requests),detail:`${percent}% of 10k dev budget`,accent:'blue'}),h(StatCard,{label:'Bytes out',value:formatBytes(usage.bytes_out),detail:'response payloads',accent:'coral'}),h(StatCard,{label:'Blocked',value:formatNumber(usage.blocked),detail:'policy or limit rejects',accent:'ink'}),h(StatCard,{label:'Active now',value:formatNumber(usage.active_sessions),detail:'expiring sessions',accent:'green'})),
    h('div',{className:'panel budget-panel'},h('div',{className:'panel-head'},h('div',null,h('span',{className:'eyebrow'},'development ceiling'),h('h3',null,'Request budget')),h('span',{className:'panel-value'},`${percent}% used`)),h('div',{className:'budget-track'},h('i',{style:{width:`${Math.max(2,percent)}%`}})),h('div',{className:'budget-labels'},h('span',null,'0'),h('span',null,'10,000 requests'))),
    h('div',{className:'region-usage-grid'},regionRows),
  );
}

function Sessions() { return h('section',{className:'page-content'},h('div',{className:'empty-state operational-empty'},h('span',{className:'eyebrow'},'sessions / privacy'),h('h3',null,'Session drill-down is intentionally quiet.'),h('p',{className:'muted'},'The public control plane exposes aggregate usage here. A dedicated session list should be connected only after retention, access logging, and redaction rules are finalized.'))); }
function Settings({user}) { return h('section',{className:'page-content'},h('div',{className:'settings-grid'},h('article',{className:'panel settings-card'},h('span',{className:'eyebrow'},'operator identity'),h('h3',null,user.email),h('p',{className:'muted'},`Role: ${user.role}. Access is limited by the role matrix in the control room.`)),h('article',{className:'panel settings-card'},h('span',{className:'eyebrow'},'session policy'),h('h3',null,'15 minute sessions'),h('p',{className:'muted'},'Signed tokens, client binding, approved origins, and rate limits are active in the current vertical slice.')),h('article',{className:'panel settings-card'},h('span',{className:'eyebrow'},'deployment note'),h('h3',null,'Persistence handoff pending'),h('p',{className:'muted'},'PostgreSQL and Redis wiring belongs to the next infrastructure milestone. This UI stays explicit about the in-memory development boundary.')))); }

function App() {
  const [user,setUser]=useState(null); const [authReady,setAuthReady]=useState(false); const [route,setRoute]=useState(routeState());
  const [posts,setPosts]=useState([]); const [regions,setRegions]=useState([]); const [abuse,setAbuse]=useState([]); const [audit,setAudit]=useState([]); const [usage,setUsage]=useState({active_sessions:0,requests:0,bytes_out:0,blocked:0}); const [loading,setLoading]=useState(false); const [dataError,setDataError]=useState('');
  useEffect(()=>{ const onPop=()=>setRoute(routeState()); window.addEventListener('popstate',onPop); return()=>window.removeEventListener('popstate',onPop); },[]);
  useEffect(()=>{ api('/admin/me').then(setUser).catch(()=>{}).finally(()=>setAuthReady(true)); },[]);
  async function refresh() {
    if (!user) return; setLoading(true); setDataError('');
    const results = await Promise.allSettled([api('/admin/posts'),api('/admin/regions'),api('/admin/usage'),api('/admin/abuse-reports'),api('/admin/audit-events')]);
    const [postResult,regionResult,usageResult,abuseResult,auditResult] = results;
    if (postResult.status==='fulfilled') setPosts(postResult.value);
    if (regionResult.status==='fulfilled') setRegions(regionResult.value);
    if (usageResult.status==='fulfilled') setUsage(usageResult.value);
    if (abuseResult.status==='fulfilled') setAbuse(abuseResult.value);
    if (auditResult.status==='fulfilled') setAudit(auditResult.value);
    const coreError = results.slice(0,3).find(result=>result.status==='rejected'); if (coreError) setDataError(coreError.reason.message);
    setLoading(false);
  }
  useEffect(()=>{refresh();},[user]);
  if (!authReady) return h('main',{className:'login-page'},h('div',{className:'loading-card'},'Checking control room session…'));
  if (!user) return h(Login,{onLogin:loggedIn=>{setUser(loggedIn); if (/^\/admin\/login\/?$/.test(window.location.pathname)) navigate('overview');}});
  const content = route.active==='overview' ? h(Overview,{usage,regions,posts,abuse,audit}) : route.active==='posts' ? h(Posts,{posts,onRefresh:refresh,user}) : route.active==='regions' ? h(Regions,{regions,onRefresh:refresh,user}) : route.active==='abuse' ? h(Abuse,{reports:abuse,onRefresh:refresh,error:dataError}) : route.active==='usage' ? h(Usage,{usage,regions}) : route.active==='sessions' ? h(Sessions) : h(Settings,{user});
  return h(Layout,{active:route.active,setActive:active=>setRoute({active}),user,onLogout:async()=>{await api('/admin/auth/logout',{method:'POST'});setUser(null);navigate('login');}},loading&&h('div',{className:'loading-line'}),dataError&&route.active!=='abuse'&&h('div',{className:'data-alert alert danger',role:'alert'},dataError),content);
}

createRoot(document.getElementById('root')).render(h(App));
