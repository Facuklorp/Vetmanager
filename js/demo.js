// VETMANAGER DEMO - localStorage only
const DEMO_KEY = 'vetmanager_demo';

function getDB() {
  const d = localStorage.getItem(DEMO_KEY);
  return d ? JSON.parse(d) : { owners:[], pets:[], vacunaciones:[], consultas:[], cirugias:[], banos:[], internaciones:[], products:[], compras:[], ventas:[], turnos:[] };
}
function saveDB(db) { localStorage.setItem(DEMO_KEY, JSON.stringify(db)); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

function seedDemoData() {
  let db = getDB();
  if (db.owners.length > 0) return;
  const o1 = genId(), o2 = genId(), o3 = genId();
  const p1 = genId(), p2 = genId(), p3 = genId(), p4 = genId();
  const pr1 = genId(), pr2 = genId(), pr3 = genId();
  db.owners = [
    {id:o1,name:'Carlos Mendoza',phone:'11-4523-7890',email:'carlos@gmail.com',address:'Av. Corrientes 1234'},
    {id:o2,name:'Maria Lopez',phone:'11-6734-2210',email:'maria@gmail.com',address:'Belgrano 456'},
    {id:o3,name:'Jorge Perez',phone:'11-3398-5521',email:'jorge@gmail.com',address:'San Martin 789'}
  ];
  db.pets = [
    {id:p1,name:'Firulais',species:'perro',breed:'Labrador',sex:'M',weight:28,color:'Amarillo',ownerId:o1,status:'active',birthDate:'2020-03-15'},
    {id:p2,name:'Misi',species:'gato',breed:'Persa',sex:'F',weight:4.2,color:'Blanco',ownerId:o1,status:'active',birthDate:'2021-06-01'},
    {id:p3,name:'Rocky',species:'perro',breed:'Bulldog',sex:'M',weight:22,color:'Atigrado',ownerId:o2,status:'active',birthDate:'2019-11-20'},
    {id:p4,name:'Piolina',species:'ave',breed:'Canario',sex:'F',weight:0.03,color:'Amarillo',ownerId:o3,status:'active',birthDate:'2022-01-10'}
  ];
  db.products = [
    {id:pr1,name:'Amoxicilina 250mg',category:'Medicamentos',stock:15,minStock:5,costPrice:800,salePrice:1200,supplier:'DistribuidoraMed'},
    {id:pr2,name:'Alimento Royal Canin 15kg',category:'Alimentos',stock:3,minStock:5,costPrice:12000,salePrice:16000,supplier:'PetFood SA'},
    {id:pr3,name:'Antiparasitario Frontline',category:'Antiparasitarios',stock:20,minStock:8,costPrice:2500,salePrice:3800,supplier:'Zoetis'}
  ];
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
  db.vacunaciones = [
    {id:genId(),petId:p1,vaccine:'Séxtuple',dose:'1ml',weight:28,date:yesterday,nextDose:new Date(Date.now()+365*86400000).toISOString().split('T')[0],vet:'Dr. García',notes:'Sin reacciones'},
    {id:genId(),petId:p3,vaccine:'Antirrábica',dose:'1ml',weight:22,date:yesterday,nextDose:new Date(Date.now()+20*86400000).toISOString().split('T')[0],vet:'Dr. García',notes:''}
  ];
  db.consultas = [
    {id:genId(),petId:p1,date:yesterday,weight:28,temperature:38.5,symptoms:'Decaimiento, falta de apetito',diagnosis:'Gastroenteritis leve',treatment:'Dieta blanda 48hs',medications:'Metronidazol 250mg 2x día',vet:'Dr. García',nextVisit:''}
  ];
  db.banos = [
    {id:genId(),petId:p1,date:yesterday,service:'Baño completo',price:3500,notes:'Pelaje brillante'},
    {id:genId(),petId:p3,date:today,service:'Baño y corte',price:5000,notes:''}
  ];
  db.cirugias = [
    {id:genId(),petId:p2,date:'2024-08-10',type:'Esterilización',vet:'Dr. García',anesthesia:'Isoflurano',preWeight:4.2,duration:45,result:'exitosa',notes:'Sin complicaciones',postCare:'Collar isabelino 10 días'}
  ];
  db.internaciones = [
    {id:genId(),petId:p3,admissionDate:yesterday,reason:'Fractura de pata delantera derecha',evolution:'Estable, respondiendo bien al tratamiento',vet:'Dr. García',active:true,dischargeDate:null}
  ];
  db.ventas = [
    {id:genId(),clientId:o1,date:yesterday,paymentMethod:'Efectivo',items:[{id:pr1,name:'Amoxicilina 250mg',qty:2,price:1200,type:'product'}],total:2400},
    {id:genId(),clientId:o2,date:today,paymentMethod:'Transferencia',items:[{id:'svc_Consulta',name:'Consulta',qty:1,price:4000,type:'service'}],total:4000}
  ];
  db.compras = [
    {id:genId(),supplier:'DistribuidoraMed',date:yesterday,items:[{productId:pr1,productName:'Amoxicilina 250mg',qty:20,price:800}],total:16000,notes:'Pedido mensual'}
  ];
  db.turnos = [
    {id:genId(),petId:p1,date:today,time:'10:00',reason:'Control post consulta',status:'pending',notes:''},
    {id:genId(),petId:p3,date:today,time:'14:30',reason:'Revisión internación',status:'attended',notes:''},
    {id:genId(),petId:p2,date:new Date(Date.now()+2*86400000).toISOString().split('T')[0],time:'09:00',reason:'Vacunación anual',status:'pending',notes:''}
  ];
  saveDB(db);
}

// Bootstrap
seedDemoData();
let _cache = { owners:[], pets:[], products:[] };
function preloadCache() {
  const db = getDB();
  _cache.owners = db.owners;
  _cache.pets = db.pets;
  _cache.products = db.products;
  updateBadges();
}
function updateBadges() {
  const low = _cache.products.filter(p=>(p.stock||0)<=(p.minStock||0)).length;
  const b = document.getElementById('badge-stock');
  if(low>0){b.textContent=low;b.style.display='inline';}else b.style.display='none';
}

function col(name) { return { _name: name }; }

// Firestore-like API over localStorage
const db = {
  collection: (name) => ({
    _col: name,
    orderBy: function() { return this; },
    where: function() { return this; },
    limit: function() { return this; },
    get: function() {
      const data = getDB()[this._col] || [];
      return Promise.resolve({ docs: data.map(d=>({id:d.id, data:()=>d, ...d})) });
    },
    doc: function(id) {
      const col = this._col;
      return {
        get: function() {
          const data = getDB()[col]||[];
          const item = data.find(x=>x.id===id);
          return Promise.resolve({exists:!!item, data:()=>item, id});
        },
        update: function(updates) {
          const d = getDB();
          const arr = d[col]||[];
          const idx = arr.findIndex(x=>x.id===id);
          if(idx>-1) { arr[idx]={...arr[idx],...updates}; d[col]=arr; saveDB(d); }
          return Promise.resolve();
        },
        delete: function() {
          const d = getDB();
          d[col]=(d[col]||[]).filter(x=>x.id!==id);
          saveDB(d);
          return Promise.resolve();
        }
      };
    },
    add: function(data) {
      const d = getDB();
      const id = genId();
      const item = {...data, id};
      if(!d[this._col]) d[this._col]=[];
      d[this._col].push(item);
      saveDB(d);
      return Promise.resolve({id});
    }
  })
};

// Fake firebase object
const firebase = {
  firestore: { 
    FieldValue: { serverTimestamp: ()=>new Date().toISOString() },
    Timestamp: { fromDate: (d)=>d instanceof Date?d.toISOString():d }
  }
};

// Fake nested col helper for app.js compatibility
const VID = 'demo';
function col2(name) {
  return {
    _col: name,
    orderBy: function() { return this; },
    where: function() { return this; },
    limit: function() { return this; },
    get: function() {
      const data = getDB()[this._col] || [];
      return Promise.resolve({ docs: data.map(d=>({id:d.id, data:()=>({...d}), ...d})) });
    },
    doc: function(id) {
      const col = this._col;
      return {
        get: function() {
          const data = getDB()[col]||[];
          const item = data.find(x=>x.id===id);
          return Promise.resolve({exists:!!item, data:()=>({...item}), id});
        },
        update: function(updates) {
          const d = getDB();
          const arr = d[col]||[];
          const idx = arr.findIndex(x=>x.id===id);
          if(idx>-1) { arr[idx]={...arr[idx],...updates}; d[col]=arr; saveDB(d); }
          return Promise.resolve();
        },
        delete: function() {
          const d = getDB();
          d[col]=(d[col]||[]).filter(x=>x.id!==id);
          saveDB(d);
          return Promise.resolve();
        }
      };
    },
    add: function(item) {
      const d = getDB();
      const id = genId();
      const newItem = {...item, id};
      if(!d[this._col]) d[this._col]=[];
      d[this._col].push(newItem);
      saveDB(d);
      return Promise.resolve({id});
    }
  };
}

// Override col() for demo compatibility
function col(name) { return col2(name); }

// Batch write stub
db.batch = function() {
  const ops = [];
  return {
    update: function(ref, data) { ops.push({ref,data}); return this; },
    commit: async function() {
      for(const op of ops) { await op.ref.update(op.data); }
      return Promise.resolve();
    }
  };
};

// ─── All app.js utility functions ───
function fmtDate(v) {
  if(!v) return '—';
  const d = v instanceof Date ? v : new Date(v);
  if(isNaN(d)) return String(v).split('T')[0];
  return new Intl.DateTimeFormat('es-AR').format(d);
}
function fmtMoney(n) { return '$'+Number(n||0).toLocaleString('es-AR',{minimumFractionDigits:2}); }
function today() { return new Date().toISOString().split('T')[0]; }
function calcAge(b) {
  if(!b) return '—';
  const d = new Date(b);
  const months = Math.floor((Date.now()-d)/(1000*60*60*24*30.44));
  return months<12 ? months+' meses' : Math.floor(months/12)+' años';
}
function petName(id) { return (_cache.pets.find(p=>p.id===id)||{}).name||'—'; }
function ownerName(id) { const o=_cache.owners.find(x=>x.id===id); return o?o.name:'—'; }
function speciesIcon(s) { return {perro:'🐶',gato:'🐱',ave:'🐦',conejo:'🐰',hamster:'🐹',reptil:'🦎',otro:'🐾'}[s]||'🐾'; }
function buildTable(headers,rows,empty='No hay registros') {
  if(!rows.length) return `<div class="empty-state"><div class="empty-icon">📋</div><p>${empty}</p></div>`;
  return `<div class="table-wrapper"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
function petOptions(sel='') { return _cache.pets.map(p=>`<option value="${p.id}" ${p.id===sel?'selected':''}>${speciesIcon(p.species)} ${p.name} (${ownerName(p.ownerId)})</option>`).join(''); }
function ownerOptions(sel='') { return _cache.owners.map(o=>`<option value="${o.id}" ${o.id===sel?'selected':''}>${o.name}</option>`).join(''); }
function statusBadge(s,type='') {
  if(type==='turno'){
    const m={pending:'badge-yellow',attended:'badge-green',cancelled:'badge-red'};
    const t={pending:'⏳ Pendiente',attended:'✅ Atendido',cancelled:'❌ Cancelado'};
    return `<span class="badge ${m[s]||'badge-gray'}">${t[s]||s}</span>`;
  }
  return `<span class="badge badge-gray">${s}</span>`;
}
function openModal() { document.getElementById('modal-overlay').classList.add('open'); }
function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
function closeModalIfOutside(e) { if(e.target.id==='modal-overlay') closeModal(); }
function setModal(title,body,footer) {
  document.getElementById('modal-title').textContent=title;
  document.getElementById('modal-body').innerHTML=body;
  document.getElementById('modal-footer').innerHTML=footer;
  openModal();
}
function showToast(msg,type='info') {
  const ex=document.getElementById('toast'); if(ex) ex.remove();
  const t=document.createElement('div'); t.id='toast'; t.className=`toast toast-${type}`; t.textContent=msg;
  document.body.appendChild(t); setTimeout(()=>t.classList.add('show'),10);
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300);},3000);
}
function showErr(e) { document.getElementById('content').innerHTML=`<div class="alert alert-danger">Error: ${e.message}</div>`; }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function navigateTo(module) {
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.module===module));
  const titles={dashboard:'Dashboard',duenos:'Clientes / Dueños',mascotas:'Mascotas',vacunaciones:'Vacunaciones',
    consultas:'Consultas / Historia Clínica',cirugias:'Cirugías',banos:'Baños / Peluquería',
    internaciones:'Internaciones',inventario:'Inventario',compras:'Compras',ventas:'Ventas',
    turnos:'Turnos / Agenda',reportes:'Reportes'};
  document.getElementById('page-title').textContent=titles[module]||module;
  document.getElementById('header-actions').innerHTML='';
  document.getElementById('content').innerHTML='<div class="loading"><div class="spinner"></div> Cargando...</div>';
  preloadCache();
  const fn={dashboard:renderDashboard,duenos:renderDuenos,mascotas:renderMascotas,
    vacunaciones:renderVacunaciones,consultas:renderConsultas,cirugias:renderCirugias,
    banos:renderBanos,internaciones:renderInternaciones,inventario:renderInventario,
    compras:renderCompras,ventas:renderVentas,turnos:renderTurnos,reportes:renderReportes}[module];
  if(fn) fn();
}
async function deleteDoc(colName,id,refreshFn) {
  if(!confirm('¿Eliminar este registro?')) return;
  try { await col(colName).doc(id).delete(); showToast('Eliminado','success'); preloadCache(); if(window[refreshFn]) window[refreshFn](); }
  catch(e) { showToast(e.message,'error'); }
}

// DASHBOARD
async function renderDashboard() {
  const dbd = getDB();
  const todayStr = today();
  const todayTurnos = dbd.turnos.filter(t=>t.date===todayStr);
  const internados = dbd.internaciones.filter(x=>x.active).length;
  const lowStock = _cache.products.filter(p=>(p.stock||0)<=(p.minStock||0)).length;
  const in30 = new Date(Date.now()+30*86400000).toISOString().split('T')[0];
  const upcoming = dbd.vacunaciones.filter(v=>v.nextDose&&v.nextDose>=todayStr&&v.nextDose<=in30).length;
  document.getElementById('content').innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-icon">🐶</div><div class="kpi-value">${_cache.pets.length}</div><div class="kpi-label">Pacientes registrados</div></div>
      <div class="kpi-card"><div class="kpi-icon">📅</div><div class="kpi-value">${todayTurnos.length}</div><div class="kpi-label">Turnos hoy</div></div>
      <div class="kpi-card"><div class="kpi-icon">📦</div><div class="kpi-value" style="color:${lowStock?'var(--red)':'var(--green)'}">${lowStock}</div><div class="kpi-label">Productos stock bajo</div></div>
      <div class="kpi-card"><div class="kpi-icon">💉</div><div class="kpi-value" style="color:${upcoming?'var(--yellow)':'var(--green)'}">${upcoming}</div><div class="kpi-label">Vacunas próximas (30d)</div></div>
    </div>
    <div class="dashboard-grid" style="margin-top:24px;">
      <div>
        <div class="card" style="margin-bottom:16px;">
          <h4 style="margin-bottom:14px;">🕐 Accesos Rápidos</h4>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            ${[['📅','Nuevo Turno','turnos'],['💉','Vacunar','vacunaciones'],['🏥','Consulta','consultas'],
              ['🛁','Baño','banos'],['🔪','Cirugía','cirugias'],['💰','Venta','ventas']]
              .map(([ico,lbl,mod])=>`<button class="btn btn-secondary" style="flex-direction:column;gap:4px;padding:14px 8px;" onclick="navigateTo('${mod}')"><span style="font-size:1.4rem;">${ico}</span><span style="font-size:0.75rem;">${lbl}</span></button>`).join('')}
          </div>
        </div>
        ${internados?`<div class="alert alert-warning" style="margin-bottom:12px;">🛏️ <strong>${internados}</strong> mascota(s) internada(s).</div>`:''}
        ${lowStock?`<div class="alert alert-danger">📦 <strong>${lowStock}</strong> producto(s) con stock bajo.</div>`:''}
      </div>
      <div class="card">
        <h4 style="margin-bottom:14px;">📅 Turnos de hoy</h4>
        ${!todayTurnos.length?'<p style="color:var(--txt3);font-size:0.82rem;">No hay turnos para hoy.</p>':
        `<div class="recent-list">${todayTurnos.map(t=>`<div class="recent-item">
          <span class="ri-icon">🕐</span>
          <div class="ri-text"><strong>${t.time}</strong> — ${petName(t.petId)}<br><span style="font-size:0.75rem;color:var(--txt3);">${t.reason||''}</span></div>
          ${statusBadge(t.status,'turno')}</div>`).join('')}</div>`}
      </div>
    </div>`;
}

// DUENOS
async function renderDuenos() {
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openDuenoModal()">+ Nuevo Cliente</button>`;
  preloadCache(); renderDuenosTable(_cache.owners,'');
}
function renderDuenosTable(owners,q) {
  const filtered=q?owners.filter(o=>o.name.toLowerCase().includes(q.toLowerCase())):owners;
  const rows=filtered.map(o=>{
    const pc=_cache.pets.filter(p=>p.ownerId===o.id).length;
    return `<tr><td><span class="td-main">${o.name}</span></td><td>${o.phone||'—'}</td><td>${o.email||'—'}</td><td>${o.address||'—'}</td>
      <td><span class="badge badge-violet">${pc} mascota(s)</span></td>
      <td><div class="td-actions"><button class="btn btn-sm btn-secondary" onclick="openDuenoModal('${o.id}')">✏️</button>
      <button class="btn btn-sm btn-danger" onclick="deleteDoc('owners','${o.id}','renderDuenos')">🗑️</button></div></td></tr>`;
  });
  document.getElementById('content').innerHTML=`
    <div class="search-bar"><div class="search-input-wrap"><span class="search-icon">🔍</span>
      <input class="form-control search-input" placeholder="Buscar..." oninput="renderDuenosTable(_cache.owners,this.value)"></div></div>
    ${buildTable(['Nombre','Teléfono','Email','Dirección','Mascotas','Acciones'],rows,'No hay clientes.')}`;
}
function openDuenoModal(id) {
  const o=id?_cache.owners.find(x=>x.id===id):null;
  setModal(o?'Editar Cliente':'Nuevo Cliente',`
    <div class="form-grid">
      <div class="form-group form-full"><label class="form-label">Nombre *</label><input id="d-name" class="form-control" value="${o?.name||''}" placeholder="Juan García"></div>
      <div class="form-group"><label class="form-label">Teléfono</label><input id="d-phone" class="form-control" value="${o?.phone||''}"></div>
      <div class="form-group"><label class="form-label">Email</label><input id="d-email" class="form-control" value="${o?.email||''}"></div>
      <div class="form-group form-full"><label class="form-label">Dirección</label><input id="d-address" class="form-control" value="${o?.address||''}"></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveDueno('${id||''}')">Guardar</button>`);
}
async function saveDueno(id) {
  const name=document.getElementById('d-name').value.trim();
  if(!name){showToast('Nombre obligatorio','error');return;}
  const data={name,phone:document.getElementById('d-phone').value.trim(),email:document.getElementById('d-email').value.trim(),address:document.getElementById('d-address').value.trim()};
  try{
    if(id) await col('owners').doc(id).update(data);
    else await col('owners').add(data);
    closeModal();showToast('Guardado ✅','success');preloadCache();renderDuenos();
  }catch(e){showToast(e.message,'error');}
}

// MASCOTAS
async function renderMascotas() {
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openMascotaModal()">+ Nueva Mascota</button>`;
  preloadCache(); renderMascotasTable(_cache.pets,'');
}
function renderMascotasTable(pets,q) {
  const filtered=q?pets.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())):pets;
  const rows=filtered.map(p=>`<tr>
    <td><span class="td-main">${speciesIcon(p.species)} ${p.name}</span></td>
    <td>${p.species||'—'}</td><td>${p.breed||'—'}</td><td>${calcAge(p.birthDate)}</td>
    <td>${p.weight?p.weight+' kg':'—'}</td><td>${p.sex==='M'?'♂️ Macho':'♀️ Hembra'}</td>
    <td>${ownerName(p.ownerId)}</td>
    <td>${p.status==='active'?'<span class="badge badge-green">Activo</span>':'<span class="badge badge-gray">Fallecido</span>'}</td>
    <td><div class="td-actions"><button class="btn btn-sm btn-secondary" onclick="openMascotaModal('${p.id}')">✏️</button>
    <button class="btn btn-sm btn-danger" onclick="deleteDoc('pets','${p.id}','renderMascotas')">🗑️</button></div></td></tr>`);
  document.getElementById('content').innerHTML=`
    <div class="search-bar"><div class="search-input-wrap"><span class="search-icon">🔍</span>
      <input class="form-control search-input" placeholder="Buscar..." oninput="renderMascotasTable(_cache.pets,this.value)"></div></div>
    ${buildTable(['Nombre','Especie','Raza','Edad','Peso','Sexo','Dueño','Estado','Acciones'],rows,'No hay mascotas.')}`;
}
function openMascotaModal(id) {
  const p=id?_cache.pets.find(x=>x.id===id):null;
  setModal(p?'Editar Mascota':'Nueva Mascota',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Nombre *</label><input id="p-name" class="form-control" value="${p?.name||''}"></div>
      <div class="form-group"><label class="form-label">Especie</label>
        <select id="p-species" class="form-control">${['perro','gato','ave','conejo','hamster','reptil','otro'].map(s=>`<option value="${s}" ${p?.species===s?'selected':''}>${speciesIcon(s)} ${s}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Raza</label><input id="p-breed" class="form-control" value="${p?.breed||''}"></div>
      <div class="form-group"><label class="form-label">Sexo</label>
        <select id="p-sex" class="form-control"><option value="M" ${p?.sex==='M'?'selected':''}>♂️ Macho</option><option value="F" ${p?.sex==='F'?'selected':''}>♀️ Hembra</option></select></div>
      <div class="form-group"><label class="form-label">Fecha nacimiento</label><input id="p-birth" type="date" class="form-control" value="${p?.birthDate||''}"></div>
      <div class="form-group"><label class="form-label">Peso (kg)</label><input id="p-weight" type="number" step="0.1" class="form-control" value="${p?.weight||''}"></div>
      <div class="form-group form-full"><label class="form-label">Dueño</label>
        <select id="p-owner" class="form-control"><option value="">Sin asignar</option>${ownerOptions(p?.ownerId)}</select></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveMascota('${id||''}')">Guardar</button>`);
}
async function saveMascota(id) {
  const name=document.getElementById('p-name').value.trim();
  if(!name){showToast('Nombre obligatorio','error');return;}
  const data={name,species:document.getElementById('p-species').value,breed:document.getElementById('p-breed').value.trim(),
    sex:document.getElementById('p-sex').value,birthDate:document.getElementById('p-birth').value,
    weight:parseFloat(document.getElementById('p-weight').value)||null,
    ownerId:document.getElementById('p-owner').value,status:'active'};
  try{
    if(id) await col('pets').doc(id).update(data);
    else await col('pets').add(data);
    closeModal();showToast('Guardado ✅','success');preloadCache();renderMascotas();
  }catch(e){showToast(e.message,'error');}
}

// VACUNACIONES
async function renderVacunaciones() {
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openVacModal()">+ Nueva Vacunación</button>`;
  const data=getDB().vacunaciones||[];
  const todayStr=today();
  const in30=new Date(Date.now()+30*86400000).toISOString().split('T')[0];
  const near=data.filter(v=>v.nextDose&&v.nextDose>=todayStr&&v.nextDose<=in30);
  const rows=data.map(v=>`<tr>
    <td>${fmtDate(v.date)}</td><td><span class="td-main">${petName(v.petId)}</span></td>
    <td>${v.vaccine||'—'}</td><td>${v.weight?v.weight+' kg':'—'}</td><td>${v.dose||'—'}</td>
    <td><span class="${v.nextDose&&v.nextDose<=in30&&v.nextDose>=todayStr?'badge badge-yellow':''}">${v.nextDose||'—'}</span></td>
    <td>${v.vet||'—'}</td>
    <td><div class="td-actions"><button class="btn btn-sm btn-secondary" onclick="openVacModal('${v.id}')">✏️</button>
    <button class="btn btn-sm btn-danger" onclick="deleteDoc('vacunaciones','${v.id}','renderVacunaciones')">🗑️</button></div></td></tr>`);
  document.getElementById('content').innerHTML=`
    ${near.length?`<div class="alert alert-warning" style="margin-bottom:16px;">💉 <strong>${near.length}</strong> vacuna(s) próxima(s) a vencer en 30 días.</div>`:''}
    ${buildTable(['Fecha','Mascota','Vacuna','Peso','Dosis','Próxima Dosis','Veterinario','Acciones'],rows,'No hay vacunaciones.')}`;
}
function openVacModal(id){
  const v=id?(getDB().vacunaciones||[]).find(x=>x.id===id):null;
  setModal(id?'Editar Vacunación':'Nueva Vacunación',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mascota *</label>
        <select id="v-pet" class="form-control"><option value="">Seleccionar...</option>${petOptions(v?.petId)}</select></div>
      <div class="form-group"><label class="form-label">Fecha</label><input id="v-date" type="date" class="form-control" value="${v?.date||today()}"></div>
      <div class="form-group"><label class="form-label">Vacuna *</label><input id="v-vaccine" class="form-control" value="${v?.vaccine||''}" placeholder="Ej: Séxtuple, Antirrábica..."></div>
      <div class="form-group"><label class="form-label">Dosis</label><input id="v-dose" class="form-control" value="${v?.dose||''}"></div>
      <div class="form-group"><label class="form-label">Peso (kg)</label><input id="v-weight" type="number" step="0.1" class="form-control" value="${v?.weight||''}"></div>
      <div class="form-group"><label class="form-label">Próxima dosis</label><input id="v-next" type="date" class="form-control" value="${v?.nextDose||''}"></div>
      <div class="form-group"><label class="form-label">Veterinario</label><input id="v-vet" class="form-control" value="${v?.vet||''}"></div>
      <div class="form-group form-full"><label class="form-label">Notas</label><textarea id="v-notes" class="form-control">${v?.notes||''}</textarea></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveVac('${id||''}')">Guardar</button>`);
}
async function saveVac(id){
  const petId=document.getElementById('v-pet').value;
  const vaccine=document.getElementById('v-vaccine').value.trim();
  if(!petId||!vaccine){showToast('Completa los campos obligatorios','error');return;}
  const data={petId,vaccine,dose:document.getElementById('v-dose').value.trim(),
    weight:parseFloat(document.getElementById('v-weight').value)||null,
    date:document.getElementById('v-date').value,nextDose:document.getElementById('v-next').value,
    vet:document.getElementById('v-vet').value.trim(),notes:document.getElementById('v-notes').value.trim()};
  if(id) await col('vacunaciones').doc(id).update(data);
  else await col('vacunaciones').add(data);
  closeModal();showToast('Vacunación guardada ✅','success');renderVacunaciones();
}

// CONSULTAS
async function renderConsultas(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openConsultaModal()">+ Nueva Consulta</button>`;
  const data=getDB().consultas||[];
  const rows=data.map(c=>`<tr>
    <td>${fmtDate(c.date)}</td><td><span class="td-main">${petName(c.petId)}</span></td>
    <td>${c.symptoms||'—'}</td><td>${c.diagnosis||'—'}</td><td>${c.treatment||'—'}</td><td>${c.vet||'—'}</td>
    <td><div class="td-actions"><button class="btn btn-sm btn-secondary" onclick="openConsultaModal('${c.id}')">✏️</button>
    <button class="btn btn-sm btn-danger" onclick="deleteDoc('consultas','${c.id}','renderConsultas')">🗑️</button></div></td></tr>`);
  document.getElementById('content').innerHTML=buildTable(['Fecha','Mascota','Síntomas','Diagnóstico','Tratamiento','Veterinario','Acciones'],rows,'No hay consultas.');
}
function openConsultaModal(id){
  const c=id?(getDB().consultas||[]).find(x=>x.id===id):null;
  setModal(id?'Editar Consulta':'Nueva Consulta',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mascota *</label>
        <select id="c-pet" class="form-control"><option value="">Seleccionar...</option>${petOptions(c?.petId)}</select></div>
      <div class="form-group"><label class="form-label">Fecha</label><input id="c-date" type="date" class="form-control" value="${c?.date||today()}"></div>
      <div class="form-group"><label class="form-label">Peso (kg)</label><input id="c-weight" type="number" step="0.1" class="form-control" value="${c?.weight||''}"></div>
      <div class="form-group"><label class="form-label">Temperatura (°C)</label><input id="c-temp" type="number" step="0.1" class="form-control" value="${c?.temperature||''}"></div>
      <div class="form-group form-full"><label class="form-label">Síntomas</label><textarea id="c-symptoms" class="form-control">${c?.symptoms||''}</textarea></div>
      <div class="form-group form-full"><label class="form-label">Diagnóstico</label><textarea id="c-diagnosis" class="form-control">${c?.diagnosis||''}</textarea></div>
      <div class="form-group form-full"><label class="form-label">Tratamiento</label><textarea id="c-treatment" class="form-control">${c?.treatment||''}</textarea></div>
      <div class="form-group form-full"><label class="form-label">Medicamentos</label><textarea id="c-meds" class="form-control">${c?.medications||''}</textarea></div>
      <div class="form-group"><label class="form-label">Veterinario</label><input id="c-vet" class="form-control" value="${c?.vet||''}"></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveConsulta('${id||''}')">Guardar</button>`);
}
async function saveConsulta(id){
  const petId=document.getElementById('c-pet').value;
  if(!petId){showToast('Selecciona una mascota','error');return;}
  const data={petId,date:document.getElementById('c-date').value,
    weight:parseFloat(document.getElementById('c-weight').value)||null,
    temperature:parseFloat(document.getElementById('c-temp').value)||null,
    symptoms:document.getElementById('c-symptoms').value.trim(),
    diagnosis:document.getElementById('c-diagnosis').value.trim(),
    treatment:document.getElementById('c-treatment').value.trim(),
    medications:document.getElementById('c-meds').value.trim(),
    vet:document.getElementById('c-vet').value.trim()};
  if(id) await col('consultas').doc(id).update(data);
  else await col('consultas').add(data);
  closeModal();showToast('Consulta guardada ✅','success');renderConsultas();
}

// CIRUGIAS
async function renderCirugias(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openCirugiaModal()">+ Nueva Cirugía</button>`;
  const data=getDB().cirugias||[];
  const rows=data.map(c=>`<tr>
    <td>${fmtDate(c.date)}</td><td><span class="td-main">${petName(c.petId)}</span></td>
    <td>${c.type||'—'}</td><td>${c.vet||'—'}</td><td>${c.anesthesia||'—'}</td>
    <td>${c.preWeight?c.preWeight+' kg':'—'}</td>
    <td><span class="badge ${c.result==='exitosa'?'badge-green':c.result==='complicaciones'?'badge-yellow':'badge-red'}">${c.result||'—'}</span></td>
    <td><div class="td-actions"><button class="btn btn-sm btn-secondary" onclick="openCirugiaModal('${c.id}')">✏️</button>
    <button class="btn btn-sm btn-danger" onclick="deleteDoc('cirugias','${c.id}','renderCirugias')">🗑️</button></div></td></tr>`);
  document.getElementById('content').innerHTML=buildTable(['Fecha','Mascota','Tipo','Veterinario','Anestesia','Peso prev.','Resultado','Acciones'],rows,'No hay cirugías.');
}
function openCirugiaModal(id){
  const c=id?(getDB().cirugias||[]).find(x=>x.id===id):null;
  setModal(id?'Editar Cirugía':'Nueva Cirugía',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mascota *</label>
        <select id="ci-pet" class="form-control"><option value="">Seleccionar...</option>${petOptions(c?.petId)}</select></div>
      <div class="form-group"><label class="form-label">Fecha</label><input id="ci-date" type="date" class="form-control" value="${c?.date||today()}"></div>
      <div class="form-group"><label class="form-label">Tipo *</label><input id="ci-type" class="form-control" value="${c?.type||''}" placeholder="Ej: Esterilización..."></div>
      <div class="form-group"><label class="form-label">Veterinario</label><input id="ci-vet" class="form-control" value="${c?.vet||''}"></div>
      <div class="form-group"><label class="form-label">Anestesia</label><input id="ci-anest" class="form-control" value="${c?.anesthesia||''}"></div>
      <div class="form-group"><label class="form-label">Peso previo (kg)</label><input id="ci-weight" type="number" step="0.1" class="form-control" value="${c?.preWeight||''}"></div>
      <div class="form-group"><label class="form-label">Resultado</label>
        <select id="ci-result" class="form-control">
          <option value="exitosa" ${c?.result==='exitosa'?'selected':''}>✅ Exitosa</option>
          <option value="complicaciones" ${c?.result==='complicaciones'?'selected':''}>⚠️ Con complicaciones</option>
          <option value="fallecio" ${c?.result==='fallecio'?'selected':''}>❌ Falleció</option>
        </select></div>
      <div class="form-group form-full"><label class="form-label">Observaciones</label><textarea id="ci-notes" class="form-control">${c?.notes||''}</textarea></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveCirugia('${id||''}')">Guardar</button>`);
}
async function saveCirugia(id){
  const petId=document.getElementById('ci-pet').value;
  const type=document.getElementById('ci-type').value.trim();
  if(!petId||!type){showToast('Completa los campos obligatorios','error');return;}
  const data={petId,type,date:document.getElementById('ci-date').value,
    vet:document.getElementById('ci-vet').value.trim(),anesthesia:document.getElementById('ci-anest').value.trim(),
    preWeight:parseFloat(document.getElementById('ci-weight').value)||null,
    result:document.getElementById('ci-result').value,notes:document.getElementById('ci-notes').value.trim()};
  if(id) await col('cirugias').doc(id).update(data);
  else await col('cirugias').add(data);
  closeModal();showToast('Cirugía guardada ✅','success');renderCirugias();
}

// BANOS
async function renderBanos(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openBanoModal()">+ Nuevo Baño</button>`;
  const data=getDB().banos||[];
  const rows=data.map(b=>`<tr>
    <td>${fmtDate(b.date)}</td><td><span class="td-main">${petName(b.petId)}</span></td>
    <td>${b.service||'—'}</td><td>${b.notes||'—'}</td><td><strong>${fmtMoney(b.price)}</strong></td>
    <td><div class="td-actions"><button class="btn btn-sm btn-secondary" onclick="openBanoModal('${b.id}')">✏️</button>
    <button class="btn btn-sm btn-danger" onclick="deleteDoc('banos','${b.id}','renderBanos')">🗑️</button></div></td></tr>`);
  document.getElementById('content').innerHTML=buildTable(['Fecha','Mascota','Servicio','Notas','Precio','Acciones'],rows,'No hay baños.');
}
function openBanoModal(id){
  const b=id?(getDB().banos||[]).find(x=>x.id===id):null;
  setModal(id?'Editar Baño':'Nuevo Baño / Peluquería',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mascota *</label>
        <select id="b-pet" class="form-control"><option value="">Seleccionar...</option>${petOptions(b?.petId)}</select></div>
      <div class="form-group"><label class="form-label">Fecha</label><input id="b-date" type="date" class="form-control" value="${b?.date||today()}"></div>
      <div class="form-group"><label class="form-label">Servicio</label>
        <select id="b-service" class="form-control">
          ${['Baño completo','Corte de pelo','Baño y corte','Corte de uñas','Desparasitación externa','Otro']
            .map(s=>`<option value="${s}" ${b?.service===s?'selected':''}>${s}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Precio ($)</label><input id="b-price" type="number" step="0.01" class="form-control" value="${b?.price||''}"></div>
      <div class="form-group form-full"><label class="form-label">Observaciones</label><textarea id="b-notes" class="form-control">${b?.notes||''}</textarea></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveBano('${id||''}')">Guardar</button>`);
}
async function saveBano(id){
  const petId=document.getElementById('b-pet').value;
  if(!petId){showToast('Selecciona mascota','error');return;}
  const data={petId,date:document.getElementById('b-date').value,service:document.getElementById('b-service').value,
    price:parseFloat(document.getElementById('b-price').value)||0,notes:document.getElementById('b-notes').value.trim()};
  if(id) await col('banos').doc(id).update(data);
  else await col('banos').add(data);
  closeModal();showToast('Guardado ✅','success');renderBanos();
}

// INTERNACIONES
async function renderInternaciones(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openInternacionModal()">+ Nueva Internación</button>`;
  const data=getDB().internaciones||[];
  const active=data.filter(x=>x.active);
  const hist=data.filter(x=>!x.active);
  const ar=active.map(i=>`<tr style="background:rgba(239,68,68,0.05)">
    <td><span class="td-main">${petName(i.petId)}</span></td><td>${fmtDate(i.admissionDate)}</td>
    <td>${i.reason||'—'}</td><td>${i.evolution||'—'}</td>
    <td><span class="badge badge-red">Internado</span></td>
    <td><div class="td-actions"><button class="btn btn-sm btn-success" onclick="darAlta('${i.id}')">Alta</button>
    <button class="btn btn-sm btn-danger" onclick="deleteDoc('internaciones','${i.id}','renderInternaciones')">🗑️</button></div></td></tr>`);
  const hr=hist.map(i=>`<tr>
    <td><span class="td-main">${petName(i.petId)}</span></td><td>${fmtDate(i.admissionDate)}</td>
    <td>${i.reason||'—'}</td><td>${i.evolution||'—'}</td><td>${fmtDate(i.dischargeDate)}</td>
    <td><button class="btn btn-sm btn-danger" onclick="deleteDoc('internaciones','${i.id}','renderInternaciones')">🗑️</button></td></tr>`);
  document.getElementById('content').innerHTML=`
    ${active.length?`<div class="alert alert-danger" style="margin-bottom:16px;">🛏️ <strong>${active.length}</strong> mascota(s) internada(s)</div>`:''}
    <h4 style="margin-bottom:12px;">Internaciones activas</h4>
    ${buildTable(['Mascota','Ingreso','Motivo','Evolución','Estado','Acciones'],ar,'No hay internaciones activas.')}
    <h4 style="margin:20px 0 12px;">Historial</h4>
    ${buildTable(['Mascota','Ingreso','Motivo','Evolución','Alta','Acciones'],hr,'Sin historial.')}`;
}
function openInternacionModal(){
  setModal('Nueva Internación',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mascota *</label>
        <select id="i-pet" class="form-control"><option value="">Seleccionar...</option>${petOptions()}</select></div>
      <div class="form-group"><label class="form-label">Fecha ingreso</label><input id="i-date" type="date" class="form-control" value="${today()}"></div>
      <div class="form-group form-full"><label class="form-label">Motivo</label><textarea id="i-reason" class="form-control"></textarea></div>
      <div class="form-group form-full"><label class="form-label">Evolución</label><textarea id="i-evol" class="form-control"></textarea></div>
      <div class="form-group"><label class="form-label">Veterinario</label><input id="i-vet" class="form-control"></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveInternacion()">Guardar</button>`);
}
async function saveInternacion(){
  const petId=document.getElementById('i-pet').value;
  if(!petId){showToast('Selecciona mascota','error');return;}
  const data={petId,admissionDate:document.getElementById('i-date').value,
    reason:document.getElementById('i-reason').value.trim(),evolution:document.getElementById('i-evol').value.trim(),
    vet:document.getElementById('i-vet').value.trim(),active:true,dischargeDate:null};
  await col('internaciones').add(data);
  closeModal();showToast('Internación guardada ✅','success');renderInternaciones();
}
async function darAlta(id){
  if(!confirm('¿Dar de alta a este paciente?')) return;
  await col('internaciones').doc(id).update({active:false,dischargeDate:today()});
  showToast('Alta registrada ✅','success');renderInternaciones();
}

// INVENTARIO
async function renderInventario(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openProductoModal()">+ Nuevo Producto</button>`;
  preloadCache();
  const low=_cache.products.filter(p=>(p.stock||0)<=(p.minStock||0));
  const rows=_cache.products.map(p=>{
    const pct=p.minStock>0?Math.min(100,(p.stock||0)/p.minStock*100):100;
    const cls=p.stock<=0?'stock-empty':p.stock<=p.minStock?'stock-low':'stock-ok';
    return `<tr><td><span class="td-main">${p.name}</span></td>
      <td><span class="badge badge-violet">${p.category||'General'}</span></td>
      <td><div style="display:flex;align-items:center;gap:8px;">
        <span style="font-weight:600;color:${p.stock<=0?'var(--red)':p.stock<=p.minStock?'var(--yellow)':'var(--green)'}">${p.stock||0}</span>
        <div class="stock-bar" style="width:60px"><div class="stock-fill ${cls}" style="width:${pct}%"></div></div>
      </div></td>
      <td>${p.minStock||0}</td><td>${fmtMoney(p.costPrice)}</td><td>${fmtMoney(p.salePrice)}</td><td>${p.supplier||'—'}</td>
      <td><div class="td-actions"><button class="btn btn-sm btn-secondary" onclick="openProductoModal('${p.id}')">✏️</button>
      <button class="btn btn-sm btn-danger" onclick="deleteDoc('products','${p.id}','renderInventario')">🗑️</button></div></td></tr>`;
  });
  document.getElementById('content').innerHTML=`
    ${low.length?`<div class="alert alert-danger" style="margin-bottom:16px;">⚠️ <strong>${low.length}</strong> producto(s) con stock bajo.</div>`:''}
    ${buildTable(['Producto','Categoría','Stock','Stock Mín.','P. Costo','P. Venta','Proveedor','Acciones'],rows,'No hay productos.')}`;
  updateBadges();
}
function openProductoModal(id){
  const p=id?_cache.products.find(x=>x.id===id):null;
  setModal(p?'Editar Producto':'Nuevo Producto',`
    <div class="form-grid">
      <div class="form-group form-full"><label class="form-label">Nombre *</label><input id="pr-name" class="form-control" value="${p?.name||''}"></div>
      <div class="form-group"><label class="form-label">Categoría</label>
        <select id="pr-cat" class="form-control">${['Medicamentos','Alimentos','Accesorios','Antiparasitarios','Vacunas','Higiene','Otro'].map(c=>`<option value="${c}" ${p?.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Proveedor</label><input id="pr-sup" class="form-control" value="${p?.supplier||''}"></div>
      <div class="form-group"><label class="form-label">Stock actual</label><input id="pr-stock" type="number" class="form-control" value="${p?.stock||0}"></div>
      <div class="form-group"><label class="form-label">Stock mínimo</label><input id="pr-min" type="number" class="form-control" value="${p?.minStock||0}"></div>
      <div class="form-group"><label class="form-label">Precio costo ($)</label><input id="pr-cost" type="number" step="0.01" class="form-control" value="${p?.costPrice||''}"></div>
      <div class="form-group"><label class="form-label">Precio venta ($)</label><input id="pr-sale" type="number" step="0.01" class="form-control" value="${p?.salePrice||''}"></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveProducto('${id||''}')">Guardar</button>`);
}
async function saveProducto(id){
  const name=document.getElementById('pr-name').value.trim();
  if(!name){showToast('Nombre obligatorio','error');return;}
  const data={name,category:document.getElementById('pr-cat').value,supplier:document.getElementById('pr-sup').value.trim(),
    stock:parseInt(document.getElementById('pr-stock').value)||0,minStock:parseInt(document.getElementById('pr-min').value)||0,
    costPrice:parseFloat(document.getElementById('pr-cost').value)||0,salePrice:parseFloat(document.getElementById('pr-sale').value)||0};
  if(id) await col('products').doc(id).update(data);
  else await col('products').add(data);
  closeModal();showToast('Guardado ✅','success');preloadCache();renderInventario();
}

// COMPRAS
let cartCompra=[];
async function renderCompras(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openCompraModal()">+ Nueva Compra</button>`;
  const data=getDB().compras||[];
  const rows=data.map(c=>`<tr>
    <td>${fmtDate(c.date)}</td><td><span class="td-main">${c.supplier||'—'}</span></td>
    <td>${(c.items||[]).length} producto(s)</td><td><strong>${fmtMoney(c.total)}</strong></td><td>${c.notes||'—'}</td>
    <td><button class="btn btn-sm btn-danger" onclick="deleteDoc('compras','${c.id}','renderCompras')">🗑️</button></td></tr>`);
  document.getElementById('content').innerHTML=buildTable(['Fecha','Proveedor','Items','Total','Notas','Acciones'],rows,'No hay compras.');
}
function openCompraModal(){
  cartCompra=[];
  setModal('Nueva Compra',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Proveedor</label><input id="co-sup" class="form-control" placeholder="Proveedor"></div>
      <div class="form-group"><label class="form-label">Fecha</label><input id="co-date" type="date" class="form-control" value="${today()}"></div>
    </div>
    <div class="form-group"><label class="form-label">Agregar producto</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select id="co-prod" class="form-control" style="flex:2;min-width:160px;">
          <option value="">Seleccionar...</option>
          ${_cache.products.map(p=>`<option value="${p.id}" data-price="${p.costPrice}">${p.name}</option>`).join('')}
        </select>
        <input id="co-qty" type="number" min="1" value="1" class="form-control" style="width:70px">
        <input id="co-unit" type="number" step="0.01" class="form-control" style="width:100px" placeholder="Precio">
        <button class="btn btn-secondary" onclick="addCC()">+ Agregar</button>
      </div>
    </div>
    <div id="cart-c"></div>
    <div class="form-group"><label class="form-label">Notas</label><textarea id="co-notes" class="form-control"></textarea></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveCompra()">Registrar Compra</button>`);
  document.getElementById('co-prod').onchange=function(){document.getElementById('co-unit').value=this.options[this.selectedIndex].dataset.price||'';};
  renderCC();
}
function addCC(){
  const sel=document.getElementById('co-prod');
  const id=sel.value; if(!id){showToast('Selecciona producto','error');return;}
  const name=sel.options[sel.selectedIndex].text;
  const qty=parseInt(document.getElementById('co-qty').value)||1;
  const price=parseFloat(document.getElementById('co-unit').value)||0;
  const ex=cartCompra.find(x=>x.id===id);
  if(ex) ex.qty+=qty; else cartCompra.push({id,name,qty,price});
  renderCC();
}
function renderCC(){
  const el=document.getElementById('cart-c');
  if(!cartCompra.length){el.innerHTML='<p style="color:var(--txt3);font-size:0.82rem;">Sin productos.</p>';return;}
  const total=cartCompra.reduce((s,i)=>s+i.qty*i.price,0);
  el.innerHTML=`<div class="table-wrapper"><table><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th><th></th></tr></thead>
    <tbody>${cartCompra.map((i,idx)=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>${fmtMoney(i.price)}</td><td>${fmtMoney(i.qty*i.price)}</td>
    <td><button class="btn btn-sm btn-danger" onclick="cartCompra.splice(${idx},1);renderCC()">✕</button></td></tr>`).join('')}</tbody></table></div>
    <div style="text-align:right;font-weight:700;margin-top:8px;">Total: ${fmtMoney(total)}</div>`;
}
async function saveCompra(){
  if(!cartCompra.length){showToast('Agrega productos','error');return;}
  const total=cartCompra.reduce((s,i)=>s+i.qty*i.price,0);
  await col('compras').add({supplier:document.getElementById('co-sup').value.trim(),
    date:document.getElementById('co-date').value,
    items:cartCompra.map(i=>({productId:i.id,productName:i.name,qty:i.qty,price:i.price})),
    total,notes:document.getElementById('co-notes').value.trim()});
  // Update stock
  const d=getDB();
  cartCompra.forEach(item=>{
    const idx=d.products.findIndex(p=>p.id===item.id);
    if(idx>-1) d.products[idx].stock=(d.products[idx].stock||0)+item.qty;
  });
  saveDB(d);
  closeModal();showToast('Compra registrada ✅','success');preloadCache();renderCompras();
}

// VENTAS
let cartVenta=[];
async function renderVentas(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openVentaModal()">+ Nueva Venta</button>`;
  const data=getDB().ventas||[];
  const rows=data.map(v=>`<tr>
    <td>${fmtDate(v.date)}</td><td>${ownerName(v.clientId)||'—'}</td>
    <td>${(v.items||[]).length} item(s)</td><td><strong>${fmtMoney(v.total)}</strong></td>
    <td><span class="badge badge-blue">${v.paymentMethod||'Efectivo'}</span></td>
    <td><button class="btn btn-sm btn-danger" onclick="deleteDoc('ventas','${v.id}','renderVentas')">🗑️</button></td></tr>`);
  document.getElementById('content').innerHTML=buildTable(['Fecha','Cliente','Items','Total','Pago','Acciones'],rows,'No hay ventas.');
}
function openVentaModal(){
  cartVenta=[];
  setModal('Nueva Venta',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Cliente</label>
        <select id="vt-client" class="form-control"><option value="">Sin asignar</option>
        ${_cache.owners.map(o=>`<option value="${o.id}">${o.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Fecha</label><input id="vt-date" type="date" class="form-control" value="${today()}"></div>
      <div class="form-group"><label class="form-label">Método de pago</label>
        <select id="vt-pay" class="form-control"><option>Efectivo</option><option>Transferencia</option><option>Tarjeta débito</option><option>Tarjeta crédito</option></select></div>
    </div>
    <div class="form-group"><label class="form-label">Agregar item</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select id="vt-prod" class="form-control" style="flex:2;min-width:160px;">
          <option value="">Seleccionar...</option>
          <optgroup label="Productos">${_cache.products.map(p=>`<option value="${p.id}" data-price="${p.salePrice}" data-type="product">${p.name}</option>`).join('')}</optgroup>
          <optgroup label="Servicios">${['Consulta','Vacunación','Baño completo','Baño y corte','Cirugía'].map(s=>`<option value="svc_${s}" data-price="0" data-type="service">${s}</option>`).join('')}</optgroup>
        </select>
        <input id="vt-qty" type="number" min="1" value="1" class="form-control" style="width:70px">
        <input id="vt-unit" type="number" step="0.01" class="form-control" style="width:100px" placeholder="Precio">
        <button class="btn btn-secondary" onclick="addCV()">+ Agregar</button>
      </div>
    </div>
    <div id="cart-v"></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveVenta()">Registrar Venta</button>`);
  document.getElementById('vt-prod').onchange=function(){document.getElementById('vt-unit').value=this.options[this.selectedIndex].dataset.price||'';};
  renderCV();
}
function addCV(){
  const sel=document.getElementById('vt-prod');
  const id=sel.value; if(!id){showToast('Selecciona item','error');return;}
  const name=sel.options[sel.selectedIndex].text.split(' (')[0];
  const type=sel.options[sel.selectedIndex].dataset.type||'product';
  const qty=parseInt(document.getElementById('vt-qty').value)||1;
  const price=parseFloat(document.getElementById('vt-unit').value)||0;
  const ex=cartVenta.find(x=>x.id===id); if(ex) ex.qty+=qty; else cartVenta.push({id,name,qty,price,type});
  renderCV();
}
function renderCV(){
  const el=document.getElementById('cart-v');
  if(!cartVenta.length){el.innerHTML='<p style="color:var(--txt3);font-size:0.82rem;">Sin items.</p>';return;}
  const total=cartVenta.reduce((s,i)=>s+i.qty*i.price,0);
  el.innerHTML=`<div class="table-wrapper"><table><thead><tr><th>Item</th><th>Tipo</th><th>Cant.</th><th>Precio</th><th>Subtotal</th><th></th></tr></thead>
    <tbody>${cartVenta.map((i,idx)=>`<tr><td>${i.name}</td>
    <td><span class="badge ${i.type==='service'?'badge-cyan':'badge-violet'}">${i.type==='service'?'Servicio':'Producto'}</span></td>
    <td>${i.qty}</td><td>${fmtMoney(i.price)}</td><td>${fmtMoney(i.qty*i.price)}</td>
    <td><button class="btn btn-sm btn-danger" onclick="cartVenta.splice(${idx},1);renderCV()">✕</button></td></tr>`).join('')}</tbody></table></div>
    <div style="text-align:right;font-weight:700;margin-top:8px;font-size:1.1rem;">Total: ${fmtMoney(total)}</div>`;
}
async function saveVenta(){
  if(!cartVenta.length){showToast('Agrega items','error');return;}
  const total=cartVenta.reduce((s,i)=>s+i.qty*i.price,0);
  await col('ventas').add({clientId:document.getElementById('vt-client').value,
    date:document.getElementById('vt-date').value,paymentMethod:document.getElementById('vt-pay').value,
    items:cartVenta.map(i=>({id:i.id,name:i.name,qty:i.qty,price:i.price,type:i.type})),total});
  const d=getDB();
  cartVenta.filter(i=>i.type==='product').forEach(item=>{
    const idx=d.products.findIndex(p=>p.id===item.id);
    if(idx>-1) d.products[idx].stock=Math.max(0,(d.products[idx].stock||0)-item.qty);
  });
  saveDB(d);
  closeModal();showToast('Venta registrada ✅','success');preloadCache();renderVentas();
}

// TURNOS
async function renderTurnos(){
  document.getElementById('header-actions').innerHTML=`<button class="btn btn-primary" onclick="openTurnoModal()">+ Nuevo Turno</button>`;
  const data=(getDB().turnos||[]).sort((a,b)=>a.date>b.date?1:-1);
  const todayStr=today();
  const renderRows=items=>items.map(t=>`<tr>
    <td><strong>${t.date}</strong></td><td><strong>${t.time||'—'}</strong></td>
    <td><span class="td-main">${petName(t.petId)}</span></td>
    <td>${ownerName(_cache.pets.find(p=>p.id===t.petId)?.ownerId)}</td>
    <td>${t.reason||'—'}</td><td>${statusBadge(t.status,'turno')}</td>
    <td><div class="td-actions">
      ${t.status==='pending'?`<button class="btn btn-sm btn-success" onclick="setTurnoStatus('${t.id}','attended')">✅</button>
      <button class="btn btn-sm btn-danger" onclick="setTurnoStatus('${t.id}','cancelled')">❌</button>`:''}
      <button class="btn btn-sm btn-secondary" onclick="openTurnoModal('${t.id}')">✏️</button>
      <button class="btn btn-sm btn-danger" onclick="deleteDoc('turnos','${t.id}','renderTurnos')">🗑️</button>
    </div></td></tr>`);
  document.getElementById('content').innerHTML=`
    <h4 style="margin-bottom:12px;">📅 Hoy</h4>
    ${buildTable(['Fecha','Hora','Mascota','Dueño','Motivo','Estado','Acciones'],renderRows(data.filter(t=>t.date===todayStr)),'No hay turnos hoy.')}
    <h4 style="margin:20px 0 12px;">🔜 Próximos</h4>
    ${buildTable(['Fecha','Hora','Mascota','Dueño','Motivo','Estado','Acciones'],renderRows(data.filter(t=>t.date>todayStr).slice(0,10)),'No hay próximos turnos.')}`;
}
function openTurnoModal(id){
  const t=id?(getDB().turnos||[]).find(x=>x.id===id):null;
  setModal(id?'Editar Turno':'Nuevo Turno',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mascota *</label>
        <select id="t-pet" class="form-control"><option value="">Seleccionar...</option>${petOptions(t?.petId)}</select></div>
      <div class="form-group"><label class="form-label">Fecha *</label><input id="t-date" type="date" class="form-control" value="${t?.date||today()}"></div>
      <div class="form-group"><label class="form-label">Hora</label><input id="t-time" type="time" class="form-control" value="${t?.time||'09:00'}"></div>
      <div class="form-group"><label class="form-label">Estado</label>
        <select id="t-status" class="form-control">
          <option value="pending" ${(!t||t.status==='pending')?'selected':''}>⏳ Pendiente</option>
          <option value="attended" ${t?.status==='attended'?'selected':''}>✅ Atendido</option>
          <option value="cancelled" ${t?.status==='cancelled'?'selected':''}>❌ Cancelado</option>
        </select></div>
      <div class="form-group form-full"><label class="form-label">Motivo</label><input id="t-reason" class="form-control" value="${t?.reason||''}"></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="saveTurno('${id||''}')">Guardar</button>`);
}
async function saveTurno(id){
  const petId=document.getElementById('t-pet').value;
  const date=document.getElementById('t-date').value;
  if(!petId||!date){showToast('Selecciona mascota y fecha','error');return;}
  const data={petId,date,time:document.getElementById('t-time').value,
    reason:document.getElementById('t-reason').value.trim(),status:document.getElementById('t-status').value};
  if(id) await col('turnos').doc(id).update(data);
  else await col('turnos').add(data);
  closeModal();showToast('Turno guardado ✅','success');renderTurnos();
}
async function setTurnoStatus(id,status){
  await col('turnos').doc(id).update({status});
  showToast('Actualizado','success');renderTurnos();
}

// REPORTES
async function renderReportes(){
  const dbd=getDB();
  document.getElementById('content').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div class="card"><h4 style="margin-bottom:12px;">💰 Ventas por mes</h4><div class="chart-container"><canvas id="ch-v"></canvas></div></div>
      <div class="card"><h4 style="margin-bottom:12px;">🛁 Servicios realizados</h4><div class="chart-container"><canvas id="ch-s"></canvas></div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div class="card"><h4 style="margin-bottom:12px;">🐶 Pacientes por especie</h4><div class="chart-container"><canvas id="ch-e"></canvas></div></div>
      <div class="card"><h4 style="margin-bottom:12px;">📊 Resumen</h4>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px;">
          <div class="recent-item"><span class="ri-icon">👥</span><div class="ri-text">Clientes registrados</div><strong>${dbd.owners.length}</strong></div>
          <div class="recent-item"><span class="ri-icon">🐶</span><div class="ri-text">Mascotas</div><strong>${dbd.pets.length}</strong></div>
          <div class="recent-item"><span class="ri-icon">💉</span><div class="ri-text">Vacunaciones</div><strong>${dbd.vacunaciones.length}</strong></div>
          <div class="recent-item"><span class="ri-icon">🛁</span><div class="ri-text">Baños realizados</div><strong>${dbd.banos.length}</strong></div>
          <div class="recent-item"><span class="ri-icon">🔪</span><div class="ri-text">Cirugías</div><strong>${dbd.cirugias.length}</strong></div>
          <div class="recent-item"><span class="ri-icon">💰</span><div class="ri-text">Total ventas</div><strong>${fmtMoney(dbd.ventas.reduce((s,v)=>s+(v.total||0),0))}</strong></div>
        </div>
      </div>
    </div>`;
  // Charts
  const vByMonth={};
  dbd.ventas.forEach(v=>{if(!v.date)return;const k=v.date.substr(0,7);vByMonth[k]=(vByMonth[k]||0)+(v.total||0);});
  const months=Object.keys(vByMonth).sort().slice(-6);
  new Chart(document.getElementById('ch-v'),{type:'bar',
    data:{labels:months,datasets:[{label:'Ventas ($)',data:months.map(m=>vByMonth[m]),backgroundColor:'rgba(124,58,237,0.7)',borderRadius:6}]},
    options:{plugins:{legend:{labels:{color:'#94a3b8'}}},scales:{x:{ticks:{color:'#94a3b8'}},y:{ticks:{color:'#94a3b8'}}}}});
  new Chart(document.getElementById('ch-s'),{type:'doughnut',
    data:{labels:['Baños','Cirugías','Vacunaciones','Consultas'],
      datasets:[{data:[dbd.banos.length,dbd.cirugias.length,dbd.vacunaciones.length,dbd.consultas.length],
        backgroundColor:['#06b6d4','#7c3aed','#10b981','#f59e0b'],borderWidth:0}]},
    options:{plugins:{legend:{labels:{color:'#94a3b8'}}}}});
  const espCount={};
  dbd.pets.forEach(p=>{espCount[p.species||'otro']=(espCount[p.species||'otro']||0)+1;});
  new Chart(document.getElementById('ch-e'),{type:'pie',
    data:{labels:Object.keys(espCount),datasets:[{data:Object.values(espCount),
      backgroundColor:['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#3b82f6'],borderWidth:0}]},
    options:{plugins:{legend:{labels:{color:'#94a3b8'}}}}});
}

// Init
preloadCache();
navigateTo('dashboard');
