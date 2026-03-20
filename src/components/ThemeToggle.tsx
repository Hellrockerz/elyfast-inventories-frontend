import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="p-2 w-10 h-10" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-full w-10 h-10 bg-white/5 border border-white/10 dark:bg-black/20 dark:border-white/5 hover:bg-white/10 dark:hover:bg-white/10 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500 rotate-0 scale-100 transition-all" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-blue-500 rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0" />
      )}
    </Button>
  );
}
