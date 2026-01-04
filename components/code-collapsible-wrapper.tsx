"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

export function CodeCollapsibleWrapper({
  className,
  children,
  defaultOpen = false,
}: {
  className?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpened, setIsOpened] = React.useState(defaultOpen);

  return (
    <Collapsible
      open={isOpened}
      onOpenChange={setIsOpened}
      className={cn("group/collapsible relative", className)}
    >
      <CollapsibleTrigger asChild>
        <div className="absolute top-2 right-10 z-10 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 rounded px-2 text-xs text-code-foreground hover:bg-code-highlight"
          >
            {isOpened ? (
              <>
                <ChevronUp className="size-3" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="size-3" />
                Expand
              </>
            )}
          </Button>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent
        forceMount
        className={cn(
          "relative overflow-hidden transition-all",
          !isOpened && "max-h-64"
        )}
      >
        {children}
      </CollapsibleContent>
      {!isOpened && (
        <CollapsibleTrigger className="from-code-bg/80 to-code-bg text-muted-foreground absolute inset-x-0 bottom-0 flex h-16 items-end justify-center rounded-b-xl bg-linear-to-b pb-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 rounded-full px-3 text-xs"
          >
            <ChevronDown className="size-3" />
            Show more
          </Button>
        </CollapsibleTrigger>
      )}
    </Collapsible>
  );
}
