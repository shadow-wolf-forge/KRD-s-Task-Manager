const fs = require('fs');

const tasks = JSON.parse(
  fs.readFileSync('tasks.json', 'utf8')
);

function now() {
  return new Date();
}

function minutesBetween(date1, date2) {
  return Math.floor(
    (date1.getTime() - date2.getTime()) / 60000
  );
}

async function sendTelegramMessage(message) {
  await fetch(
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
}

async function processTasks() {
  let updated = false;

  for (const task of tasks) {

    if (task.done) {
      continue;
    }

    if (!task.reminder_enabled) {
      continue;
    }

    const lastReminder = task.last_reminder_sent_at
      ? new Date(task.last_reminder_sent_at)
      : null;

    const interval =
      task.reminder_interval_minutes || 30;

    let shouldSend = false;

    if (!lastReminder) {
      shouldSend = true;
    } else {
      const diff = minutesBetween(
        now(),
        lastReminder
      );

      if (diff >= interval) {
        shouldSend = true;
      }
    }

    if (!shouldSend) {
      continue;
    }

    const message =
`⏰ Task Reminder

📝 ${task.title}

👤 ${task.assigned_to}
📁 ${task.project}
⚡ ${task.priority}

Task is still pending.`;

    await sendTelegramMessage(message);

    task.last_reminder_sent_at =
      new Date().toISOString();

    updated = true;

    console.log(`Reminder sent for: ${task.title}`);
  }

  if (updated) {
    fs.writeFileSync(
      'tasks.json',
      JSON.stringify(tasks, null, 2)
    );
  }
}

processTasks();
