const WEBHOOK_URL = () => process.env.SLACK_WEBHOOK_URL;

async function send(payload: Record<string, unknown>): Promise<boolean> {
  const url = WEBHOOK_URL();
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendSlackNotification(
  message: string,
  blocks?: Record<string, unknown>[],
): Promise<boolean> {
  const payload: Record<string, unknown> = { text: message };
  if (blocks) payload.blocks = blocks;
  return send(payload);
}

export async function notifyJobStarted(jobName: string): Promise<boolean> {
  const now = new Date().toISOString();
  return sendSlackNotification(`AEO Job Started: ${jobName}`, [
    {
      type: "section",
      text: { type: "mrkdwn", text: `*${jobName} Job Started*` },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: "*Status:*\nRunning" },
        { type: "mrkdwn", text: `*Started:*\n${now}` },
      ],
    },
  ]);
}

export async function notifyJobCompleted(
  jobName: string,
  success: boolean,
  durationSeconds?: number,
  summary?: Record<string, unknown>,
): Promise<boolean> {
  const statusText = success ? "Completed Successfully" : "Failed";
  const durationStr =
    durationSeconds != null
      ? durationSeconds > 60
        ? `${(durationSeconds / 60).toFixed(1)}m`
        : `${durationSeconds.toFixed(1)}s`
      : undefined;

  const fields: Record<string, unknown>[] = [
    { type: "mrkdwn", text: `*Status:*\n${statusText}` },
    { type: "mrkdwn", text: `*Completed:*\n${new Date().toISOString()}` },
  ];
  if (durationStr) {
    fields.push({ type: "mrkdwn", text: `*Duration:*\n${durationStr}` });
  }

  const blocks: Record<string, unknown>[] = [
    {
      type: "section",
      text: { type: "mrkdwn", text: `*${jobName} Job ${statusText}*` },
    },
    { type: "section", fields },
  ];

  if (summary) {
    const summaryText = Object.entries(summary)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Results:*\n${summaryText}` },
    });
  }

  return sendSlackNotification(`AEO Job ${statusText}: ${jobName}`, blocks);
}

export async function notifyMentionAlert(
  provider: string,
  currentRate: number,
  threshold: number,
  previousRate?: number,
): Promise<boolean> {
  const fields: Record<string, unknown>[] = [
    { type: "mrkdwn", text: `*Provider:*\n${provider}` },
    { type: "mrkdwn", text: `*Current Rate:*\n${(currentRate * 100).toFixed(1)}%` },
    { type: "mrkdwn", text: `*Threshold:*\n${(threshold * 100).toFixed(1)}%` },
  ];
  if (previousRate != null) {
    const change = currentRate - previousRate;
    fields.push({
      type: "mrkdwn",
      text: `*Change:*\n${change >= 0 ? "+" : ""}${(change * 100).toFixed(1)}%`,
    });
  }

  return sendSlackNotification(`Mention Rate Alert: ${provider}`, [
    {
      type: "section",
      text: { type: "mrkdwn", text: "*Mention Rate Below Threshold*" },
    },
    { type: "section", fields },
  ]);
}
