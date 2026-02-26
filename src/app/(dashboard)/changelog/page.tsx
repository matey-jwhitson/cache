import { db } from "@/lib/db";
import { ChangelogClient } from "./changelog-client";

export default async function ChangelogPage() {
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const entityTypes = [...new Set(logs.map((l) => l.entityType))];

  const serialized = logs.map((l) => ({
    id: l.id,
    entityType: l.entityType,
    entityId: l.entityId,
    action: l.action,
    details: l.details as Record<string, unknown>,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Changelog</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Audit log of all system changes
        </p>
      </div>

      <ChangelogClient logs={serialized} entityTypes={entityTypes} />
    </div>
  );
}
