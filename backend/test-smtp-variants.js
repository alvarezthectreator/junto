import nodemailer from 'nodemailer';

// Test different cPanel SMTP configurations
const configs = [
  {
    name: 'Current: Port 465 (SSL)',
    host: 'mail.orquex.com',
    port: 465,
    secure: true,
    auth: { user: 'testmail@orquex.com', pass: '100000000' }
  },
  {
    name: 'Alt 1: Port 587 (TLS)',
    host: 'mail.orquex.com',
    port: 587,
    secure: false,
    auth: { user: 'testmail@orquex.com', pass: '100000000' }
  },
  {
    name: 'Alt 2: Port 25 (No SSL)',
    host: 'mail.orquex.com',
    port: 25,
    secure: false,
    auth: { user: 'testmail@orquex.com', pass: '100000000' }
  },
  {
    name: 'Alt 3: Hostname without "mail." prefix',
    host: 'orquex.com',
    port: 465,
    secure: true,
    auth: { user: 'testmail@orquex.com', pass: '100000000' }
  }
];

let tested = 0;
let working = null;

console.log('🔍 Testing cPanel SMTP Configurations\n');
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
    console.log(`CPANEL_EMAIL_HOST=${working.host}`);
    console.log(`CPANEL_EMAIL_PORT=${working.port}`);
    console.log(`CPANEL_EMAIL_USER=testmail@orquex.com`);
    console.log(`CPANEL_EMAIL_PASSWORD=100000000`);
    console.log(`CPANEL_EMAIL_FROM=testmail@orquex.com\n`);
    
    console.log('Then restart the backend:');
    console.log('  npm run dev\n');
  } else {
    console.log('❌ NO WORKING CONFIGURATION FOUND\n');
    console.log('This usually means:\n');
    console.log('1. ❌ Email account not created in cPanel');
    console.log('2. ❌ Wrong password (verify in cPanel > Email Accounts)');
    console.log('3. ❌ Network/firewall blocking SMTP ports\n');
    console.log('💡 Recommendation: Use Gmail SMTP instead for testing:\n');
    console.log('  - Easier to set up');
    console.log('  - More reliable');
    console.log('  - Can test immediately\n');
  }
  
  process.exit(0);
}

setTimeout(() => {
  console.log('\n⏱️ Timeout waiting for responses');
  process.exit(1);
}, 30000);
