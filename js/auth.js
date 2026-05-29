// ============================================================
// GESTIÓN DE AUTENTICACIÓN Y REDIRECCIÓN
// ============================================================

const PAGE = window.location.pathname.split('/').pop() || 'index.html';

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    if (PAGE !== 'index.html') window.location.href = 'index.html';
    return;
  }

  try {
    const doc = await db.collection('users').doc(user.uid).get();
    if (!doc.exists) { await auth.signOut(); return; }

    const data = doc.data();
    window._currentUser = { uid: user.uid, email: user.email, ...data };

    if (data.role === 'admin') {
      if (PAGE !== 'admin.html') window.location.href = 'admin.html';
      else if (typeof initAdmin === 'function') initAdmin();
    } else {
      if (PAGE === 'admin.html') { window.location.href = 'index.html'; return; }
      if (PAGE !== 'app.html') { window.location.href = 'app.html'; return; }
      
      let isExpired = false;
      if (data.subscriptionEnd) {
        const subEnd = data.subscriptionEnd.toDate ? data.subscriptionEnd.toDate() : new Date(data.subscriptionEnd);
        if (subEnd < new Date()) isExpired = true;
      }

      if (data.status === 'active' && !isExpired) {
        if (typeof initApp === 'function') initApp();
      } else {
        showAccessDenied(isExpired ? 'expired' : data.status);
      }
    }
  } catch (e) {
    console.error(e);
    showToast('Error de conexión', 'error');
  }
});

// ---------- Login ----------
async function login(email, password) {
  await auth.signInWithEmailAndPassword(email, password);
}

// ---------- Registro (nueva veterinaria) ----------
async function register(email, password, clinicName, phone, address) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await db.collection('users').doc(cred.user.uid).set({
    email, role: 'veterinary', clinicName, phone, address,
    status: 'pending',
    subscriptionEnd: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  await auth.signOut();
}

// ---------- Logout ----------
async function logout() {
  await auth.signOut();
  window.location.href = 'index.html';
}

// ---------- Pantalla de acceso denegado ----------
function showAccessDenied(status) {
  let msg = '';
  let icon = '';
  if (status === 'suspended') {
    msg = '⚠️ Tu cuenta está <strong>suspendida</strong>.<br>Contactá al administrador para reactivarla.';
    icon = '🚫';
  } else if (status === 'expired') {
    msg = '💳 Tu suscripción ha <strong>vencido</strong>.<br>Contactá a ventas para renovarla.';
    icon = '💳';
  } else {
    msg = '⏳ Tu cuenta está <strong>pendiente de activación</strong>.<br>El administrador la activará en breve.';
    icon = '⏳';
  }

  document.body.innerHTML = `
    <div class="denied-screen">
      <div class="denied-card">
        <div class="denied-icon">${icon}</div>
        <h2>Acceso Restringido</h2>
        <p>${msg}</p>
        <button class="btn btn-primary" onclick="logout()">Cerrar sesión</button>
      </div>
    </div>`;
}

// ---------- Toast ----------
function showToast(msg, type = 'info') {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'toast';
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}
