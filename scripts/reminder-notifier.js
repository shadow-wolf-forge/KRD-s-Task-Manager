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

  console.log('NOW:', now.toISOString());

  for (const task of tasks) {

    console.log('----------------');

    console.log('TASK:', task.title);

    if (!task.reminder_enabled) {

      console.log('SKIPPED: reminder disabled');

      continue;
    }

    if (task.reminder_sent) {

      console.log('SKIPPED: already sent');

      continue;
    }

    if (task.done) {

      console.log('SKIPPED: task completed');

      continue;
    }

    if (!task.remind_at) {

      console.log('SKIPPED: no remind_at');

      continue;
    }

    const remindTime = new Date(task.remind_at);

    if (isNaN(remindTime.getTime())) {

      console.log('SKIPPED: invalid remind_at');

      continue;
    }

    console.log('REMIND_AT:', remindTime.toISOString());

    if (now >= remindTime) {

      console.log('REMINDER MATCHED');

      const message =
`⏰ ${task.title}
📁 ${task.project}
🔥 ${task.priority}`;

      try {

        await sendTelegramMessage(message);

        console.log('TELEGRAM SENT');

        task.reminder_sent = true;

        task.modified_at = new Date().toISOString();

        updated = true;

      } catch (err) {

        console.error('TELEGRAM FAILED');

        console.error(err.message);
      }

    } else {

      console.log('NOT YET TIME');
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
