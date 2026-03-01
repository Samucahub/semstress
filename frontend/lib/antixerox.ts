// Shared utility for tracking AntiXerox vulnerability discoveries

const STORAGE_KEY = 'antixerox.found';

export type MemberId = 'rafa' | 'samu' | 'ze' | 'rodri';

export type MemberInfo = {
  id: MemberId;
  name: string;
  alias: string;
  role: string;
  github: string;
  color: string;
  colorHex: string;
  vulnNumber: number;
  vulnType: string;
  image: string;
};

export const MEMBERS: Record<MemberId, MemberInfo> = {
  rafa: {
    id: 'rafa',
    name: 'Rafa',
    alias: '0xadamastor',
    role: 'Cibersegurança',
    github: 'https://github.com/0xadamastor',
    color: 'cyan',
    colorHex: '#06b6d4',
    vulnNumber: 1,
    vulnType: 'Weak Credentials',
    image: '/assets/oxadamastor.png',
  },
  samu: {
    id: 'samu',
    name: 'Samu',
    alias: 'TheArchitect',
    role: "Programador de 'cenas'",
    github: 'https://github.com/Samucahub',
    color: 'orange',
    colorHex: '#f97316',
    vulnNumber: 2,
    vulnType: 'XSS Injection',
    image: '/assets/TheArchitect.jpeg',
  },
  ze: {
    id: 'ze',
    name: 'Zé',
    alias: 'ManWithThatHat',
    role: 'Designer',
    github: 'https://github.com/ManWithThatHat',
    color: 'white',
    colorHex: '#ffffff',
    vulnNumber: 4,
    vulnType: 'Source Inspection',
    image: '/assets/manwiththathat.png',
  },
  rodri: {
    id: 'rodri',
    name: 'Rodri',
    alias: 'Devilboy',
    role: 'Team Leader',
    github: 'https://github.com/RodrigoCybersecurity',
    color: 'red',
    colorHex: '#ef4444',
    vulnNumber: 3,
    vulnType: 'SQL Injection',
    image: '/assets/devilboy.png',
  },
};

export function getFoundMembers(): MemberId[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MemberId[];
  } catch {
    return [];
  }
}

export function markMemberFound(id: MemberId): void {
  if (typeof window === 'undefined') return;
  const found = getFoundMembers();
  if (!found.includes(id)) {
    found.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
  }
}

export function isMemberFound(id: MemberId): boolean {
  return getFoundMembers().includes(id);
}

export function getFoundCount(): number {
  return getFoundMembers().length;
}

// SQL injection patterns to detect
export const SQL_INJECTION_PATTERNS = [
  "' OR 1=1",
  "' OR '1'='1",
  "'; DROP TABLE",
  "' OR 1=1 --",
  "' OR 1=1#",
  "1' OR '1'='1",
  "' UNION SELECT",
  "'; DELETE FROM",
  "' OR ''='",
];

export function detectSQLInjection(input: string): boolean {
  const upper = input.toUpperCase();
  return SQL_INJECTION_PATTERNS.some((p) => upper.includes(p.toUpperCase()));
}
