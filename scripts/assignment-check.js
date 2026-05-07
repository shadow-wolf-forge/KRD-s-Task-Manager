const fs = require('fs');
const { execSync } = require('child_process');
const nodemailer = require('nodemailer');

const currentTasks = JSON.parse(
  fs.readFileSync('tasks.json', 'utf8')
);

let previousTasks = [];

try {
  const previousRaw = execSync(
    'git show HEAD~1:tasks.json'
  ).toString();

  previousTasks = JSON.parse(previousRaw);
} catch (e) {
  console.log('No previous tasks.json found');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const previousMap = {};

previousTasks.forEach(task => {
  previousMap[task.id] = task;
});

function getPriorityColor(priority) {
  switch (priority) {
    case 'High':
      return '#ff6b6b';
    case 'Medium':
      return '#f7b731';
    case 'Low':
      return '#2ecc71';
    default:
      return '#6c5ce7';
  }
}

async function sendNotification(task, type) {
  const currentTime = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const html = `
    <div style="
      background:#f4f7fb;
      padding:24px;
      font-family:Arial,sans-serif;
    ">

      <div style="
        max-width:650px;
        margin:auto;
      ">

        <div style="
          background:white;
          border-radius:24px;
          padding:28px;
          box-shadow:0 8px 24px rgba(0,0,0,0.08);
        ">

          <div style="
            font-size:28px;
            font-weight:800;
            margin-bottom:8px;
            color:#2d3436;
          ">
            ${type} Task 🚀
          </div>

          <div style="
            color:#636e72;
            font-size:14px;
            margin-bottom:26px;
          ">
            ${currentTime}
          </div>

          <div style="
            background:#ffffff;
            border-left:6px solid ${getPriorityColor(task.priority)};
            border-radius:18px;
            padding:20px;
            box-shadow:0 4px 14px rgba(0,0,0,0.06);
          ">

            <div style="
              font-size:18px;
              font-weight:700;
              color:#2d3436;
              margin-bottom:16px;
              line-height:1.5;
            ">
              ${task.title}
            </div>

            <div style="
              display:flex;
              flex-wrap:wrap;
              gap:10px;
            ">

              <div style="
                background:#f1f2f6;
                padding:7px 14px;
                border-radius:999px;
                font-size:13px;
              ">
                📁 ${task.project}
              </div>

              <div style="
                background:#f1f2f6;
                padding:7px 14px;
                border-radius:999px;
                font-size:13px;
              ">
                👤 ${task.assigned_to}
              </div>

              <div style="
                background:${getPriorityColor(task.priority)};
                color:white;
                padding:7px 14px;
                border-radius:999px;
                font-size:13px;
                font-weight:600;
              ">
                ${task.priority}
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: 'karthikramadurai.cpi@gmail.com',

    subject:
`🚀 ${type} Task • ${task.title}`,

    text:
`${type} Task

${task.title}

Assigned To: ${task.assigned_to}
Project: ${task.project}
Priority: ${task.priority}`,

    html
  });

  console.log(`${type} notification sent`);
}

async function processTasks() {
  for (const task of currentTasks) {
    const oldTask = previousMap[task.id];

    if (!oldTask) {
      await sendNotification(task, 'New');
      continue;
    }

    if (oldTask.assigned_to !== task.assigned_to) {
      await sendNotification(task, 'Reassigned');
    }
  }
}

processTasks();
