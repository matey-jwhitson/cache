"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { triggerAudit, triggerReinforcement, triggerContentBuild } from "@/lib/actions/jobs";
import { Radar, Repeat, FileCode, Loader2 } from "lucide-react";

export function ControlPanelActions() {
  const [isPending, startTransition] = useTransition();
  const [lastResult, setLastResult] = useState<string | null>(null);

  function run(action: () => Promise<{ jobId: string; status: string }>, label: string) {
    startTransition(async () => {
      try {
        const result = await action();
        setLastResult(`${label} started (Job: ${result.jobId.slice(0, 8)}...)`);
      } catch {
        setLastResult(`Failed to start ${label}`);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => run(triggerAudit, "Audit")}
          disabled={isPending}
          className="gap-2"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          Run Audit
        </Button>
        <Button
          onClick={() => run(triggerReinforcement, "Reinforcement")}
          disabled={isPending}
          variant="secondary"
          className="gap-2"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
          Run Reinforcement
        </Button>
        <Button
          onClick={() => run(triggerContentBuild, "Content Build")}
          disabled={isPending}
          variant="secondary"
          className="gap-2"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCode className="h-4 w-4" />}
          Run Content Build
        </Button>
      </div>
      {lastResult && (
        <p className="text-sm text-zinc-400">{lastResult}</p>
      )}
    </div>
  );
}
