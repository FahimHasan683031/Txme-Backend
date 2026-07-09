"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const stripe_service_1 = require("./stripe.service");
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const createTopUpPaymentIntent = (0, catchAsync_1.default)(async (req, res) => {
    const { amount } = req.body;
    const baseUrl = `${req.protocol}://${req.get('host')}/api/v1/stripe`;
    const result = await stripe_service_1.StripeService.createTopUpPaymentIntent(req.user.id, amount, req.user.email, `${baseUrl}/payment-return`, `${baseUrl}/payment-refresh`);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Payment intent created successfully",
        data: result,
    });
});
const verifyTopUpPayment = (0, catchAsync_1.default)(async (req, res) => {
    const { paymentIntentId } = req.body;
    const result = await stripe_service_1.StripeService.verifyTopUpPayment(paymentIntentId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Payment verified successfully",
        data: result,
    });
});
const createAppointmentPaymentIntent = (0, catchAsync_1.default)(async (req, res) => {
    const { appointmentId } = req.params;
    const baseUrl = `${req.protocol}://${req.get('host')}/api/v1/stripe`;
    const result = await stripe_service_1.StripeService.createAppointmentPaymentIntent(appointmentId, req.user.email, `${baseUrl}/payment-return`, `${baseUrl}/payment-refresh`);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Appointment payment intent created successfully",
        data: result,
    });
});
const createAccountLink = (0, catchAsync_1.default)(async (req, res) => {
    let { return_url, refresh_url } = req.body;
    if (!return_url || !refresh_url) {
        const baseUrl = `${req.protocol}://${req.get('host')}/api/v1/stripe`;
        return_url = `${baseUrl}/return`;
        refresh_url = `${baseUrl}/refresh`;
    }
    const stripeAccountId = await stripe_service_1.StripeService.createExpressAccount(req.user.id, req.user.email);
    const url = await stripe_service_1.StripeService.createAccountLink(stripeAccountId, return_url, refresh_url);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Account link created successfully",
        data: { url, stripeAccountId },
    });
});
const getAccountStatus = (0, catchAsync_1.default)(async (req, res) => {
    const result = await stripe_service_1.StripeService.getAccountStatus(req.user.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Account status retrieved successfully",
        data: result,
    });
});
// Export moved to bottom
const handleConnectReturn = (0, catchAsync_1.default)(async (req, res) => {
    const mobileAppUrl = "txme://app/stripe-onboarding?result=success";
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Connected - Txme</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333;
            }
            .card {
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                text-align: center;
                max-width: 400px;
                width: 90%;
            }
            .icon {
                font-size: 60px;
                color: #4CAF50;
                margin-bottom: 20px;
            }
            h1 {
                margin: 0 0 10px;
                font-size: 24px;
                color: #2D3748;
            }
            p {
                margin: 0 0 30px;
                color: #718096;
                line-height: 1.5;
            }
            .btn {
                display: inline-block;
                padding: 15px 30px;
                background-color: #4A90E2;
                color: white;
                text-decoration: none;
                border-radius: 12px;
                font-weight: bold;
                transition: transform 0.2s, background-color 0.2s;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .btn:active {
                transform: scale(0.98);
                background-color: #357ABD;
            }
            .loader {
                margin-top: 20px;
                font-size: 14px;
                color: #A0AEC0;
            }
        </style>
        <script>
            function performRedirect() {
                try {
                    window.location.href = "${mobileAppUrl}";
                    if (window.top && window.top !== window) {
                        window.top.location.href = "${mobileAppUrl}";
                    }
                    var link = document.createElement('a');
                    link.href = "${mobileAppUrl}";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (e) {}
            }
            performRedirect();
            window.addEventListener('load', function() {
                setTimeout(performRedirect, 200);
            });
            setTimeout(performRedirect, 2000);
        </script>
    </head>
    <body onclick="performRedirect()">
        <div class="card">
            <div class="icon">✅</div>
            <h1>Account Connected!</h1>
            <p>Your Stripe account is successfully connected. We are taking you back to the Txme app.</p>
            <a href="${mobileAppUrl}" class="btn">Return to App</a>
            <div class="loader">If the app doesn't open automatically, <br><strong>tap anywhere</strong> or click the button.</div>
        </div>
    </body>
    </html>
    `;
    res.send(html);
});
const handleConnectRefresh = (0, catchAsync_1.default)(async (req, res) => {
    const mobileAppUrl = "txme://app/stripe-onboarding?result=failed";
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Connection Incomplete - Txme</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
                color: #333;
            }
            .card {
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                text-align: center;
                max-width: 400px;
                width: 90%;
            }
            .icon {
                font-size: 60px;
                color: #FFA000;
                margin-bottom: 20px;
            }
            h1 {
                margin: 0 0 10px;
                font-size: 24px;
                color: #2D3748;
            }
            p {
                margin: 0 0 30px;
                color: #718096;
                line-height: 1.5;
            }
            .btn {
                display: inline-block;
                padding: 15px 30px;
                background-color: #4A90E2;
                color: white;
                text-decoration: none;
                border-radius: 12px;
                font-weight: bold;
                transition: transform 0.2s, background-color 0.2s;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .btn:active {
                transform: scale(0.98);
                background-color: #357ABD;
            }
            .loader {
                margin-top: 20px;
                font-size: 14px;
                color: #A0AEC0;
            }
        </style>
        <script>
            function performRedirect() {
                try {
                    window.location.href = "${mobileAppUrl}";
                    if (window.top && window.top !== window) {
                        window.top.location.href = "${mobileAppUrl}";
                    }
                    var link = document.createElement('a');
                    link.href = "${mobileAppUrl}";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (e) {}
            }
            performRedirect();
            window.addEventListener('load', function() {
                setTimeout(performRedirect, 200);
            });
            setTimeout(performRedirect, 2000);
        </script>
    </head>
    <body onclick="performRedirect()">
        <div class="card">
            <div class="icon">⚠️</div>
            <h1>Connection Incomplete</h1>
            <p>Your Stripe connection was not finished. Please return to the app to try again.</p>
            <a href="${mobileAppUrl}" class="btn">Return to App</a>
            <div class="loader">If the app doesn't open automatically, <br><strong>tap anywhere</strong> or click the button.</div>
        </div>
    </body>
    </html>
    `;
    res.send(html);
});
const handlePaymentReturn = (0, catchAsync_1.default)(async (req, res) => {
    const mobileAppUrl = "txme://app/payment-status?result=success";
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful - Txme</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333;
            }
            .card {
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                text-align: center;
                max-width: 400px;
                width: 90%;
            }
            .icon {
                font-size: 60px;
                color: #4CAF50;
                margin-bottom: 20px;
            }
            h1 {
                margin: 0 0 10px;
                font-size: 24px;
                color: #2D3748;
            }
            p {
                margin: 0 0 30px;
                color: #718096;
                line-height: 1.5;
            }
            .btn {
                display: inline-block;
                padding: 15px 30px;
                background-color: #4A90E2;
                color: white;
                text-decoration: none;
                border-radius: 12px;
                font-weight: bold;
                transition: transform 0.2s, background-color 0.2s;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .btn:active {
                transform: scale(0.98);
                background-color: #357ABD;
            }
            .loader {
                margin-top: 20px;
                font-size: 14px;
                color: #A0AEC0;
            }
        </style>
        <script>
            function performRedirect() {
                try {
                    window.location.href = "${mobileAppUrl}";
                    if (window.top && window.top !== window) {
                        window.top.location.href = "${mobileAppUrl}";
                    }
                    var link = document.createElement('a');
                    link.href = "${mobileAppUrl}";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (e) {}
            }
            performRedirect();
            window.addEventListener('load', function() {
                setTimeout(performRedirect, 200);
            });
            setTimeout(performRedirect, 2000);
        </script>
    </head>
    <body onclick="performRedirect()">
        <div class="card">
            <div class="icon">✅</div>
            <h1>Payment Successful!</h1>
            <p>Your payment has been successfully completed. We are taking you back to the Txme app.</p>
            <a href="${mobileAppUrl}" class="btn">Return to App</a>
            <div class="loader">If the app doesn't open automatically, <br><strong>tap anywhere</strong> or click the button.</div>
        </div>
    </body>
    </html>
    `;
    res.send(html);
});
const handlePaymentRefresh = (0, catchAsync_1.default)(async (req, res) => {
    const mobileAppUrl = "txme://app/payment-status?result=failed";
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Incomplete - Txme</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
                color: #333;
            }
            .card {
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                text-align: center;
                max-width: 400px;
                width: 90%;
            }
            .icon {
                font-size: 60px;
                color: #FFA000;
                margin-bottom: 20px;
            }
            h1 {
                margin: 0 0 10px;
                font-size: 24px;
                color: #2D3748;
            }
            p {
                margin: 0 0 30px;
                color: #718096;
                line-height: 1.5;
            }
            .btn {
                display: inline-block;
                padding: 15px 30px;
                background-color: #4A90E2;
                color: white;
                text-decoration: none;
                border-radius: 12px;
                font-weight: bold;
                transition: transform 0.2s, background-color 0.2s;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .btn:active {
                transform: scale(0.98);
                background-color: #357ABD;
            }
            .loader {
                margin-top: 20px;
                font-size: 14px;
                color: #A0AEC0;
            }
        </style>
        <script>
            function performRedirect() {
                try {
                    window.location.href = "${mobileAppUrl}";
                    if (window.top && window.top !== window) {
                        window.top.location.href = "${mobileAppUrl}";
                    }
                    var link = document.createElement('a');
                    link.href = "${mobileAppUrl}";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (e) {}
            }
            performRedirect();
            window.addEventListener('load', function() {
                setTimeout(performRedirect, 200);
            });
            setTimeout(performRedirect, 2000);
        </script>
    </head>
    <body onclick="performRedirect()">
        <div class="card">
            <div class="icon">⚠️</div>
            <h1>Payment Incomplete</h1>
            <p>Your payment was not finished. Please return to the app to try again.</p>
            <a href="${mobileAppUrl}" class="btn">Return to App</a>
            <div class="loader">If the app doesn't open automatically, <br><strong>tap anywhere</strong> or click the button.</div>
        </div>
    </body>
    </html>
    `;
    res.send(html);
});
const renderStripePaymentPage = (0, catchAsync_1.default)(async (req, res) => {
    const { clientSecret } = req.query;
    if (!clientSecret) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("Missing clientSecret");
        return;
    }
    // Derive publishable key from secret key
    const secretKey = config_1.default.stripe.stripeSecretKey;
    const publishableKey = secretKey.replace(/^sk_/, "pk_");
    const successUrl = `${req.protocol}://${req.get('host')}/api/v1/stripe/payment-return`;
    const cancelUrl = `${req.protocol}://${req.get('host')}/api/v1/stripe/payment-refresh`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Txme Payment</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://js.stripe.com/v3/"></script>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 16px;
                background-color: #f7fafc;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
            }
            .payment-form {
                width: 100%;
                max-width: 450px;
                background: white;
                padding: 30px;
                border-radius: 16px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            }
            h2 {
                margin-top: 0;
                margin-bottom: 20px;
                color: #2d3748;
                font-size: 22px;
                text-align: center;
            }
            #card-element {
                padding: 15px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                background-color: #fff;
                margin-bottom: 20px;
            }
            button {
                background: #4F46E5;
                color: #ffffff;
                font-family: inherit;
                border: 0;
                padding: 12px 16px;
                font-size: 16px;
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: block;
                width: 100%;
            }
            button:hover {
                filter: brightness(0.9);
            }
            button:disabled {
                opacity: 0.5;
                cursor: default;
            }
            #error-message {
                color: #df1b41;
                font-size: 14px;
                margin-top: 12px;
                text-align: center;
            }
            .loader {
                display: none;
                margin: 0 auto;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #4F46E5;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div class="payment-form">
            <h2>Complete Your Payment</h2>
            <form id="payment-form">
                <div id="card-element"></div>
                <button id="submit">
                    <span id="button-text">Pay Now</span>
                    <div class="loader" id="loader"></div>
                </button>
                <div id="error-message"></div>
            </form>
        </div>

        <script>
            const stripe = Stripe('${publishableKey}');
            const elements = stripe.elements();
            
            const style = {
                base: {
                    color: '#32325d',
                    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                    fontSmoothing: 'antialiased',
                    fontSize: '16px',
                    '::placeholder': {
                        color: '#aab7c4'
                    }
                },
                invalid: {
                    color: '#fa755a',
                    iconColor: '#fa755a'
                }
            };

            const card = elements.create('card', { style: style });
            card.mount('#card-element');

            const form = document.getElementById('payment-form');
            const submitButton = document.getElementById('submit');
            const buttonText = document.getElementById('button-text');
            const loader = document.getElementById('loader');
            const errorMessage = document.getElementById('error-message');

            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                setLoading(true);

                const { paymentIntent, error } = await stripe.confirmCardPayment('${clientSecret}', {
                    payment_method: {
                        card: card
                    }
                });

                if (error) {
                    errorMessage.textContent = error.message;
                    setLoading(false);
                } else {
                    if (paymentIntent.status === 'succeeded') {
                        window.location.href = "${successUrl}";
                    } else {
                        window.location.href = "${cancelUrl}";
                    }
                }
            });

            function setLoading(isLoading) {
                if (isLoading) {
                    submitButton.disabled = true;
                    buttonText.style.display = 'none';
                    loader.style.display = 'block';
                    errorMessage.textContent = '';
                } else {
                    submitButton.disabled = false;
                    buttonText.style.display = 'inline';
                    loader.style.display = 'none';
                }
            }
        </script>
    </body>
    </html>
    `;
    res.send(html);
});
exports.StripeController = {
    createAccountLink,
    getAccountStatus,
    createTopUpPaymentIntent,
    verifyTopUpPayment,
    createAppointmentPaymentIntent,
    handleConnectReturn,
    handleConnectRefresh,
    handlePaymentReturn,
    handlePaymentRefresh,
    renderStripePaymentPage
};
