import { Entidade } from "@/lib/shared/types";

type EntidadeDescriptionSectionProps = {
  entidade: Entidade;
};

export function EntidadeDescriptionSection({ entidade }: EntidadeDescriptionSectionProps) {
  if (!entidade.description) {
    return null;
  }

  return (
    <div className="container mx-auto px-6 md:px-8 lg:px-16 pb-12">
      <div className="border-t border-border/30 pt-8">
        <h2 className="text-lg font-semibold mb-4">Sobre</h2>
        <p className="text-muted-foreground leading-relaxed">{entidade.description}</p>
      </div>
    </div>
  );
}
