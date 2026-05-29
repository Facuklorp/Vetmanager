// ============================================================
// VETMANAGER — APP PRINCIPAL
// ============================================================

let VID = null; // veterinary user ID
let _cache = { owners: [], pets: [], products: [] };

// ─── INIT ───
async function initApp() {
  const u = window._currentUser;
  if (!u) return;
  VID = u.uid;
  document.getElementById('clinic-name').textContent = u.clinicName || 'Veterinaria';
  document.getElementById('user-clinic').textContent = u.clinicName || 'Veterinaria';
  document.getElementById('user-email').textContent = u.email;
  document.getElementById('user-avatar').textContent = (u.clinicName || u.email)[0].toUpperCase();
  await preloadCache();
  
  if (!u.onboardingDone && _cache.owners.length === 0) {
    showOnboardingWizard();
  } else {
    navigateTo('dashboard');
  }
}

// ─── ONBOARDING WIZARD ───
function showOnboardingWizard() {
  setModal('🎉 ¡Bienvenido a VetManager!', `
    <div style="text-align: center; padding: 20px;">
      <h3 style="margin-bottom: 16px;">¡Tu cuenta ya está activa!</h3>
      <p style="color: var(--txt2); margin-bottom: 24px; line-height: 1.5;">
        Para comenzar a usar el sistema, te sugerimos registrar a tu primer cliente (dueño) y luego a su mascota.
      </p>
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 300px; margin: 0 auto;">
        <button class="btn btn-primary" style="justify-content: center; padding: 12px;" onclick="startOnboarding()">
          Comenzar configuración
        </button>
        <button class="btn btn-secondary" style="justify-content: center;" onclick="skipOnboarding()">
          Omitir por ahora
        </button>
      </div>
    </div>
  `, '');
}

async function startOnboarding() {
  await db.collection('users').doc(VID).update({ onboardingDone: true });
  window._currentUser.onboardingDone = true;
  closeModal();
  navigateTo('duenos');
  setTimeout(() => openDuenoModal(), 500);
}

async function skipOnboarding() {
  await db.collection('users').doc(VID).update({ onboardingDone: true });
  window._currentUser.onboardingDone = true;
  closeModal();
  navigateTo('dashboard');
}

// ─── PRE-LOAD ───
async function preloadCache() {
  try {
    const [oSnap, pSnap, prSnap] = await Promise.all([
      col('owners').orderBy('name').get(),
      col('pets').orderBy('name').get(),
      col('products').orderBy('name').get()
    ]);
    _cache.owners = oSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    _cache.pets = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    _cache.products = prSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateBadges();
  } catch (e) { console.error(e); }
}

function updateBadges() {
  const lowStock = _cache.products.filter(p => (p.stock || 0) <= (p.minStock || 0)).length;
  const badge = document.getElementById('badge-stock');
  if (lowStock > 0) { badge.textContent = lowStock; badge.style.display = 'inline'; }
  else badge.style.display = 'none';
}

// ─── FIRESTORE HELPER ───
function col(name) { return db.collection('veterinaries').doc(VID).collection(name); }

// ─── NAVIGATION ───
function navigateTo(module) {
  document.querySelectorAll('.nav-item').forEach(el => {
    const isActive = el.dataset.module === module;
    el.classList.toggle('active', isActive);
  });

  // Auto-expand active submenus
  const activeEl = document.querySelector('.nav-item.active');
  if (activeEl) {
    const parentSubmenu = activeEl.closest('.nav-submenu');
    if (parentSubmenu) {
      parentSubmenu.style.display = 'block';
      const id = parentSubmenu.id.replace('submenu-', '');
      const parent = document.getElementById('parent-' + id);
      if (parent) {
        const arrow = parent.querySelector('.submenu-arrow');
        if (arrow) arrow.textContent = '▲';
      }
    }
  }
  const titles = {
    dashboard:'Dashboard', duenos:'Clientes / Dueños', mascotas:'Mascotas',
    vacunaciones:'Vacunaciones', consultas:'Consultas / Historia Clínica',
    cirugias:'Cirugías', banos:'Baños / Peluquería', internaciones:'Internaciones',
    inventario:'Inventario', compras:'Compras', ventas:'Ventas',
    turnos:'Turnos / Agenda', reportes:'Reportes'
  };
  document.getElementById('page-title').textContent = titles[module] || module;
  document.getElementById('header-actions').innerHTML = '';
  const c = document.getElementById('content');
  c.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando...</div>';
  const fn = { dashboard:renderDashboard, duenos:renderDuenos, mascotas:renderMascotas,
    vacunaciones:renderVacunaciones, consultas:renderConsultas, cirugias:renderCirugias,
    banos:renderBanos, internaciones:renderInternaciones, inventario:renderInventario,
    compras:renderCompras, ventas:renderVentas, turnos:renderTurnos, reportes:renderReportes }[module];
  if (fn) fn();
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

// ─── MODAL ───
function openModal() { document.getElementById('modal-overlay').classList.add('open'); }
function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
function closeModalIfOutside(e) { if (e.target.id === 'modal-overlay') closeModal(); }
function setModal(title, bodyHTML, footerHTML) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-footer').innerHTML = footerHTML;
  openModal();
}

// ─── UTILS ───
function fmtDate(v) {
  if (!v) return '—';
  const d = v.toDate ? v.toDate() : new Date(v);
  return new Intl.DateTimeFormat('es-AR').format(d);
}
function fmtMoney(n) { return '$' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 }); }
function today() { return new Date().toISOString().split('T')[0]; }
function calcAge(birthDate) {
  if (!birthDate) return '—';
  const d = birthDate.toDate ? birthDate.toDate() : new Date(birthDate);
  const months = Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 12) return months + ' meses';
  return Math.floor(months / 12) + ' años';
}
function petName(id) { return (_cache.pets.find(p => p.id === id) || {}).name || '—'; }
function ownerName(id) { const o = _cache.owners.find(x => x.id === id); return o ? o.name : '—'; }
function speciesIcon(s) {
  return { perro:'🐶', gato:'🐱', ave:'🐦', conejo:'🐰', hamster:'🐹', reptil:'🦎', otro:'🐾' }[s] || '🐾';
}

// ── TABLE BUILDER ──
function buildTable(headers, rows, emptyMsg = 'No hay registros') {
  if (!rows.length) return `<div class="empty-state"><div class="empty-icon">📋</div><p>${emptyMsg}</p></div>`;
  return `<div class="table-wrapper"><table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table></div>`;
}

