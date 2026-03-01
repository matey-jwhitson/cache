"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { addContentSource, submitManualContent } from "@/lib/actions/sources";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Source {
  id: string;
  name: string;
  sourceType: string;
  config: Record<string, unknown>;
  enabled: boolean;
  lastFetchedAt: string | null;
  createdAt: string;
}

interface Item {
  id: string;
  title: string;
  author: string | null;
  sourceType: string;
  status: string;
  createdAt: string;
}

interface SourcesTabsProps {
  sources: Source[];
  items: Item[];
}

const TABS = ["RSS", "Manual", "Items"] as const;
type Tab = (typeof TABS)[number];

export function SourcesTabs({ sources, items }: SourcesTabsProps) {
  const [tab, setTab] = useState<Tab>("RSS");
  const [isPending, setIsPending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();

  async function handleAddSource(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsPending(true);
    try {
      await addContentSource(formData);
      e.currentTarget.reset();
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function handleAddManual(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsPending(true);
    try {
      await submitManualContent(formData);
      e.currentTarget.reset();
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  const filteredItems = items.filter(
    (i) => statusFilter === "all" || i.status === statusFilter,
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "RSS" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add RSS Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSource} className="flex flex-wrap gap-3">
                <input type="hidden" name="sourceType" value="rss" />
                <Input name="name" placeholder="Feed name" required className="w-48" />
                <Input name="url" placeholder="https://..." type="url" required className="flex-1" />
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add Feed
                </Button>
              </form>
            </CardContent>
          </Card>

          <SourcesTable
            sources={sources.filter((s) => s.sourceType === "rss")}
            emptyMessage="No RSS feeds configured"
          />
        </div>
      )}

      {tab === "Manual" && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Content</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddManual} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Title</label>
                  <Input name="title" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Author</label>
                  <Input name="author" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Content</label>
                <Textarea name="content" rows={6} required />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === "Items" && (
        <div className="space-y-4">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="processed">Processed</option>
            <option value="rejected">Rejected</option>
          </Select>

          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
              No content items
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/80">
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">Author</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">Source</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-900">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-800/50 last:border-0">
                      <td className="px-4 py-3 font-medium text-white">{item.title}</td>
                      <td className="px-4 py-3 text-zinc-300">{item.author ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-300">{item.sourceType}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            item.status === "processed"
                              ? "success"
                              : item.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SourcesTable({
  sources,
  emptyMessage,
}: {
  sources: Source[];
  emptyMessage: string;
}) {
  if (sources.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/80">
            <th className="px-4 py-3 text-left font-medium text-zinc-400">Name</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-400">URL</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-400">Status</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-400">Last Fetched</th>
          </tr>
        </thead>
        <tbody className="bg-zinc-900">
          {sources.map((s) => (
            <tr key={s.id} className="border-b border-zinc-800/50 last:border-0">
              <td className="px-4 py-3 font-medium text-white">{s.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                {(s.config.url as string) ?? "—"}
              </td>
              <td className="px-4 py-3">
                <Badge variant={s.enabled ? "success" : "secondary"}>
                  {s.enabled ? "Active" : "Disabled"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-zinc-400">
                {s.lastFetchedAt ? new Date(s.lastFetchedAt).toLocaleDateString() : "Never"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
