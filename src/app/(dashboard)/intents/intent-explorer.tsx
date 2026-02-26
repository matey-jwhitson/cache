"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Result {
  id: string;
  provider: string;
  promptId: string;
  mentioned: boolean;
  mentionRank: number | null;
  similarity: number;
  responseText: string;
  createdAt: string;
  meta: Record<string, unknown>;
}

interface IntentExplorerProps {
  results: Result[];
  providers: string[];
}

export function IntentExplorer({ results, providers }: IntentExplorerProps) {
  const [provider, setProvider] = useState("all");
  const [maxResults, setMaxResults] = useState(50);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = results
    .filter((r) => provider === "all" || r.provider === provider)
    .slice(0, maxResults);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-44"
        >
          <option value="all">All Providers</option>
          {providers.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
        <Select
          value={maxResults}
          onChange={(e) => setMaxResults(Number(e.target.value))}
          className="w-32"
        >
          {[25, 50, 100, 200].map((n) => (
            <option key={n} value={n}>Max {n}</option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
          No results — run an audit to populate
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const isOpen = expanded.has(r.id);
            const intent = (r.meta?.intent as string) ?? "unknown";
            return (
              <div
                key={r.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700"
              >
                <button
                  onClick={() => toggleExpand(r.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
                  )}
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-white">{intent}</span>
                    <Badge variant="secondary">{r.provider}</Badge>
                    <Badge variant={r.mentioned ? "success" : "destructive"}>
                      {r.mentioned ? "Mentioned" : "Not Mentioned"}
                    </Badge>
                    {r.mentionRank != null && (
                      <Badge variant="outline">Rank #{r.mentionRank}</Badge>
                    )}
                    <span className="text-xs text-zinc-500">
                      Sim: {(r.similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-zinc-800 px-4 py-3">
                    <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 font-mono text-xs text-zinc-300">
                      {r.responseText}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
