"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionAccordion } from "@/components/brand-bible/section-accordion";
import { ArrayEditor } from "@/components/brand-bible/array-editor";
import { AudiencesEditor } from "@/components/brand-bible/audiences-editor";
import { analyzeBrandDocument, saveBrandBible } from "@/lib/actions/brand-bible";
import {
  Save,
  Loader2,
  FileText,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import type { BrandBible, TargetAudience } from "@/lib/brand-bible/types";
import { CONTENT_CHANNELS, CHANNEL_LABELS } from "@/lib/brand-bible/types";

interface Props {
  initial: BrandBible | null;
}

type Mode = "import" | "edit";

function emptyForm(): FormState {
  return {
    name: "",
    url: "",
    logoUrl: "",
    tagline: "",
    mission: "",
    valueProposition: "",
    industry: "",
    geoFocus: [],
    voiceAttributes: [],
    tonePerChannel: {},
    readingLevel: "",
    topicPillars: [],
    targetAudiences: [],
    terminologyDos: [],
    terminologyDonts: [],
    contentRules: [],
    benefits: [],
    productFeatures: [],
    competitors: [],
    differentiators: [],
    boilerplateAbout: "",
    boilerplateDisclaimer: "",
  };
}

type FormState = Omit<BrandBible, "id" | "rawDocument">;

function brandToForm(b: BrandBible): FormState {
  return {
    name: b.name,
    url: b.url,
    logoUrl: b.logoUrl,
    tagline: b.tagline,
    mission: b.mission,
    valueProposition: b.valueProposition,
    industry: b.industry,
    geoFocus: b.geoFocus,
    voiceAttributes: b.voiceAttributes,
    tonePerChannel: b.tonePerChannel,
    readingLevel: b.readingLevel,
    topicPillars: b.topicPillars,
    targetAudiences: b.targetAudiences,
    terminologyDos: b.terminologyDos,
    terminologyDonts: b.terminologyDonts,
    contentRules: b.contentRules,
    benefits: b.benefits,
    productFeatures: b.productFeatures,
    competitors: b.competitors,
    differentiators: b.differentiators,
    boilerplateAbout: b.boilerplateAbout,
    boilerplateDisclaimer: b.boilerplateDisclaimer,
  };
}

export function BrandBibleEditor({ initial }: Props) {
  const [mode, setMode] = useState<Mode>(initial ? "edit" : "import");
  const [form, setForm] = useState<FormState>(
    initial ? brandToForm(initial) : emptyForm(),
  );
  const [rawText, setRawText] = useState(initial?.rawDocument ?? "");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  function patch(updates: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  function handleAnalyze() {
    if (!rawText.trim()) return;
    setStatus(null);
    startTransition(async () => {
      try {
        const extracted = await analyzeBrandDocument(rawText);
        setForm({
          name: extracted.name || form.name,
          url: extracted.url || form.url,
          logoUrl: extracted.logoUrl || "",
          tagline: extracted.tagline || "",
          mission: extracted.mission || "",
          valueProposition: extracted.valueProposition || "",
          industry: extracted.industry || "",
          geoFocus: extracted.geoFocus || [],
          voiceAttributes: extracted.voiceAttributes || ["professional"],
          tonePerChannel: {},
          readingLevel: extracted.readingLevel || "",
          topicPillars: extracted.topicPillars || [],
          targetAudiences: (extracted.targetAudiences || []).map((a) => ({
            name: a.name,
            description: a.description,
            painPoints: a.painPoints || [],
            goals: a.goals || [],
            jobsToBeDone: a.jobsToBeDone || [],
            geos: a.geos || [],
            segments: a.segments || [],
          })),
          terminologyDos: extracted.terminologyDos || [],
          terminologyDonts: extracted.terminologyDonts || [],
          contentRules: extracted.contentRules || [],
          benefits: extracted.benefits || [],
          productFeatures: extracted.productFeatures || [],
          competitors: extracted.competitors || [],
          differentiators: extracted.differentiators || [],
          boilerplateAbout: extracted.boilerplateAbout || "",
          boilerplateDisclaimer: extracted.boilerplateDisclaimer || "",
        });
        setMode("edit");
        setStatus("AI extraction complete — review and save.");
      } catch (err) {
        setStatus(
          `Error: ${err instanceof Error ? err.message : "Extraction failed"}`,
        );
      }
    });
  }

  function handleSave() {
    setStatus(null);
    startTransition(async () => {
      try {
        await saveBrandBible(form, rawText || undefined);
        setStatus("Brand Bible saved successfully.");
      } catch (err) {
        setStatus(
          `Error: ${err instanceof Error ? err.message : "Save failed"}`,
        );
      }
    });
  }

  if (mode === "import") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">
              Import Brand Document
            </h2>
          </div>
          <p className="mb-4 text-sm text-zinc-400">
            Paste your brand guide, about page, marketing brief, or any text
            that describes your brand. AI will extract structured data from it.
          </p>
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={12}
            placeholder="Paste your brand document here..."
            className="mb-4 font-mono text-sm"
          />
          <div className="flex items-center gap-3">
            <Button onClick={handleAnalyze} disabled={isPending || !rawText.trim()}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Analyze with AI
            </Button>
            {initial && (
              <Button variant="outline" onClick={() => setMode("edit")}>
                <ArrowLeft className="h-4 w-4" />
                Back to Editor
              </Button>
            )}
          </div>
          {status && (
            <p
              className={`mt-3 text-sm ${status.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}
            >
              {status}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Brand Bible
        </Button>
        <Button variant="outline" onClick={() => setMode("import")}>
          <FileText className="h-4 w-4" />
          Re-import
        </Button>
        {status && (
          <span
            className={`text-sm ${status.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}
          >
            {status}
          </span>
        )}
      </div>

      <SectionAccordion
        title="Company Identity"
        description="Name, URL, tagline, mission, and value proposition"
        defaultOpen
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldInput
              label="Brand Name"
              value={form.name}
              onChange={(v) => patch({ name: v })}
              required
            />
            <FieldInput
              label="Website URL"
              value={form.url}
              onChange={(v) => patch({ url: v })}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldInput
              label="Tagline"
              value={form.tagline}
              onChange={(v) => patch({ tagline: v })}
              placeholder="Your brand slogan"
            />
            <FieldInput
              label="Logo URL"
              value={form.logoUrl}
              onChange={(v) => patch({ logoUrl: v })}
              placeholder="https://example.com/logo.png"
            />
          </div>
          <FieldTextarea
            label="Mission Statement"
            value={form.mission}
            onChange={(v) => patch({ mission: v })}
          />
          <FieldTextarea
            label="Value Proposition"
            value={form.valueProposition}
            onChange={(v) => patch({ valueProposition: v })}
            placeholder="What unique value does your brand deliver?"
          />
        </div>
      </SectionAccordion>

      <SectionAccordion
        title="Industry & Market"
        description="Market positioning, geographic focus, competitors, and differentiators"
      >
        <div className="space-y-4">
          <FieldInput
            label="Industry / Category"
            value={form.industry}
            onChange={(v) => patch({ industry: v })}
            placeholder="e.g. LegalTech, FinTech, Healthcare"
          />
          <ArrayEditor
            label="Geographic Focus"
            value={form.geoFocus}
            onChange={(v) => patch({ geoFocus: v })}
            placeholder="e.g. US, EU, Global"
          />
          <ArrayEditor
            label="Competitors"
            value={form.competitors}
            onChange={(v) => patch({ competitors: v })}
            placeholder="Competing company or product name"
          />
          <ArrayEditor
            label="Key Differentiators"
            value={form.differentiators}
            onChange={(v) => patch({ differentiators: v })}
            placeholder="What makes your brand unique"
          />
        </div>
      </SectionAccordion>

      <SectionAccordion
        title="Voice & Tone"
        description="Brand voice attributes, per-channel tone, and reading level"
      >
        <div className="space-y-4">
          <ArrayEditor
            label="Voice Attributes"
            value={form.voiceAttributes}
            onChange={(v) => patch({ voiceAttributes: v })}
            placeholder="e.g. professional, clear, empathetic"
          />
          <FieldInput
            label="Reading Level"
            value={form.readingLevel}
            onChange={(v) => patch({ readingLevel: v })}
            placeholder="e.g. Grade 8-10"
          />
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-400">
              Tone per Channel
            </label>
            {CONTENT_CHANNELS.map((ch) => (
              <div key={ch} className="space-y-1.5">
                <label className="text-xs text-zinc-500">
                  {CHANNEL_LABELS[ch]}
                </label>
                <Input
                  value={form.tonePerChannel[ch] ?? ""}
                  onChange={(e) =>
                    patch({
                      tonePerChannel: {
                        ...form.tonePerChannel,
                        [ch]: e.target.value,
                      },
                    })
                  }
                  placeholder={`Tone for ${CHANNEL_LABELS[ch].toLowerCase()}`}
                />
              </div>
            ))}
          </div>
        </div>
      </SectionAccordion>

      <SectionAccordion
        title="Topics & Messaging"
        description="Topic pillars and key benefits the brand wants associated in AI responses"
      >
        <div className="space-y-4">
          <ArrayEditor
            label="Topic Pillars"
            value={form.topicPillars}
            onChange={(v) => patch({ topicPillars: v })}
            placeholder="A topic or theme to be known for"
          />
          <ArrayEditor
            label="Key Benefits"
            value={form.benefits}
            onChange={(v) => patch({ benefits: v })}
            placeholder="A key benefit or selling point"
          />
        </div>
      </SectionAccordion>

      <SectionAccordion
        title="Product"
        description="Features and capabilities to surface in AI engine responses"
      >
        <ArrayEditor
          label="Product Features"
          value={form.productFeatures}
          onChange={(v) => patch({ productFeatures: v })}
          placeholder="A product feature or capability"
        />
      </SectionAccordion>

      <SectionAccordion
        title="Target Audiences"
        description="Audience segments with pain points, goals, jobs to be done — replaces the old ICPs page"
      >
        <AudiencesEditor
          value={form.targetAudiences}
          onChange={(v) => patch({ targetAudiences: v })}
        />
      </SectionAccordion>

      <SectionAccordion
        title="Terminology"
        description="Preferred terms (always use) and forbidden terms (never use)"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <ArrayEditor
            label="Preferred Terms (Dos)"
            value={form.terminologyDos}
            onChange={(v) => patch({ terminologyDos: v })}
            placeholder="Preferred term"
          />
          <ArrayEditor
            label="Forbidden Terms (Don'ts)"
            value={form.terminologyDonts}
            onChange={(v) => patch({ terminologyDonts: v })}
            placeholder="Forbidden phrase"
          />
        </div>
      </SectionAccordion>

      <SectionAccordion
        title="Content Rules"
        description="Mandatory rules enforced in every AI-generated content artifact"
      >
        <ArrayEditor
          label="Content Rules"
          hint="These rules are injected into every AI content generation prompt as mandatory constraints."
          value={form.contentRules}
          onChange={(v) => patch({ contentRules: v })}
          placeholder="e.g. Never use passive voice in headlines"
        />
      </SectionAccordion>

      <SectionAccordion
        title="Boilerplate"
        description="Standard about and disclaimer text"
      >
        <div className="space-y-4">
          <FieldTextarea
            label="About Us"
            value={form.boilerplateAbout}
            onChange={(v) => patch({ boilerplateAbout: v })}
            placeholder="Standard company description paragraph"
            rows={4}
          />
          <FieldTextarea
            label="Disclaimer"
            value={form.boilerplateDisclaimer}
            onChange={(v) => patch({ boilerplateDisclaimer: v })}
            placeholder="Standard legal disclaimer or notice"
            rows={3}
          />
        </div>
      </SectionAccordion>

      <div className="flex items-center gap-3 pb-8">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Brand Bible
        </Button>
        {status && (
          <span
            className={`text-sm ${status.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}
          >
            {status}
          </span>
        )}
      </div>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-400">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-400">{label}</label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}
