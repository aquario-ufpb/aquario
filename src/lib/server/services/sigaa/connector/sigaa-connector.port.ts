import "server-only";

import type { EphemeralSigaaCredentials } from "./ephemeral-credentials";

export type SigaaComponentStatus = "completed" | "enrolled" | "pending" | "unknown";

export type SigaaWorkloadProgress = Readonly<{
  description: string;
  completedHours: number;
  totalHours: number;
  remainingHours: number;
  completedPercent: number;
}>;

export type SigaaAcademicComponent = Readonly<{
  code: string;
  name: string;
  integrationType: string;
  period: number | null;
  workloadHours: number;
  required: boolean;
  status: SigaaComponentStatus;
  prerequisite: string | null;
  corequisite: string | null;
  unrecognizedSource?: Readonly<{
    status?: string;
    period?: string;
  }>;
}>;

export type SigaaGrade = Readonly<{
  semester: string;
  code: string;
  discipline: string;
  units: readonly string[];
  exam: string | null;
  result: string | null;
  absences: string | null;
  status: string | null;
}>;

export type SigaaClass = Readonly<{
  sourceKey: string;
  name: string;
  code: string | null;
  room: string | null;
  scheduleRaw: string | null;
  semester: string | null;
}>;

export type SigaaSnapshotCandidate = Readonly<{
  contractVersion: "1.0";
  connectorObservedAt: Date;
  connectorRequestId: string;
  upstreamCommit: string;
  identity: Readonly<{
    matricula: string;
    sourceCourse: string | null;
    sourceSemester: string | null;
  }>;
  curriculum: Readonly<{
    code: string;
    maximumCompletionTerm: string | null;
    semesterWorkload: Readonly<{
      minimum: number | null;
      maximum: number | null;
    }>;
    cra: Readonly<{
      value: string | null;
      source: "academic_transcript" | "unavailable";
    }>;
    progress: readonly SigaaWorkloadProgress[];
    components: readonly SigaaAcademicComponent[];
  }>;
  grades: readonly SigaaGrade[];
  classes: readonly SigaaClass[];
}>;

export type ISigaaConnector = {
  synchronize(input: {
    credentials: EphemeralSigaaCredentials;
    expectedMatricula: string | null;
  }): Promise<SigaaSnapshotCandidate>;
};
