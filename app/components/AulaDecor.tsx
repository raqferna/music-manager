export default function AulaDecor({ floating = false }: { floating?: boolean }) {
  const staff = (
      <svg
        className={
          floating
            ? "absolute left-1/2 top-[11%] w-[min(720px,92vw)] -translate-x-1/2 text-[#e7c27a]/30"
            : "mb-5 w-full text-[#e7c27a]/40"
        }
        viewBox="0 0 720 88"
        fill="none"
      >
        <g stroke="currentColor" strokeWidth="1.25">
          <line x1="0" y1="16" x2="720" y2="16" />
          <line x1="0" y1="30" x2="720" y2="30" />
          <line x1="0" y1="44" x2="720" y2="44" />
          <line x1="0" y1="58" x2="720" y2="58" />
          <line x1="0" y1="72" x2="720" y2="72" />
        </g>
        <g fill="currentColor">
          <ellipse cx="150" cy="44" rx="8" ry="5.5" transform="rotate(-20 150 44)" />
          <rect x="157" y="16" width="1.6" height="30" />
          <ellipse cx="230" cy="30" rx="8" ry="5.5" transform="rotate(-20 230 30)" />
          <rect x="237" y="8" width="1.6" height="24" />
          <ellipse cx="318" cy="58" rx="8" ry="5.5" transform="rotate(-20 318 58)" />
          <rect x="325" y="30" width="1.6" height="30" />
          <ellipse cx="430" cy="44" rx="8" ry="5.5" transform="rotate(-20 430 44)" />
          <rect x="437" y="16" width="1.6" height="30" />
          <ellipse cx="520" cy="30" rx="8" ry="5.5" transform="rotate(-20 520 30)" />
          <rect x="527" y="8" width="1.6" height="24" />
          <ellipse cx="610" cy="58" rx="8" ry="5.5" transform="rotate(-20 610 58)" />
          <rect x="617" y="30" width="1.6" height="30" />
        </g>
      </svg>
  );

  if (floating) {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        {staff}
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none">
      {staff}
    </div>
  );
}
