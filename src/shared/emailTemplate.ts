import config from '../config';



const createAccount = (values: any) => {
  const data = {
    to: values.email,
    subject: `Verify your Txme account, ${values.name}`,
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
                src="https://i.ibb.co.com/XrDytJV1/0b93a78e7f086c8a309266ebc5c6dcac895dd0c2.png"
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
                Hi <strong style="color:#FF5A36;">${values.name}</strong>,<br />
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
                src="https://i.ibb.co.com/XrDytJV1/0b93a78e7f086c8a309266ebc5c6dcac895dd0c2.png"
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
                src="https://i.ibb.co.com/XrDytJV1/0b93a78e7f086c8a309266ebc5c6dcac895dd0c2.png"
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
                src="https://i.ibb.co.com/XrDytJV1/0b93a78e7f086c8a309266ebc5c6dcac895dd0c2.png"
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


const resendOtp = (values: {
  email: string
  name: string
  otp: string
  type: 'resetPassword' | 'createAccount'
}) => {
  console.log(values, 'values')
  const isReset = values.type === 'resetPassword'

  const data = {
    to: values.email,
    subject: `${isReset ? 'Password Reset' : 'Account Verification'} - New Code`,
    html: `
   <body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; margin:40px auto; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 5px 25px rgba(0,0,0,0.08);">

    <!-- Header -->
    <tr>
      <td align="center" style="background:#2c2c2c; padding:35px 20px; border-top:1px solid #e6e6e6;">
        <img 
          src="https://i.ibb.co.com/jks76tpB/8a6289d738dfae4e5ecc32ab7b4cd261fd2b5e71.png" 
          alt="Just Breath"
          style="width:160px; height:auto; filter:drop-shadow(0 0 6px rgba(0,0,0,0.25));"
        >
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:45px;">
        <h1 style="color:#0b3d3a; font-size:26px; font-weight:700; margin-bottom:15px; text-align:center;">
          ${isReset ? 'Reset Your Password 🔐' : 'Verify Your Account 🌿'}
        </h1>

        <p style="color:#334f4e; font-size:16px; line-height:1.6; margin-bottom:25px; text-align:center;">
          Hi <strong>${values.name}</strong>, 👋<br>
          ${
            isReset
              ? 'You requested to reset your password for your Just Breath account.'
              : 'Welcome to <strong>Just Breath</strong> — your calm, your space, your journey begins here.'
          }<br>
          Please use the code below to continue:
        </p>

        <!-- OTP Box -->
        <div style="background:linear-gradient(145deg,#e2f6f5,#c9ecea); border:2px solid #4ca8a3; border-radius:12px; padding:25px 0; text-align:center; margin:30px auto; max-width:300px;">
          <span style="font-size:40px; font-weight:700; color:#0b3d3a; letter-spacing:6px;">
            ${values.otp}
          </span>
        </div>

        <p style="color:#334f4e; font-size:15px; line-height:1.6; text-align:center;">
          This code is valid for <strong>5 minutes</strong>.<br>
          If this wasn't you, simply ignore this email.
        </p>

        <!-- Tip -->
        <div style="margin-top:35px; background-color:#fff8e1; border-left:6px solid #ffd54f; border-radius:8px; padding:15px 18px;">
          <p style="margin:0; color:#4a4a4a; font-size:14px;">
            🔒 <strong>Security Tip:</strong> Never share your OTP with anyone. Just Breath support will never ask for it.
          </p>
        </div>

        <!-- Button -->
        <div style="text-align:center; margin-top:45px;">
          <a href="https://justbreath.com/otp-verify" 
             style="background-color:#0b3d3a; color:#ffffff; padding:14px 32px; font-size:16px; font-weight:600; border-radius:10px; text-decoration:none; display:inline-block; box-shadow:0 4px 12px rgba(11,61,58,0.3); transition:all 0.3s;">
            ${isReset ? 'Reset Password' : 'Open Just Breath 🌿'}
          </a>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" style="background-color:#f4f4f4; padding:25px 20px; border-top:1px solid #e6e6e6;">
        <p style="margin:0; color:#566a69; font-size:13px;">
          © ${new Date().getFullYear()} <strong>Just Breath</strong>. All rights reserved.
        </p>
        <p style="margin:6px 0 0; color:#334f4e; font-size:13px;">
          Powered by <strong style="color:#0b3d3a;">Just Breath API</strong> 🌿
        </p>
      </td>
    </tr>

  </table>
</body>
    `,
  }

  return data
}

const adminContactNotificationEmail = (payload: {
  name: string
  email: string
  phone?: string
  message: string
}) => {
  return {
    to: config.admin.email as string,
    subject: '📩 New Contact Form Submission – Just Breath',
    html: `
<body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="max-width:640px; margin:40px auto; background-color:#ffffff; border-radius:14px;
                overflow:hidden; box-shadow:0 5px 25px rgba(0,0,0,0.08);">

    <!-- Header -->
    <tr>
      <td align="center" style="background:#2c2c2c; padding:35px 20px; border-top:1px solid #dfeeee;">
        <img 
          src="https://i.ibb.co.com/jks76tpB/8a6289d738dfae4e5ecc32ab7b4cd261fd2b5e71.png" 
          alt="Just Breath"
          style="width:170px; height:auto; filter:drop-shadow(0 0 6px rgba(0,0,0,0.25));"
        >
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:45px;">
        <h1 style="color:#0b3d3a; font-size:26px; font-weight:700; margin-bottom:20px; text-align:center;">
          📬 New Contact Form Submission
        </h1>

        <p style="color:#335958; font-size:16px; text-align:center; margin-bottom:25px;">
          A new message has been submitted through the <strong>Just Breath</strong> contact form.
        </p>

        <!-- Contact Details -->
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
          <tr>
            <td style="padding:10px 0; font-size:15px; color:#335958;">👤 <strong>Name:</strong></td>
            <td style="padding:10px 0; font-size:15px; color:#0b3d3a; text-align:right;">${payload.name}</td>
          </tr>
          <tr style="border-top:1px solid #e3f0ef;">
            <td style="padding:10px 0; font-size:15px; color:#335958;">📧 <strong>Email:</strong></td>
            <td style="padding:10px 0; font-size:15px; color:#0b3d3a; text-align:right;">${payload.email}</td>
          </tr>
          <tr style="border-top:1px solid #e3f0ef;">
            <td style="padding:10px 0; font-size:15px; color:#335958;">📞 <strong>Phone:</strong></td>
            <td style="padding:10px 0; font-size:15px; color:#0b3d3a; text-align:right;">${payload.phone || 'N/A'}</td>
          </tr>
        </table>

        <!-- Message Box -->
        <div style="background-color:#f4f7f7; border-left:6px solid #0b3d3a; border-radius:8px; padding:20px; margin-top:25px;">
          <p style="margin:0; font-size:15px; color:#0b3d3a; line-height:1.6;">
            "${payload.message}"
          </p>
        </div>

        <p style="color:#335958; font-size:14px; margin-top:25px; text-align:center;">
          You can respond directly to <strong>${payload.email}</strong>.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" style="background-color:#f4f7f7; padding:25px 20px; border-top:1px solid #dfeeee;">
        <p style="margin:0; color:#567473; font-size:13px;">
          © ${new Date().getFullYear()} <strong>Just Breath</strong>. All rights reserved.
        </p>
        <p style="margin:6px 0 0; color:#335958; font-size:13px;">
          Powered by <strong style="color:#0b3d3a;">Just Breath API</strong> 🌿
        </p>
      </td>
    </tr>

  </table>
</body>
    `,
  }
}

const userContactConfirmationEmail = (payload: {
  name: string
  email: string
  message: string
}) => {
  return {
    to: payload.email,
    subject: '💬 Thank You for Contacting Just Breath',
    html: `
<body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="max-width:640px; margin:40px auto; background-color:#ffffff; border-radius:14px;
                overflow:hidden; box-shadow:0 5px 25px rgba(0,0,0,0.08);">

    <!-- Header -->
    <tr>
      <td align="center" style="background:#2c2c2c; padding:35px 20px; border-top:1px solid #dfeeee;">
        <img 
          src="https://i.ibb.co.com/jks76tpB/8a6289d738dfae4e5ecc32ab7b4cd261fd2b5e71.png"
          alt="Just Breath"
          style="width:170px; height:auto; filter:drop-shadow(0 0 6px rgba(0,0,0,0.25));"
        >
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:45px;">
        <h1 style="color:#0b3d3a; font-size:26px; font-weight:700; margin-bottom:20px; text-align:center;">
          Thank You for Contacting Us 🌿
        </h1>

        <p style="color:#335958; font-size:16px; line-height:1.6; text-align:center;">
          Dear <strong>${payload.name}</strong>,<br>
          We’ve received your message — our team will respond shortly.
        </p>

        <!-- Your Message -->
        <div style="
          background:linear-gradient(145deg,#e8f3f1,#d9efec);
          border:2px solid #0b3d3a; 
          border-radius:12px; 
          padding:25px 20px; 
          text-align:center; 
          margin:30px auto; 
          max-width:500px;">
          <p style="font-size:15px; color:#0b3d3a; line-height:1.6; margin:0;">
            <em>“${payload.message}”</em>
          </p>
        </div>

        <p style="color:#335958; font-size:15px; line-height:1.6; text-align:center;">
          Thank you for choosing <strong>Just Breath</strong>.<br>
          We’re here to support you 🤍
        </p>

        <!-- Button -->
        <div style="text-align:center; margin-top:40px;">
          <a href="https://justbreath.com"
             style="
              background-color:#0b3d3a; 
              color:#ffffff; 
              padding:14px 32px; 
              font-size:16px;
              font-weight:600; 
              border-radius:10px; 
              text-decoration:none; 
              display:inline-block; 
              box-shadow:0 4px 12px rgba(0,0,0,0.25); 
              transition:all 0.3s;">
            Visit Just Breath 🌐
          </a>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" style="background-color:#f4f7f7; padding:25px 20px; border-top:1px solid #dfeeee;">
        <p style="margin:0; color:#567473; font-size:13px;">
          © ${new Date().getFullYear()} <strong>Just Breath</strong>. All rights reserved.
        </p>
        <p style="margin:6px 0 0; color:#335958; font-size:13px;">
          Powered by <strong style="color:#0b3d3a;">Just Breath API</strong> 🌿
        </p>
      </td>
    </tr>

  </table>
</body>
    `,
  }
}

const sendPaymentLinkEmail = ({
  data,
  paymentUrl,
}: {
  data: any
  paymentUrl: string
}) => {
  return {
    to: data.email,
    subject: `💳 Complete Your Payment – ${data.serviceType.title}`,
    html: `
<body style="margin:0; padding:0; font-family:'Inter','Segoe UI',Tahoma,Geneva,Verdana,sans-serif; ">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="max-width:640px; margin:40px auto; background:#ffffff; border-radius:16px;
                overflow:hidden; border:1px solid #e5e5e5; box-shadow:0 4px 20px rgba(0,0,0,0.06);">

    <!-- Header -->
    <tr>
      <td align="center" style="background:#2c2c2c; padding:35px 20px; border-bottom:1px solid #d9f3e4;">
        <img src="https://i.ibb.co.com/jks76tpB/8a6289d738dfae4e5ecc32ab7b4cd261fd2b5e71.png"
             alt="Just Breath Logo"
             style="height:85px; width:auto; margin-bottom:10px;" />
        <h1 style="color:#3cb371; font-size:24px; font-weight:700; margin:0;">
          Payment Required to Confirm Your Service
        </h1>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:40px;">

        <p style="color:#444; font-size:15px; line-height:1.7; text-align:center;">
          Hello <strong style="color:#3CB371;">${data.fullName}</strong>,  
          You need to complete your payment to confirm your <strong>${data.serviceType.title}</strong> service. 💚
        </p>

        <!-- Service Summary -->
        <h2 style="color:#3CB371; font-size:19px; margin-bottom:15px; margin-top:30px;">🧾 Service Details</h2>

        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0; color:#666; font-size:15px;">Service Type:</td>
            <td style="padding:8px 0; color:#222; text-align:right;">${data.serviceType.title}</td>
          </tr>

          <tr style="border-top:1px solid #e8e8e8;">
            <td style="padding:8px 0; color:#666;">Preferred Date:</td>
            <td style="padding:8px 0; color:#222; text-align:right;">
              ${new Date(data.preferredDateTime).toLocaleString('en-US')}
            </td>
          </tr>

          <tr style="border-top:1px solid #e8e8e8;">
            <td style="padding:8px 0; color:#666;">Address:</td>
            <td style="padding:8px 0; color:#222; text-align:right;">
              ${data.serviceAddress}
            </td>
          </tr>

          <tr style="border-top:1px solid #e8e8e8;">
            <td style="padding:8px 0; color:#666;">Property Size:</td>
            <td style="padding:8px 0; color:#222; text-align:right;">
              ${data.propertySize} sq ft
            </td>
          </tr>

          <tr style="border-top:1px solid #e8e8e8;">
            <td style="padding:8px 0; color:#666;">Cleaning Frequency:</td>
            <td style="padding:8px 0; color:#222; text-align:right;">
              ${data.cleaningFrequency}
            </td>
          </tr>

          <tr style="border-top:1px solid #e8e8e8;">
            <td style="padding:12px 0; color:#555; font-size:16px;">Total Price:</td>
            <td style="padding:12px 0; color:#3CB371; font-size:18px; font-weight:700; text-align:right;">
              £${data.serviceType.price}
            </td>
          </tr>
        </table>

        <!-- Notes Box -->
        <div style="background:#f1f8f4; padding:15px 18px; border-radius:12px; border-left:4px solid #3CB371; margin-top:25px;">
          <p style="margin:0; color:#444; font-size:14px;">
            💬 <strong>Notes:</strong> ${data.additionalNotes || 'No additional notes'}
          </p>
        </div>

        <!-- Payment Button -->
        <div style="text-align:center; margin:45px 0 30px;">
          <a href="${paymentUrl}"
             style="background:#3CB371; padding:14px 38px; color:#ffffff; font-size:17px;
                    font-weight:600; border-radius:12px; text-decoration:none;
                    box-shadow:0 4px 14px rgba(60,179,113,0.35); display:inline-block;">
            💳 Make Payment
          </a>
        </div>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" style="background:#f9f9f9; padding:22px; border-top:1px solid #e6e6e6;">
        <p style="margin:0; color:#777; font-size:12px;">
          © ${new Date().getFullYear()} — Just Breath Services
        </p>
        <p style="margin:5px 0 0; color:#777; font-size:12px;">
          Built with 💚 for your comfort
        </p>
      </td>
    </tr>

  </table>
</body>
    `,
  }
}

const sendPaymentConfirmationEmail = (data: any) => {
  return {
    to: data.email,
    subject: `✅ Payment Confirmed – ${data.serviceType.title}`,
    html: `
<body style="margin:0; padding:0; font-family:'Inter','Segoe UI',Tahoma,Geneva,Verdana,sans-serif; ">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="max-width:640px; margin:40px auto; background:#ffffff; border-radius:16px;
                overflow:hidden; border:1px solid #e5e5e5; box-shadow:0 4px 20px rgba(0,0,0,0.06);">

    <!-- Header -->
    <tr>
      <td align="center" style="background:#2c2c2c; padding:35px 20px; border-bottom:1px solid #d9f3e4;">
        <img src="https://i.ibb.co.com/jks76tpB/8a6289d738dfae4e5ecc32ab7b4cd261fd2b5e71.png"
             alt="Just Breath Logo"
             style="height:85px; width:auto; margin-bottom:10px;" />
        <h1 style="color:#3cb371; font-size:24px; font-weight:700; margin:0;">
          Payment Successfully Completed
        </h1>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:40px;">
        <p style="color:#444; font-size:15px; line-height:1.7; text-align:center;">
          Hello <strong style="color:#3CB371;">${data.fullName}</strong>,  
          your payment for <strong>${data.serviceType.title}</strong> has been successfully completed. 💚
        </p>

        <!-- Service Summary -->
        <h2 style="color:#3CB371; font-size:19px; margin-bottom:15px; margin-top:30px;">🧾 Service Details</h2>
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0; color:#666; font-size:15px;">Service Type:</td>
            <td style="padding:8px 0; color:#222; text-align:right;">${data.serviceType.title}</td>
          </tr>
          <tr style="border-top:1px solid #e8e8e8;">
            <td style="padding:8px 0; color:#666;">Preferred Date:</td>
            <td style="padding:8px 0; color:#222; text-align:right;">
              ${new Date(data.preferredDateTime).toLocaleString('en-US')}
            </td>
          </tr>
          <tr style="border-top:1px solid #e8e8e8;">
            <td style="padding:8px 0; color:#666;">Address:</td>
            <td style="padding:8px 0; color:#222; text-align:right;">${data.serviceAddress}</td>
          </tr>
          <tr style="border-top:1px solid #e8e8e8;">
            <td style="padding:8px 0; color:#666;">Total Paid:</td>
            <td style="padding:8px 0; color:#3CB371; font-weight:700; text-align:right;">
              £${data.serviceType.price}
            </td>
          </tr>
        </table>

        <!-- Notes -->
        <div style="background:#f1f8f4; padding:15px 18px; border-radius:12px; border-left:4px solid #3CB371; margin-top:25px;">
          <p style="margin:0; color:#444; font-size:14px;">
            💬 <strong>Notes:</strong> ${data.additionalNotes || 'No additional notes'}
          </p>
        </div>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" style="background:#f9f9f9; padding:22px; border-top:1px solid #e6e6e6;">
        <p style="margin:0; color:#777; font-size:12px;">
          © ${new Date().getFullYear()} — Just Breath Services
        </p>
        <p style="margin:5px 0 0; color:#777; font-size:12px;">
          Built with 💚 for your comfort
        </p>
      </td>
    </tr>

  </table>
</body>
    `,
  }
}

const sendAdminPaymentNotificationEmail = (data: any) => {
  return {
    to: config.admin.email as string,
    subject: `💡 Payment Completed by ${data.fullName} – ${data.serviceType.title}`,
    html: `
<body style="margin:0; padding:0; font-family:'Inter','Segoe UI',Tahoma,Geneva,Verdana,sans-serif; ">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="max-width:640px; margin:40px auto; background:#ffffff; border-radius:16px;
                overflow:hidden; border:1px solid #e5e5e5; box-shadow:0 4px 20px rgba(0,0,0,0.06);">

    <!-- Header -->
    <tr>
      <td align="center" style="background:#2c2c2c; padding:35px 20px; border-bottom:1px solid #d9f3e4;">
        <img src="https://i.ibb.co.com/jks76tpB/8a6289d738dfae4e5ecc32ab7b4cd261fd2b5e71.png"
             alt="Just Breath Logo"
             style="height:85px; width:auto; margin-bottom:10px;" />
        <h1 style="color:#3cb371; font-size:24px; font-weight:700; margin:0;">
          Payment Completed Notification
        </h1>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:40px;">
        <p style="color:#444; font-size:15px; line-height:1.7; text-align:center;">
          <strong style="color:#3CB371;">${data.fullName}</strong> has completed the payment for <strong>${data.serviceType.title}</strong>.
        </p>

        <!-- Service Summary -->
        <h2 style="color:#3CB371; font-size:19px; margin-bottom:15px; margin-top:30px;">🧾 Service Details</h2>
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0; color:#666; font-size:15px;">Customer Name:</td>
            <td style="padding:8px 0; color:#222; text-align:right;">${data.fullName}</td>
          </tr>
          <tr style="border-top:1px solid #e8e8e8;">
            <td style="padding:8px 0; color:#666;">Email:</td>
            <td style="padding:8px 0; color:#222; text-align:right;">${data.email}</td>
          </tr>
          <tr style="border-top:1px solid #e8e8e8;">
            <td style="padding:8px 0; color:#666;">Phone:</td>
            <td style="padding:8px 0; color:#222; text-align:right;">${data.phone}</td>
          </tr>
          <tr style="border-top:1px solid #e8e8e8;">
            <td style="padding:8px 0; color:#666;">Service Type:</td>
            <td style="padding:8px 0; color:#222; text-align:right;">${data.serviceType.title}</td>
          </tr>
          <tr style="border-top:1px solid #e8e8e8;">
            <td style="padding:8px 0; color:#666;">Preferred Date:</td>
            <td style="padding:8px 0; color:#222; text-align:right;">
              ${new Date(data.preferredDateTime).toLocaleString('en-US')}
            </td>
          </tr>
          <tr style="border-top:1px solid #e8e8e8;">
            <td style="padding:8px 0; color:#666;">Address:</td>
            <td style="padding:8px 0; color:#222; text-align:right;">${data.serviceAddress}</td>
          </tr>
          <tr style="border-top:1px solid #e8e8e8;">
            <td style="padding:8px 0; color:#666;">Total Paid:</td>
            <td style="padding:8px 0; color:#3CB371; font-weight:700; text-align:right;">£${data.serviceType.price}</td>
          </tr>
        </table>

        <!-- Notes -->
        <div style="background:#f1f8f4; padding:15px 18px; border-radius:12px; border-left:4px solid #3CB371; margin-top:25px;">
          <p style="margin:0; color:#444; font-size:14px;">
            💬 <strong>Notes:</strong> ${data.additionalNotes || 'No additional notes'}
          </p>
        </div>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" style="background:#f9f9f9; padding:22px; border-top:1px solid #e6e6e6;">
        <p style="margin:0; color:#777; font-size:12px;">
          © ${new Date().getFullYear()} — Just Breath Services
        </p>
        <p style="margin:5px 0 0; color:#777; font-size:12px;">
          Built with 💚 for your comfort
        </p>
      </td>
    </tr>

  </table>
</body>
    `,
  }
}



export const emailTemplate = {
    createAccount,
    resetPassword,
    resendOtpEmail,
    loginOtp
};