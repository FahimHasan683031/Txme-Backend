import config from '../config';



const createAccount = (values: any) => {
  const data = {
    to: values.email,
    subject: `Verify your Txme account`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#f6f6f6; font-family:Inter,Segoe UI,Tahoma,Verdana,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:640px; margin:40px auto; background:#ffffff;
                 border-radius:20px; overflow:hidden;
                 border:1px solid #eee; box-shadow:0 8px 30px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center"
              style="padding:48px 20px 36px; background:#ffffff; border-bottom:1px solid #f1f1f1;">

              <!-- Bigger Logo -->
              <img
                src="https://texme-media-bucket.s3.us-east-1.amazonaws.com/serviceimage/1770608892815-1770608892522-7m6bfj.png"
                alt="Txme Logo"
                style="height:130px; width:auto; display:block; margin-bottom:22px;" />

              <h1 style="margin:0; font-size:28px; font-weight:800; color:#FF5A36;">
                Verify your email
              </h1>

              <p style="margin:10px 0 0; font-size:15px; color:#666;">
                Enter this code in the Txme app
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:42px 45px; text-align:center;">

              <p style="font-size:16px; color:#444; line-height:1.7; margin:0 0 28px;">
                Hi there,<br />
                Welcome to <strong>Txme</strong> 👋  
                Use the code below to verify your account.
              </p>

              <!-- OTP Box (Primary Focus) -->
              <div style="
                background:#fff1ec;
                border:3px solid #FF5A36;
                border-radius:22px;
                padding:34px 0;
                margin:36px auto;
                max-width:360px;">

                <div style="font-size:14px; font-weight:600; color:#777; margin-bottom:12px;">
                  YOUR VERIFICATION CODE
                </div>

                <span style="
                  font-size:46px;
                  font-weight:900;
                  letter-spacing:8px;
                  color:#FF5A36;">
                  ${values.otp}
                </span>
              </div>

              <p style="font-size:15px; color:#555; line-height:1.6; margin:0;">
                This code expires in <strong>5 minutes</strong>.<br />
                If you didn’t request this, you can safely ignore this email.
              </p>

              <!-- Security Notice -->
              <div style="
                margin-top:36px;
                background:#fafafa;
                border-left:6px solid #FF5A36;
                border-radius:12px;
                padding:18px 20px;
                text-align:left;">

                <p style="margin:0; font-size:14px; color:#444;">
                  🔐 Txme will never ask for this code. Do not share it with anyone.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center"
              style="background:#fafafa; padding:24px; border-top:1px solid #eee;">

              <p style="margin:0; font-size:12px; color:#777;">
                © ${new Date().getFullYear()} Txme. All rights reserved.
              </p>

              <p style="margin:6px 0 0; font-size:12px; color:#777;">
                Built for secure and private communication
              </p>
              <p style="margin:12px 0 0; font-size:11px; color:#999; font-style:italic; line-height:1.4;">
                please contact <a href="mailto:oliver@txme.nl" style="color:#FF5A36; text-decoration:none;">oliver@txme.nl</a> if you wish to unsubscribe or if this communication was not requested by you
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `,
  };

  return data;
};


const resetPassword = (values: { email: string; otp: number }) => {
  const data = {
    to: values.email,
    subject: `Reset your Txme password`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#f6f6f6; font-family:Inter,Segoe UI,Tahoma,Verdana,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:640px; margin:40px auto; background:#ffffff;
                 border-radius:20px; overflow:hidden;
                 border:1px solid #eee; box-shadow:0 8px 30px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center"
              style="padding:48px 20px 36px; background:#ffffff; border-bottom:1px solid #f1f1f1;">

              <img
                src="https://texme-media-bucket.s3.us-east-1.amazonaws.com/serviceimage/1770608892815-1770608892522-7m6bfj.png"
                alt="Txme Logo"
                style="height:130px; width:auto; display:block; margin-bottom:22px;" />

              <h1 style="margin:0; font-size:28px; font-weight:800; color:#FF5A36;">
                Reset your password
              </h1>

              <p style="margin:10px 0 0; font-size:15px; color:#666;">
                Enter this code in the Txme app
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:42px 45px; text-align:center;">

              <p style="font-size:16px; color:#444; line-height:1.7; margin:0 0 28px;">
                We received a request to reset your <strong>Txme</strong> account password.
                Use the verification code below to continue.
              </p>

              <!-- OTP Box -->
              <div style="
                background:#fff1ec;
                border:3px solid #FF5A36;
                border-radius:22px;
                padding:36px 0;
                margin:36px auto;
                max-width:360px;">

                <div style="font-size:14px; font-weight:600; color:#777; margin-bottom:12px;">
                  PASSWORD RESET CODE
                </div>

                <span style="
                  font-size:48px;
                  font-weight:900;
                  letter-spacing:8px;
                  color:#FF5A36;">
                  ${values.otp}
                </span>
              </div>

              <p style="font-size:15px; color:#555; line-height:1.6; margin:0;">
                This code will expire in <strong>5 minutes</strong>.<br />
                If you didn’t request a password reset, please ignore this email.
              </p>

              <!-- Security Notice -->
              <div style="
                margin-top:36px;
                background:#fafafa;
                border-left:6px solid #FF5A36;
                border-radius:12px;
                padding:18px 20px;
                text-align:left;">

                <p style="margin:0; font-size:14px; color:#444;">
                  🔐 Txme will never ask for this code. Do not share it with anyone.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center"
              style="background:#fafafa; padding:24px; border-top:1px solid #eee;">

              <p style="margin:0; font-size:12px; color:#777;">
                © ${new Date().getFullYear()} Txme. All rights reserved.
              </p>

              <p style="margin:6px 0 0; font-size:12px; color:#777;">
                Secure password recovery for your account
              </p>
              <p style="margin:12px 0 0; font-size:11px; color:#999; font-style:italic; line-height:1.4;">
                please contact <a href="mailto:oliver@txme.nl" style="color:#FF5A36; text-decoration:none;">oliver@txme.nl</a> if you wish to unsubscribe or if this communication was not requested by you
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `,
  };

  return data;
};


