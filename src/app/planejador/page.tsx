import type { Metadata } from "next";
import { EnrollmentPlanner } from "@/components/pages/planejador/enrollment-planner";

export const metadata: Metadata = {
  title: "Planejador de matrícula · Aquário",
  description:
    "Compare combinações de turmas do SIGAA por disponibilidade, prioridades e reservas para seu curso.",
};
export default function PlannerPage() {
  return <EnrollmentPlanner />;
}
