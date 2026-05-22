/**
 * IEEE Society Definitions
 * Each society has a unique identity that shapes the bootcamp's visual design.
 */
import React from 'react';
import { Laptop, GraduationCap, Code2, Bot, Settings } from 'lucide-react';

export const SOCIETIES = {
  computer_society: {
    id: 'computer_society',
    name: 'IEEE Computer Society',
    shortName: 'Computer Society',
    description: 'Advancing the theory and practice of computer science and engineering',
    icon: <Laptop size={20} />,
    backgroundEffect: 'code_rain',
    colors: {
      primary: '#0076D6',
      secondary: '#004A8F',
      accent: '#00D4FF',
      gradient: 'linear-gradient(135deg, #0076D6 0%, #00D4FF 50%, #004A8F 100%)',
      glowColor: 'rgba(0, 118, 214, 0.3)',
      backgroundTint: 'rgba(0, 118, 214, 0.05)',
    },
    logo: '/societies/cs-logo.svg',
  },
  student_branch: {
    id: 'student_branch',
    name: 'IEEE Student Branch',
    shortName: 'Student Branch',
    description: 'Empowering student innovation and professional growth',
    icon: <GraduationCap size={20} />,
    backgroundEffect: 'node_network',
    colors: {
      primary: '#00629B',
      secondary: '#003D61',
      accent: '#4ECDC4',
      gradient: 'linear-gradient(135deg, #00629B 0%, #4ECDC4 50%, #003D61 100%)',
      glowColor: 'rgba(0, 98, 155, 0.3)',
      backgroundTint: 'rgba(0, 98, 155, 0.05)',
    },
    logo: '/societies/sb-logo.svg',
  },
  women_in_engineering: {
    id: 'women_in_engineering',
    name: 'IEEE Women In Engineering',
    shortName: 'Women In Engineering',
    description: 'Inspiring, engaging, and advancing women in technology',
    icon: <Code2 size={20} />,
    backgroundEffect: 'aurora',
    colors: {
      primary: '#6B2D8B',
      secondary: '#3D1952',
      accent: '#E040FB',
      gradient: 'linear-gradient(135deg, #6B2D8B 0%, #E040FB 50%, #3D1952 100%)',
      glowColor: 'rgba(107, 45, 139, 0.3)',
      backgroundTint: 'rgba(107, 45, 139, 0.05)',
    },
    logo: '/societies/wie-logo.svg',
  },
  robotics: {
    id: 'robotics',
    name: 'IEEE Robotics & Automation Society',
    shortName: 'Robotics & Automation',
    description: 'Pioneering robotics and intelligent automation',
    icon: <Bot size={20} />,
    backgroundEffect: 'circuit_board',
    colors: {
      primary: '#E74C3C',
      secondary: '#922B21',
      accent: '#FF7675',
      gradient: 'linear-gradient(135deg, #E74C3C 0%, #FF7675 50%, #922B21 100%)',
      glowColor: 'rgba(231, 76, 60, 0.3)',
      backgroundTint: 'rgba(231, 76, 60, 0.05)',
    },
    logo: '/societies/ras-logo.svg',
  },
  industrial_applications: {
    id: 'industrial_applications',
    name: 'IEEE Industrial Applications Society',
    shortName: 'Industrial Applications',
    description: 'Advancing the theory and practice of industrial and commercial systems',
    icon: <Settings size={20} />,
    backgroundEffect: 'blueprint_grid',
    colors: {
      primary: '#F39C12',
      secondary: '#B7770D',
      accent: '#FFEAA7',
      gradient: 'linear-gradient(135deg, #F39C12 0%, #FFEAA7 50%, #B7770D 100%)',
      glowColor: 'rgba(243, 156, 18, 0.3)',
      backgroundTint: 'rgba(243, 156, 18, 0.05)',
    },
    logo: '/societies/ias-logo.svg',
  },
};

export const SOCIETY_LIST = Object.values(SOCIETIES);

export const normalizeSocietyIds = (society) => {
  if (Array.isArray(society)) return society.filter(Boolean);
  if (typeof society === 'string' && society.trim()) return [society];
  return [];
};

export const getPrimarySocietyId = (society) => normalizeSocietyIds(society)[0] || 'student_branch';

export const getSociety = (id) => SOCIETIES[id] || SOCIETIES.student_branch;

export const getSocieties = (society) => normalizeSocietyIds(society).map(getSociety);

export const getSocietyLabel = (society) => {
  const names = getSocieties(society).map(item => item.shortName || item.name);
  return names.length > 0 ? names.join(', ') : 'IEEE Bootcamp';
};
