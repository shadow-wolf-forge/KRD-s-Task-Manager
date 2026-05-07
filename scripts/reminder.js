const fs = require('fs');
const { execSync } = require('child_process');
const nodemailer = require('nodemailer');

const current = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));

const previousRaw = execSync('git show HEAD~1:tasks.json').toString();

const previous = JSON.parse(previousRaw);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const oldMap = {};

previous.forEach(t => {
  oldMap[t.id] = t;
});

const emailMap = {
  Rahul: 'karthikramadurai.cpi@gmail.com',
  Karthik: 'karthikramadurai.ci@gmail.com'
};

async function notify(task) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: emailMap[task.assigned_to],
    subject: 'New Task Assigned',
    text:
`Task: ${task.title}

Project: ${task.project}

Priority: ${task.priority}`
  });
}

async function processTasks() {
  for (const task of current) {
    const old = oldMap[task.id];

    if (!old) {
      await notify(task);
      continue;
    }

    if (old.assigned_to !== task.assigned_to) {
      await notify(task);
    }
  }
}

processTasks();
