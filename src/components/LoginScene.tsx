"use client";

/**
 * Decorative "welcome party" scene behind the login card: an elegant couple
 * greeting up front, a few more guests mingling in the background, plus
 * balloons and confetti scattered across the full page. Purely
 * presentational, no interactivity. Subtle idle animations are defined in
 * globals.css and disabled under prefers-reduced-motion.
 */
export function LoginScene() {
  return (
    <svg
      className="login-scene pointer-events-none absolute inset-0 h-full w-full select-none"
      viewBox="0 0 520 760"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="loginGlow" cx="50%" cy="16%" r="85%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef0fb" />
        </radialGradient>
      </defs>

      <rect width="520" height="760" fill="url(#loginGlow)" />

      {/* string-light garland */}
      <path d="M8 30 Q140 66 260 34 T512 34" fill="none" stroke="#c9cef0" strokeWidth="2" />
      <g>
        <circle cx="60" cy="45" r="3.5" fill="#f6c667" />
        <circle cx="130" cy="54" r="3.5" fill="#ec8fa4" />
        <circle cx="200" cy="45" r="3.5" fill="#5ec2a8" />
        <circle cx="290" cy="42" r="3.5" fill="#6f8ff0" />
        <circle cx="360" cy="47" r="3.5" fill="#f6c667" />
        <circle cx="440" cy="41" r="3.5" fill="#ec8fa4" />
      </g>

      {/* balloons (gently bobbing), spread across the whole page, not just the top */}
      <g className="ls-float-a">
        <ellipse cx="58" cy="78" rx="17" ry="21" fill="#ec8fa4" />
        <path d="M58 99 v18" stroke="#c9cef0" strokeWidth="1.4" />
      </g>
      <g className="ls-float-b">
        <ellipse cx="462" cy="70" rx="17" ry="21" fill="#5ec2a8" />
        <path d="M462 91 v18" stroke="#c9cef0" strokeWidth="1.4" />
      </g>
      <g className="ls-float-c">
        <ellipse cx="436" cy="104" rx="12" ry="15" fill="#f6c667" />
        <path d="M436 119 v13" stroke="#c9cef0" strokeWidth="1.4" />
      </g>
      <g className="ls-float-b">
        <ellipse cx="40" cy="480" rx="14" ry="18" fill="#6f8ff0" opacity="0.8" />
        <path d="M40 498 v16" stroke="#c9cef0" strokeWidth="1.4" />
      </g>
      <g className="ls-float-a">
        <ellipse cx="480" cy="560" rx="15" ry="19" fill="#f6c667" opacity="0.8" />
        <path d="M480 579 v16" stroke="#c9cef0" strokeWidth="1.4" />
      </g>
      <g className="ls-float-c">
        <ellipse cx="30" cy="680" rx="13" ry="16" fill="#ec8fa4" opacity="0.75" />
        <path d="M30 696 v14" stroke="#c9cef0" strokeWidth="1.4" />
      </g>

      {/* confetti scattered down the whole page */}
      <g className="ls-confetti">
        <rect x="120" y="58" width="6" height="6" rx="1" fill="#6f8ff0" transform="rotate(20 123 61)" />
        <rect x="384" y="50" width="6" height="6" rx="1" fill="#ec8fa4" transform="rotate(-25 387 53)" />
        <circle cx="250" cy="38" r="3.2" fill="#f6c667" />
        <circle cx="300" cy="64" r="3" fill="#9b6db3" />
        <circle cx="196" cy="52" r="3" fill="#5ec2a8" />
        <rect x="330" y="70" width="5" height="5" rx="1" fill="#5ec2a8" transform="rotate(35 332 72)" />
        <rect x="70" y="340" width="6" height="6" rx="1" fill="#f6c667" transform="rotate(-15 73 343)" />
        <circle cx="450" cy="380" r="3.2" fill="#ec8fa4" />
        <rect x="440" y="440" width="5" height="5" rx="1" fill="#6f8ff0" transform="rotate(25 442 442)" />
        <circle cx="90" cy="560" r="3" fill="#5ec2a8" />
        <rect x="380" y="620" width="6" height="6" rx="1" fill="#9b6db3" transform="rotate(18 383 623)" />
        <circle cx="200" cy="680" r="3.2" fill="#f6c667" />
        <rect x="120" y="700" width="5" height="5" rx="1" fill="#ec8fa4" transform="rotate(-20 122 702)" />
      </g>

      {/* ===== background guests (smaller, muted, mingling) ===== */}
      <g opacity="0.9">
        {/* bg guest 1 */}
        <g transform="translate(170 150) scale(0.72)">
          <ellipse cx="0" cy="74" rx="30" ry="36" fill="#9b6db3" />
          <circle cx="0" cy="30" r="21" fill="#e8b48c" />
          <path d="M-21 28 a21 20 0 0 1 42 0 q-6 -22 -42 -3Z" fill="#43301f" />
          <circle cx="-7" cy="30" r="2.2" fill="#2a1f19" />
          <circle cx="7" cy="30" r="2.2" fill="#2a1f19" />
          <path d="M-7 38 q7 5 14 0" stroke="#9c6a45" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
        {/* bg guest 2 */}
        <g transform="translate(350 150) scale(0.72)">
          <ellipse cx="0" cy="74" rx="30" ry="36" fill="#5ec2a8" />
          <circle cx="0" cy="30" r="21" fill="#c98a5e" />
          <path d="M-21 26 q21 -20 42 0 l0 -5 q-21 -14 -42 0Z" fill="#221812" />
          <circle cx="-7" cy="30" r="2.2" fill="#221812" />
          <circle cx="7" cy="30" r="2.2" fill="#221812" />
          <path d="M-7 38 q7 5 14 0" stroke="#7a4a30" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
        {/* bg guest 3 (center-back, peeking) */}
        <g transform="translate(260 140) scale(0.64)">
          <ellipse cx="0" cy="74" rx="30" ry="36" fill="#f6c667" />
          <circle cx="0" cy="30" r="21" fill="#f3c9a8" />
          <path d="M-21 30 a21 22 0 0 1 42 0 q-4 -24 -42 -3Z" fill="#5b3b2e" />
          <circle cx="-7" cy="30" r="2.2" fill="#3a2a22" />
          <circle cx="7" cy="30" r="2.2" fill="#3a2a22" />
          <path d="M-7 38 q7 5 14 0" stroke="#b5654d" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
      </g>

      {/* ===== front-left character: waving ===== */}
      <g transform="translate(92 158)">
        <ellipse cx="0" cy="80" rx="34" ry="42" fill="#ec8fa4" />
        {/* waving arm */}
        <g className="ls-wave">
          <path d="M28 46 q26 -10 30 -34" stroke="#ec8fa4" strokeWidth="13" fill="none" strokeLinecap="round" />
          <circle cx="58" cy="10" r="8" fill="#f3c9a8" />
        </g>
        <circle cx="0" cy="30" r="24" fill="#f3c9a8" />
        <path d="M-24 28 a24 22 0 0 1 48 0 q-4 -26 -48 -4Z" fill="#e0a63c" />
        <g className="ls-blink">
          <circle cx="-8" cy="30" r="2.6" fill="#3a2a22" />
          <circle cx="8" cy="30" r="2.6" fill="#3a2a22" />
        </g>
        <path d="M-8 39 q8 7 16 0" stroke="#b5654d" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <circle cx="-12" cy="37" r="4" fill="#f4a6ba" opacity="0.6" />
        <circle cx="12" cy="37" r="4" fill="#f4a6ba" opacity="0.6" />
      </g>

      {/* ===== front-right character: bow-tie suit, toasting ===== */}
      <g transform="translate(428 158)">
        <ellipse cx="0" cy="80" rx="34" ry="42" fill="#3f4a63" />
        <path d="M-8 46 l8 -15 l8 15Z" fill="#ffffff" />
        <path d="M-6 42 l-4 -3 l0 6Z M6 42 l4 -3 l0 6Z" fill="#ec8fa4" />
        <circle cx="0" cy="30" r="24" fill="#c98a5e" />
        <path d="M-24 26 q24 -22 48 0 l0 -5 q-24 -16 -48 0Z" fill="#221812" />
        <g className="ls-blink" style={{ animationDelay: "1.4s" }}>
          <circle cx="-8" cy="30" r="2.6" fill="#221812" />
          <circle cx="8" cy="30" r="2.6" fill="#221812" />
        </g>
        <path d="M-8 39 q8 7 16 0" stroke="#7a4a30" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <circle cx="-12" cy="38" r="4" fill="#e39a6f" opacity="0.5" />
        <circle cx="12" cy="38" r="4" fill="#e39a6f" opacity="0.5" />
        {/* toasting glass with a rising bubble */}
        <g className="ls-toast">
          <rect x="-31.4" y="20" width="2.8" height="14" fill="#d7dbe6" />
          <path d="M-37 8 h14 l-4 12 h-6Z" fill="#f6c667" opacity="0.9" />
          <circle className="ls-bubble" cx="-31" cy="14" r="1.2" fill="#ffffff" />
        </g>
      </g>

      {/* soft floor beneath the front characters */}
      <ellipse cx="260" cy="292" rx="235" ry="16" fill="#e6e9f7" />

      {/* ===== lower-page guests, seated further down the page ===== */}
      <g opacity="0.85">
        <g transform="translate(70 560) scale(0.6)">
          <ellipse cx="0" cy="74" rx="30" ry="36" fill="#6f8ff0" />
          <circle cx="0" cy="30" r="21" fill="#f3c9a8" />
          <path d="M-21 28 a21 20 0 0 1 42 0 q-6 -22 -42 -3Z" fill="#5b3b2e" />
          <circle cx="-7" cy="30" r="2.2" fill="#2a1f19" />
          <circle cx="7" cy="30" r="2.2" fill="#2a1f19" />
          <path d="M-7 38 q7 5 14 0" stroke="#9c6a45" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(452 600) scale(0.6)">
          <ellipse cx="0" cy="74" rx="30" ry="36" fill="#ec8fa4" />
          <circle cx="0" cy="30" r="21" fill="#c98a5e" />
          <path d="M-21 26 q21 -20 42 0 l0 -5 q-21 -14 -42 0Z" fill="#221812" />
          <circle cx="-7" cy="30" r="2.2" fill="#221812" />
          <circle cx="7" cy="30" r="2.2" fill="#221812" />
          <path d="M-7 38 q7 5 14 0" stroke="#7a4a30" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(60 700) scale(0.52)">
          <ellipse cx="0" cy="74" rx="30" ry="36" fill="#f6c667" />
          <circle cx="0" cy="30" r="21" fill="#e8b48c" />
          <path d="M-21 30 a21 22 0 0 1 42 0 q-4 -24 -42 -3Z" fill="#43301f" />
          <circle cx="-7" cy="30" r="2.2" fill="#3a2a22" />
          <circle cx="7" cy="30" r="2.2" fill="#3a2a22" />
          <path d="M-7 38 q7 5 14 0" stroke="#b5654d" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(460 720) scale(0.52)">
          <ellipse cx="0" cy="74" rx="30" ry="36" fill="#5ec2a8" />
          <circle cx="0" cy="30" r="21" fill="#f3c9a8" />
          <path d="M-21 28 a21 20 0 0 1 42 0 q-6 -22 -42 -3Z" fill="#5b3b2e" />
          <circle cx="-7" cy="30" r="2.2" fill="#2a1f19" />
          <circle cx="7" cy="30" r="2.2" fill="#2a1f19" />
          <path d="M-7 38 q7 5 14 0" stroke="#9c6a45" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
