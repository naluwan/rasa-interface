const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: "ms1.interinfo.com.tw", // hostname
  secureConnection: false, // TLS requires secureConnection to be false
  port: 587, // port for secure SMTP
  // secure: false,
  tls: {
    ciphers:'SSLv3',
    rejectUnauthorized: false
  },
  auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD
  }
});

module.exports = {
  TrainSendMail: (res, template, name, entity_name, subject) => {
    // 產生mail template並傳送mail，layout: null才不會有其他html，只會有template的東西
    res.render(template, {layout: null, name, entity_name}, 
      function(err, html){
        if (err) {
          console.log('error in email template');
        }
        transporter.sendMail({
          from: '"BOTFRONT" <harrychien@interinfo.com.tw>',
          to: 'harrychien@interinfo.com.tw',
          subject: subject,
          html: html,
        },
          function(err) {
            if (err) {
              console.error('Unable to send confirmation: ' + err.stack);
            }
          },
        )
      }
    )
  },
  userSendMAil:  (res, template, cpy_id, cpy_name, email, subject) => {
    res.render(template, {layout: null, cpy_id, cpy_name, email}, 
      function(err, html){
        if (err) {
          console.log('error in email template');
        }
        transporter.sendMail({
          from: '"BOTFRONT" <harrychien@interinfo.com.tw>',
          to: 'harrychien@interinfo.com.tw',
          subject: subject,
          html: html,
        },
          function(err) {
            if (err) {
              console.error('Unable to send confirmation: ' + err.stack);
            }
          },
        )
      }
    )
  },
  resetMail:  (res, template, email, subject) => {
    res.render(template, {layout: null, email}, 
      function(err, html){
        if (err) {
          console.log('error in email template');
        }
        transporter.sendMail({
          from: '"BOTFRONT" <harrychien@interinfo.com.tw>',
          to: email,
          subject: subject,
          html: html,
        },
          function(err) {
            if (err) {
              console.error('Unable to send confirmation: ' + err.stack);
            }
          },
        )
      }
    )
  }
}