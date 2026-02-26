"use client";

import { useEffect, useState } from "react";

interface LocalTimeProps {
  date: string | Date;
  className?: string;
}

export function LocalTime({ date, className }: LocalTimeProps) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    const d = typeof date === "string" ? new Date(date) : date;
    setFormatted(
      d.toLocaleString(undefined, {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  }, [date]);

  if (!formatted) return <span className={className}>—</span>;

  return <span className={className}>{formatted}</span>;
}
