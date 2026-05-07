const fs = require('fs');

const tasks = JSON.parse(
  fs.readFileSync('tasks.json', 'utf8')
);

const pendingTasks = tasks.filter(task => !task.done);

function formatDateTime() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

async function sendTelegramMessage(message) {
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message
      })
    }
  );

  const result = await response.json();

  console.log(result);
}

async function sendReminder() {
  if (pendingTasks.length === 0) {
    console.log('No pending tasks');
    return;
  }

  const currentTime = formatDateTime();

  let message =
`🔔 Pending Tasks Reminder

🕒 ${currentTime}

`;

  pendingTasks.forEach((task, index) => {
    message +=
`${index + 1}. ${task.title}

👤 ${task.assigned_to}
📁 ${task.project}
⚡ ${task.priority}

`;
  });

  message += `📌 Total Pending Tasks: ${pendingTasks.length}`;

  await sendTelegramMessage(message);

  console.log('Telegram reminder sent');
}

sendReminder();
