const API = {
  tokenKey: 'chavez_token',
  userKey: 'chavez_user',

  getToken() {
    return localStorage.getItem(this.tokenKey);
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(this.userKey) || 'null');
    } catch {
      return null;
    }
  },

  setSession(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  },

  requireAuth() {
    if (!this.getToken()) {
      window.location.href = '/';
      return false;
    }
    return true;
  },

  async request(path, options = {}) {
    const headers = Object.assign({}, options.headers || {});
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!(options.body instanceof FormData) && options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(path, { ...options, headers });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    if (res.status === 401) {
      this.clearSession();
      if (!path.includes('/api/auth/login')) {
        window.location.href = '/';
      }
    }
    if (!res.ok) {
      const err = new Error((data && data.error) || `Error ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },
};

function money(n) {
  return `Bs ${Number(n || 0).toFixed(2)}`;
}

function fmtDateTime(v) {
  if (!v) return '—';
  return String(v).replace('T', ' ').slice(0, 16);
}

function badgePago(estado) {
  if (estado === 'pagado') return '<span class="badge ok">pagado</span>';
  if (estado === 'pendiente_verificacion') return '<span class="badge warn">pendiente</span>';
  if (estado === 'rechazado') return '<span class="badge danger">rechazado</span>';
  return `<span class="badge">${estado || ''}</span>`;
}

function renderShell({ title, active }) {
  if (!API.requireAuth()) return;
  const user = API.getUser() || {};
  const links = [
    ['/pages/dashboard.html', 'Dashboard', 'dashboard'],
    ['/pages/clientes.html', 'Clientes / Pacientes', 'clientes'],
    ['/pages/agenda.html', 'Agenda', 'agenda'],
    ['/pages/servicios.html', 'Servicios', 'servicios'],
    ['/pages/caja.html', 'Caja', 'caja'],
    ['/pages/verificacion.html', 'Verificación QR', 'verificacion'],
    ['/pages/arqueo.html', 'Arqueo', 'arqueo'],
  ];
  if (user.rol === 'veterinario') {
    links.push(['/pages/config.html', 'Config QR', 'config']);
  }

  document.body.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">Chavez Pet's Doctor<small>Veterinaria · Bolivia</small></div>
        <nav class="nav">
          ${links
            .map(
              ([href, label, key]) =>
                `<a href="${href}" class="${active === key ? 'active' : ''}">${label}</a>`
            )
            .join('')}
        </nav>
        <div class="user-chip">
          <div><strong>${user.nombre || ''}</strong></div>
          <div>${user.rol || ''}</div>
          <button class="btn secondary" id="btnLogout" style="margin-top:0.6rem;width:100%">Salir</button>
        </div>
      </aside>
      <main class="main">
        <div class="topbar">
          <div>
            <h1>${title}</h1>
            <div class="muted">Primera entrega operativa</div>
          </div>
        </div>
        <div id="page"></div>
      </main>
    </div>
  `;
  document.getElementById('btnLogout').onclick = async () => {
    try {
      await API.request('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    API.clearSession();
    window.location.href = '/';
  };
}
