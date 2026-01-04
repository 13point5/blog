"use client";

import * as React from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CopyButton({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-slot="copy-button"
          size="icon"
          variant="ghost"
          className={cn(
            "absolute top-3 right-3 z-10 size-7 text-code-foreground opacity-0 transition-opacity group-hover/code:opacity-100 hover:bg-code-highlight hover:text-code-foreground focus-visible:opacity-100",
            className
          )}
          onClick={() => {
            navigator.clipboard.writeText(value);
            setHasCopied(true);
          }}
        >
          <span className="sr-only">Copy</span>
          {hasCopied ? (
            <IconCheck className="size-3.5" />
          ) : (
            <IconCopy className="size-3.5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {hasCopied ? "Copied!" : "Copy to clipboard"}
      </TooltipContent>
    </Tooltip>
  );
}

