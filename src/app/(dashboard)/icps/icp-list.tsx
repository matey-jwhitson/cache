"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createICP, deleteICP } from "@/lib/actions/icps";
import { Trash2, Plus, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ICP {
  id: string;
  name: string;
  description: string | null;
  pains: string[];
  jobsToBeDone: string[];
  geos: string[];
  segments: string[];
  createdAt: string;
}

interface ICPListProps {
  icps: ICP[];
}

export function ICPList({ icps }: ICPListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteICP(id);
      router.refresh();
    });
  }

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      await createICP(formData);
      setShowForm(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"}>
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Create ICP"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New ICP</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Name</label>
                  <Input name="name" required placeholder="e.g. Public Defenders" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Geos</label>
                  <Input name="geos" placeholder="Comma-separated" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Description</label>
                <Textarea name="description" rows={2} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Pains</label>
                <Input name="pains" placeholder="Comma-separated" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Jobs to Be Done</label>
                <Input name="jobsToBeDone" placeholder="Comma-separated" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Segments</label>
                <Input name="segments" placeholder="Comma-separated" />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {icps.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
          No ICPs defined yet — create one above
        </div>
      ) : (
        <div className="space-y-2">
          {icps.map((icp) => {
            const isOpen = expanded.has(icp.id);
            return (
              <div key={icp.id} className="rounded-xl border border-zinc-800 bg-zinc-900">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => toggleExpand(icp.id)} className="flex flex-1 items-center gap-3 text-left">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                    )}
                    <span className="font-medium text-white">{icp.name}</span>
                    {icp.description && (
                      <span className="truncate text-sm text-zinc-500">{icp.description}</span>
                    )}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(icp.id)}
                    disabled={isPending}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {isOpen && (
                  <div className="border-t border-zinc-800 px-4 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TagSection label="Pains" items={icp.pains} />
                      <TagSection label="Jobs to Be Done" items={icp.jobsToBeDone} />
                      <TagSection label="Geos" items={icp.geos} />
                      <TagSection label="Segments" items={icp.segments} />
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

function TagSection({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-400">{label}</p>
      {items.length === 0 ? (
        <p className="text-xs text-zinc-600">None</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <Badge key={i} variant="secondary">{item}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}
