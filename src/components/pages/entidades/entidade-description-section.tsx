import { Entidade } from "@/lib/shared/types";

type EntidadeDescriptionSectionProps = {
  entidade: Entidade;
};

export function EntidadeDescriptionSection({ entidade }: EntidadeDescriptionSectionProps) {
  if (!entidade.description) {
    return null;
  }

  return (
    <div className="px-6 md:px-8 lg:px-16 pb-12">
      <p className="text-muted-foreground leading-relaxed">{entidade.description}</p>
    </div>
  );
}
