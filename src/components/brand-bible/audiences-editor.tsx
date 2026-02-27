"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrayEditor } from "./array-editor";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { TargetAudience } from "@/lib/brand-bible/types";

interface AudiencesEditorProps {
  value: TargetAudience[];
  onChange: (value: TargetAudience[]) => void;
}

const EMPTY_AUDIENCE: TargetAudience = {
  name: "",
  description: "",
  painPoints: [],
  goals: [],
  jobsToBeDone: [],
  geos: [],
  segments: [],
};

export function AudiencesEditor({ value, onChange }: AudiencesEditorProps) {
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(value.map((_, i) => i)),
  );

  function toggleExpand(index: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleAdd() {
    const next = [...value, { ...EMPTY_AUDIENCE }];
    onChange(next);
    setExpanded((prev) => new Set([...prev, next.length - 1]));
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index));
    setExpanded((prev) => {
      const next = new Set<number>();
      for (const v of prev) {
        if (v < index) next.add(v);
        else if (v > index) next.add(v - 1);
      }
      return next;
    });
  }

  function update(index: number, patch: Partial<TargetAudience>) {
    const updated = [...value];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-400">
          Target Audiences ({value.length})
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          className="h-7 gap-1 text-xs text-zinc-400 hover:text-white"
        >
          <Plus className="h-3 w-3" />
          Add Audience
        </Button>
      </div>

      {value.length === 0 ? (
        <button
          type="button"
          onClick={handleAdd}
          className="w-full rounded-lg border border-dashed border-zinc-700 px-4 py-6 text-sm text-zinc-600 hover:border-zinc-500 hover:text-zinc-400"
        >
          No audiences defined -- click to add one
        </button>
      ) : (
        <div className="space-y-2">
          {value.map((aud, i) => {
            const isOpen = expanded.has(i);
            return (
              <div
                key={i}
                className="rounded-lg border border-zinc-800 bg-zinc-950"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(i)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                    )}
                    <span className="font-medium text-white">
                      {aud.name || `Audience ${i + 1}`}
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(i)}
                    className="h-8 w-8 text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {isOpen && (
                  <div className="space-y-4 border-t border-zinc-800 px-4 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-400">
                          Name
                        </label>
                        <Input
                          value={aud.name}
                          onChange={(e) => update(i, { name: e.target.value })}
                          placeholder="e.g. Public Defenders"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-400">
                          Geos
                        </label>
                        <Input
                          value={aud.geos.join(", ")}
                          onChange={(e) =>
                            update(i, {
                              geos: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="e.g. US, California"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-400">
                        Description
                      </label>
                      <Textarea
                        value={aud.description}
                        onChange={(e) => update(i, { description: e.target.value })}
                        rows={2}
                        placeholder="Brief description of this audience segment"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-400">
                        Segments
                      </label>
                      <Input
                        value={aud.segments.join(", ")}
                        onChange={(e) =>
                          update(i, {
                            segments: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="e.g. Solo practitioners, Mid-size firms"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <ArrayEditor
                        label="Pain Points"
                        value={aud.painPoints}
                        onChange={(v) => update(i, { painPoints: v })}
                        placeholder="A key pain point"
                      />
                      <ArrayEditor
                        label="Goals"
                        value={aud.goals}
                        onChange={(v) => update(i, { goals: v })}
                        placeholder="A primary goal"
                      />
                    </div>

                    <ArrayEditor
                      label="Jobs to Be Done"
                      value={aud.jobsToBeDone}
                      onChange={(v) => update(i, { jobsToBeDone: v })}
                      placeholder="e.g. Review discovery materials quickly"
                    />
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
