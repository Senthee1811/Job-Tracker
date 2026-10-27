/**
 * Serverless-compatible email service for transactional emails (Password Reset).
 * Uses Resend API via native fetch, with graceful console fallback in development.
 */

export const sendPasswordResetEmail = async ({ toEmail, resetToken, userName = "there" }) => {
    const apiKey = process.env.EMAIL_PROVIDER_API_KEY || process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || "Job Tracker <onboarding@resend.dev>";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${resetToken}`;

    // Graceful fallback for development / testing when no Resend key is provided
    if (!apiKey || apiKey.includes("your_email") || apiKey.includes("re_placeholder")) {
        console.log("------------------------------------------------------------");
        console.log(`[DEV Email Service] To: ${toEmail}`);
        console.log(`[DEV Email Service] Reset Link: ${resetUrl}`);
        console.log("------------------------------------------------------------");
        return {
            success: true,
            provider: "console_fallback",
            resetUrl
        };
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 30px; }
        .card { background-color: #ffffff; border: 2px solid #111827; border-radius: 16px; max-width: 520px; margin: 0 auto; padding: 32px; box-shadow: 4px 4px 0px 0px #111827; }
        .badge { background-color: #a3e635; color: #111827; font-weight: 900; padding: 4px 10px; border-radius: 8px; border: 1.5px solid #111827; font-size: 13px; display: inline-block; margin-bottom: 16px; }
        h1 { color: #111827; font-size: 22px; font-weight: 800; margin: 0 0 12px 0; }
        p { color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; }
        .btn { display: inline-block; background-color: #a3e635; color: #111827; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 12px; border: 2px solid #111827; box-shadow: 3px 3px 0px 0px #111827; }
        .footer { font-size: 12px; color: #9ca3af; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">Job Tracker Security</div>
        <h1>Password Reset Request</h1>
        <p>Hi ${userName},</p>
        <p>We received a request to reset the password for your Job Tracker account. Click the button below to choose a new password. This link is single-use and will expire in 30 minutes.</p>
        <p style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" class="btn">Reset Password</a>
        </p>
        <p>If you did not request a password reset, you can safely ignore this email — your account remains completely secure.</p>
        <div class="footer">
          <p style="margin: 0;">Job Tracker • Sri Lankan Tech Vacancies & AI Application Assistant</p>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [toEmail],
                subject: "Reset your Job Tracker password",
                html: htmlContent
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `Resend error: ${response.statusText}`);
        }

        return {
            success: true,
            provider: "resend",
            messageId: data.id
        };
    } catch (err) {
        console.error("[Email Service Error]:", err.message);
        throw err;
    }
};