// ============================================================
// DASHBOARD
// ============================================================
async function renderDashboard() {
  try {
    const [turnSnap, hospSnap] = await Promise.all([
      col('turnos').where('date', '==', today()).get(),
      col('internaciones').where('active', '==', true).get()
    ]);
    const todayTurnos = turnSnap.docs.length;
    const internados = hospSnap.docs.length;
    const lowStock = _cache.products.filter(p => (p.stock || 0) <= (p.minStock || 0)).length;

    // Upcoming vacunas (next 30 days)
    const now = new Date(); const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    const vacSnap = await col('vacunaciones').where('nextDose', '<=', firebase.firestore.Timestamp.fromDate(in30)).get();
    const upcoming = vacSnap.docs.filter(d => { const nd = d.data().nextDose; return nd && nd.toDate() >= now; }).length;

    document.getElementById('content').innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-icon">🐶</div>
          <div class="kpi-value">${_cache.pets.length}</div><div class="kpi-label">Pacientes registrados</div></div>
        <div class="kpi-card"><div class="kpi-icon">📅</div>
          <div class="kpi-value">${todayTurnos}</div><div class="kpi-label">Turnos hoy</div></div>
        <div class="kpi-card"><div class="kpi-icon">📦</div>
          <div class="kpi-value" style="color:${lowStock?'var(--red)':'var(--green)'}">${lowStock}</div>
          <div class="kpi-label">Productos con stock bajo</div></div>
        <div class="kpi-card"><div class="kpi-icon">💉</div>
          <div class="kpi-value" style="color:${upcoming?'var(--yellow)':'var(--green)'}">${upcoming}</div>
          <div class="kpi-label">Vacunas próximas (30 días)</div></div>
      </div>
      <div class="dashboard-grid" style="margin-top:24px;">
        <div>
          <div class="card" style="margin-bottom:16px;">
            <h4 style="margin-bottom:14px;">🕐 Accesos Rápidos</h4>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
              ${[['📅','Nuevo Turno','navigateTo(\'turnos\')'],['💉','Vacunar','navigateTo(\'vacunaciones\')'],
                ['🏥','Nueva Consulta','navigateTo(\'consultas\')'],['🛁','Baño','navigateTo(\'banos\')'],
                ['🔪','Cirugía','navigateTo(\'cirugias\')'],['💰','Nueva Venta','navigateTo(\'ventas\')']]
                .map(([ico,lbl,fn])=>`<button class="btn btn-secondary" style="flex-direction:column;gap:4px;padding:14px 8px;" onclick="${fn}">
                  <span style="font-size:1.4rem;">${ico}</span><span style="font-size:0.75rem;">${lbl}</span></button>`).join('')}
            </div>
          </div>
          ${internados ? `<div class="alert alert-warning" style="margin-bottom:12px;">🛏️ <strong>${internados}</strong> mascota(s) internada(s) actualmente.</div>` : ''}
          ${lowStock ? `<div class="alert alert-danger">📦 <strong>${lowStock}</strong> producto(s) con stock bajo o agotado.</div>` : ''}
        </div>
        <div>
          <div class="card">
            <h4 style="margin-bottom:14px;">📅 Turnos de hoy</h4>
            ${todayTurnos === 0
              ? '<p style="font-size:0.82rem;color:var(--txt3);">No hay turnos para hoy.</p>'
              : `<div id="today-turnos"><div class="loading"><div class="spinner"></div></div></div>`}
          </div>
        </div>
      </div>`;

    if (todayTurnos > 0) {
      const rows = turnSnap.docs.map(d => { const t = d.data();
        return `<div class="recent-item"><span class="ri-icon">🕐</span>
          <div class="ri-text"><strong>${t.time || ''}</strong> — ${petName(t.petId)}<br>
          <span style="font-size:0.75rem;color:var(--txt3);">${t.reason || ''}</span></div>
          ${statusBadge(t.status,'turno')}</div>`;}).join('');
      document.getElementById('today-turnos').innerHTML = `<div class="recent-list">${rows}</div>`;
    }
  } catch (e) { document.getElementById('content').innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`; }
}

// ============================================================
// DUEÑOS
// ============================================================
async function renderDuenos() {
  document.getElementById('header-actions').innerHTML = `<button class="btn btn-primary" onclick="openDuenoModal()">+ Nuevo Cliente</button>`;
  try {
    const snap = await col('owners').orderBy('name').get();
    _cache.owners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderDuenosTable(_cache.owners, '');
  } catch (e) { document.getElementById('content').innerHTML = `<div class="alert alert-danger">${e.message}</div>`; }
}

function renderDuenosTable(owners, q) {
  const filtered = q ? owners.filter(o => o.name.toLowerCase().includes(q.toLowerCase()) || (o.phone||'').includes(q)) : owners;
  const rows = filtered.map(o => {
    const pCount = _cache.pets.filter(p => p.ownerId === o.id).length;
    return `<tr>
      <td><span class="td-main">${o.name}</span></td>
      <td>${o.phone || '—'}</td><td>${o.email || '—'}</td><td>${o.address || '—'}</td>
      <td><span class="badge badge-violet">${pCount} mascota(s)</span></td>
      <td><div class="td-actions">
        <button class="btn btn-sm btn-secondary" onclick="openDuenoModal('${o.id}')">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteDueno('${o.id}','${o.name}')">🗑️</button>
      </div></td></tr>`;
  });
  document.getElementById('content').innerHTML = `
    <div class="search-bar">
      <div class="search-input-wrap"><span class="search-icon">🔍</span>
        <input class="form-control search-input" placeholder="Buscar por nombre o teléfono..." oninput="renderDuenosTable(_cache.owners, this.value)"></div>
    </div>
    ${buildTable(['Nombre','Teléfono','Email','Dirección','Mascotas','Acciones'], rows, 'No hay clientes registrados. ¡Agregá el primero!')}`;
}

function openDuenoModal(id) {
  const o = id ? _cache.owners.find(x => x.id === id) : null;
  setModal(o ? 'Editar Cliente' : 'Nuevo Cliente', `
    <div class="form-grid">
      <div class="form-group form-full"><label class="form-label">Nombre completo *</label>
        <input id="d-name" class="form-control" value="${o?.name||''}" placeholder="Juan García"></div>
      <div class="form-group"><label class="form-label">Teléfono</label>
        <input id="d-phone" class="form-control" value="${o?.phone||''}" placeholder="+54 11 1234-5678"></div>
      <div class="form-group"><label class="form-label">Email</label>
        <input id="d-email" class="form-control" value="${o?.email||''}" placeholder="juan@email.com"></div>
      <div class="form-group form-full"><label class="form-label">Dirección</label>
        <input id="d-address" class="form-control" value="${o?.address||''}" placeholder="Calle Falsa 123"></div>
      <div class="form-group form-full"><label class="form-label">Notas</label>
        <textarea id="d-notes" class="form-control">${o?.notes||''}</textarea></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveDueno('${id||''}')">Guardar</button>`);
}

