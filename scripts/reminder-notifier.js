const fs = require('fs');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const TASKS_FILE = 'tasks.json';

const tasks = JSON.parse(
  fs.readFileSync(TASKS_FILE, 'utf8')
);

const now = new Date();

let updated = false;

async function sendTelegramMessage(message) {

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message
      })
    }
  );

  if (!response.ok) {

    const errorText = await response.text();

    throw new Error(errorText);
  }
}

async function processReminders() {

  for (const task of tasks) {

    if (!task.reminder_enabled) continue;

    if (task.reminder_sent) continue;

    if (task.done) continue;

    if (!task.remind_at) continue;

    const remindTime = new Date(task.remind_at);

    if (isNaN(remindTime.getTime())) continue;

    if (now >= remindTime) {

      const message =
`⏰ ${task.title}
📁 ${task.project}
🔥 ${task.priority}
🕒 ${task.remind_at}`;

      try {

        await sendTelegramMessage(message);

        task.reminder_sent = true;

        task.modified_at = new Date().toISOString();

        updated = true;

        console.log(`Reminder sent for task: ${task.title}`);

      } catch (err) {

        console.error(
          `Failed to send reminder for ${task.title}`
        );

        console.error(err.message);
      }
    }
  }

  if (updated) {

    fs.writeFileSync(
      TASKS_FILE,
      JSON.stringify(tasks, null, 2)
    );

    console.log('tasks.json updated');
  }
}

processReminders();
