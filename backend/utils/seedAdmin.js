const User = require('../models/User');
const { hashPassword } = require('./auth');

/**
 * Seed admin user from environment variables
 * Called on server startup
 */
const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminName = process.env.ADMIN_NAME;

        if (!adminEmail || !adminPassword || !adminName) {
            console.log('⚠️  Admin credentials not found in .env - skipping admin seeding');
            return;
        }

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });

        if (existingAdmin) {
            console.log('✓ Admin user already exists:', adminEmail);
            return;
        }

        // Create admin user
        const hashedPassword = await hashPassword(adminPassword);

        const admin = new User({
            name: adminName,
            email: adminEmail.toLowerCase(),
            password: hashedPassword,
            role: 'Admin',
            metadata: {
                createdBy: 'system',
                seedDate: new Date()
            }
        });

        await admin.save();

        console.log('✓ Admin user created successfully!');
        console.log('  Email:', adminEmail);
        console.log('  Password:', adminPassword);
        console.log('  Role: Admin');
        console.log('⚠️  Please change the admin password after first login!');

    } catch (error) {
        console.error('❌ Error seeding admin user:', error.message);
    }
};

module.exports = seedAdmin;
