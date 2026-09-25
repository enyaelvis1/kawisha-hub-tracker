"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ChecklistItem, ChecklistSection, ChecklistStatus } from "@/lib/checklist";

const STORAGE_KEY = "kawisha-project-progress-v1";

const statusLabels: Record<ChecklistStatus, string> = {
  done: "Done",
  in_progress: "In progress",
  partial: "Partial",
  blocked: "Blocked",
  not_started: "Not started",
};

const statusStyles: Record<ChecklistStatus, string> = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-800",
  in_progress: "border-amber-200 bg-amber-50 text-amber-800",
  partial: "border-sky-200 bg-sky-50 text-sky-800",
  blocked: "border-rose-200 bg-rose-50 text-rose-800",
  not_started: "border-border bg-muted text-muted-foreground",
};

function getEffectiveStatus(item: ChecklistItem, overrides: Record<string, boolean>): ChecklistStatus {
  if (overrides[item.id] === true) return "done";
  if (overrides[item.id] === false && item.status === "done") return "not_started";
  return item.status;
}

function flattenItems(sections: ChecklistSection[]) {
  return sections.flatMap((section) => section.items);
}

export function ProjectProgress({ sections }: { sections: ChecklistSection[] }) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const items = useMemo(() => flattenItems(sections), [sections]);
  const totals = useMemo(() => {
    return items.reduce(
      (result, item) => {
        const status = getEffectiveStatus(item, overrides);
        result.total += 1;
        result[status] += 1;
        return result;
      },
      { total: 0, done: 0, in_progress: 0, partial: 0, blocked: 0, not_started: 0 },
    );
  }, [items, overrides]);
  const completion = totals.total ? Math.round((totals.done / totals.total) * 100) : 0;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setOverrides(JSON.parse(stored) as Record<string, boolean>);
    } catch {
      // Local review state is optional; the Markdown checklist remains authoritative.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [hydrated, overrides]);

  function setChecked(item: ChecklistItem, checked: boolean) {
    setOverrides((current) => ({ ...current, [item.id]: checked }));
  }

  function resetTicks() {
    setOverrides({});
  }

  return (
    <div>
      <section aria-label="Checklist summary" className="rounded-xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Local review completion</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{completion}%</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{totals.done} of {totals.total} items checked</p>
            <p className="mt-1 text-xs">{hydrated ? "Ticks saved in this browser" : "Loading local ticks…"}</p>
          </div>
        </div>
        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Checklist completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion}>
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${completion}%` }} />
        </div>
        <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" /> {totals.done} done</span>
          <span className="inline-flex items-center gap-1.5"><CircleDashed className="size-3.5 text-amber-600" aria-hidden="true" /> {totals.in_progress + totals.partial} in progress/partial</span>
          <span className="inline-flex items-center gap-1.5"><AlertTriangle className="size-3.5 text-rose-600" aria-hidden="true" /> {totals.blocked} blocked</span>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-5 text-muted-foreground">The Markdown checklist is authoritative. These ticks are only for a local walkthrough and never change app data.</p>
        <Button type="button" variant="outline" size="sm" onClick={resetTicks} disabled={!Object.keys(overrides).length}>
          <RotateCcw aria-hidden="true" /> Reset local ticks
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {sections.map((section, index) => {
          const sectionDone = section.items.filter((item) => getEffectiveStatus(item, overrides) === "done").length;
          return (
            <details key={section.id} open={index === 0} className="group rounded-xl border bg-card shadow-sm">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold tracking-tight">{section.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{sectionDone} of {section.items.length} checked</span>
                </span>
                <span className="text-xs font-semibold text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="border-t px-4 pb-2">
                <ul>
                  {section.items.map((item) => {
                    const status = getEffectiveStatus(item, overrides);
                    const checked = status === "done";
                    const checkboxId = `checklist-${item.id}`;
                    return (
                      <li key={item.id} className="flex items-start gap-3 border-b py-3 last:border-b-0">
                        <Checkbox id={checkboxId} checked={checked} onCheckedChange={(value) => setChecked(item, value === true)} className="mt-0.5" aria-label={`Mark ${item.title} complete`} />
                        <label htmlFor={checkboxId} className={`min-w-0 flex-1 cursor-pointer text-sm leading-6 ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {item.title}
                        </label>
                        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[status]}`}>
                          {statusLabels[status]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