const resendOtpEmail = (values: {
  email: string;
  otp: number;
  purpose: string;
}) => {
  const readablePurpose = values.purpose.replace(/_/g, " ");

  return {
    to: values.email,
    subject: `Your Txme verification code`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#f6f6f6; font-family:Inter,Segoe UI,Tahoma,Verdana,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">

        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:640px; margin:40px auto; background:#ffffff;
                 border-radius:20px; overflow:hidden;
                 border:1px solid #eee; box-shadow:0 8px 30px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center"
              style="padding:48px 20px 36px; background:#ffffff; border-bottom:1px solid #f1f1f1;">

              <img
                src="https://texme-media-bucket.s3.us-east-1.amazonaws.com/serviceimage/1770608892815-1770608892522-7m6bfj.png"
                alt="Txme Logo"
                style="height:130px; width:auto; display:block; margin-bottom:22px;" />

              <h1 style="margin:0; font-size:28px; font-weight:800; color:#FF5A36;">
                Verification code
              </h1>

              <p style="margin:10px 0 0; font-size:15px; color:#666;">
                This code was requested again
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:42px 45px; text-align:center;">

              <p style="font-size:16px; color:#444; line-height:1.7; margin:0 0 28px;">
                You requested a new verification code for
                <strong style="text-transform:capitalize;">${readablePurpose}</strong>.
                Enter the code below in the <strong>Txme</strong> app.
              </p>

              <!-- OTP Box -->
              <div style="
                background:#fff1ec;
                border:3px solid #FF5A36;
                border-radius:22px;
                padding:36px 0;
                margin:36px auto;
                max-width:360px;">

                <div style="font-size:14px; font-weight:600; color:#777; margin-bottom:12px;">
                  YOUR ONE-TIME CODE
                </div>

                <span style="
                  font-size:48px;
                  font-weight:900;
                  letter-spacing:8px;
                  color:#FF5A36;">
                  ${values.otp}
                </span>
              </div>

              <p style="font-size:15px; color:#555; line-height:1.6; margin:0;">
                This code expires in <strong>5 minutes</strong>.<br />
                If you didn’t request a new code, please ignore this email.
              </p>

              <!-- Security Notice -->
              <div style="
                margin-top:36px;
                background:#fafafa;
                border-left:6px solid #FF5A36;
                border-radius:12px;
                padding:18px 20px;
                text-align:left;">

                <p style="margin:0; font-size:14px; color:#444;">
                  🔐 Txme will never ask for this code. Do not share it with anyone.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center"
              style="background:#fafafa; padding:24px; border-top:1px solid #eee;">

              <p style="margin:0; font-size:12px; color:#777;">
                © ${new Date().getFullYear()} Txme. All rights reserved.
              </p>

              <p style="margin:6px 0 0; font-size:12px; color:#777;">
                Keeping your account secure
              </p>
              <p style="margin:12px 0 0; font-size:11px; color:#999; font-style:italic; line-height:1.4;">
                please contact <a href="mailto:oliver@txme.nl" style="color:#FF5A36; text-decoration:none;">oliver@txme.nl</a> if you wish to unsubscribe or if this communication was not requested by you
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `,
  };
};

const loginOtp = (values: { email: string; otp: number }) => {
  return {
    to: values.email,
    subject: "Your Txme login verification code",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#f6f6f6; font-family:Inter,Segoe UI,Tahoma,Verdana,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">

        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:640px; margin:40px auto; background:#ffffff;
                 border-radius:20px; overflow:hidden;
                 border:1px solid #eee; box-shadow:0 8px 30px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center"
              style="padding:48px 20px 36px; background:#ffffff; border-bottom:1px solid #f1f1f1;">

              <img
                src="https://texme-media-bucket.s3.us-east-1.amazonaws.com/serviceimage/1770608892815-1770608892522-7m6bfj.png"
                alt="Txme Logo"
                style="height:130px; width:auto; display:block; margin-bottom:22px;" />

              <h1 style="margin:0; font-size:28px; font-weight:800; color:#FF5A36;">
                Login verification
              </h1>

              <p style="margin:10px 0 0; font-size:15px; color:#666;">
                A login attempt was made to your account
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:42px 45px; text-align:center;">

              <p style="font-size:16px; color:#444; line-height:1.7; margin:0 0 28px;">
                Use the verification code below to sign in to your
                <strong>Txme</strong> account.
              </p>

              <!-- OTP Box -->
              <div style="
                background:#fff1ec;
                border:3px solid #FF5A36;
                border-radius:22px;
                padding:36px 0;
                margin:36px auto;
                max-width:360px;">

                <div style="font-size:14px; font-weight:600; color:#777; margin-bottom:12px;">
                  LOGIN OTP
                </div>

                <span style="
                  font-size:48px;
                  font-weight:900;
                  letter-spacing:8px;
                  color:#FF5A36;">
                  ${values.otp}
                </span>
              </div>

              <p style="font-size:15px; color:#555; line-height:1.6; margin:0;">
                This code expires in <strong>5 minutes</strong>.<br />
                If you didn’t try to log in, please ignore this email.
              </p>

              <!-- Security Notice -->
              <div style="
                margin-top:36px;
                background:#fafafa;
                border-left:6px solid #FF5A36;
                border-radius:12px;
                padding:18px 20px;
                text-align:left;">

                <p style="margin:0; font-size:14px; color:#444;">
                  🔐 Txme will never ask for this code. Do not share it with anyone.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center"
              style="background:#fafafa; padding:24px; border-top:1px solid #eee;">

              <p style="margin:0; font-size:12px; color:#777;">
                © ${new Date().getFullYear()} Txme. All rights reserved.
              </p>

              <p style="margin:6px 0 0; font-size:12px; color:#777;">
                Protecting your account with secure login verification
              </p>
              <p style="margin:12px 0 0; font-size:11px; color:#999; font-style:italic; line-height:1.4;">
                please contact <a href="mailto:oliver@txme.nl" style="color:#FF5A36; text-decoration:none;">oliver@txme.nl</a> if you wish to unsubscribe or if this communication was not requested by you
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `,
  };
};

export const emailTemplate = {
  createAccount,
  resetPassword,
  resendOtpEmail,
  loginOtp
};
