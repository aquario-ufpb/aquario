import { COPA_TEAMS } from "@/lib/shared/copa/teams";
import type { CopaGroupLetter } from "@/lib/shared/copa/types";
import { Flag } from "./flag";

export function GroupCard({ grupo }: { grupo: CopaGroupLetter }) {
  const teams = COPA_TEAMS.filter(team => team.grupo === grupo);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-aquario-primary text-sm font-bold text-white">
          {grupo}
        </span>
        <span className="text-sm font-semibold text-aquario-header dark:text-aquario-header-dark">
          Grupo {grupo}
        </span>
      </div>
      <ul className="space-y-2">
        {teams.map(team => (
          <li key={team.id} className="flex items-center gap-2.5">
            <Flag code={team.flagCode} name={team.nome} width={26} className="shrink-0" />
            <span className="truncate text-sm text-aquario-header dark:text-aquario-header-dark">
              {team.nome}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
