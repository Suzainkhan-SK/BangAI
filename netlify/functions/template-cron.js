// Netlify Scheduled Function: template-cron
// Automatically triggered by Netlify scheduler every 15 minutes.
// Invokes the template-automation engine to process due runs.

import { handler as templateHandler } from './template-automation.js';

export const handler = async (event, context) => {
  console.log('[template-cron] Triggered by Netlify scheduler');
  const syntheticEvent = {
    httpMethod: 'POST',
    headers: { 'x-nf-event': 'schedule', 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cron-runner' })
  };
  return templateHandler(syntheticEvent, context);
};
