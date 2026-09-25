import fs from "node:fs";
import path from "node:path";

export type ChecklistStatus = "done" | "in_progress" | "partial" | "blocked" | "not_started";

export type ChecklistItem = {
  id: string;
  title: string;
  status: ChecklistStatus;
};

export type ChecklistSection = {
  id: string;
  title: string;
  items: ChecklistItem[];
};

export type ProjectChecklist = {
  title: string;
  sections: ChecklistSection[];
};

const statusMarkers: Record<string, ChecklistStatus> = {
  x: "done",
  "~": "in_progress",
  p: "partial",
  "!": "blocked",
  " ": "not_started",
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/^\d+[.)-]?\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getProjectChecklist(): ProjectChecklist {
  const checklistPath = path.join(process.cwd(), "docs", "IMPLEMENTATION_CHECKLIST.md");
  const lines = fs.readFileSync(checklistPath, "utf8").split(/\r?\n/);
  let title = "Kawisha Hub NG implementation checklist";
  let currentSection: ChecklistSection | null = null;
  const sections: ChecklistSection[] = [];

  lines.forEach((line) => {
    const titleMatch = line.match(/^#\s+(.+?)\s*#*$/);
    if (titleMatch) {
      title = titleMatch[1].trim();
      return;
    }

    const sectionMatch = line.match(/^##\s+(.+?)\s*#*$/);
    if (sectionMatch) {
      currentSection = {
        id: normalize(sectionMatch[1]) || `section-${sections.length + 1}`,
        title: sectionMatch[1].trim(),
        items: [],
      };
      sections.push(currentSection);
      return;
    }

    const taskMatch = line.match(/^\s*[-*+]\s+\[([ x~p!])\]\s+(.+?)\s*$/i);
    if (!taskMatch || !currentSection) return;

    const taskTitle = taskMatch[2].replace(/\*\*/g, "").trim();
    const status = statusMarkers[taskMatch[1].toLocaleLowerCase()];
    if (!taskTitle || !status) return;

    currentSection.items.push({
      id: `${currentSection.id}-${normalize(taskTitle)}-${currentSection.items.length + 1}`,
      title: taskTitle,
      status,
    });
  });

  return { title, sections: sections.filter((section) => section.items.length > 0) };
}
