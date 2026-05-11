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

  const logo = process.env.NEXT_PUBLIC_APP_URL + "/assets/email-logo.png";

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
        --primary: #11006a;
        --secondary: #444cf5;
        --white: #ffffff;
        --black: #000000;
        --gray-light: #f4f4f5;
        --gray-mid: #e4e4e7;
        --gray-muted: #71717a;
        --gray-soft: #fafafa;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family:
          "Inter",
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
        background-color: var(--white);
        color: var(--black);
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
      }

      .wrapper {
        padding: 48px 16px;
      }

      .container {
        max-width: 420px;
        margin: 0 auto;
        background: var(--white);
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        border: 1px solid var(--gray-mid);
      }

      .header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 20px 20px 0 20px;
      }

      .logo-wrap {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background-color: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        flex-shrink: 0;
      }

      .logo-wrap img {
        width: 22px;
        height: 22px;
        object-fit: contain;
        filter: invert(1) brightness(2);
        display: block;
      }

      .brand-name {
        font-size: 26px;
        font-weight: 700;
        letter-spacing: -0.03em;
        color: var(--black);
        line-height: 1;
      }

      .content {
        padding: 20px 20px 24px 20px;
      }

      .title {
        font-size: 13px;
        font-weight: 700;
        color: var(--black);
        margin: 0 0 4px;
        letter-spacing: -0.01em;
      }

      .subtitle {
        font-size: 11px;
        color: var(--gray-muted);
        line-height: 1.5;
        margin: 0 0 20px;
      }

      .otp-box {
        background: var(--gray-soft);
        border: 1px solid var(--gray-mid);
        border-left: 3px solid var(--secondary);
        padding: 20px 16px;
        margin-bottom: 16px;
      }

      .otp-label {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--gray-muted);
        margin-bottom: 8px;
      }

      .otp-code {
        font-size: 36px;
        font-weight: 800;
        letter-spacing: 10px;
        color: var(--primary);
        font-family: ui-monospace, "Courier New", monospace;
        line-height: 1;
      }

      .otp-expiry {
        font-size: 11px;
        font-weight: 500;
        color: var(--gray-muted);
        margin: 0;
      }

      .footer {
        padding: 16px 20px;
        background: var(--gray-soft);
        border-top: 1px solid var(--gray-mid);
      }

      .footer p {
        font-size: 11px;
        color: var(--black);
        margin: 0;
        line-height: 1.5;
      }

      .footer .copyright {
        margin-top: 8px;
        font-weight: 600;
        color: var(--black);
      }

      @media (prefers-color-scheme: dark) {
        body {
          background-color: #ffffff;
          color: var(--black);
        }
        .container {
          background: #ffffff;
          box-shadow: 0 4px 22px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .brand-name {
          color: black;
        }
        .logo-wrap {
          height: 50px;
          width: 50px;
          background-color: black;
          border-radius: 0%;
        }
        .title {
          color: black;
        }
        .subtitle {
          color: black;
        }
        .otp-box {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
          border-left-color: var(--secondary);
        }
        .otp-label {
          color: black;
        }
        .otp-code {
          color: black;
        }
        .otp-expiry {
          color: black;
        }
        .footer {
          background: white;
          border-top-color: rgb(229, 229, 229);
        }
        .footer p {
          color: black;
        }
        .footer .copyright {
          color: black;
        }
      }

      @media (max-width: 480px) {
        .wrapper {
          padding: 24px 12px;
        }
        .brand-name {
          font-size: 22px;
        }
        .otp-code {
          font-size: 28px;
          letter-spacing: 7px;
        }
        .content {
          padding: 16px 16px 20px 16px;
        }
        .header {
          padding: 16px 16px 0 16px;
        }
        .footer {
          padding: 14px 16px;
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
              src="${logo}"
              alt="Surrealbox logo"
              onerror="this.style.display = 'none'"
            />
          </div>
          <span class="brand-name">surrealbox</span>
        </div>

        <div class="content">
          <h1 class="title">${title}</h1>
          <p class="subtitle">${subtitle}</p>

          <div class="otp-box">
            <div class="otp-label">Your code</div>
            <div class="otp-code">${otp}</div>
          </div>

          <p class="otp-expiry">
            Valid for 10 minutes. Do not share this code.
          </p>
        </div>

        <div class="footer">
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p class="copyright">&copy; 2026 Surrealbox. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
}
