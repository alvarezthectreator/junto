import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing ZeptoMail SMTP Connection\n');
console.log('Current Configuration:');
console.log(`  Host: ${process.env.ZEPTOMAIL_HOST || 'smtp.zeptomail.com'}`);
console.log(`  Port: ${process.env.ZEPTOMAIL_PORT || '465'}`);
console.log(`  User: ${process.env.ZEPTOMAIL_USER || 'emailapikey'}`);
console.log(`  Password: ${(process.env.ZEPTOMAIL_PASSWORD || '').substring(0, 3)}***`);
console.log(`  From: ${process.env.ZEPTOMAIL_FROM || 'no-reply@wantuu.com'}\n`);

// Test with current config
const transporter = nodemailer.createTransport({
  host: process.env.ZEPTOMAIL_HOST || 'smtp.zeptomail.com',
  port: parseInt(process.env.ZEPTOMAIL_PORT || '465'),
  secure: (process.env.ZEPTOMAIL_PORT || '465') === '465',
  auth: {
    user: process.env.ZEPTOMAIL_USER || 'emailapikey',
    pass: process.env.ZEPTOMAIL_PASSWORD || '',
  },
});

console.log('🔗 Attempting to connect...\n');

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('\n📋 Possible causes:');
    console.log('  1. Wrong password - verify in ZeptoMail SMTP settings');
    console.log('  2. Wrong username - usually emailapikey for ZeptoMail');
    console.log('  3. Port issue - try 587 instead of 465');
    console.log('  4. Firewall - check if port is blocked');
    console.log('  5. Sender domain/email not verified in ZeptoMail\n');
    console.log('💡 Next steps:');
    console.log('  1. Log into your ZeptoMail account');
    console.log('  2. Open SMTP credentials');
    console.log('  3. Confirm the sender address: ' + (process.env.ZEPTOMAIL_FROM || 'no-reply@wantuu.com'));
    console.log('  4. Verify the password matches your SMTP token');
    console.log('  5. Try alternative ports: 587 (TLS) or 465 (SSL)');
  } else {
    console.log('✅ SMTP connection successful!');
    console.log('\n📧 You can now send emails through this account.');
    
    // Try sending a test email
    const mailOptions = {
      from: process.env.ZEPTOMAIL_FROM || 'no-reply@wantuu.com',
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
