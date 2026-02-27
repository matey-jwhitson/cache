"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface ArrayEditorProps {
  label: string;
  hint?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function ArrayEditor({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: ArrayEditorProps) {
  function handleAdd() {
    onChange([...value, ""]);
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleChange(index: number, newValue: string) {
    const updated = [...value];
    updated[index] = newValue;
    onChange(updated);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-400">{label}</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          className="h-7 gap-1 text-xs text-zinc-400 hover:text-white"
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}
      {value.length === 0 ? (
        <button
          type="button"
          onClick={handleAdd}
          className="w-full rounded-lg border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-600 hover:border-zinc-500 hover:text-zinc-400"
        >
          Click to add an entry
        </button>
      ) : (
        <div className="space-y-1.5">
          {value.map((item, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => handleChange(i, e.target.value)}
                placeholder={placeholder}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(i)}
                className="h-9 w-9 shrink-0 text-zinc-500 hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
