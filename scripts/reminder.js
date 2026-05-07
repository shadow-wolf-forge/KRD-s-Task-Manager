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

function generateTableRows(tasks) {
  return tasks.map((task, index) => {
    return `
      <tr>
        <td style="padding:8px;border:1px solid #ccc;">${index + 1}</td>
        <td style="padding:8px;border:1px solid #ccc;">${task.title}</td>
        <td style="padding:8px;border:1px solid #ccc;">${task.project}</td>
        <td style="padding:8px;border:1px solid #ccc;">${task.priority}</td>
        <td style="padding:8px;border:1px solid #ccc;">${task.assigned_to}</td>
        <td style="padding:8px;border:1px solid #ccc;">${new Date(task.created_at).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata'
        })}</td>
      </tr>
    `;
  }).join('');
}

async function sendMail() {
  if (pendingTasks.length === 0) {
    console.log('No pending tasks found');
    return;
  }

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;">
      <h2>Pending Tasks Reminder</h2>

      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr style="background-color:#f2f2f2;">
            <th style="padding:10px;border:1px solid #ccc;">#</th>
            <th style="padding:10px;border:1px solid #ccc;">Task</th>
            <th style="padding:10px;border:1px solid #ccc;">Project</th>
            <th style="padding:10px;border:1px solid #ccc;">Priority</th>
            <th style="padding:10px;border:1px solid #ccc;">Assigned To</th>
            <th style="padding:10px;border:1px solid #ccc;">Created At</th>
          </tr>
        </thead>

        <tbody>
          ${generateTableRows(pendingTasks)}
        </tbody>
      </table>

      <br>

      <div>
        Total Pending Tasks: <b>${pendingTasks.length}</b>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: 'karthikramadurai.cpi@gmail.com',
    subject: `Pending Tasks Reminder (${pendingTasks.length})`,
    html: htmlContent
  });

  console.log('Reminder mail sent');
}

sendMail();
