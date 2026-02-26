"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { ChevronDown, ChevronRight, MessageSquare } from "lucide-react";

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
  promptText: string | null;
}

interface IntentExplorerProps {
  results: Result[];
  providers: string[];
}

export function IntentExplorer({ results, providers }: IntentExplorerProps) {
  const [provider, setProvider] = useState("all");
  const [mentionFilter, setMentionFilter] = useState("all");
  const [maxResults, setMaxResults] = useState(50);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = results
    .filter((r) => provider === "all" || r.provider === provider)
    .filter((r) => {
      if (mentionFilter === "mentioned") return r.mentioned;
      if (mentionFilter === "not-mentioned") return !r.mentioned;
      return true;
    })
    .slice(0, maxResults);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const mentionedCount = filtered.filter((r) => r.mentioned).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-44"
        >
          <option value="all">All Providers</option>
          {providers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Select
          value={mentionFilter}
          onChange={(e) => setMentionFilter(e.target.value)}
          className="w-44"
        >
          <option value="all">All Results</option>
          <option value="mentioned">Mentioned Only</option>
          <option value="not-mentioned">Not Mentioned Only</option>
        </Select>
        <Select
          value={maxResults}
          onChange={(e) => setMaxResults(Number(e.target.value))}
          className="w-32"
        >
          {[25, 50, 100, 200].map((n) => (
            <option key={n} value={n}>
              Max {n}
            </option>
          ))}
        </Select>
        <span className="text-xs text-zinc-500">
          {filtered.length} results · {mentionedCount} mentioned
        </span>
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
                    <span className="text-sm font-medium text-white">
                      {intent}
                    </span>
                    <Badge variant="secondary">{r.provider}</Badge>
                    <Badge
                      variant={r.mentioned ? "success" : "destructive"}
                    >
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

                {!isOpen && (
                  <div className="flex items-start gap-2 border-t border-zinc-800/50 px-4 py-2">
                    <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-blue-400/60" />
                    <p className="line-clamp-1 text-xs text-zinc-500">
                      {r.promptText ?? (
                        <span className="italic">
                          Previous audit — run a new audit to see updated prompts
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {isOpen && (
                  <div className="space-y-3 border-t border-zinc-800 px-4 py-3">
                    {r.promptText ? (
                      <div className="rounded-lg bg-blue-500/5 px-3 py-2">
                        <p className="text-xs font-medium text-blue-300">
                          Prompt sent to {r.provider}:
                        </p>
                        <p className="mt-1 text-sm text-zinc-300">
                          {r.promptText}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                        <p className="text-xs italic text-zinc-500">
                          Prompt from previous audit — run a new audit to see updated questions
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="mb-1 text-xs font-medium text-zinc-500">
                        Response:
                      </p>
                      <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 font-mono text-xs text-zinc-300">
                        {r.responseText}
                      </pre>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                      {r.meta?.tokensIn != null && (
                        <span>
                          Tokens: {String(r.meta.tokensIn)} in /{" "}
                          {String(r.meta.tokensOut)} out
                        </span>
                      )}
                      {r.meta?.latencyMs != null && (
                        <span>
                          Latency: {Number(r.meta.latencyMs).toFixed(0)}ms
                        </span>
                      )}
                    </div>
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
