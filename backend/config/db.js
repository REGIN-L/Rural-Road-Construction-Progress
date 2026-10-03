const mongoose = require('mongoose');
const dns = require('dns');

let isConnecting = false;

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error('[Database Error]: MONGO_URI is not set in .env file.');
        return;
    }

    if (mongoose.connection.readyState === 1 || isConnecting) {
        return;
    }

    isConnecting = true;

    // Force Node.js to use Google DNS (8.8.8.8) and Cloudflare DNS (1.1.1.1) for SRV resolution
    // This fixes "querySrv ECONNREFUSED" errors on systems with broken default DNS
    try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (dnsErr) {
        // Ignore DNS server set errors if not permitted
    }

    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });
        isConnecting = false;
        console.log('✅ [Database]: MongoDB Atlas connected successfully');
        console.log(`✅ [Database]: Host → ${conn.connection.host}`);
    } catch (error) {
        isConnecting = false;
        // Print useful error WITHOUT exposing credentials or secrets
        const safeMessage = error.message
            .replace(/(mongodb(\+srv)?:\/\/)[^@]+@/gi, '$1****:****@')
            .replace(/password=[^&\s]*/gi, 'password=****');
        console.error('⚠️ [Database Error]: Connection failed —', safeMessage);
        if (error.message.includes('SSL alert number 80') || error.message.includes('tlsv1 alert internal error')) {
            console.error('💡 [Atlas Tip]: SSL alert 80 indicates your IP is not whitelisted in MongoDB Atlas.');
            console.error('💡 [Atlas Tip]: Go to MongoDB Atlas (cloud.mongodb.com) -> Security -> Network Access -> Add IP Address (Add Current IP or 0.0.0.0/0).');
        }
        console.log('🔄 [Database]: Retrying connection in 10 seconds...');
        setTimeout(connectDB, 10000);
    }
};

module.exports = connectDB;

