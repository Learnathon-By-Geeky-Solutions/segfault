def generate(username, userid, verification_code):
    email_template = f"""
    <!doctype html>
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Welcome to CodeSirius - Verify Your Account</title>
        <style media="all" type="text/css">
        @media all {{
          .btn-primary table td:hover {{
            background-color: #2563eb !important;
          }}

          .btn-primary a:hover {{
            background-color: #1d4ed8 !important;
            border-color: #1d4ed8 !important;
          }}
        }}

        .verification-code-container {{
          text-align: center;
          margin: 24px 0;
        }}

        .verification-code {{
          display: inline-block;
          background-color: #f8fafc;
          border: 2px solid #e2e8f0;
          padding: 12px 24px;
          font-size: 18px;
          font-family: 'Courier New', monospace;
          border-radius: 8px;
          color: #1e293b;
          letter-spacing: 2px;
          font-weight: 600;
        }}

        .logo {{
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          text-decoration: none;
          margin-bottom: 24px;
          display: inline-block;
        }}

        .motto {{
          color: #64748b;
          font-size: 16px;
          margin-top: 4px;
        }}
        </style>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f8fafc;">
          <tr>
            <td style="vertical-align: top; padding: 40px 0;">
              <div class="content" style="max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);">
                <div style="text-align: center; margin-bottom: 32px;">
                  <a href="https://codesirius.tech" class="logo">CodeSirius</a>
                  <div class="motto">Ace your interviews</div>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6; color: #1e293b; margin: 0 0 24px;">Hi {username},</p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #1e293b; margin: 0 0 24px;">Welcome to CodeSirius! We're excited to have you join our community of learners and achievers. To get started, please verify your account by clicking the button below:</p>
                
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin: 32px 0;">
                  <tr>
                    <td align="center">
                      <a href="https://codesirius.tech/api/verify?id={userid}&code={verification_code}" style="background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Verify Your Account</a>
                    </td>
                  </tr>
                </table>

                <p style="font-size: 16px; line-height: 1.6; color: #1e293b; margin: 0 0 16px;">Or copy and paste this verification code:</p>
                
                <div class="verification-code-container">
                  <span class="verification-code">{verification_code}</span>
                </div>

                <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin: 32px 0 0;">If you didn't create an account with CodeSirius, you can safely ignore this email.</p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #1e293b; margin: 32px 0 0;">Best regards,<br>The CodeSirius Team</p>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """
    return email_template
