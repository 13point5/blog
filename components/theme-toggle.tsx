"use client";

import * as React from "react";
import { Moon, Sun, FileText } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" disabled>
          <Sun className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <Button
        variant={theme === "light" ? "default" : "ghost"}
        size="icon"
        onClick={() => setTheme("light")}
        title="Light mode"
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Light mode</span>
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "ghost"}
        size="icon"
        onClick={() => setTheme("dark")}
        title="Dark mode"
      >
        <Moon className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Dark mode</span>
      </Button>
      <Button
        variant={theme === "paper" ? "default" : "ghost"}
        size="icon"
        onClick={() => setTheme("paper")}
        title="Paper mode"
      >
        <FileText className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Paper mode</span>
      </Button>
    </div>
  );
}
