type AdmissionSetuMarkProps = {
  className?: string;
};

export function AdmissionSetuMark({ className }: AdmissionSetuMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 17c3.2 0 3-9 7-9s4 5 7 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.25"
      />
      <circle cx="5" cy="17" fill="currentColor" r="2" />
      <circle cx="19" cy="13" fill="currentColor" r="2" />
    </svg>
  );
}
