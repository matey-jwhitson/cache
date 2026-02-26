"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileJson } from "lucide-react";

interface Artifact {
  id: string;
  path: string;
  content: string;
  createdAt: string;
}

interface ContentSectionsProps {
  grouped: Record<string, Artifact[]>;
}

const SECTION_LABELS: Record<string, string> = {
  organization: "Organization Schema",
  software: "Software Application Schema",
  faq: "FAQ Page Schema",
  blog: "Blog Posting Schemas",
};

export function ContentSections({ grouped }: ContentSectionsProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["organization"]));

  function toggleSection(key: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {Object.entries(SECTION_LABELS).map(([key, label]) => {
        const items = grouped[key] ?? [];
        const isOpen = openSections.has(key);

        return (
          <div
            key={key}
            className="rounded-xl border border-zinc-800 bg-zinc-900"
          >
            <button
              onClick={() => toggleSection(key)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              )}
              <FileJson className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-white">{label}</span>
              <span className="ml-auto text-xs text-zinc-500">
                {items.length} artifact{items.length !== 1 ? "s" : ""}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-zinc-800 p-5 pt-3">
                {items.length === 0 ? (
                  <p className="text-sm text-zinc-500">No artifacts for this type</p>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id}>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="font-mono text-xs text-zinc-400">{item.path}</span>
                          <span className="text-xs text-zinc-600">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <pre className="max-h-80 overflow-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-emerald-400">
                          {formatJson(item.content)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatJson(content: string): string {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}
