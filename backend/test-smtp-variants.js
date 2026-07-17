import nodemailer from 'nodemailer';

const smtpHost = process.env.ZEPTOMAIL_HOST || 'smtp.zeptomail.com';
const smtpUser = process.env.ZEPTOMAIL_USER || 'emailapikey';
const smtpPass = process.env.ZEPTOMAIL_PASSWORD || '';
const smtpFrom = process.env.ZEPTOMAIL_FROM || 'no-reply@wantuu.com';

// Test different ZeptoMail SMTP configurations
const configs = [
  {
    name: 'Current: Port 465 (SSL)',
    host: smtpHost,
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass }
  },
  {
    name: 'Alt 1: Port 587 (TLS)',
    host: smtpHost,
    port: 587,
    secure: false,
    auth: { user: smtpUser, pass: smtpPass }
  },
  {
    name: 'Alt 2: Port 25 (No SSL)',
    host: smtpHost,
    port: 25,
    secure: false,
    auth: { user: smtpUser, pass: smtpPass }
  },
  {
    name: 'Alt 3: Hostname without "smtp." prefix',
    host: 'zeptomail.com',
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass }
  }
];

let tested = 0;
let working = null;

console.log('🔍 Testing ZeptoMail SMTP Configurations\n');
console.log('This will test 4 different configurations...\n');

configs.forEach((config, index) => {
  setTimeout(() => {
    console.log(`[${index + 1}/4] Testing: ${config.name}`);
    
    const transporter = nodemailer.createTransport(config);
    
    transporter.verify((error, success) => {
      tested++;
      
      if (success) {
        console.log(`✅ SUCCESS!\n`);
        working = config;
      } else {
        console.log(`❌ Failed: ${error.message}\n`);
      }
      
      if (tested === configs.length) {
        printResults();
      }
    });
  }, index * 3000);
});

function printResults() {
  console.log('\n' + '='.repeat(50));
  console.log('TEST RESULTS');
  console.log('='.repeat(50) + '\n');
  
  if (working) {
    console.log('✅ WORKING CONFIGURATION FOUND!\n');
    console.log('Use these settings in backend/.env:\n');
    console.log(`ZEPTOMAIL_HOST=${working.host}`);
    console.log(`ZEPTOMAIL_PORT=${working.port}`);
    console.log(`ZEPTOMAIL_USER=emailapikey`);
    console.log(`ZEPTOMAIL_PASSWORD=your-zeptomail-password`);
    console.log(`ZEPTOMAIL_FROM=${smtpFrom}\n`);
    
    console.log('Then restart the backend:');
    console.log('  npm run dev\n');
  } else {
    console.log('❌ NO WORKING CONFIGURATION FOUND\n');
    console.log('This usually means:\n');
    console.log('1. ❌ Sender email/domain not verified in ZeptoMail');
    console.log('2. ❌ Wrong SMTP password or username');
    console.log('3. ❌ Network/firewall blocking SMTP ports\n');
    console.log('💡 Recommendation: Double-check the verified sender and SMTP token in ZeptoMail.\n');
  }
  
  process.exit(0);
}

setTimeout(() => {
  console.log('\n⏱️ Timeout waiting for responses');
  process.exit(1);
}, 30000);