async function saveDueno(id) {
  const data = { name: document.getElementById('d-name').value.trim(),
    phone: document.getElementById('d-phone').value.trim(),
    email: document.getElementById('d-email').value.trim(),
    address: document.getElementById('d-address').value.trim(),
    notes: document.getElementById('d-notes').value.trim() };
  if (!data.name) { showToast('El nombre es obligatorio', 'error'); return; }
  try {
    if (id) await col('owners').doc(id).update(data);
    else await col('owners').add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    closeModal(); showToast('Cliente guardado ✅', 'success');
    await preloadCache(); renderDuenos();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function deleteDueno(id, name) {
  if (!confirm(`¿Eliminar a "${name}"?`)) return;
  try { await col('owners').doc(id).delete(); showToast('Cliente eliminado', 'success'); await preloadCache(); renderDuenos(); }
  catch (e) { showToast('Error: ' + e.message, 'error'); }
}

// ============================================================
// MASCOTAS
// ============================================================
async function renderMascotas() {
  document.getElementById('header-actions').innerHTML = `<button class="btn btn-primary" onclick="openMascotaModal()">+ Nueva Mascota</button>`;
  try {
    const snap = await col('pets').orderBy('name').get();
    _cache.pets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderMascotasTable(_cache.pets, '');
  } catch (e) { document.getElementById('content').innerHTML = `<div class="alert alert-danger">${e.message}</div>`; }
}

function renderMascotasTable(pets, q) {
  const filtered = q ? pets.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || (p.species||'').toLowerCase().includes(q.toLowerCase())) : pets;
  const rows = filtered.map(p => `<tr>
    <td><span class="td-main">${speciesIcon(p.species)} ${p.name}</span></td>
    <td>${p.species || '—'}</td><td>${p.breed || '—'}</td>
    <td>${calcAge(p.birthDate)}</td>
    <td>${p.weight ? p.weight + ' kg' : '—'}</td>
    <td>${p.sex === 'M' ? '♂️ Macho' : p.sex === 'F' ? '♀️ Hembra' : '—'}</td>
    <td>${ownerName(p.ownerId)}</td>
    <td>${p.status === 'active' ? '<span class="badge badge-green">Activo</span>' : '<span class="badge badge-gray">Fallecido</span>'}</td>
    <td><div class="td-actions">
      <button class="btn btn-sm btn-secondary" onclick="openMascotaModal('${p.id}')">✏️</button>
      <button class="btn btn-sm btn-danger" onclick="deleteMascota('${p.id}','${p.name}')">🗑️</button>
    </div></td></tr>`);
  document.getElementById('content').innerHTML = `
    <div class="search-bar">
      <div class="search-input-wrap"><span class="search-icon">🔍</span>
        <input class="form-control search-input" placeholder="Buscar por nombre o especie..." oninput="renderMascotasTable(_cache.pets, this.value)"></div>
    </div>
    ${buildTable(['Nombre','Especie','Raza','Edad','Peso','Sexo','Dueño','Estado','Acciones'], rows, 'No hay mascotas registradas.')}`;
}

function ownerOptions(sel = '') {
  return _cache.owners.map(o => `<option value="${o.id}" ${o.id===sel?'selected':''}>${o.name}</option>`).join('');
}

function openMascotaModal(id) {
  const p = id ? _cache.pets.find(x => x.id === id) : null;
  const bd = p?.birthDate ? (p.birthDate.toDate ? p.birthDate.toDate() : new Date(p.birthDate)).toISOString().split('T')[0] : '';
  setModal(p ? 'Editar Mascota' : 'Nueva Mascota', `
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Nombre *</label>
        <input id="p-name" class="form-control" value="${p?.name||''}" placeholder="Firulais"></div>
      <div class="form-group"><label class="form-label">Especie *</label>
        <select id="p-species" class="form-control">
          ${['perro','gato','ave','conejo','hamster','reptil','otro'].map(s=>`<option value="${s}" ${p?.species===s?'selected':''}>${speciesIcon(s)} ${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Raza</label>
        <input id="p-breed" class="form-control" value="${p?.breed||''}" placeholder="Labrador"></div>
      <div class="form-group"><label class="form-label">Sexo</label>
        <select id="p-sex" class="form-control">
          <option value="M" ${p?.sex==='M'?'selected':''}>♂️ Macho</option>
          <option value="F" ${p?.sex==='F'?'selected':''}>♀️ Hembra</option>
        </select></div>
      <div class="form-group"><label class="form-label">Fecha de nacimiento</label>
        <input id="p-birth" type="date" class="form-control" value="${bd}"></div>
      <div class="form-group"><label class="form-label">Peso (kg)</label>
        <input id="p-weight" type="number" step="0.1" class="form-control" value="${p?.weight||''}" placeholder="5.5"></div>
      <div class="form-group"><label class="form-label">Color / Pelaje</label>
        <input id="p-color" class="form-control" value="${p?.color||''}" placeholder="Marrón con blanco"></div>
      <div class="form-group"><label class="form-label">Estado</label>
        <select id="p-status" class="form-control">
          <option value="active" ${(!p||p.status==='active')?'selected':''}>Activo</option>
          <option value="deceased" ${p?.status==='deceased'?'selected':''}>Fallecido</option>
        </select></div>
      <div class="form-group form-full"><label class="form-label">Dueño</label>
        <select id="p-owner" class="form-control"><option value="">Sin asignar</option>${ownerOptions(p?.ownerId)}</select></div>
      <div class="form-group form-full"><label class="form-label">Observaciones</label>
        <textarea id="p-notes" class="form-control">${p?.notes||''}</textarea></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveMascota('${id||''}')">Guardar</button>`);
}

async function saveMascota(id) {
  const name = document.getElementById('p-name').value.trim();
  if (!name) { showToast('El nombre es obligatorio', 'error'); return; }
  const bd = document.getElementById('p-birth').value;
  const data = { name, species: document.getElementById('p-species').value,
    breed: document.getElementById('p-breed').value.trim(),
    sex: document.getElementById('p-sex').value,
    birthDate: bd ? firebase.firestore.Timestamp.fromDate(new Date(bd)) : null,
    weight: parseFloat(document.getElementById('p-weight').value) || null,
    color: document.getElementById('p-color').value.trim(),
    status: document.getElementById('p-status').value,
    ownerId: document.getElementById('p-owner').value,
    notes: document.getElementById('p-notes').value.trim() };
  try {
    if (id) await col('pets').doc(id).update(data);
    else await col('pets').add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    closeModal(); showToast('Mascota guardada ✅', 'success');
    await preloadCache(); renderMascotas();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function deleteMascota(id, name) {
  if (!confirm(`¿Eliminar a "${name}"?`)) return;
  try { await col('pets').doc(id).delete(); showToast('Eliminado', 'success'); await preloadCache(); renderMascotas(); }
  catch (e) { showToast(e.message, 'error'); }
}

// ─── PET SELECT OPTIONS ───
function petOptions(sel = '') {
  return _cache.pets.map(p => `<option value="${p.id}" ${p.id===sel?'selected':''}>${speciesIcon(p.species)} ${p.name} (${ownerName(p.ownerId)})</option>`).join('');
}

// ─── STATUS BADGE ───
function statusBadge(s, type='') {
  if (type === 'turno') {
    const m = { pending:'badge-yellow', attended:'badge-green', cancelled:'badge-red' };
    const t = { pending:'⏳ Pendiente', attended:'✅ Atendido', cancelled:'❌ Cancelado' };
    return `<span class="badge ${m[s]||'badge-gray'}">${t[s]||s}</span>`;
  }
  return `<span class="badge badge-gray">${s}</span>`;
}

// ============================================================
// VACUNACIONES
// ============================================================
async function renderVacunaciones() {
  document.getElementById('header-actions').innerHTML = `<button class="btn btn-primary" onclick="openVacModal()">+ Nueva Vacunacion</button>`;
  try {
    const snap = await col('vacunaciones').orderBy('date','desc').get();
    const data = snap.docs.map(d=>({id:d.id,...d.data()}));
    const rows = data.map(v=>{
      const nd = v.nextDose ? (v.nextDose.toDate ? v.nextDose.toDate() : new Date(v.nextDose)) : null;
      const isNear = nd && nd <= new Date(Date.now()+30*24*60*60*1000);
      return `<tr>
        <td>${fmtDate(v.date)}</td>
        <td><span class="td-main">${petName(v.petId)}</span></td>
        <td>${v.vaccine||'�'}</td>
        <td>${v.weight ? v.weight+' kg':'�'}</td>
        <td>${v.dose||'�'}</td>
        <td><span class="${isNear&&nd>=new Date()?'badge badge-yellow':''}"> ${fmtDate(v.nextDose)}</span></td>
        <td>${v.vet||'�'}</td>
        <td><div class="td-actions">
          <button class="btn btn-sm btn-secondary" onclick="openVacModal('${v.id}')">??</button>
          <button class="btn btn-sm btn-danger" onclick="deleteDoc('vacunaciones','${v.id}','renderVacunaciones')">???</button>
        </div></td></tr>`;
    });
    document.getElementById('content').innerHTML = buildTable(['Fecha','Mascota','Vacuna','Peso','Dosis','Proxima Dosis','Veterinario','Acciones'],rows,'No hay vacunaciones registradas.');
  } catch(e){showErr(e);}
}

function openVacModal(id){
  const existing = id ? null : null;
  setModal(id?'Editar Vacunacion':'Nueva Vacunacion',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mascota *</label>
        <select id="v-pet" class="form-control"><option value="">Seleccionar...</option>${petOptions()}</select></div>
      <div class="form-group"><label class="form-label">Fecha *</label>
        <input id="v-date" type="date" class="form-control" value="${today()}"></div>
      <div class="form-group"><label class="form-label">Vacuna *</label>
        <input id="v-vaccine" class="form-control" placeholder="Ej: Antirr�bica, S�xtuple..."></div>
      <div class="form-group"><label class="form-label">Dosis</label>
        <input id="v-dose" class="form-control" placeholder="Ej: 1ml, Refuerzo..."></div>
      <div class="form-group"><label class="form-label">Peso actual (kg)</label>
        <input id="v-weight" type="number" step="0.1" class="form-control"></div>
      <div class="form-group"><label class="form-label">Proxima dosis</label>
        <input id="v-next" type="date" class="form-control"></div>
      <div class="form-group"><label class="form-label">Veterinario</label>
        <input id="v-vet" class="form-control"></div>
      <div class="form-group form-full"><label class="form-label">Observaciones</label>
        <textarea id="v-notes" class="form-control"></textarea></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveVac('${id||''}')">Guardar</button>`);
}

async function saveVac(id){
  const petId=document.getElementById('v-pet').value;
  const vaccine=document.getElementById('v-vaccine').value.trim();
  if(!petId||!vaccine){showToast('Selecciona mascota y vacuna','error');return;}
  const nd=document.getElementById('v-next').value;
  const d=document.getElementById('v-date').value;
  const data={petId,vaccine,dose:document.getElementById('v-dose').value.trim(),
    weight:parseFloat(document.getElementById('v-weight').value)||null,
    date:d?firebase.firestore.Timestamp.fromDate(new Date(d)):null,
    nextDose:nd?firebase.firestore.Timestamp.fromDate(new Date(nd)):null,
    vet:document.getElementById('v-vet').value.trim(),
    notes:document.getElementById('v-notes').value.trim()};
  try{
    if(id) await col('vacunaciones').doc(id).update(data);
    else await col('vacunaciones').add({...data,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    closeModal();showToast('Vacunacion guardada ?','success');renderVacunaciones();
  }catch(e){showToast(e.message,'error');}
}

// ============================================================
// CONSULTAS / HISTORIA CLINICA
// ============================================================
async function renderConsultas(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openConsultaModal()">+ Nueva Consulta</button>`;
  try{
    const snap=await col('consultas').orderBy('date','desc').get();
    const data=snap.docs.map(d=>({id:d.id,...d.data()}));
    const rows=data.map(c=>`<tr>
      <td>${fmtDate(c.date)}</td>
      <td><span class="td-main">${petName(c.petId)}</span></td>
      <td>${c.symptoms||'�'}</td>
      <td>${c.diagnosis||'�'}</td>
      <td>${c.treatment||'�'}</td>
      <td>${c.vet||'�'}</td>
      <td><div class="td-actions">
        <button class="btn btn-sm btn-secondary" onclick="openConsultaModal('${c.id}')">??</button>
        <button class="btn btn-sm btn-danger" onclick="deleteDoc('consultas','${c.id}','renderConsultas')">???</button>
      </div></td></tr>`);
    document.getElementById('content').innerHTML=buildTable(['Fecha','Mascota','S�ntomas','Diagn�stico','Tratamiento','Veterinario','Acciones'],rows,'No hay consultas registradas.');
  }catch(e){showErr(e);}
}

function openConsultaModal(id){
  setModal(id?'Editar Consulta':'Nueva Consulta',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mascota *</label>
        <select id="c-pet" class="form-control"><option value="">Seleccionar...</option>${petOptions()}</select></div>
      <div class="form-group"><label class="form-label">Fecha</label>
        <input id="c-date" type="date" class="form-control" value="${today()}"></div>
      <div class="form-group"><label class="form-label">Peso (kg)</label>
        <input id="c-weight" type="number" step="0.1" class="form-control"></div>
      <div class="form-group"><label class="form-label">Temperatura (�C)</label>
        <input id="c-temp" type="number" step="0.1" class="form-control"></div>
      <div class="form-group form-full"><label class="form-label">S�ntomas</label>
        <textarea id="c-symptoms" class="form-control" placeholder="Describe los s�ntomas..."></textarea></div>
      <div class="form-group form-full"><label class="form-label">Diagn�stico</label>
        <textarea id="c-diagnosis" class="form-control"></textarea></div>
      <div class="form-group form-full"><label class="form-label">Tratamiento</label>
        <textarea id="c-treatment" class="form-control"></textarea></div>
      <div class="form-group form-full"><label class="form-label">Medicamentos recetados</label>
        <textarea id="c-meds" class="form-control" placeholder="Ej: Amoxicilina 250mg..."></textarea></div>
      <div class="form-group"><label class="form-label">Veterinario</label>
        <input id="c-vet" class="form-control"></div>
      <div class="form-group"><label class="form-label">Proxima consulta</label>
        <input id="c-next" type="date" class="form-control"></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveConsulta('${id||''}')">Guardar</button>`);
}

async function saveConsulta(id){
  const petId=document.getElementById('c-pet').value;
  if(!petId){showToast('Selecciona una mascota','error');return;}
  const d=document.getElementById('c-date').value;
  const nc=document.getElementById('c-next').value;
  const data={petId,
    date:d?firebase.firestore.Timestamp.fromDate(new Date(d)):null,
    weight:parseFloat(document.getElementById('c-weight').value)||null,
    temperature:parseFloat(document.getElementById('c-temp').value)||null,
    symptoms:document.getElementById('c-symptoms').value.trim(),
    diagnosis:document.getElementById('c-diagnosis').value.trim(),
    treatment:document.getElementById('c-treatment').value.trim(),
    medications:document.getElementById('c-meds').value.trim(),
    vet:document.getElementById('c-vet').value.trim(),
    nextVisit:nc?firebase.firestore.Timestamp.fromDate(new Date(nc)):null};
  try{
    if(id) await col('consultas').doc(id).update(data);
    else await col('consultas').add({...data,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    closeModal();showToast('Consulta guardada ?','success');renderConsultas();
  }catch(e){showToast(e.message,'error');}
}

// ============================================================
// CIRUGIAS
// ============================================================
async function renderCirugias(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openCirugiaModal()">+ Nueva Cirugia</button>`;
  try{
    const snap=await col('cirugias').orderBy('date','desc').get();
    const data=snap.docs.map(d=>({id:d.id,...d.data()}));
    const rows=data.map(c=>`<tr>
      <td>${fmtDate(c.date)}</td>
      <td><span class="td-main">${petName(c.petId)}</span></td>
      <td>${c.type||'�'}</td>
      <td>${c.vet||'�'}</td>
      <td>${c.anesthesia||'�'}</td>
      <td>${c.preWeight?c.preWeight+' kg':'�'}</td>
      <td><span class="badge ${c.result==='exitosa'?'badge-green':c.result==='complicaciones'?'badge-yellow':'badge-red'}">${c.result||'�'}</span></td>
      <td><div class="td-actions">
        <button class="btn btn-sm btn-secondary" onclick="openCirugiaModal('${c.id}')">??</button>
        <button class="btn btn-sm btn-danger" onclick="deleteDoc('cirugias','${c.id}','renderCirugias')">???</button>
      </div></td></tr>`);
    document.getElementById('content').innerHTML=buildTable(['Fecha','Mascota','Tipo','Veterinario','Anestesia','Peso prev.','Resultado','Acciones'],rows,'No hay cirugias registradas.');
  }catch(e){showErr(e);}
}

function openCirugiaModal(id){
  setModal(id?'Editar Cirugia':'Nueva Cirugia',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mascota *</label>
        <select id="ci-pet" class="form-control"><option value="">Seleccionar...</option>${petOptions()}</select></div>
      <div class="form-group"><label class="form-label">Fecha</label>
        <input id="ci-date" type="date" class="form-control" value="${today()}"></div>
      <div class="form-group"><label class="form-label">Tipo de cirugia *</label>
        <input id="ci-type" class="form-control" placeholder="Ej: Esterilizacion, Extraccion..."></div>
      <div class="form-group"><label class="form-label">Veterinario</label>
        <input id="ci-vet" class="form-control"></div>
      <div class="form-group"><label class="form-label">Anestesia</label>
        <input id="ci-anest" class="form-control" placeholder="Ej: Isoflurano..."></div>
      <div class="form-group"><label class="form-label">Peso previo (kg)</label>
        <input id="ci-weight" type="number" step="0.1" class="form-control"></div>
      <div class="form-group"><label class="form-label">Duracion (min)</label>
        <input id="ci-dur" type="number" class="form-control"></div>
      <div class="form-group"><label class="form-label">Resultado</label>
        <select id="ci-result" class="form-control">
          <option value="exitosa">? Exitosa</option>
          <option value="complicaciones">?? Con complicaciones</option>
          <option value="fallecio">? Fallecio</option>
        </select></div>
      <div class="form-group form-full"><label class="form-label">Observaciones</label>
        <textarea id="ci-notes" class="form-control"></textarea></div>
      <div class="form-group form-full"><label class="form-label">Cuidados post-operatorios</label>
        <textarea id="ci-post" class="form-control"></textarea></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveCirugia('${id||''}')">Guardar</button>`);
}

async function saveCirugia(id){
  const petId=document.getElementById('ci-pet').value;
  const type=document.getElementById('ci-type').value.trim();
  if(!petId||!type){showToast('Completa los campos obligatorios','error');return;}
  const d=document.getElementById('ci-date').value;
  const data={petId,type,vet:document.getElementById('ci-vet').value.trim(),
    anesthesia:document.getElementById('ci-anest').value.trim(),
    preWeight:parseFloat(document.getElementById('ci-weight').value)||null,
    duration:parseInt(document.getElementById('ci-dur').value)||null,
    result:document.getElementById('ci-result').value,
    notes:document.getElementById('ci-notes').value.trim(),
    postCare:document.getElementById('ci-post').value.trim(),
    date:d?firebase.firestore.Timestamp.fromDate(new Date(d)):null};
  try{
    if(id) await col('cirugias').doc(id).update(data);
    else await col('cirugias').add({...data,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    closeModal();showToast('Cirugia guardada ?','success');renderCirugias();
  }catch(e){showToast(e.message,'error');}
}

// ============================================================
// BANOS / PELUQUERIA
// ============================================================
async function renderBanos(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openBanoModal()">+ Nuevo Bano</button>`;
  try{
    const snap=await col('banos').orderBy('date','desc').get();
    const data=snap.docs.map(d=>({id:d.id,...d.data()}));
    const rows=data.map(b=>`<tr>
      <td>${fmtDate(b.date)}</td>
      <td><span class="td-main">${petName(b.petId)}</span></td>
      <td>${b.service||'�'}</td>
      <td>${b.notes||'�'}</td>
      <td><strong>${fmtMoney(b.price)}</strong></td>
      <td><div class="td-actions">
        <button class="btn btn-sm btn-secondary" onclick="openBanoModal('${b.id}')">??</button>
        <button class="btn btn-sm btn-danger" onclick="deleteDoc('banos','${b.id}','renderBanos')">???</button>
      </div></td></tr>`);
    document.getElementById('content').innerHTML=buildTable(['Fecha','Mascota','Servicio','Observaciones','Precio','Acciones'],rows,'No hay banos registrados.');
  }catch(e){showErr(e);}
}

function openBanoModal(id){
  setModal(id?'Editar Bano':'Nuevo Bano / Peluqueria',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mascota *</label>
        <select id="b-pet" class="form-control"><option value="">Seleccionar...</option>${petOptions()}</select></div>
      <div class="form-group"><label class="form-label">Fecha</label>
        <input id="b-date" type="date" class="form-control" value="${today()}"></div>
      <div class="form-group"><label class="form-label">Tipo de servicio</label>
        <select id="b-service" class="form-control">
          <option value="Bano completo">?? Bano completo</option>
          <option value="Corte de pelo">?? Corte de pelo</option>
          <option value="Bano y corte">???? Bano y corte</option>
          <option value="Corte de unas">?? Corte de unas</option>
          <option value="Desparasitacion externa">?? Desparasitacion externa</option>
          <option value="Otro">Otro</option>
        </select></div>
      <div class="form-group"><label class="form-label">Precio ($)</label>
        <input id="b-price" type="number" step="0.01" class="form-control" placeholder="0.00"></div>
      <div class="form-group form-full"><label class="form-label">Observaciones</label>
        <textarea id="b-notes" class="form-control"></textarea></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveBano('${id||''}')">Guardar</button>`);
}

async function saveBano(id){
  const petId=document.getElementById('b-pet').value;
  if(!petId){showToast('Selecciona una mascota','error');return;}
  const d=document.getElementById('b-date').value;
  const data={petId,service:document.getElementById('b-service').value,
    price:parseFloat(document.getElementById('b-price').value)||0,
    notes:document.getElementById('b-notes').value.trim(),
    date:d?firebase.firestore.Timestamp.fromDate(new Date(d)):null};
  try{
    if(id) await col('banos').doc(id).update(data);
    else await col('banos').add({...data,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    closeModal();showToast('Servicio guardado ?','success');renderBanos();
  }catch(e){showToast(e.message,'error');}
}

// ============================================================
// INTERNACIONES
// ============================================================
async function renderInternaciones(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openInternacionModal()">+ Nueva Internacion</button>`;
  try{
    const snap=await col('internaciones').orderBy('admissionDate','desc').get();
    const data=snap.docs.map(d=>({id:d.id,...d.data()}));
    const active=data.filter(x=>x.active);
    const hist=data.filter(x=>!x.active);
    const activeRows=active.map(i=>`<tr style="background:rgba(239,68,68,0.05)">
      <td><span class="td-main">${petName(i.petId)}</span></td>
      <td>${fmtDate(i.admissionDate)}</td>
      <td>${i.reason||'�'}</td>
      <td>${i.evolution||'�'}</td>
      <td><span class="badge badge-red">Internado</span></td>
      <td><div class="td-actions">
        <button class="btn btn-sm btn-success" onclick="darAlta('${i.id}')">Alta</button>
        <button class="btn btn-sm btn-secondary" onclick="openInternacionModal('${i.id}')">??</button>
      </div></td></tr>`);
    const histRows=hist.map(i=>`<tr>
      <td><span class="td-main">${petName(i.petId)}</span></td>
      <td>${fmtDate(i.admissionDate)}</td>
      <td>${i.reason||'�'}</td>
      <td>${i.evolution||'�'}</td>
      <td>${fmtDate(i.dischargeDate)}</td>
      <td><div class="td-actions">
        <button class="btn btn-sm btn-danger" onclick="deleteDoc('internaciones','${i.id}','renderInternaciones')">???</button>
      </div></td></tr>`);
    document.getElementById('content').innerHTML=`
      ${active.length?`<div class="alert alert-danger" style="margin-bottom:16px;">??? <strong>${active.length}</strong> mascota(s) internada(s) actualmente</div>`:''}
      <h4 style="margin-bottom:12px;">Internaciones activas</h4>
      ${buildTable(['Mascota','Ingreso','Motivo','Evolucion','Estado','Acciones'],activeRows,'No hay internaciones activas.')}
      <h4 style="margin:20px 0 12px;">Historial</h4>
      ${buildTable(['Mascota','Ingreso','Motivo','Evolucion','Alta','Acciones'],histRows,'No hay historial.')}`;
  }catch(e){showErr(e);}
}

function openInternacionModal(id){
  setModal(id?'Editar Internacion':'Nueva Internacion',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mascota *</label>
        <select id="i-pet" class="form-control"><option value="">Seleccionar...</option>${petOptions()}</select></div>
      <div class="form-group"><label class="form-label">Fecha de ingreso</label>
        <input id="i-date" type="date" class="form-control" value="${today()}"></div>
      <div class="form-group form-full"><label class="form-label">Motivo de internacion</label>
        <textarea id="i-reason" class="form-control" placeholder="Descripcion del motivo..."></textarea></div>
      <div class="form-group form-full"><label class="form-label">Evolucion / Notas</label>
        <textarea id="i-evol" class="form-control" placeholder="Estado actual del paciente..."></textarea></div>
      <div class="form-group"><label class="form-label">Veterinario responsable</label>
        <input id="i-vet" class="form-control"></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveInternacion('${id||''}')">Guardar</button>`);
}

async function saveInternacion(id){
  const petId=document.getElementById('i-pet').value;
  if(!petId){showToast('Selecciona una mascota','error');return;}
  const d=document.getElementById('i-date').value;
  const data={petId,reason:document.getElementById('i-reason').value.trim(),
    evolution:document.getElementById('i-evol').value.trim(),
    vet:document.getElementById('i-vet').value.trim(),
    admissionDate:d?firebase.firestore.Timestamp.fromDate(new Date(d)):null,
    active:true,dischargeDate:null};
  try{
    if(id) await col('internaciones').doc(id).update(data);
    else await col('internaciones').add({...data,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    closeModal();showToast('Internacion guardada ?','success');renderInternaciones();
  }catch(e){showToast(e.message,'error');}
}

async function darAlta(id){
  if(!confirm('Dar de alta a este paciente?')) return;
  try{
    await col('internaciones').doc(id).update({active:false,dischargeDate:firebase.firestore.Timestamp.fromDate(new Date())});
    showToast('Paciente dado de alta ?','success');renderInternaciones();
  }catch(e){showToast(e.message,'error');}
}

// ============================================================
// INVENTARIO
// ============================================================
async function renderInventario(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openProductoModal()">+ Nuevo Producto</button>`;
  try{
    const snap=await col('products').orderBy('name').get();
    _cache.products=snap.docs.map(d=>({id:d.id,...d.data()}));
    const low=_cache.products.filter(p=>(p.stock||0)<=(p.minStock||0));
    const rows=_cache.products.map(p=>{
      const pct=p.minStock>0?Math.min(100,(p.stock||0)/p.minStock*100):100;
      const cls=p.stock<=0?'stock-empty':p.stock<=p.minStock?'stock-low':'stock-ok';
      return `<tr>
        <td><span class="td-main">${p.name}</span></td>
        <td><span class="badge badge-violet">${p.category||'General'}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-weight:600;color:${p.stock<=0?'var(--red)':p.stock<=p.minStock?'var(--yellow)':'var(--green)'}">${p.stock||0}</span>
            <div class="stock-bar" style="width:60px"><div class="stock-fill ${cls}" style="width:${pct}%"></div></div>
          </div>
        </td>
        <td>${p.minStock||0}</td>
        <td>${fmtMoney(p.costPrice)}</td>
        <td>${fmtMoney(p.salePrice)}</td>
        <td>${p.supplier||'�'}</td>
        <td><div class="td-actions">
          <button class="btn btn-sm btn-secondary" onclick="openProductoModal('${p.id}')">??</button>
          <button class="btn btn-sm btn-danger" onclick="deleteDoc('products','${p.id}','renderInventario')">???</button>
        </div></td></tr>`;
    });
    document.getElementById('content').innerHTML=`
      ${low.length?`<div class="alert alert-danger" style="margin-bottom:16px;">?? <strong>${low.length}</strong> producto(s) con stock bajo o agotado.</div>`:''}
      ${buildTable(['Producto','Categoria','Stock','Stock Min.','Precio Costo','Precio Venta','Proveedor','Acciones'],rows,'No hay productos en el inventario.')}`;
    updateBadges();
  }catch(e){showErr(e);}
}

function openProductoModal(id){
  const p=id?_cache.products.find(x=>x.id===id):null;
  setModal(p?'Editar Producto':'Nuevo Producto',`
    <div class="form-grid">
      <div class="form-group form-full"><label class="form-label">Nombre del producto *</label>
        <input id="pr-name" class="form-control" value="${p?.name||''}" placeholder="Amoxicilina 250mg..."></div>
      <div class="form-group"><label class="form-label">Categoria</label>
        <select id="pr-cat" class="form-control">
          ${['Medicamentos','Alimentos','Accesorios','Antiparasitarios','Vacunas','Higiene','Otro'].map(c=>`<option value="${c}" ${p?.category===c?'selected':''}>${c}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Proveedor</label>
        <input id="pr-sup" class="form-control" value="${p?.supplier||''}"></div>
      <div class="form-group"><label class="form-label">Stock actual</label>
        <input id="pr-stock" type="number" class="form-control" value="${p?.stock||0}"></div>
      <div class="form-group"><label class="form-label">Stock minimo</label>
        <input id="pr-min" type="number" class="form-control" value="${p?.minStock||0}"></div>
      <div class="form-group"><label class="form-label">Precio de costo ($)</label>
        <input id="pr-cost" type="number" step="0.01" class="form-control" value="${p?.costPrice||''}"></div>
      <div class="form-group"><label class="form-label">Precio de venta ($)</label>
        <input id="pr-sale" type="number" step="0.01" class="form-control" value="${p?.salePrice||''}"></div>
      <div class="form-group form-full"><label class="form-label">Descripcion</label>
        <textarea id="pr-desc" class="form-control">${p?.description||''}</textarea></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveProducto('${id||''}')">Guardar</button>`);
}

async function saveProducto(id){
  const name=document.getElementById('pr-name').value.trim();
  if(!name){showToast('El nombre es obligatorio','error');return;}
  const data={name,category:document.getElementById('pr-cat').value,
    supplier:document.getElementById('pr-sup').value.trim(),
    stock:parseInt(document.getElementById('pr-stock').value)||0,
    minStock:parseInt(document.getElementById('pr-min').value)||0,
    costPrice:parseFloat(document.getElementById('pr-cost').value)||0,
    salePrice:parseFloat(document.getElementById('pr-sale').value)||0,
    description:document.getElementById('pr-desc').value.trim()};
  try{
    if(id) await col('products').doc(id).update(data);
    else await col('products').add({...data,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    closeModal();showToast('Producto guardado ?','success');
    await preloadCache();renderInventario();
  }catch(e){showToast(e.message,'error');}
}

// ============================================================
// COMPRAS
// ============================================================
let cartCompra = [];

async function renderCompras(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openCompraModal()">+ Nueva Compra</button>`;
  try{
    const snap=await col('compras').orderBy('date','desc').get();
    const data=snap.docs.map(d=>({id:d.id,...d.data()}));
    const rows=data.map(c=>`<tr>
      <td>${fmtDate(c.date)}</td>
      <td><span class="td-main">${c.supplier||'�'}</span></td>
      <td>${(c.items||[]).length} producto(s)</td>
      <td><strong>${fmtMoney(c.total)}</strong></td>
      <td>${c.notes||'�'}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteDoc('compras','${c.id}','renderCompras')">???</button></td></tr>`);
    document.getElementById('content').innerHTML=buildTable(['Fecha','Proveedor','Items','Total','Notas','Acciones'],rows,'No hay compras registradas.');
  }catch(e){showErr(e);}
}

function openCompraModal(){
  cartCompra=[];
  setModal('Nueva Compra',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Proveedor</label>
        <input id="co-sup" class="form-control" placeholder="Nombre del proveedor"></div>
      <div class="form-group"><label class="form-label">Fecha</label>
        <input id="co-date" type="date" class="form-control" value="${today()}"></div>
    </div>
    <div class="form-group">
      <label class="form-label">Agregar producto</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select id="co-prod" class="form-control" style="flex:2;min-width:160px;">
          <option value="">Seleccionar producto...</option>
          ${_cache.products.map(p=>`<option value="${p.id}" data-price="${p.costPrice}">${p.name}</option>`).join('')}
        </select>
        <input id="co-qty" type="number" min="1" value="1" class="form-control" style="width:80px" placeholder="Cant.">
        <input id="co-unit" type="number" step="0.01" class="form-control" style="width:100px" placeholder="Precio unit.">
        <button class="btn btn-secondary" onclick="addToCartCompra()">+ Agregar</button>
      </div>
    </div>
    <div id="cart-compra"></div>
    <div class="form-group"><label class="form-label">Notas</label>
      <textarea id="co-notes" class="form-control"></textarea></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveCompra()">Registrar Compra</button>`);
  document.getElementById('co-prod').onchange=function(){
    const opt=this.options[this.selectedIndex];
    document.getElementById('co-unit').value=opt.dataset.price||'';
  };
  renderCartCompra();
}

function addToCartCompra(){
  const sel=document.getElementById('co-prod');
  const id=sel.value; const name=sel.options[sel.selectedIndex].text;
  const qty=parseInt(document.getElementById('co-qty').value)||1;
  const price=parseFloat(document.getElementById('co-unit').value)||0;
  if(!id){showToast('Selecciona un producto','error');return;}
  const ex=cartCompra.find(x=>x.id===id);
  if(ex){ex.qty+=qty;ex.price=price;}
  else cartCompra.push({id,name,qty,price});
  renderCartCompra();
}

function renderCartCompra(){
  const el=document.getElementById('cart-compra');
  if(!cartCompra.length){el.innerHTML='<p style="color:var(--txt3);font-size:0.82rem;">Sin productos agregados.</p>';return;}
  const total=cartCompra.reduce((s,i)=>s+i.qty*i.price,0);
  el.innerHTML=`<div class="table-wrapper"><table>
    <thead><tr><th>Producto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th><th></th></tr></thead>
    <tbody>${cartCompra.map((i,idx)=>`<tr>
      <td>${i.name}</td><td>${i.qty}</td><td>${fmtMoney(i.price)}</td>
      <td>${fmtMoney(i.qty*i.price)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="cartCompra.splice(${idx},1);renderCartCompra()">?</button></td>
    </tr>`).join('')}
    </tbody></table></div>
    <div style="text-align:right;font-weight:700;margin-top:8px;">Total: ${fmtMoney(total)}</div>`;
}

async function saveCompra(){
  if(!cartCompra.length){showToast('Agrega al menos un producto','error');return;}
  const d=document.getElementById('co-date').value;
  const total=cartCompra.reduce((s,i)=>s+i.qty*i.price,0);
  const data={supplier:document.getElementById('co-sup').value.trim(),
    date:d?firebase.firestore.Timestamp.fromDate(new Date(d)):null,
    items:cartCompra.map(i=>({productId:i.id,productName:i.name,qty:i.qty,price:i.price})),
    total,notes:document.getElementById('co-notes').value.trim()};
  try{
    await col('compras').add({...data,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    // Update stock
    const batch=db.batch();
    cartCompra.forEach(item=>{
      const ref=db.collection('veterinaries').doc(VID).collection('products').doc(item.id);
      const cur=(_cache.products.find(p=>p.id===item.id)||{}).stock||0;
      batch.update(ref,{stock:cur+item.qty});
    });
    await batch.commit();
    closeModal();showToast('Compra registrada ?','success');
    await preloadCache();renderCompras();
  }catch(e){showToast(e.message,'error');}
}

// ============================================================
// VENTAS
// ============================================================
let cartVenta = [];

async function renderVentas(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openVentaModal()">+ Nueva Venta</button>`;
  try{
    const snap=await col('ventas').orderBy('date','desc').get();
    const data=snap.docs.map(d=>({id:d.id,...d.data()}));
    const rows=data.map(v=>`<tr>
      <td>${fmtDate(v.date)}</td>
      <td>${ownerName(v.clientId)||v.clientName||'�'}</td>
      <td>${(v.items||[]).length} item(s)</td>
      <td><strong>${fmtMoney(v.total)}</strong></td>
      <td><span class="badge badge-blue">${v.paymentMethod||'Efectivo'}</span></td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteDoc('ventas','${v.id}','renderVentas')">???</button></td></tr>`);
    document.getElementById('content').innerHTML=buildTable(['Fecha','Cliente','Items','Total','Pago','Acciones'],rows,'No hay ventas registradas.');
  }catch(e){showErr(e);}
}

function openVentaModal(){
  cartVenta=[];
  setModal('Nueva Venta',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Cliente</label>
        <select id="vt-client" class="form-control">
          <option value="">Sin asignar</option>
          ${_cache.owners.map(o=>`<option value="${o.id}">${o.name}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Fecha</label>
        <input id="vt-date" type="date" class="form-control" value="${today()}"></div>
      <div class="form-group"><label class="form-label">Metodo de pago</label>
        <select id="vt-pay" class="form-control">
          <option>Efectivo</option><option>Transferencia</option><option>Tarjeta debito</option><option>Tarjeta credito</option>
        </select></div>
    </div>
    <div class="form-group">
      <label class="form-label">Agregar producto/servicio</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select id="vt-prod" class="form-control" style="flex:2;min-width:160px;">
          <option value="">Seleccionar...</option>
          <optgroup label="Productos">
            ${_cache.products.map(p=>`<option value="${p.id}" data-price="${p.salePrice}" data-type="product">${p.name} (Stock: ${p.stock||0})</option>`).join('')}
          </optgroup>
          <optgroup label="Servicios">
            ${['Consulta','Vacunacion','Bano completo','Corte de pelo','Bano y corte','Cirugia','Internacion']
              .map(s=>`<option value="svc_${s}" data-price="0" data-type="service">${s}</option>`).join('')}
          </optgroup>
        </select>
        <input id="vt-qty" type="number" min="1" value="1" class="form-control" style="width:80px">
        <input id="vt-unit" type="number" step="0.01" class="form-control" style="width:110px" placeholder="Precio">
        <button class="btn btn-secondary" onclick="addToCartVenta()">+ Agregar</button>
      </div>
    </div>
    <div id="cart-venta"></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveVenta()">Registrar Venta</button>`);
  document.getElementById('vt-prod').onchange=function(){
    const opt=this.options[this.selectedIndex];
    document.getElementById('vt-unit').value=opt.dataset.price||'';
  };
  renderCartVenta();
}

function addToCartVenta(){
  const sel=document.getElementById('vt-prod');
  const id=sel.value; const name=sel.options[sel.selectedIndex].text.split(' (')[0];
  const type=sel.options[sel.selectedIndex].dataset.type||'product';
  const qty=parseInt(document.getElementById('vt-qty').value)||1;
  const price=parseFloat(document.getElementById('vt-unit').value)||0;
  if(!id){showToast('Selecciona un producto o servicio','error');return;}
  const ex=cartVenta.find(x=>x.id===id);
  if(ex){ex.qty+=qty;}
  else cartVenta.push({id,name,qty,price,type});
  renderCartVenta();
}

function renderCartVenta(){
  const el=document.getElementById('cart-venta');
  if(!cartVenta.length){el.innerHTML='<p style="color:var(--txt3);font-size:0.82rem;">Sin items.</p>';return;}
  const total=cartVenta.reduce((s,i)=>s+i.qty*i.price,0);
  el.innerHTML=`<div class="table-wrapper"><table>
    <thead><tr><th>Item</th><th>Tipo</th><th>Cant.</th><th>Precio</th><th>Subtotal</th><th></th></tr></thead>
    <tbody>${cartVenta.map((i,idx)=>`<tr>
      <td>${i.name}</td>
      <td><span class="badge ${i.type==='service'?'badge-cyan':'badge-violet'}">${i.type==='service'?'Servicio':'Producto'}</span></td>
      <td>${i.qty}</td><td>${fmtMoney(i.price)}</td><td>${fmtMoney(i.qty*i.price)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="cartVenta.splice(${idx},1);renderCartVenta()">?</button></td>
    </tr>`).join('')}</tbody></table></div>
    <div style="text-align:right;font-weight:700;margin-top:8px;font-size:1.1rem;">Total: ${fmtMoney(total)}</div>`;
}

async function saveVenta(){
  if(!cartVenta.length){showToast('Agrega al menos un item','error');return;}
  const d=document.getElementById('vt-date').value;
  const total=cartVenta.reduce((s,i)=>s+i.qty*i.price,0);
  const data={clientId:document.getElementById('vt-client').value,
    date:d?firebase.firestore.Timestamp.fromDate(new Date(d)):null,
    paymentMethod:document.getElementById('vt-pay').value,
    items:cartVenta.map(i=>({id:i.id,name:i.name,qty:i.qty,price:i.price,type:i.type})),
    total};
  try{
    await col('ventas').add({...data,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    // Descontar stock de productos
    const productItems=cartVenta.filter(i=>i.type==='product');
    if(productItems.length){
      const batch=db.batch();
      productItems.forEach(item=>{
        const ref=db.collection('veterinaries').doc(VID).collection('products').doc(item.id);
        const cur=(_cache.products.find(p=>p.id===item.id)||{}).stock||0;
        batch.update(ref,{stock:Math.max(0,cur-item.qty)});
      });
      await batch.commit();
    }
    closeModal();showToast('Venta registrada ?','success');
    await preloadCache();renderVentas();
  }catch(e){showToast(e.message,'error');}
}

// ============================================================
// TURNOS / AGENDA
// ============================================================
async function renderTurnos(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openTurnoModal()">+ Nuevo Turno</button>`;
  try{
    const snap=await col('turnos').orderBy('date','desc').orderBy('time','desc').get();
    const data=snap.docs.map(d=>({id:d.id,...d.data()}));
    const todayData=data.filter(t=>t.date===today());
    const upcoming=data.filter(t=>t.date>today());
    const past=data.filter(t=>t.date<today());

    const renderRows=(items)=>items.map(t=>`<tr>
      <td><strong>${t.date||'�'}</strong></td>
      <td><strong>${t.time||'�'}</strong></td>
      <td><span class="td-main">${petName(t.petId)}</span></td>
      <td>${ownerName(_cache.pets.find(p=>p.id===t.petId)?.ownerId)}</td>
      <td>${t.reason||'�'}</td>
      <td>${statusBadge(t.status,'turno')}</td>
      <td><div class="td-actions">
        ${t.status==='pending'?`
          <button class="btn btn-sm btn-success" onclick="setTurnoStatus('${t.id}','attended')">?</button>
          <button class="btn btn-sm btn-danger" onclick="setTurnoStatus('${t.id}','cancelled')">?</button>`:'' }
        <button class="btn btn-sm btn-secondary" onclick="openTurnoModal('${t.id}')">??</button>
        <button class="btn btn-sm btn-danger" onclick="deleteDoc('turnos','${t.id}','renderTurnos')">???</button>
      </div></td></tr>`);

    document.getElementById('content').innerHTML=`
      <h4 style="margin-bottom:12px;">?? Hoy (${today()})</h4>
      ${buildTable(['Fecha','Hora','Mascota','Due�o','Motivo','Estado','Acciones'],renderRows(todayData),'No hay turnos para hoy.')}
      <h4 style="margin:20px 0 12px;">?? Proximos turnos</h4>
      ${buildTable(['Fecha','Hora','Mascota','Due�o','Motivo','Estado','Acciones'],renderRows(upcoming.slice(0,10)),'No hay turnos proximos.')}
      <h4 style="margin:20px 0 12px;">?? Historial</h4>
      ${buildTable(['Fecha','Hora','Mascota','Due�o','Motivo','Estado','Acciones'],renderRows(past.slice(0,10)),'Sin historial.')}`;
  }catch(e){showErr(e);}
}

function openTurnoModal(id){
  setModal(id?'Editar Turno':'Nuevo Turno',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mascota *</label>
        <select id="t-pet" class="form-control"><option value="">Seleccionar...</option>${petOptions()}</select></div>
      <div class="form-group"><label class="form-label">Fecha *</label>
        <input id="t-date" type="date" class="form-control" value="${today()}"></div>
      <div class="form-group"><label class="form-label">Hora *</label>
        <input id="t-time" type="time" class="form-control" value="09:00"></div>
      <div class="form-group"><label class="form-label">Estado</label>
        <select id="t-status" class="form-control">
          <option value="pending">? Pendiente</option>
          <option value="attended">? Atendido</option>
          <option value="cancelled">? Cancelado</option>
        </select></div>
      <div class="form-group form-full"><label class="form-label">Motivo de la consulta</label>
        <input id="t-reason" class="form-control" placeholder="Ej: Control anual, Vacunacion..."></div>
      <div class="form-group form-full"><label class="form-label">Notas</label>
        <textarea id="t-notes" class="form-control"></textarea></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveTurno('${id||''}')">Guardar</button>`);
}

async function saveTurno(id){
  const petId=document.getElementById('t-pet').value;
  const date=document.getElementById('t-date').value;
  const time=document.getElementById('t-time').value;
  if(!petId||!date){showToast('Selecciona mascota y fecha','error');return;}
  const data={petId,date,time,reason:document.getElementById('t-reason').value.trim(),
    status:document.getElementById('t-status').value,
    notes:document.getElementById('t-notes').value.trim()};
  try{
    if(id) await col('turnos').doc(id).update(data);
    else await col('turnos').add({...data,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    closeModal();showToast('Turno guardado ?','success');renderTurnos();
  }catch(e){showToast(e.message,'error');}
}

async function setTurnoStatus(id,status){
  try{
    await col('turnos').doc(id).update({status});
    showToast('Turno actualizado','success');renderTurnos();
  }catch(e){showToast(e.message,'error');}
}

// ============================================================
// REPORTES
// ============================================================
async function renderReportes(){
  document.getElementById('content').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div class="card"><h4 style="margin-bottom:12px;">?? Ingresos por Ventas (ultimos meses)</h4>
        <div class="chart-container"><canvas id="ch-ventas"></canvas></div></div>
      <div class="card"><h4 style="margin-bottom:12px;">?? Servicios mas realizados</h4>
        <div class="chart-container"><canvas id="ch-servicios"></canvas></div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div class="card"><h4 style="margin-bottom:12px;">?? Pacientes por especie</h4>
        <div class="chart-container"><canvas id="ch-especies"></canvas></div></div>
      <div class="card"><h4 style="margin-bottom:12px;">?? Productos con mas ventas</h4>
        <div class="chart-container"><canvas id="ch-productos"></canvas></div></div>
    </div>`;
  try{
    const [ventasSnap,banosSnap,cirugSnap,vacSnap]=await Promise.all([
      col('ventas').orderBy('date','desc').limit(100).get(),
      col('banos').get(),col('cirugias').get(),col('vacunaciones').get()
    ]);
    // Ventas por mes
    const ventasByMonth={};
    ventasSnap.docs.forEach(d=>{
      const t=d.data(); if(!t.date) return;
      const dt=t.date.toDate?t.date.toDate():new Date(t.date);
      const key=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
      ventasByMonth[key]=(ventasByMonth[key]||0)+(t.total||0);
    });
    const months=Object.keys(ventasByMonth).sort().slice(-6);
    new Chart(document.getElementById('ch-ventas'),{type:'bar',
      data:{labels:months,datasets:[{label:'Ventas ($)',data:months.map(m=>ventasByMonth[m]),
        backgroundColor:'rgba(124,58,237,0.7)',borderRadius:6}]},
      options:{plugins:{legend:{labels:{color:'#94a3b8'}}},scales:{x:{ticks:{color:'#94a3b8'}},y:{ticks:{color:'#94a3b8'}}}}});
    // Servicios
    const svcCount={Banos:banosSnap.docs.length,Cirugias:cirugSnap.docs.length,Vacunaciones:vacSnap.docs.length};
    new Chart(document.getElementById('ch-servicios'),{type:'doughnut',
      data:{labels:Object.keys(svcCount),datasets:[{data:Object.values(svcCount),
        backgroundColor:['#06b6d4','#7c3aed','#10b981'],borderWidth:0}]},
      options:{plugins:{legend:{labels:{color:'#94a3b8'}}}}});
    // Especies
    const espCount={};
    _cache.pets.forEach(p=>{espCount[p.species||'otro']=(espCount[p.species||'otro']||0)+1;});
    new Chart(document.getElementById('ch-especies'),{type:'pie',
      data:{labels:Object.keys(espCount),datasets:[{data:Object.values(espCount),
        backgroundColor:['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#3b82f6'],borderWidth:0}]},
      options:{plugins:{legend:{labels:{color:'#94a3b8'}}}}});
    // Productos mas vendidos
    const prodCount={};
    ventasSnap.docs.forEach(d=>{
      (d.data().items||[]).filter(i=>i.type==='product').forEach(i=>{
        prodCount[i.name]=(prodCount[i.name]||0)+i.qty;
      });
    });
    const topProds=Object.entries(prodCount).sort((a,b)=>b[1]-a[1]).slice(0,6);
    new Chart(document.getElementById('ch-productos'),{type:'bar',
      data:{labels:topProds.map(x=>x[0]),datasets:[{label:'Unidades vendidas',data:topProds.map(x=>x[1]),
        backgroundColor:'rgba(6,182,212,0.7)',borderRadius:6}]},
      options:{indexAxis:'y',plugins:{legend:{labels:{color:'#94a3b8'}}},scales:{x:{ticks:{color:'#94a3b8'}},y:{ticks:{color:'#94a3b8'}}}}});
  }catch(e){showErr(e);}
}

// ============================================================
// HELPERS COMUNES
// ============================================================
async function deleteDoc(colName,id,refreshFn){
  if(!confirm('Eliminar este registro? Esta accion no se puede deshacer.')) return;
  try{
    await col(colName).doc(id).delete();
    showToast('Eliminado correctamente','success');
    if(window[refreshFn]) window[refreshFn]();
  }catch(e){showToast(e.message,'error');}
}

function showErr(e){
  document.getElementById('content').innerHTML=`<div class="alert alert-danger">Error al cargar datos: ${e.message}<br><small>Asegurate de haber configurado Firebase correctamente.</small></div>`;
}
