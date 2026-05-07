const fs = require('fs');
const nodemailer = require('nodemailer');

const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));

const pending = tasks.filter(task => !task.done);

const grouped = {};

pending.forEach(task => {
  if (!grouped[task.assigned_to]) {
    grouped[task.assigned_to] = [];
  }

  grouped[task.assigned_to].push(task);
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmails() {
  for (const person in grouped) {
    const taskList = grouped[person]
      .map((task, index) => {
        return `${index + 1}. ${task.title}
Project: ${task.project}
Priority: ${task.priority}`;
      })
      .join('\n\n');

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: 'karthikramadurai.cpi@gmail.com',
      subject: `Pending Tasks Reminder - ${person}`,
      text:
`Pending Tasks for ${person}

${taskList}`
    });

    console.log(`Reminder mail sent for ${person}`);
  }
}

sendEmails();
