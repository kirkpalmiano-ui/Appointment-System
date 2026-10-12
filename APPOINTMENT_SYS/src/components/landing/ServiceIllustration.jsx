import Box from '@mui/material/Box';

// Original flat illustrations for the services grid. Each sits on a soft "ground" shadow.
// The service name picks one by keyword; anything unknown gets the stethoscope.

const C = {
  ground: '#eef0f7',
  purple: '#6d5dfc',
  indigo: '#4f46e5',
  lavender: '#e0e7ff',
  pink: '#f472b6',
  pinkSoft: '#fbcfe8',
  teal: '#2dd4bf',
  tealDark: '#0f9488',
  yellow: '#facc15',
  navy: '#1e3a5f',
  gray: '#cbd5e1',
  white: '#ffffff',
};

const Ground = () => <ellipse cx="100" cy="146" rx="62" ry="9" fill={C.ground} />;

function Stethoscope() {
  return (
    <>
      <Ground />
      {/* ear tubes */}
      <path d="M70 22 C66 48 70 70 90 78" fill="none" stroke={C.gray} strokeWidth="7" strokeLinecap="round" />
      <path d="M112 22 C116 48 112 70 92 78" fill="none" stroke={C.gray} strokeWidth="7" strokeLinecap="round" />
      <circle cx="70" cy="18" r="7" fill={C.pink} />
      <circle cx="112" cy="18" r="7" fill={C.pink} />
      {/* main tube down and round to the chest piece */}
      <path d="M91 78 L91 112 C91 136 128 136 128 110 L128 92" fill="none" stroke={C.purple} strokeWidth="9" strokeLinecap="round" />
      <circle cx="128" cy="82" r="15" fill={C.lavender} stroke={C.indigo} strokeWidth="6" />
      <circle cx="128" cy="82" r="5" fill={C.indigo} />
    </>
  );
}

function Clipboard() {
  return (
    <>
      <Ground />
      <rect x="56" y="20" width="88" height="118" rx="12" fill={C.tealDark} />
      <rect x="64" y="32" width="72" height="98" rx="6" fill={C.white} />
      <rect x="80" y="12" width="40" height="18" rx="6" fill={C.yellow} />
      <rect x="74" y="98" width="52" height="6" rx="3" fill={C.gray} />
      <rect x="74" y="112" width="36" height="6" rx="3" fill={C.gray} />
      {/* heart with a check */}
      <path
        d="M100 88 C78 74 72 58 84 50 C92 45 98 50 100 55 C102 50 108 45 116 50 C128 58 122 74 100 88 Z"
        fill={C.pink}
      />
      <path d="M90 65 L97 72 L111 58" fill="none" stroke={C.white} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function CalendarRepeat() {
  return (
    <>
      <Ground />
      <rect x="40" y="30" width="96" height="100" rx="12" fill={C.white} stroke={C.gray} strokeWidth="3" />
      <path d="M40 42 a12 12 0 0 1 12 -12 h72 a12 12 0 0 1 12 12 v14 h-96 z" fill={C.pink} />
      <rect x="60" y="20" width="8" height="20" rx="4" fill={C.navy} />
      <rect x="108" y="20" width="8" height="20" rx="4" fill={C.navy} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect key={`${r}-${c}`} x={52 + c * 20} y={68 + r * 18} width="12" height="10" rx="3" fill={r === 1 && c === 1 ? C.indigo : C.lavender} />
        ))
      )}
      {/* circular "again" arrow badge */}
      <circle cx="140" cy="112" r="28" fill={C.teal} />
      <path d="M127 112 a13 13 0 1 0 5 -10" fill="none" stroke={C.white} strokeWidth="5" strokeLinecap="round" />
      <path d="M126 96 L132 103 L124 107 Z" fill={C.white} />
    </>
  );
}

function SpeechBubbles() {
  return (
    <>
      <Ground />
      <path d="M36 34 h80 a14 14 0 0 1 14 14 v36 a14 14 0 0 1 -14 14 h-50 l-18 16 v-16 h-12 a14 14 0 0 1 -14 -14 v-36 a14 14 0 0 1 14 -14 z" fill={C.purple} />
      <circle cx="56" cy="66" r="6" fill={C.white} />
      <circle cx="76" cy="66" r="6" fill={C.white} />
      <circle cx="96" cy="66" r="6" fill={C.white} />
      <path d="M96 76 h56 a12 12 0 0 1 12 12 v28 a12 12 0 0 1 -12 12 h-4 v14 l-16 -14 h-36 a12 12 0 0 1 -12 -12 v-28 a12 12 0 0 1 12 -12 z" fill={C.teal} />
      <path
        d="M124 116 C110 107 106 97 114 92 C119 89 123 92 124 95 C125 92 129 89 134 92 C142 97 138 107 124 116 Z"
        fill={C.white}
      />
    </>
  );
}

