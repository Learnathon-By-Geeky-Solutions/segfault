def generate(username, userid, verification_code):
    email_template = f"""
    <!doctype html>
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Verification Email</title>
        <style media="all" type="text/css">
        @media all {{
          .btn-primary table td:hover {{
            background-color: #ec0867 !important;
          }}

          .btn-primary a:hover {{
            background-color: #ec0867 !important;
            border-color: #ec0867 !important;
          }}
        }}

        .verification-code-container {{
          text-align: center; /* Center the code block */
          margin-top: 10px;
        }}

        .verification-code {{
          display: inline-block;
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          padding: 8px 16px;
          font-size: 16px;
          font-family: monospace;
          border-radius: 4px;
          margin-top: 10px;
          word-wrap: break-word;
        }}
        </style>
      </head>
      <body style="font-family: Helvetica, sans-serif; background-color: #f4f5f6; margin: 0; padding: 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f4f5f6;">
          <tr>
            <td style="vertical-align: top; padding-top: 24px;">
              <div class="content" style="max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border-radius: 16px; border: 1px solid #eaebed;">
                <p>Hi {username},</p>
                <p>Thank you for signing up! Please click the link below to verify your account:</p>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin: 16px 0;">
                  <tr>
                    <td align="center" style="padding-bottom: 16px;">
                      <a href="http://codesirius.com/verify?id={userid}&code={verification_code}" style="background-color: #0867ec; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Your Account</a>
                    </td>
                  </tr>
                </table>
                Or copy and paste the following code into the verification page:<br>
                <div class="verification-code-container">
                  <span class="verification-code">{verification_code}</span>
                </div>
                <p>If you did not request this email, please ignore it.</p>
                <p>Best regards,<br>Team Codesirius</p>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """
    return email_template
