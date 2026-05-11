export function getOTPEmailHtml({
  otp,
  type,
}: {
  otp: string;
  type: "sign-in" | "sign-up" | "forget-password" | "email-verification" | "change-email";
}) {
  const title = type === "forget-password" ? "Reset Password" : "Verification Code";
  const subtitle =
    type === "forget-password"
      ? "Use the following code to reset your password."
      : type === "change-email"
        ? "Use the following code to confirm your email change."
        : "Use the following code to verify your account.";

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - Surrealbox</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

      :root {
        --bg-main: #ffffff;
        --bg-container: #ffffff;
        --text-main: #000000;
        --text-muted: #71717a;
        --border-color: #e4e4e7;
        --accent: #000000;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background-color: var(--bg-main);
        color: var(--text-main);
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }

      .wrapper {
        width: 100%;
        padding: 20px;
      }

      .container {
        max-width: 420px;
        width: 100%;
        margin: 0 auto;
        background: var(--bg-container);
        border: 1px solid var(--border-color);
      }

      .header {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 32px 24px 0 24px;
      }

      .logo-wrap {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
      }

      .logo-wrap img {
        width: 50%;
        height: auto;
        display: block;
      }

      .brand-name {
        font-size: 22px;
        margin-left: 10px;
        font-weight: 400;
        letter-spacing: -0.04em;
        color: var(--text-main);
        text-transform: lowercase;
      }

      .content {
        padding: 32px 24px;
      }

      .title {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-main);
        margin: 0 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .subtitle {
        font-size: 13px;
        color: var(--text-muted);
        line-height: 1.5;
        margin: 0 0 24px;
      }

      .otp-box {
        background: #ffffff;
        border: 1px solid var(--border-color);
        border-left: 4px solid var(--accent);
        padding: 24px 20px;
        margin-bottom: 20px;
      }

      .otp-label {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 12px;
      }

      .otp-code {
        font-size: 32px;
        font-weight: 800;
        letter-spacing: 8px;
        color: var(--accent);
        font-family: ui-monospace, "Courier New", monospace;
        line-height: 1;
      }

      .otp-expiry {
        font-size: 12px;
        color: var(--text-muted);
        margin: 0;
      }

      .footer {
        padding: 24px;
        border-top: 1px solid var(--border-color);
        background: #ffffff;
      }

      .footer p {
        font-size: 12px;
        color: var(--text-muted);
        margin: 0;
        line-height: 1.6;
      }

      .footer .copyright {
        margin-top: 12px;
        font-weight: 500;
        color: var(--text-main);
      }

      @media (max-width: 480px) {
        .container {
          border: none;
        }
        .otp-code {
          font-size: 26px;
          letter-spacing: 6px;
        }
        .brand-name {
          font-size: 40px;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <div class="logo-wrap">
            <img
              src="https://surrealbox.vercel.app/assets/invert-logo.png"
              alt="Logo"
              onerror="this.style.display = 'none'"
            />
          </div>
          <span class="brand-name">surrealbox</span>
        </div>

        <div class="content">
          <h1 class="title">${title}</h1>
          <p class="subtitle">${subtitle}</p>

          <div class="otp-box">
            <div class="otp-label">Security Code</div>
            <div class="otp-code">${otp}</div>
          </div>

          <p class="otp-expiry">
            Expires in 10 minutes. Please do not share this code with anyone.
          </p>
        </div>

        <div class="footer">
          <p>If you didn't request this code, you can safely ignore this email.</p>
          <p class="copyright">&copy; 2026 Surrealbox. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
}