function PulseMonitor() {
  return (
    <>
      <Ground />
      <rect x="34" y="28" width="132" height="92" rx="16" fill={C.navy} />
      <rect x="46" y="40" width="108" height="68" rx="8" fill="#0b2540" />
      <path d="M50 78 h24 l8 -22 l12 40 l10 -30 l8 12 h34" fill="none" stroke={C.teal} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="88" y="120" width="24" height="14" fill={C.gray} />
      <rect x="70" y="132" width="60" height="8" rx="4" fill={C.gray} />
      <circle cx="150" cy="34" r="16" fill={C.yellow} />
      <path d="M150 25 v10 l6 4" fill="none" stroke={C.navy} strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

// ---------- "How it works" steps ----------

function NewAccount() {
  return (
    <>
      <Ground />
      {/* phone */}
      <rect x="58" y="14" width="84" height="128" rx="14" fill={C.navy} />
      <rect x="65" y="24" width="70" height="108" rx="8" fill={C.white} />
      <rect x="88" y="17" width="24" height="4" rx="2" fill="#0b2540" />
      {/* profile on screen */}
      <circle cx="100" cy="56" r="14" fill={C.lavender} />
      <circle cx="100" cy="52" r="6" fill={C.purple} />
      <path d="M90 66 a10 9 0 0 1 20 0" fill={C.purple} />
      <rect x="76" y="80" width="48" height="7" rx="3.5" fill={C.gray} />
      <rect x="76" y="93" width="48" height="7" rx="3.5" fill={C.gray} />
      <rect x="76" y="108" width="48" height="12" rx="6" fill={C.indigo} />
      {/* plus badge */}
      <circle cx="144" cy="38" r="20" fill={C.teal} />
      <path d="M144 29 v18 M135 38 h18" stroke={C.white} strokeWidth="5" strokeLinecap="round" />
    </>
  );
}

function ChooseOption() {
  return (
    <>
      <Ground />
      {[0, 1, 2].map((i) => {
        const y = 22 + i * 38;
        const picked = i === 1;
        return (
          <g key={i}>
            <rect
              x={picked ? 34 : 44}
              y={y}
              width={picked ? 132 : 112}
              height="30"
              rx="10"
              fill={picked ? C.white : '#f8fafc'}
              stroke={picked ? C.indigo : C.gray}
              strokeWidth={picked ? 3 : 2}
            />
            <circle cx={picked ? 52 : 60} cy={y + 15} r="7" fill={picked ? C.indigo : C.white} stroke={picked ? C.indigo : C.gray} strokeWidth="2" />
            {picked && <path d={`M48 ${y + 15} l3 3 l6 -6`} fill="none" stroke={C.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x={picked ? 66 : 74} y={y + 11} width={picked ? 60 : 50} height="8" rx="4" fill={picked ? C.navy : C.gray} />
            <rect x={picked ? 136 : 134} y={y + 11} width="18" height="8" rx="4" fill={picked ? C.pink : C.gray} />
          </g>
        );
      })}
      {/* pointer tapping the picked row */}
      <path d="M150 88 l0 30 l8 -7 l6 13 l6 -3 l-6 -12 l11 -1 z" fill={C.yellow} stroke={C.navy} strokeWidth="2.5" strokeLinejoin="round" />
    </>
  );
}

function PickTime() {
  return (
    <>
      <Ground />
      {/* calendar behind */}
      <rect x="36" y="34" width="84" height="88" rx="12" fill={C.white} stroke={C.gray} strokeWidth="3" />
      <path d="M36 46 a12 12 0 0 1 12 -12 h60 a12 12 0 0 1 12 12 v12 h-84 z" fill={C.purple} />
      {[0, 1].map((r) =>
        [0, 1, 2].map((c) => (
          <rect key={`${r}-${c}`} x={48 + c * 22} y={70 + r * 20} width="14" height="11" rx="3" fill={C.lavender} />
        ))
      )}
      {/* clock in front */}
      <circle cx="132" cy="96" r="38" fill={C.pink} />
      <circle cx="132" cy="96" r="29" fill={C.white} />
      <path d="M132 76 v20 l13 9" fill="none" stroke={C.navy} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="132" cy="96" r="4" fill={C.navy} />
      {/* small check badge */}
      <circle cx="160" cy="62" r="13" fill={C.teal} />
      <path d="M154 62 l4 4 l8 -8" fill="none" stroke={C.white} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

const STEP_ART = { account: NewAccount, choose: ChooseOption, time: PickTime };

export function StepIllustration({ name, size = 150 }) {
  const Art = STEP_ART[name];
  return (
    <Box component="svg" viewBox="0 0 200 160" aria-hidden sx={{ width: size, height: size * 0.8, display: 'block' }}>
      <Art />
    </Box>
  );
}

const ILLUSTRATIONS = [
  [/check|exam|physical/i, Clipboard],
  [/follow|review/i, CalendarRepeat],
  [/counsel|therapy|mental/i, SpeechBubbles],
  [/assess|screen|test|quick/i, PulseMonitor],
];

export default function ServiceIllustration({ name, size = 150 }) {
  const Art = ILLUSTRATIONS.find(([pattern]) => pattern.test(name))?.[1] ?? Stethoscope;
  return (
    <Box component="svg" viewBox="0 0 200 160" aria-hidden sx={{ width: size, height: size * 0.8, display: 'block' }}>
      <Art />
    </Box>
  );
}
