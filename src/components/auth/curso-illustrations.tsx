/**
 * Custom SVG illustrations for each curso, used in the registration page.
 * Each is a simple, recognizable scene rendered at 64x64.
 */

export function CcIllustration({ className }: { className?: string }) {
  // Terminal / code window
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Monitor body */}
      <rect x="8" y="10" width="48" height="34" rx="4" stroke="currentColor" strokeWidth="2" />
      {/* Screen area */}
      <rect x="12" y="14" width="40" height="26" rx="2" fill="currentColor" opacity="0.08" />
      {/* Terminal prompt lines */}
      <path
        d="M18 22l4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="26"
        y1="30"
        x2="40"
        y2="30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="26"
        y1="35"
        x2="34"
        y2="35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Stand */}
      <line x1="32" y1="44" x2="32" y2="50" stroke="currentColor" strokeWidth="2" />
      <line
        x1="24"
        y1="50"
        x2="40"
        y2="50"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EcIllustration({ className }: { className?: string }) {
  // Microchip / circuit board
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Chip body */}
      <rect x="18" y="18" width="28" height="28" rx="3" stroke="currentColor" strokeWidth="2" />
      {/* Inner die */}
      <rect
        x="24"
        y="24"
        width="16"
        height="16"
        rx="1"
        fill="currentColor"
        opacity="0.08"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Pins — top */}
      <line
        x1="26"
        y1="18"
        x2="26"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="18"
        x2="32"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="38"
        y1="18"
        x2="38"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Pins — bottom */}
      <line
        x1="26"
        y1="46"
        x2="26"
        y2="52"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="46"
        x2="32"
        y2="52"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="38"
        y1="46"
        x2="38"
        y2="52"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Pins — left */}
      <line
        x1="18"
        y1="26"
        x2="12"
        y2="26"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="18"
        y1="32"
        x2="12"
        y2="32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="18"
        y1="38"
        x2="12"
        y2="38"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Pins — right */}
      <line
        x1="46"
        y1="26"
        x2="52"
        y2="26"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="46"
        y1="32"
        x2="52"
        y2="32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="46"
        y1="38"
        x2="52"
        y2="38"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Inner circuit detail */}
      <circle cx="32" cy="32" r="3" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

export function CdiaIllustration({ className }: { className?: string }) {
  // Brain with data nodes
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Brain outline — left hemisphere */}
      <path
        d="M32 14c-6 0-10 3-12 7-2 4-1 8 0 11 1 3 0 6-1 8 2 3 5 5 9 5h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="currentColor"
        fillOpacity="0.05"
      />
      {/* Brain outline — right hemisphere */}
      <path
        d="M32 14c6 0 10 3 12 7 2 4 1 8 0 11-1 3 0 6 1 8-2 3-5 5-9 5h-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="currentColor"
        fillOpacity="0.05"
      />
      {/* Central divide */}
      <line x1="32" y1="14" x2="32" y2="45" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      {/* Data nodes */}
      <circle
        cx="26"
        cy="24"
        r="2.5"
        fill="currentColor"
        opacity="0.2"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle
        cx="38"
        cy="24"
        r="2.5"
        fill="currentColor"
        opacity="0.2"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle
        cx="24"
        cy="34"
        r="2.5"
        fill="currentColor"
        opacity="0.2"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle
        cx="40"
        cy="34"
        r="2.5"
        fill="currentColor"
        opacity="0.2"
        stroke="currentColor"
        strokeWidth="1"
      />
      {/* Connection lines */}
      <line x1="28" y1="25" x2="32" y2="29" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="36" y1="25" x2="32" y2="29" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="26" y1="34" x2="32" y2="29" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="38" y1="34" x2="32" y2="29" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      {/* Central hub */}
      <circle cx="32" cy="29" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function ErIllustration({ className }: { className?: string }) {
  // Robot figure
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Antenna */}
      <line
        x1="32"
        y1="8"
        x2="32"
        y2="15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="32"
        cy="7"
        r="2"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Head */}
      <rect
        x="20"
        y="15"
        width="24"
        height="18"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.05"
      />
      {/* Eyes */}
      <circle
        cx="27"
        cy="24"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        opacity="0.15"
      />
      <circle
        cx="37"
        cy="24"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        opacity="0.15"
      />
      {/* Eye highlights */}
      <circle cx="28" cy="23" r="1" fill="currentColor" opacity="0.3" />
      <circle cx="38" cy="23" r="1" fill="currentColor" opacity="0.3" />
      {/* Mouth */}
      <line
        x1="27"
        y1="29"
        x2="37"
        y2="29"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Body */}
      <rect
        x="22"
        y="35"
        width="20"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.05"
      />
      {/* Chest detail */}
      <rect x="29" y="38" width="6" height="4" rx="1" fill="currentColor" opacity="0.12" />
      {/* Arms */}
      <line
        x1="22"
        y1="39"
        x2="14"
        y2="42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="42"
        y1="39"
        x2="50"
        y2="42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Legs */}
      <line
        x1="28"
        y1="49"
        x2="28"
        y2="56"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="36"
        y1="49"
        x2="36"
        y2="56"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OutroIllustration({ className }: { className?: string }) {
  // Graduation cap
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cap top */}
      <polygon
        points="32,16 8,28 32,40 56,28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.08"
      />
      {/* Tassel string */}
      <line
        x1="50"
        y1="26"
        x2="50"
        y2="40"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Tassel */}
      <line
        x1="50"
        y1="40"
        x2="50"
        y2="48"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="50" cy="40" r="1.5" fill="currentColor" opacity="0.3" />
      {/* Band sides */}
      <line
        x1="16"
        y1="32"
        x2="16"
        y2="42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="48"
        y1="32"
        x2="48"
        y2="42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Band bottom curve */}
      <path
        d="M16 42c0 5 7 8 16 8s16-3 16-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="currentColor"
        fillOpacity="0.05"
      />
    </svg>
  );
}

/** Map curso name → illustration component */
export const cursoIllustrations: Record<string, React.FC<{ className?: string }>> = {
  "Ciência da Computação": CcIllustration,
  "Engenharia da Computação": EcIllustration,
  "Ciência de Dados e Inteligência Artificial": CdiaIllustration,
  "Engenharia de Robôs": ErIllustration,
  Outro: OutroIllustration,
};

/** Short labels for the buttons */
export const cursoShortLabels: Record<string, string> = {
  "Ciência da Computação": "Ciência da Computação",
  "Engenharia da Computação": "Eng. da Computação",
  "Ciência de Dados e Inteligência Artificial": "Ciência de Dados e IA",
  "Engenharia de Robôs": "Eng. de Robôs",
  Outro: "Outro curso",
};
