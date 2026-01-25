import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Entidade } from "@/lib/shared/types";
import { formatEntityType, getBadgeText } from "./entidade-utils";

type EntidadeOtherEntitiesSectionProps = {
  currentEntidade: Entidade;
  otherEntidades: Entidade[];
};

export function EntidadeOtherEntitiesSection({
  currentEntidade,
  otherEntidades,
}: EntidadeOtherEntitiesSectionProps) {
  if (otherEntidades.length === 0) {
    return null;
  }

  return (
    <div className="px-6 md:px-8 lg:px-16 pb-12">
      <div className="border-t border-border/30 pt-8">
        <h2 className="text-lg font-semibold mb-6">
          Outros {formatEntityType(currentEntidade.tipo).toLowerCase()}s
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {otherEntidades.map(otherEntidade => (
            <Link key={otherEntidade.id} href={`/entidade/${otherEntidade.slug}`} className="group">
              <div className="flex gap-3 p-3 rounded-lg border border-border/30 hover:border-border/60 hover:bg-accent/10 transition-all duration-200 h-full">
                {/* Image */}
                <div className="flex-shrink-0 flex items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={otherEntidade.imagePath || ""}
                    alt={otherEntidade.name}
                    className="w-12 h-12 object-contain rounded"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-medium truncate flex-1 group-hover:text-primary transition-colors">
                      {otherEntidade.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 text-muted-foreground border-muted-foreground/30 flex-shrink-0"
                    >
                      {getBadgeText(otherEntidade.tipo)}
                    </Badge>
                  </div>

                  {otherEntidade.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {otherEntidade.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
