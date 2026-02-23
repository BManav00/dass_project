const { Resend } = require('resend');

let resend;

/**
 * Sends an email using Resend API
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content
 * @param {Array} attachments - Optional attachments [{ filename: string, content: Buffer/String, content_type: string }]
 */
const sendEmail = async (to, subject, text, html, attachments = []) => {
    try {
        const apiKey = process.env.RESEND_API_KEY;
        const fromEmail = process.env.EMAIL_FROM || 'dass@kritikmc.com';

        if (!apiKey) {
            console.warn('⚠️ RESEND_API_KEY not set. Email simulation:');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            return;
        }

        // Lazy initialization to ensure ENV is loaded
        if (!resend) {
            resend = new Resend(apiKey);
        }

        const payload = {
            from: `Felicity MGMT <${fromEmail}>`,
            to,
            subject,
            html: html || text,
            attachments: attachments.length > 0 ? attachments : undefined
        };

        const response = await resend.emails.send(payload);

        if (response.error) {
            console.error(`❌ Resend Error Details (${to}):`, {
                error: response.error,
                to,
                from: payload.from,
                subject
            });
            return { error: response.error, to };
        }

        console.log(`✅ Email sent successfully to ${to}:`, response.data);
        return { ...response.data, to };
    } catch (error) {
        console.error('❌ Unexpected Catch-all Error in emailService:', error);
        // Don't throw to prevent crashing the request, just log it
        return { error: error.message || error, to };
    }
};

module.exports = sendEmail;
