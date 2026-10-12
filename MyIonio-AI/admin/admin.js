const documents = document.querySelector('#documents');
const status = document.querySelector('#status');
const refresh = document.querySelector('#refresh');
const account = document.querySelector('#account');
const logout = document.querySelector('#logout');
let csrfToken = '';

const escapeHtml = value => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const bytes = value => `${(value / 1024).toFixed(1)} KB`;

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.method && options.method !== 'GET') headers.set('X-CSRF-Token', csrfToken);
  const response = await fetch(url, {...options, headers, credentials: 'same-origin'});
  if (response.status === 401) window.location.assign('/admin/login');
  return response;
}

async function initialiseSession() {
  const response = await fetch('/admin/session', {credentials: 'same-origin'});
  if (!response.ok) { window.location.assign('/admin/login'); return false; }
  const session = await response.json();
  csrfToken = session.csrf_token;
  account.textContent = session.username;
  return true;
}

async function load() {
  refresh.disabled = true; status.textContent = 'Έλεγχος και υπολογισμός SHA-256…'; documents.innerHTML = '';
  try {
    const response = await apiFetch('/pipeline/official/schedules');
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Discovery failed');
    render(data.documents); status.textContent = `Βρέθηκαν ${data.documents.length} επίσημα PDF.`;
  } catch (error) {
    status.innerHTML = `<span class="error">${escapeHtml(error.message)}</span>`;
  } finally { refresh.disabled = false; }
}

function render(items) {
  if (!items.length) { documents.innerHTML = '<div class="empty">Δεν βρέθηκαν PDF.</div>'; return; }
  documents.innerHTML = items.map((item, index) => `
    <article class="card">
      <div class="row"><span class="semester">${escapeHtml(item.semester)}΄</span><span class="${item.already_imported ? 'ok' : 'new'}">${item.already_imported ? '✓ Εισαγμένο' : '● Νέο'}</span></div>
      <h2>${escapeHtml(item.academic_year)}</h2>
      <div class="meta"><span>${escapeHtml(item.document_type)}</span><span>${bytes(item.size_bytes)} · ${escapeHtml(item.published_date || 'χωρίς ημερομηνία')}</span><span class="hash">SHA-256 ${escapeHtml(item.sha256)}</span></div>
      <div class="row"><a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer" class="hash">PDF</a><button data-index="${index}" ${item.already_imported ? 'disabled' : ''}>${item.already_imported ? 'Ήδη εισαγμένο' : 'Parse & εισαγωγή'}</button></div>
    </article>`).join('');
  documents.querySelectorAll('button[data-index]').forEach(button => button.addEventListener('click', () => importDocument(items[Number(button.dataset.index)], button)));
}

async function importDocument(item, button) {
  button.disabled = true; button.textContent = 'Parsing…'; status.textContent = `${item.semester}΄ εξάμηνο: λήψη και AI parsing. Μπορεί να πάρει αρκετά λεπτά.`;
  try {
    const response = await apiFetch('/pipeline/official/import', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source_url:item.url,expected_sha256:item.sha256})});
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Import failed');
    status.innerHTML = `<span class="ok">Ολοκληρώθηκε: ${data.rows_written} εγγραφές για το ${escapeHtml(item.semester)}΄.</span>`;
    await load();
  } catch (error) {
    button.disabled = false; button.textContent = 'Δοκιμή ξανά'; status.innerHTML = `<span class="error">${escapeHtml(error.message)}</span>`;
  }
}

refresh.addEventListener('click', load);
logout.addEventListener('click', async () => {
  await apiFetch('/admin/logout', {method: 'POST'});
  window.location.assign('/admin/login');
});

initialiseSession().then(ready => { if (ready) load(); });
