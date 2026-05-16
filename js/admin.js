// ============================================================
// PANEL DE ADMINISTRACIÓN — LÓGICA COMPLETA
// ============================================================

let allVets = [];
let statusFilter = '';

function initAdmin() {
  const u = window._currentUser;
  if (!u) return;
  document.getElementById('admin-name').textContent = u.email.split('@')[0];
  document.getElementById('admin-avatar').textContent = u.email[0].toUpperCase();
  loadVets();
}

// ─── CARGAR VETERINARIAS ───
async function loadVets() {
  try {
    const snap = await db.collection('users').where('role', '==', 'veterinary').orderBy('createdAt', 'desc').get();
    allVets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderVets(allVets);
    updateStats(allVets);
    renderPending(allVets.filter(v => v.status === 'pending'));
    document.getElementById('badge-pending').textContent = allVets.filter(v => v.status === 'pending').length;
  } catch (e) {
    showToast('Error al cargar veterinarias: ' + e.message, 'error');
  }
}

// ─── RENDERIZAR TABLA ───
function renderVets(vets) {
  const filtered = statusFilter ? vets.filter(v => v.status === statusFilter) : vets;
  const tbody = document.getElementById('vets-tbody');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">🏥</div><p>No se encontraron veterinarias</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map(v => `
    <tr>
      <td><span class="td-main">${v.clinicName || '—'}</span></td>
      <td>${v.email}</td>
      <td>${v.phone || '—'}</td>
      <td>${statusBadge(v.status)}</td>
      <td>${v.subscriptionEnd ? formatDate(v.subscriptionEnd.toDate ? v.subscriptionEnd.toDate() : new Date(v.subscriptionEnd)) : '<span style="color:var(--txt3)">Sin fecha</span>'}</td>
      <td>${v.createdAt ? formatDate(v.createdAt.toDate ? v.createdAt.toDate() : new Date(v.createdAt)) : '—'}</td>
      <td><div class="td-actions">
        <button class="btn btn-sm btn-secondary" onclick="editVet('${v.id}')">✏️</button>
        ${v.status === 'active'
          ? `<button class="btn btn-sm btn-danger" onclick="setStatus('${v.id}','suspended')">Suspender</button>`
          : `<button class="btn btn-sm btn-success" onclick="setStatus('${v.id}','active')">Activar</button>`}
        <button class="btn btn-sm btn-danger" onclick="deleteVet('${v.id}','${v.clinicName}')">🗑️</button>
      </div></td>
    </tr>`).join('');
}

function renderPending(pending) {
  const tbody = document.getElementById('pending-tbody');
  if (!pending.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">✅</div><p>No hay solicitudes pendientes</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = pending.map(v => `
    <tr>
      <td><span class="td-main">${v.clinicName || '—'}</span></td>
      <td>${v.email}</td>
      <td>${v.phone || '—'}</td>
      <td>${v.address || '—'}</td>
      <td>${v.createdAt ? formatDate(v.createdAt.toDate ? v.createdAt.toDate() : new Date(v.createdAt)) : '—'}</td>
      <td><div class="td-actions">
        <button class="btn btn-sm btn-success" onclick="setStatus('${v.id}','active')">✅ Activar</button>
        <button class="btn btn-sm btn-danger" onclick="setStatus('${v.id}','suspended')">🚫 Rechazar</button>
      </div></td>
    </tr>`).join('');
}

function updateStats(vets) {
  document.getElementById('stat-total').textContent = vets.length;
  document.getElementById('stat-active').textContent = vets.filter(v => v.status === 'active').length;
  document.getElementById('stat-suspended').textContent = vets.filter(v => v.status === 'suspended').length;
}

// ─── FILTROS ───
function filterVets(q) {
  const filtered = allVets.filter(v =>
    (v.clinicName || '').toLowerCase().includes(q.toLowerCase()) ||
    v.email.toLowerCase().includes(q.toLowerCase())
  );
  renderVets(filtered);
}
function filterByStatus(s) {
  statusFilter = s;
  renderVets(allVets);
}

// ─── CAMBIAR ESTADO ───
async function setStatus(id, status) {
  try {
    const updates = { status };
    if (status === 'active') {
      const end = new Date();
      end.setMonth(end.getMonth() + 1);
      updates.subscriptionEnd = end;
    }
    await db.collection('users').doc(id).update(updates);
    showToast(`Estado actualizado: ${status}`, 'success');
    loadVets();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

// ─── CREAR VETERINARIA ───
function openCreateModal() {
  document.getElementById('modal-title').textContent = 'Nueva Veterinaria';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group"><label class="form-label">Nombre de la Veterinaria *</label>
      <input id="m-clinic" class="form-control" placeholder="Veterinaria San Roque"></div>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Email *</label>
        <input id="m-email" type="email" class="form-control" placeholder="contacto@vet.com"></div>
      <div class="form-group"><label class="form-label">Contraseña inicial *</label>
        <input id="m-pass" type="password" class="form-control" placeholder="Mínimo 6 caracteres"></div>
      <div class="form-group"><label class="form-label">Teléfono</label>
        <input id="m-phone" class="form-control" placeholder="+54 11 1234-5678"></div>
      <div class="form-group"><label class="form-label">Ciudad</label>
        <input id="m-address" class="form-control" placeholder="Buenos Aires"></div>
    </div>
    <div class="form-group"><label class="form-label">Vencimiento de suscripción</label>
      <input id="m-sub" type="date" class="form-control"></div>`;
  // Set default expiry = 1 month from now
  const d = new Date(); d.setMonth(d.getMonth() + 1);
  document.getElementById('m-sub').value = d.toISOString().split('T')[0];
  document.getElementById('modal-footer').innerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="createVet()">Crear Cuenta</button>`;
  openModal();
}

async function createVet() {
  const clinic = document.getElementById('m-clinic').value.trim();
  const email = document.getElementById('m-email').value.trim();
  const pass = document.getElementById('m-pass').value;
  const phone = document.getElementById('m-phone').value.trim();
  const address = document.getElementById('m-address').value.trim();
  const sub = document.getElementById('m-sub').value;
  if (!clinic || !email || !pass) { showToast('Completá los campos obligatorios', 'error'); return; }

  try {
    // Guardar admin actual
    const adminUser = auth.currentUser;
    // Crear cuenta con un segundo client Auth (usamos signInWithCustomToken no disponible fácil, así que usamos REST API)
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebase.app().options.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, returnSecureToken: false })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const uid = data.localId;

    await db.collection('users').doc(uid).set({
      email, role: 'veterinary', clinicName: clinic, phone, address,
      status: 'active',
      subscriptionEnd: sub ? new Date(sub) : null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal();
    showToast('Veterinaria creada exitosamente ✅', 'success');
    loadVets();
  } catch (e) { showToast('Error al crear: ' + e.message, 'error'); }
}

// ─── EDITAR VETERINARIA ───
function editVet(id) {
  const v = allVets.find(x => x.id === id);
  if (!v) return;
  document.getElementById('modal-title').textContent = 'Editar Veterinaria';
  const subVal = v.subscriptionEnd
    ? (v.subscriptionEnd.toDate ? v.subscriptionEnd.toDate() : new Date(v.subscriptionEnd)).toISOString().split('T')[0]
    : '';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group"><label class="form-label">Nombre de la Veterinaria</label>
      <input id="e-clinic" class="form-control" value="${v.clinicName || ''}"></div>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Teléfono</label>
        <input id="e-phone" class="form-control" value="${v.phone || ''}"></div>
      <div class="form-group"><label class="form-label">Dirección</label>
        <input id="e-address" class="form-control" value="${v.address || ''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Estado</label>
      <select id="e-status" class="form-control">
        <option value="active" ${v.status==='active'?'selected':''}>✅ Activa</option>
        <option value="suspended" ${v.status==='suspended'?'selected':''}>🚫 Suspendida</option>
        <option value="pending" ${v.status==='pending'?'selected':''}>⏳ Pendiente</option>
      </select></div>
    <div class="form-group"><label class="form-label">Vencimiento de suscripción</label>
      <input id="e-sub" type="date" class="form-control" value="${subVal}"></div>`;
  document.getElementById('modal-footer').innerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveEditVet('${id}')">Guardar Cambios</button>`;
  openModal();
}

