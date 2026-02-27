import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default async function ContentQAPage() {
  const brand = await db.brandProfile.findFirst();
  const artifacts = await db.contentArtifact.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const forbiddenPhrases = Array.isArray(brand?.terminologyDonts)
    ? (brand.terminologyDonts as string[])
    : [];

  const gates = artifacts.map((artifact) => {
    const content = artifact.content.toLowerCase();
    const forbiddenHits = forbiddenPhrases.filter((p) =>
      content.includes(p.toLowerCase()),
    );
    const hasForbidden = forbiddenHits.length > 0;

    const wordCount = artifact.content.split(/\s+/).length;
    const sentenceCount = artifact.content.split(/[.!?]+/).filter(Boolean).length;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const readabilityScore = Math.max(0, 100 - avgWordsPerSentence * 3);

    return {
      id: artifact.id,
      kind: artifact.kind,
      path: artifact.path,
      forbiddenPass: !hasForbidden,
      forbiddenHits,
      readabilityScore: Math.round(readabilityScore),
      readabilityPass: readabilityScore >= 55,
      wordCount,
    };
  });

  const allPass = gates.every((g) => g.forbiddenPass && g.readabilityPass);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Content QA</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Quality gates for generated content artifacts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {allPass ? (
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            )}
            Overall Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={allPass ? "success" : "warning"} className="text-sm">
            {allPass ? "All Gates Passing" : "Some Gates Failing"}
          </Badge>
        </CardContent>
      </Card>

      {gates.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
          No content artifacts to QA — run a content build first
        </div>
      ) : (
        <div className="space-y-3">
          {gates.map((gate) => (
            <div
              key={gate.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="font-medium text-white">{gate.kind}</span>
                <span className="font-mono text-xs text-zinc-500">{gate.path}</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <GateIndicator
                  label="Forbidden Phrases"
                  pass={gate.forbiddenPass}
                  detail={
                    gate.forbiddenPass
                      ? "No forbidden phrases found"
                      : `Found: ${gate.forbiddenHits.join(", ")}`
                  }
                />
                <GateIndicator
                  label="Readability"
                  pass={gate.readabilityPass}
                  detail={`Score: ${gate.readabilityScore} (min: 55)`}
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-400">Word Count</p>
                  <p className="text-lg font-bold text-white">{gate.wordCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GateIndicator({
  label,
  pass,
  detail,
}: {
  label: string;
  pass: boolean;
  detail: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <div className="flex items-center gap-2">
        {pass ? (
          <CheckCircle className="h-4 w-4 text-emerald-400" />
        ) : (
          <XCircle className="h-4 w-4 text-red-400" />
        )}
        <span className={pass ? "text-sm text-emerald-400" : "text-sm text-red-400"}>
          {pass ? "Pass" : "Fail"}
        </span>
      </div>
      <p className="text-xs text-zinc-500">{detail}</p>
    </div>
  );
}
