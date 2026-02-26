"use client";

import { useTransition, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { upsertBrandProfile } from "@/lib/actions/brand";
import { Save, Loader2 } from "lucide-react";

interface BrandData {
  name: string;
  url: string;
  mission: string;
  positioning: string;
  voiceTone: string;
  readingLevel: string;
  brandTerms: string;
  forbiddenPhrases: string;
}

interface BrandFormProps {
  initial: BrandData | null;
}

export function BrandForm({ initial }: BrandFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await upsertBrandProfile(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Brand Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form ref={formRef} action={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Brand Name" name="name" defaultValue={initial?.name} required />
                <Field label="Website URL" name="url" defaultValue={initial?.url} required />
              </div>
              <TextareaField label="Mission Statement" name="mission" defaultValue={initial?.mission} />
              <TextareaField label="Positioning" name="positioning" defaultValue={initial?.positioning} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Voice & Tone" name="voiceTone" defaultValue={initial?.voiceTone} />
                <Field label="Reading Level" name="readingLevel" defaultValue={initial?.readingLevel} placeholder="e.g. 8th grade" />
              </div>
              <Field
                label="Brand Terms"
                name="brandTerms"
                defaultValue={initial?.brandTerms}
                placeholder="Comma-separated terms"
              />
              <Field
                label="Forbidden Phrases"
                name="forbiddenPhrases"
                defaultValue={initial?.forbiddenPhrases}
                placeholder="Comma-separated phrases"
              />

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Profile
                </Button>
                {saved && (
                  <span className="text-sm text-emerald-400">Saved successfully</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {initial ? (
              <>
                <div>
                  <p className="font-medium text-zinc-400">Name</p>
                  <p className="text-white">{initial.name}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-400">URL</p>
                  <p className="text-blue-400">{initial.url}</p>
                </div>
                {initial.mission && (
                  <div>
                    <p className="font-medium text-zinc-400">Mission</p>
                    <p className="text-zinc-300">{initial.mission}</p>
                  </div>
                )}
                {initial.voiceTone && (
                  <div>
                    <p className="font-medium text-zinc-400">Voice</p>
                    <p className="text-zinc-300">{initial.voiceTone}</p>
                  </div>
                )}
                {initial.brandTerms && (
                  <div>
                    <p className="font-medium text-zinc-400">Brand Terms</p>
                    <p className="text-zinc-300">{initial.brandTerms}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-zinc-500">No brand profile configured yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-zinc-400">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-zinc-400">
        {label}
      </label>
      <Textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        rows={3}
      />
    </div>
  );
}
