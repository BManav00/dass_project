require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testVerifiedEmail() {
    console.log('--- Resend Verification Test ---');
    console.log('API Key:', process.env.RESEND_API_KEY ? 'Present (matches .env)' : 'MISSING');
    console.log('From Address:', process.env.EMAIL_FROM);
    console.log('To Address: manavberiwal07904521@gmail.com');
    console.log('--------------------------------');

    try {
        const response = await resend.emails.send({
            from: `Felicity MGMT <${process.env.EMAIL_FROM}>`,
            to: 'manavberiwal07904521@gmail.com',
            subject: 'Domain Verification Check',
            html: '<h1>If you see this, your domain is working!</h1>'
        });

        if (response.error) {
            console.error('❌ Resend API Error Object:');
            console.dir(response.error, { depth: null });
        } else {
            console.log('✅ Success! Full Response:');
            console.dir(response.data, { depth: null });
        }
    } catch (err) {
        console.error('❌ Unexpected Catch Error:');
        console.error(err);
    }
}

testVerifiedEmail();
