import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { dailyAudit } from "@/inngest/functions/daily-audit";
import { reinforcementJob } from "@/inngest/functions/reinforcement";
import { weeklyContent } from "@/inngest/functions/weekly-content";
import { rssPoll } from "@/inngest/functions/rss-poll";

export const maxDuration = 60;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [dailyAudit, reinforcementJob, weeklyContent, rssPoll],
});
