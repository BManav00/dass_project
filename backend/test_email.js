require('dotenv').config();
const sendEmail = require('./utils/emailService');

const testEmail = async () => {
    console.log('Testing Resend Email Integration...');
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_123456789') {
        console.warn('⚠️ Please set a valid RESEND_API_KEY in .env before testing.');
    }

    await sendEmail(
        'manavberiwal006@gmail.com', // Replace with your email if needed
        'Test Email from Event Management App',
        'This is a test email sent via Resend API.',
        '<h1>Resend Integration Test</h1><p>This is a <strong>test email</strong> sent via Resend API.</p>'
    );
};

testEmail();
