const CategoryIcons: Record<string, React.FC<{ className?: string }>> = {
  smartphones: ({ className }) => (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Phone body */}
      <rect x="35" y="12" width="50" height="96" rx="10" stroke="currentColor" strokeWidth="3" />
      {/* Screen */}
      <rect x="40" y="24" width="40" height="68" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      {/* Notch */}
      <rect x="50" y="14" width="20" height="6" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      {/* Home indicator */}
      <rect x="50" y="100" width="20" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      {/* Camera dot */}
      <circle cx="60" cy="17" r="2" fill="currentColor" opacity="0.4" />
      {/* Screen content lines */}
      <line x1="46" y1="36" x2="74" y2="36" stroke="currentColor" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
      <line x1="46" y1="44" x2="66" y2="44" stroke="currentColor" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
      <rect x="46" y="52" width="28" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
    </svg>
  ),

  laptops: ({ className }) => (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Screen lid */}
      <rect x="20" y="16" width="80" height="56" rx="6" stroke="currentColor" strokeWidth="3" />
      {/* Screen inner */}
      <rect x="26" y="22" width="68" height="44" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      {/* Base / keyboard area */}
      <path d="M12 76h96l-6 20H18L12 76z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      {/* Keyboard lines */}
      <line x1="28" y1="82" x2="92" y2="82" stroke="currentColor" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <line x1="30" y1="87" x2="90" y2="87" stroke="currentColor" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <line x1="32" y1="92" x2="88" y2="92" stroke="currentColor" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      {/* Trackpad */}
      <rect x="46" y="84" width="28" height="8" rx="2" stroke="currentColor" strokeWidth="1" opacity="0.15" />
      {/* Screen content */}
      <line x1="34" y1="34" x2="62" y2="34" stroke="currentColor" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      <line x1="34" y1="42" x2="54" y2="42" stroke="currentColor" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      {/* Camera dot */}
      <circle cx="60" cy="19" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  ),

  audio: ({ className }) => (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Headband */}
      <path d="M28 60C28 38 40 20 60 20s32 18 32 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Left ear cup outer */}
      <rect x="18" y="54" width="22" height="36" rx="11" stroke="currentColor" strokeWidth="3" />
      {/* Left cushion detail */}
      <rect x="22" y="60" width="14" height="24" rx="7" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      {/* Right ear cup outer */}
      <rect x="80" y="54" width="22" height="36" rx="11" stroke="currentColor" strokeWidth="3" />
      {/* Right cushion detail */}
      <rect x="84" y="60" width="14" height="24" rx="7" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      {/* Left arm connector */}
      <line x1="29" y1="54" x2="29" y2="46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Right arm connector */}
      <line x1="91" y1="54" x2="91" y2="46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Sound waves */}
      <path d="M36 72c0-4 2-8 2-8" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
      <path d="M84 72c0-4-2-8-2-8" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
    </svg>
  ),

  wearables: ({ className }) => (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Watch band top */}
      <path d="M44 16v24h32V16" stroke="currentColor" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Watch band bottom */}
      <path d="M44 104V80h32v24" stroke="currentColor" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Watch face (circle) */}
      <circle cx="60" cy="60" r="26" stroke="currentColor" strokeWidth="3" />
      {/* Inner bezel */}
      <circle cx="60" cy="60" r="22" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      {/* Hour hand */}
      <line x1="60" y1="60" x2="60" y2="44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Minute hand */}
      <line x1="60" y1="60" x2="72" y2="54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="60" cy="60" r="2" fill="currentColor" />
      {/* Crown button */}
      <rect x="86" y="56" width="6" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      {/* Hour markers */}
      <line x1="60" y1="38" x2="60" y2="41" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <line x1="60" y1="79" x2="60" y2="82" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <line x1="38" y1="60" x2="41" y2="60" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <line x1="79" y1="60" x2="82" y2="60" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
    </svg>
  ),

  cameras: ({ className }) => (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Camera body */}
      <rect x="14" y="38" width="92" height="58" rx="8" stroke="currentColor" strokeWidth="3" />
      {/* Viewfinder bump */}
      <path d="M44 38V28h32v10" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      {/* Main lens outer ring */}
      <circle cx="60" cy="68" r="22" stroke="currentColor" strokeWidth="3" />
      {/* Lens inner ring */}
      <circle cx="60" cy="68" r="15" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      {/* Lens center */}
      <circle cx="60" cy="68" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      {/* Lens reflection */}
      <circle cx="55" cy="63" r="3" fill="currentColor" opacity="0.15" />
      {/* Flash */}
      <circle cx="88" cy="48" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      {/* Power button */}
      <rect x="22" y="44" width="10" height="5" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      {/* Shutter button */}
      <circle cx="76" cy="32" r="4" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    </svg>
  ),

  accessories: ({ className }) => (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Charger brick */}
      <rect x="12" y="56" width="32" height="40" rx="4" stroke="currentColor" strokeWidth="2.5" />
      {/* Charger prong slots */}
      <line x1="22" y1="56" x2="22" y2="48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="34" y1="56" x2="34" y2="48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* USB port on charger */}
      <rect x="22" y="84" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      {/* Cable */}
      <path d="M34 86c16 0 16 -20 32 -20" stroke="currentColor" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
      {/* USB-C connector */}
      <rect x="64" y="60" width="14" height="8" rx="3" stroke="currentColor" strokeWidth="2" />
      {/* Phone case outline */}
      <rect x="80" y="20" width="28" height="48" rx="6" stroke="currentColor" strokeWidth="2.5" />
      {/* Case camera cutout */}
      <rect x="90" y="24" width="12" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      {/* LED indicator on charger */}
      <circle cx="28" cy="74" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  ),
}

export default CategoryIcons
