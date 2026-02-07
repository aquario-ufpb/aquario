import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  EntidadeVagaType,
  ENTIDADE_VAGA_LABELS,
  ENTIDADE_VAGA_SHORT_LABELS,
} from "@/lib/shared/types/vaga.types";

type BadgeProps = {
  type: EntidadeVagaType;
  size: "large" | "small";
  className?: string;
};

const TypeBadge = ({ type, size, className }: BadgeProps) => {
  const colorsBig = {
    laboratorios: "text-violet-700 bg-violet-200 border-violet-700 hover:bg-violet-200",
    pessoa: "text-red-700 bg-red-200 border-red-700 hover:bg-red-200",
    ufpb: "text-fuchsia-700 bg-fuchsia-200 border-fuchsia-700 hover:bg-fuchsia-200",
    grupos: "text-emerald-700 bg-emerald-200 border-emerald-700 hover:bg-emerald-200",
    externo: "text-amber-700 bg-amber-200 border-amber-700 hover:bg-amber-200",
    ligas: "text-cyan-700 bg-cyan-200 border-cyan-700 hover:bg-cyan-200",
  };

  const colorsSmall = {
    laboratorios: "text-violet-200 bg-violet-700 hover:bg-purple-200 hover:text-violet-700",
    pessoa: "text-red-200 bg-red-700 hover:bg-red-200 hover:text-red-700",
    ufpb: "text-fuchsia-200 bg-fuchsia-700 hover:bg-fuchsia-200 hover:text-fuchsia-700",
    grupos: "text-emerald-200 bg-emerald-700 hover:bg-emerald-200 hover:text-emerald-700",
    externo: "text-amber-200 bg-amber-700 hover:bg-amber-200 hover:text-amber-700",
    ligas: "text-cyan-200 bg-cyan-700 border-cyan-200 hover:bg-cyan-700",
  };

  const badgeClassName = className ? className : "";

  if (size === "large") {
    return (
      <Badge className={`${colorsBig[type]} rounded-full border text-xs ${badgeClassName}`}>
        {ENTIDADE_VAGA_LABELS[type]}
      </Badge>
    );
  } else {
    return (
      <Badge className={`${colorsSmall[type]} rounded-sm text-center ${badgeClassName}`}>
        {ENTIDADE_VAGA_SHORT_LABELS[type]}
      </Badge>
    );
  }
};

export default TypeBadge;
