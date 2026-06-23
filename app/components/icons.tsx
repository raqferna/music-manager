// Iconos SVG inline (sin dependencias externas).
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function Play(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 4.5v15l13-7.5L6 4.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function Pause(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="6" y="4.5" width="4.5" height="15" rx="1" fill="currentColor" stroke="none" />
      <rect x="13.5" y="4.5" width="4.5" height="15" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function SkipBack(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M19 5l-12 7 12 7V5z" fill="currentColor" stroke="none" />
      <line x1="5" y1="5" x2="5" y2="19" stroke="currentColor" />
    </svg>
  );
}
export function SkipForward(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 5l12 7-12 7V5z" fill="currentColor" stroke="none" />
      <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" />
    </svg>
  );
}
export function Volume(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
      <path d="M16 9c1 1 1 5 0 6" />
      <path d="M19 7c2 2 2 8 0 10" />
    </svg>
  );
}
export function VolumeMute(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
      <line x1="16" y1="9" x2="22" y2="15" />
      <line x1="22" y1="9" x2="16" y2="15" />
    </svg>
  );
}
export function Disc(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
export function FileMusic(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
      <circle cx="10" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <path d="M11.5 16v-4l4-1v3" />
      <circle cx="14" cy="14.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function FileText(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </svg>
  );
}
export function Search(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16.5" y2="16.5" />
    </svg>
  );
}
export function FolderOpen(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H3z" />
      <path d="M3 10h18l-2 8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}
export function Plus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
export function X(props: IconProps) {
  return (
    <svg {...base(props)}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
export function Trash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
export function Upload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  );
}
export function Link(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
export function Loader(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2v4" />
      <path d="M12 18v4" opacity="0.3" />
      <path d="m4.93 4.93 2.83 2.83" opacity="0.7" />
      <path d="m16.24 16.24 2.83 2.83" opacity="0.3" />
      <path d="M2 12h4" opacity="0.5" />
      <path d="M18 12h4" opacity="0.3" />
      <path d="m4.93 19.07 2.83-2.83" opacity="0.3" />
      <path d="m16.24 7.76 2.83-2.83" opacity="0.7" />
    </svg>
  );
}
