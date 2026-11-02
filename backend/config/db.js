const mongoose = require('mongoose');
const dns = require('dns');

let isConnecting = false;

const isServerless = Boolean(
    process.env.VERCEL || 
    process.env.VERCEL_ENV || 
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NOW_REGION
);

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error('[Database Error]: MONGO_URI is not set in environment.');
        return;
    }

    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (isConnecting) {
        return;
    }

    isConnecting = true;

    // In local development, use public DNS to bypass ISP querySrv issues.
    // In serverless (Vercel / Lambda), let the platform DNS resolver handle VPC/Atlas resolution.
    if (!isServerless) {
        try {
            dns.setServers(['8.8.8.8', '1.1.1.1']);
        } catch (_) {}
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
            console.error('💡 [Atlas Tip]: Go to MongoDB Atlas (cloud.mongodb.com) -> Security -> Network Access -> Add IP Address (Add 0.0.0.0/0 for Vercel).');
        }
        if (!isServerless) {
            console.log('🔄 [Database]: Retrying connection in 10 seconds...');
            setTimeout(connectDB, 10000);
        }
    }
};

module.exports = connectDB;
