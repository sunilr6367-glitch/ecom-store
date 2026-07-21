export function ArtisanFooterAnimation() {
  return (
    <div className="artisan-footer-art absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg
        className="absolute inset-x-0 bottom-0 h-[180px] w-full opacity-[0.05] md:h-[240px]"
        viewBox="0 0 1440 240"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0 240h1440v-55h-55l-26-58-27 58h-74l-41-109-42 109h-82l-25-42-24 42h-78l-38-81-39 81h-90l-35-98-36 98h-84l-23-39-24 39h-80l-37-91-38 91h-86l-29-63-28 63h-76l-41-117-42 117H82l-25-46-24 46H0z" />
      </svg>

      <svg
        className="absolute top-[28%] h-[110px] w-full text-brand-gold opacity-15"
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          className="artisan-footer-stitch"
          d="M0 55Q180-18 360 55t360 0t360 0t360 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="10 15"
        />
      </svg>

      <style>{`
        .artisan-footer-stitch {
          animation: artisan-footer-stitch 20s linear infinite;
        }

        @keyframes artisan-footer-stitch {
          to { stroke-dashoffset: -500; }
        }

        @media (prefers-reduced-motion: reduce) {
          .artisan-footer-stitch { animation: none; }
        }
      `}</style>
    </div>
  );
}
