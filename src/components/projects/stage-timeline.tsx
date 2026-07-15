"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { advanceStage } from "@/features/projects/actions";
import { STAGES, type ProjectStage } from "@/features/projects/types";

export function StageTimeline({ projectId, currentStage, canAdvance }: { projectId: string; currentStage: ProjectStage; canAdvance: boolean }) {
  const [pending, startTransition] = useTransition();
  const currentIndex = STAGES.indexOf(currentStage);
  const next = STAGES[currentIndex + 1];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {STAGES.map((stage, i) => {
          const done = i <= currentIndex;
          return (
            <div key={stage} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                  done ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn("text-sm capitalize", done ? "font-medium" : "text-muted-foreground")}>{stage}</span>
              {i < STAGES.length - 1 ? <span className="mx-1 text-muted-foreground/40">→</span> : null}
            </div>
          );
        })}
      </div>

      {canAdvance && next ? (
        <Button
          variant="gradient"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await advanceStage(projectId, next);
              toast.success(`Advanced to ${next}`);
            })
          }
        >
          Mark &quot;{next}&quot; complete
        </Button>
      ) : null}
    </div>
  );
}
