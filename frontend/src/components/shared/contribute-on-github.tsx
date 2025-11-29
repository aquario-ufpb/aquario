import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

type ContributeOnGitHubProps = {
  url: string;
  variant?: "default" | "outline";
  size?: "sm" | "lg";
  className?: string;
};

export function ContributeOnGitHub({
  url,
  variant = "default",
  size = "sm",
  className,
}: ContributeOnGitHubProps) {
  const defaultClassName =
    variant === "default"
      ? "rounded-full hover:bg-primary/90 transition-all text-white dark:text-black font-normal"
      : "rounded-full";

  return (
    <Button asChild variant={variant} size={size} className={className || defaultClassName}>
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
        <Github className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
        Contribuir no GitHub
      </a>
    </Button>
  );
}
