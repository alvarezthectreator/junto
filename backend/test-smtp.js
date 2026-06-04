import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing cPanel SMTP Connection\n');
console.log('Current Configuration:');
console.log(`  Host: ${process.env.CPANEL_EMAIL_HOST || 'mail.orquex.com'}`);
console.log(`  Port: ${process.env.CPANEL_EMAIL_PORT || '465'}`);
console.log(`  User: ${process.env.CPANEL_EMAIL_USER || 'testmail@orquex.com'}`);
console.log(`  Password: ${(process.env.CPANEL_EMAIL_PASSWORD || '100000000').substring(0, 3)}***`);
console.log(`  From: ${process.env.CPANEL_EMAIL_FROM || 'testmail@orquex.com'}\n`);

// Test with current config
const transporter = nodemailer.createTransport({
  host: process.env.CPANEL_EMAIL_HOST || 'mail.orquex.com',
  port: parseInt(process.env.CPANEL_EMAIL_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.CPANEL_EMAIL_USER || 'testmail@orquex.com',
    pass: process.env.CPANEL_EMAIL_PASSWORD || '100000000',
  },
});

console.log('🔗 Attempting to connect...\n');

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('\n📋 Possible causes:');
    console.log('  1. Wrong password - verify in cPanel > Email Accounts');
    console.log('  2. Wrong username - should be full email address');
    console.log('  3. Port issue - try 587 instead of 465');
    console.log('  4. Firewall - check if port is blocked');
    console.log('  5. Email not set up in cPanel\n');
    console.log('💡 Next steps:');
    console.log('  1. Log into your cPanel control panel');
    console.log('  2. Go to Email Accounts section');
    console.log('  3. Find testmail@orquex.com account');
    console.log('  4. Verify the password matches: ' + (process.env.CPANEL_EMAIL_PASSWORD || '100000000'));
    console.log('  5. Note the full email: testmail@orquex.com');
    console.log('  6. Try alternative ports: 25, 587 (TLS), or 465 (SSL)');
  } else {
    console.log('✅ SMTP connection successful!');
    console.log('\n📧 You can now send emails through this account.');
    
    // Try sending a test email
    const mailOptions = {
      from: process.env.CPANEL_EMAIL_FROM || 'testmail@orquex.com',
      to: 'wagwulageorge@gmail.com',
      subject: 'Test Email from Junto',
      text: 'If you receive this, SMTP is working correctly!',
    };
    
    console.log('\n📤 Sending test email to wagwulageorge@gmail.com...');
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('❌ Email send failed:', error.message);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log(`   Message ID: ${info.messageId}`);
      }
      process.exit(0);
    });
  }
});

// Timeout after 15 seconds
setTimeout(() => {
  console.log('\n⏱️  Connection timeout - please check your network/firewall');
  process.exit(1);
}, 15000);
