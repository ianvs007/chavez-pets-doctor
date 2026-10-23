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
  if (!document.querySelector("link[rel*='icon']")) {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/jpeg';
    favicon.href = '/img/logo.jpg';
    document.head.appendChild(favicon);
  }

  const user = API.getUser() || {};
  const links = [
    ['/pages/dashboard.html', 'Dashboard', 'dashboard'],
    ['/pages/clientes.html', 'Mascotas y Cuidadores', 'clientes'],
    ['/pages/historial.html', 'Historial y Atenciones', 'historial'],
    ['/pages/campanas.html', 'Campañas Veterinarias', 'campanas'],
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
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div style="display:flex;align-items:center;gap:0.75rem;min-width:0;">
            <img src="/img/logo.jpg" alt="Logo" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.4);flex-shrink:0;" />
            <div class="brand">Patitas al poder<small>Registro y control veterinario</small></div>
          </div>
          <button type="button" class="nav-toggle" id="navToggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="mainNav">
            <span class="nav-toggle-bars" aria-hidden="true"></span>
          </button>
        </div>
        <nav class="nav" id="mainNav">
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
            <div class="muted">Patitas al poder · Atención veterinaria</div>
          </div>
        </div>
        <div id="page"></div>
      </main>
    </div>
  `;

  const sidebar = document.getElementById('sidebar');
  const navToggle = document.getElementById('navToggle');
  const setNavOpen = (open) => {
    sidebar.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };
  navToggle.addEventListener('click', (e) => {
    e.preventDefault();
    setNavOpen(!sidebar.classList.contains('nav-open'));
  });
  sidebar.querySelectorAll('.nav a').forEach((a) => {
    a.addEventListener('click', () => setNavOpen(false));
  });

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
