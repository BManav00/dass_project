const axios = require('axios');

/**
 * Sends a notification to a Discord channel via webhook
 * @param {string} webhookUrl - The Discord webhook URL
 * @param {Object} event - The event object
 */
const sendEventNotification = async (webhookUrl, event) => {
    if (!webhookUrl) return;

    try {
        const payload = {
            embeds: [
                {
                    title: `🚀 New Event Published: ${event.name}`,
                    description: event.description,
                    color: 5814783, // Felicity Blue
                    fields: [
                        {
                            name: '📅 Date',
                            value: new Date(event.date).toLocaleString(),
                            inline: true
                        },
                        {
                            name: '🏷️ Type',
                            value: event.type,
                            inline: true
                        },
                        {
                            name: '💰 Price',
                            value: event.price > 0 ? `₹${event.price}` : 'Free',
                            inline: true
                        }
                    ],
                    footer: {
                        text: 'Felicity Event Management System'
                    },
                    timestamp: new Date()
                }
            ]
        };

        await axios.post(webhookUrl, payload);
    } catch (error) {
        console.error('Discord Webhook Error:', error.message);
        // We don't throw error here to avoid breaking the main flow
    }
};

module.exports = { sendEventNotification };
