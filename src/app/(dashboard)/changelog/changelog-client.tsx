"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Download } from "lucide-react";

interface LogEntry {
  id: string;
  entityType: string;
  entityId: string | null;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
}

interface ChangelogClientProps {
  logs: LogEntry[];
  entityTypes: string[];
}

export function ChangelogClient({ logs, entityTypes }: ChangelogClientProps) {
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(50);

  const filtered = logs
    .filter((l) => filter === "all" || l.entityType === filter)
    .slice(0, limit);

  function exportCsv() {
    const headers = ["ID", "Entity Type", "Entity ID", "Action", "Date"];
    const rows = filtered.map((l) => [
      l.id,
      l.entityType,
      l.entityId ?? "",
      l.action,
      l.createdAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "changelog.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-44"
        >
          <option value="all">All Entity Types</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="w-28"
        >
          {[25, 50, 100, 200].map((n) => (
            <option key={n} value={n}>Limit {n}</option>
          ))}
        </Select>
        <Button variant="outline" onClick={exportCsv} className="ml-auto">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
          No changelog entries
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="px-4 py-3 text-left font-medium text-zinc-400">Entity Type</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">Entity ID</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">Action</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">Details</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">Date</th>
              </tr>
            </thead>
            <tbody className="bg-zinc-900">
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-zinc-800/50 last:border-0">
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{log.entityType}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                    {log.entityId ? `${log.entityId.slice(0, 12)}...` : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{log.action}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-zinc-400">
                    {JSON.stringify(log.details).slice(0, 60)}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
