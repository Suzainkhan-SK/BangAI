// Netlify Scheduled Function: stock-studio-cron
// Automatically triggered by Netlify scheduler every 15 minutes.
// Invokes the stock-studio-automation engine to process due 24h autonomous runs.

import { handler as stockStudioHandler } from './stock-studio-automation.js';

export const handler = async (event, context) => {
  console.log('[stock-studio-cron] Triggered by Netlify scheduler');
  const syntheticEvent = {
    httpMethod: 'POST',
    headers: { 'x-nf-event': 'schedule', 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cron-runner' })
  };
  return stockStudioHandler(syntheticEvent, context);
};
