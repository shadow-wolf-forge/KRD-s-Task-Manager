const fs = require('fs');
const nodemailer = require('nodemailer');

const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));

const pendingTasks = tasks.filter(task => !task.done);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function formatDateTime() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

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

function generateTaskCards(tasks) {
  return tasks.map(task => {
    return `
      <div style="
        background:#ffffff;
        border-radius:18px;
        padding:18px;
        margin-bottom:16px;
        box-shadow:0 4px 14px rgba(0,0,0,0.08);
        border-left:6px solid ${getPriorityColor(task.priority)};
      ">

        <div style="
          font-size:17px;
          font-weight:700;
          color:#2d3436;
          margin-bottom:14px;
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
            color:#2f3542;
          ">
            📁 ${task.project}
          </div>

          <div style="
            background:#f1f2f6;
            padding:7px 14px;
            border-radius:999px;
            font-size:13px;
            color:#2f3542;
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
    `;
  }).join('');
}

async function sendMail() {
  if (pendingTasks.length === 0) {
    console.log('No pending tasks');
    return;
  }

  const currentTime = formatDateTime();

  const previewText = pendingTasks
    .slice(0, 3)
    .map(task => {
      return `• ${task.title} (${task.assigned_to}) [${task.project}]`;
    })
    .join('\n');

  const htmlContent = `
    <div style="
      background:#f4f7fb;
      padding:24px;
      font-family:Arial,sans-serif;
    ">

      <div style="
        max-width:720px;
        margin:auto;
      ">

        <div style="
          background:white;
          border-radius:24px;
          padding:30px;
          box-shadow:0 8px 24px rgba(0,0,0,0.08);
        ">

          <div style="
            font-size:30px;
            font-weight:800;
            color:#2d3436;
            margin-bottom:8px;
          ">
            Pending Tasks ✨
          </div>

          <div style="
            color:#636e72;
            font-size:14px;
            margin-bottom:28px;
          ">
            ${currentTime}
          </div>

          ${generateTaskCards(pendingTasks)}

          <div style="
            margin-top:24px;
            padding-top:20px;
            border-top:1px solid #ececec;
            text-align:center;
            color:#636e72;
            font-size:14px;
          ">
            Total Pending Tasks: 
            <b>${pendingTasks.length}</b>
          </div>

        </div>

      </div>

    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: 'karthikramadurai.cpi@gmail.com',

    subject: `🔔 ${pendingTasks.length} Pending Tasks • ${currentTime}`,

    text:
`Pending Tasks

${previewText}

Open mail for complete list.`,

    html: htmlContent
  });

  console.log('Reminder mail sent');
}

sendMail();
