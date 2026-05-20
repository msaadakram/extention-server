"use strict";

const express = require("express");
const pino = require("pino");

const router = express.Router();
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

// ---------------------------------------------------------------------------
// GET /token/:token — render a simple HTML page that verifies via the API
// ---------------------------------------------------------------------------
router.get("/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Earn Credits</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #0f0f1a;
      color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .card {
      background: #1a1a2e;
      border: 1px solid #2a2a4a;
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 420px;
      width: 90%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #2a2a4a;
      border-top-color: #7c5cfc;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 24px;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 12px;
      font-weight: 600;
    }
    p {
      font-size: 0.95rem;
      color: #a0a0b8;
      line-height: 1.5;
    }
    .success {
      color: #4ade80;
    }
    .error {
      color: #f87171;
    }
    .badge {
      display: inline-block;
      background: #7c5cfc22;
      color: #a78bfa;
      border: 1px solid #7c5cfc44;
      border-radius: 999px;
      padding: 4px 16px;
      font-size: 0.85rem;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div id="spinner" class="spinner"></div>
    <h1 id="heading">Verifying your reward...</h1>
    <p id="message">Please wait while we confirm your token.</p>
    <div id="badge"></div>
  </div>

  <script>
    (async function () {
      const heading = document.getElementById("heading");
      const message = document.getElementById("message");
      const spinner = document.getElementById("spinner");
      const badge = document.getElementById("badge");

      try {
        const resp = await fetch(
          "/api/earn/verify/${token}"
        );
        const data = await resp.json();

        if (!resp.ok) {
          // API returned an error status
          spinner.style.display = "none";
          heading.textContent = "Verification Failed";
          heading.classList.add("error");
          message.textContent =
            data.error || "Could not verify your reward token.";
          message.classList.add("error");
          return;
        }

        // Success
        spinner.style.display = "none";
        heading.textContent = "Credits Added!";
        heading.classList.add("success");
        message.textContent =
          data.message || "Credits have been added to your account.";
        message.classList.add("success");
        badge.innerHTML =
          '<span class="badge">+5 Credits &bull; Total: ' +
          (data.credits || 0) +
          "</span>";

        // Auto-close after 3 seconds
        setTimeout(function () {
          window.close();
        }, 3000);
      } catch (err) {
        spinner.style.display = "none";
        heading.textContent = "Connection Error";
        heading.classList.add("error");
        message.textContent =
          "Could not reach the server. Please check your connection and try again.";
        message.classList.add("error");
      }
    })();
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    logger.error(err, "Error rendering token page");
    return res.status(500).json({
      error: "Failed to render page",
      code: "INTERNAL_ERROR",
    });
  }
});

module.exports = router;
