import { PageHeader } from "@/components/app-shell";
import { ProjectProgress } from "@/components/project-progress";
import { getProjectChecklist } from "@/lib/checklist";

export const metadata = {
  title: "Project progress | Kawisha Hub NG",
};

export default function ProgressPage() {
  const checklist = getProjectChecklist();

  return (
    <div>
      <PageHeader
        eyebrow="Delivery review"
        title="Project progress"
        description="A lightweight view of the Kawisha Hub NG implementation checklist for walkthroughs and handovers."
      />
      <ProjectProgress sections={checklist.sections} />
    </div>
  );
}