async function saveEditVet(id) {
  try {
    const sub = document.getElementById('e-sub').value;
    await db.collection('users').doc(id).update({
      clinicName: document.getElementById('e-clinic').value.trim(),
      phone: document.getElementById('e-phone').value.trim(),
      address: document.getElementById('e-address').value.trim(),
      status: document.getElementById('e-status').value,
      subscriptionEnd: sub ? new Date(sub) : null,
    });
    closeModal();
    showToast('Cambios guardados ✅', 'success');
    loadVets();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

// ─── ELIMINAR ───
async function deleteVet(id, name) {
  if (!confirm(`¿Eliminar la veterinaria "${name}"? Esta acción no se puede deshacer.`)) return;
  try {
    await db.collection('users').doc(id).delete();
    showToast('Veterinaria eliminada', 'success');
    loadVets();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

// ─── SECCIONES ───
function showSection(name) {
  ['veterinarias','pendientes','estadisticas'].forEach(s => {
    document.getElementById(`section-${s}`).style.display = s === name ? 'block' : 'none';
  });
  document.querySelectorAll('.admin-sidebar .nav-item').forEach((el, i) => {
    el.classList.toggle('active', ['veterinarias','pendientes','estadisticas'][i] === name);
  });
  if (name === 'estadisticas') renderCharts();
}

function renderCharts() {
  const active = allVets.filter(v => v.status === 'active').length;
  const suspended = allVets.filter(v => v.status === 'suspended').length;
  const pending = allVets.filter(v => v.status === 'pending').length;

  const ctx1 = document.getElementById('chart-status');
  if (ctx1._chart) ctx1._chart.destroy();
  ctx1._chart = new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: ['Activas', 'Suspendidas', 'Pendientes'],
      datasets: [{ data: [active, suspended, pending], backgroundColor: ['#10b981','#ef4444','#f59e0b'], borderWidth: 0 }]
    },
    options: { plugins: { legend: { labels: { color: '#94a3b8' } } } }
  });
}

// ─── MODAL HELPERS ───
function openModal() { document.getElementById('modal-overlay').classList.add('open'); }
function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
function closeModalIfOutside(e) { if (e.target === document.getElementById('modal-overlay')) closeModal(); }

// ─── DATE FORMAT ───
function formatDate(d) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}
function statusBadge(s) {
  const map = { active: 'badge-green', suspended: 'badge-red', pending: 'badge-yellow' };
  const txt = { active: '✅ Activa', suspended: '🚫 Suspendida', pending: '⏳ Pendiente' };
  return `<span class="badge ${map[s] || 'badge-gray'}">${txt[s] || s}</span>`;
}
