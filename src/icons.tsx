/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Megaphone, Trophy, Siren, VenetianMask, Sparkles, PartyPopper, Bomb, Brush, TriangleAlert, Gift
} from 'lucide-react';

// --- CUSTOM HALLOWEEN SVG SPRITES (emoji replacements) ---
export type SpriteName =
  | 'pumpkin' | 'candy' | 'chocolate' | 'lollipop' | 'star'
  | 'wand' | 'ghost' | 'dagger' | 'fire'
  | 'witch' | 'vampire' | 'skull' | 'bat' | 'moon';

const SPRITES: Record<SpriteName, React.ReactNode> = {
  pumpkin: (
    <>
      <path d="M30 14c0-5 2-8 6-10" stroke="#3f6212" strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="18" cy="38" rx="14" ry="20" fill="#ea580c" />
      <ellipse cx="46" cy="38" rx="14" ry="20" fill="#ea580c" />
      <ellipse cx="32" cy="38" rx="14" ry="22" fill="#f97316" />
      <path d="M20 32l6-6 4 6zM34 32l6-6 4 6z" fill="#1c0a00" />
      <path d="M18 42c4 8 24 8 28 0l-5 3-4-3-5 4-5-4-4 3z" fill="#1c0a00" />
    </>
  ),
  candy: (
    <>
      <path d="M18 32L4 20v24z" fill="#f472b6" />
      <path d="M46 32l14-12v24z" fill="#f472b6" />
      <circle cx="32" cy="32" r="15" fill="#ec4899" />
      <path d="M22 22c8 4 12 14 20 20M28 18c6 6 10 16 18 20" stroke="#fdf2f8" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  chocolate: (
    <>
      <rect x="12" y="6" width="40" height="52" rx="4" fill="#78350f" />
      <path d="M12 26h40M12 42h40M32 6v52" stroke="#451a03" strokeWidth="3" />
      <path d="M12 34l40-10v34H12z" fill="#dc2626" />
      <path d="M12 40l40-10" stroke="#fde047" strokeWidth="3" />
    </>
  ),
  lollipop: (
    <>
      <rect x="29" y="34" width="6" height="28" rx="3" fill="#f5f5f4" />
      <circle cx="32" cy="24" r="20" fill="#a855f7" />
      <path d="M32 24m-4 0a4 4 0 1 1 8 0a8 8 0 1 1-16 0a12 12 0 1 1 24 0a16 16 0 1 1-32 0" stroke="#fde047" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </>
  ),
  star: (
    <path d="M32 4l8 18 20 2-15 13 5 20-18-11-18 11 5-20L4 24l20-2z" fill="#facc15" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
  ),
  wand: (
    <>
      <path d="M10 56L40 26" stroke="#b45309" strokeWidth="7" strokeLinecap="round" />
      <path d="M10 56l6-6" stroke="#e9d5ff" strokeWidth="7" strokeLinecap="round" />
      <path d="M46 6l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#fde047" />
      <circle cx="56" cy="34" r="3" fill="#f0abfc" />
      <circle cx="28" cy="10" r="2.5" fill="#f0abfc" />
    </>
  ),
  ghost: (
    <>
      <path d="M12 30a20 20 0 0 1 40 0v28l-7-6-6 6-7-6-7 6-6-6-7 6z" fill="#f8fafc" />
      <ellipse cx="25" cy="28" rx="4" ry="6" fill="#1e1b4b" />
      <ellipse cx="39" cy="28" rx="4" ry="6" fill="#1e1b4b" />
      <ellipse cx="32" cy="42" rx="4" ry="5" fill="#1e1b4b" />
    </>
  ),
  dagger: (
    <>
      <path d="M32 2l7 10v26h-14V12z" fill="#cbd5e1" />
      <path d="M32 4v34" stroke="#94a3b8" strokeWidth="2" />
      <rect x="18" y="38" width="28" height="6" rx="3" fill="#a16207" />
      <rect x="28" y="44" width="8" height="14" rx="2" fill="#7c2d12" />
      <circle cx="32" cy="60" r="3.5" fill="#dc2626" />
    </>
  ),
  fire: (
    <>
      <path d="M32 2c4 12 20 18 20 36a20 20 0 0 1-40 0c0-10 6-14 8-22 4 6 4 10 8 12 2-10 0-16 4-26z" fill="#ef4444" />
      <path d="M32 26c2 8 12 12 12 22a12 12 0 0 1-24 0c0-6 4-8 6-12 2 4 4 4 6 4 0-6-2-8 0-14z" fill="#f97316" />
      <path d="M32 42c2 4 6 6 6 10a6 6 0 0 1-12 0c0-4 4-6 6-10z" fill="#fde047" />
    </>
  ),
  witch: (
    <>
      <circle cx="32" cy="42" r="15" fill="#86efac" />
      <path d="M8 30h48" stroke="#1e1b4b" strokeWidth="5" strokeLinecap="round" />
      <path d="M18 30L34 2l2 10 10 18z" fill="#4c1d95" />
      <rect x="20" y="24" width="24" height="5" fill="#f97316" />
      <circle cx="26" cy="40" r="2.5" fill="#1e1b4b" />
      <circle cx="38" cy="40" r="2.5" fill="#1e1b4b" />
      <path d="M26 49q6 4 12 0" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  vampire: (
    <>
      <path d="M6 60l8-28h36l8 28z" fill="#7f1d1d" />
      <path d="M14 32l4 28h28l4-28z" fill="#1e1b4b" />
      <circle cx="32" cy="28" r="16" fill="#e2e8f0" />
      <path d="M16 24c4-14 28-14 32 0l-8-4-8 6-8-6z" fill="#0f172a" />
      <circle cx="26" cy="28" r="2.5" fill="#dc2626" />
      <circle cx="38" cy="28" r="2.5" fill="#dc2626" />
      <path d="M26 36h12" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 36l1.5 4 1.5-4M33 36l1.5 4 1.5-4" fill="#f8fafc" />
    </>
  ),
  skull: (
    <>
      <path d="M32 4C18 4 8 14 8 28c0 8 4 14 10 17v9h28v-9c6-3 10-9 10-17C56 14 46 4 32 4z" fill="#f1f5f9" />
      <ellipse cx="23" cy="29" rx="6" ry="7" fill="#1e1b4b" />
      <ellipse cx="41" cy="29" rx="6" ry="7" fill="#1e1b4b" />
      <path d="M32 36l-4 6h8z" fill="#1e1b4b" />
      <path d="M26 54v-6M32 54v-6M38 54v-6" stroke="#1e1b4b" strokeWidth="2.5" />
    </>
  ),
  bat: (
    <>
      <path d="M32 24c-6-10-18-12-28-6 6 2 8 8 6 14 6-4 10-2 12 4 2-4 6-6 10-6s8 2 10 6c2-6 6-8 12-4-2-6 0-12 6-14-10-6-22-4-28 6z" fill="#3b0764" />
      <path d="M26 22l2-8 4 6 4-6 2 8-6 14z" fill="#3b0764" />
      <circle cx="29" cy="24" r="1.8" fill="#fde047" />
      <circle cx="35" cy="24" r="1.8" fill="#fde047" />
    </>
  ),
  moon: (
    <path d="M40 4a28 28 0 1 0 20 44A24 24 0 0 1 40 4z" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
  ),
};

export function Sprite({ name, className = 'w-6 h-6', style }: { name: SpriteName; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" className={`inline-block shrink-0 ${className}`} style={style} aria-hidden="true">
      {SPRITES[name]}
    </svg>
  );
}

// --- LOG / NEWS ICONS ---
export type LogIconName =
  | SpriteName | 'megaphone' | 'trophy' | 'siren' | 'thief'
  | 'sparkles' | 'party' | 'bomb' | 'broom' | 'warning' | 'gift';

const LUCIDE_ICONS = {
  megaphone: { Icon: Megaphone, color: 'text-amber-300' },
  trophy: { Icon: Trophy, color: 'text-yellow-400' },
  siren: { Icon: Siren, color: 'text-red-400' },
  thief: { Icon: VenetianMask, color: 'text-purple-300' },
  sparkles: { Icon: Sparkles, color: 'text-amber-300' },
  party: { Icon: PartyPopper, color: 'text-pink-400' },
  bomb: { Icon: Bomb, color: 'text-red-400' },
  broom: { Icon: Brush, color: 'text-orange-300' },
  warning: { Icon: TriangleAlert, color: 'text-orange-400' },
  gift: { Icon: Gift, color: 'text-pink-400' },
} as const;

export function LogIcon({ name, className = 'w-4 h-4' }: { name: LogIconName; className?: string }) {
  if (name in LUCIDE_ICONS) {
    const { Icon, color } = LUCIDE_ICONS[name as keyof typeof LUCIDE_ICONS];
    return <Icon className={`inline-block shrink-0 ${color} ${className}`} aria-hidden="true" />;
  }
  return <Sprite name={name as SpriteName} className={className} />;
}
