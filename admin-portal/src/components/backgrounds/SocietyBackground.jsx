'use client';

import dynamic from 'next/dynamic';

const CodeRain = dynamic(() => import('./CodeRain'), { ssr: false });
const NodeNetwork = dynamic(() => import('./NodeNetwork'), { ssr: false });
const AuroraBorealis = dynamic(() => import('./AuroraBorealis'), { ssr: false });
const CircuitBoard = dynamic(() => import('./CircuitBoard'), { ssr: false });
const BlueprintGrid = dynamic(() => import('./BlueprintGrid'), { ssr: false });
const AntigravityDots = dynamic(() => import('./AntigravityDots'), { ssr: false });

const BACKGROUND_MAP = {
  code_rain: CodeRain,
  node_network: NodeNetwork,
  aurora: AuroraBorealis,
  circuit_board: CircuitBoard,
  blueprint_grid: BlueprintGrid,
};

const COLOR_MAP = {
  code_rain: '#0076D6',
  node_network: '#00629B',
  aurora: '#6B2D8B',
  circuit_board: '#E74C3C',
  blueprint_grid: '#F39C12',
};

/**
 * Renders the appropriate society-themed animated background.
 * The `customColor` prop (from bootcamp.colorTheme.primary) takes priority
 * so each bootcamp gets a unique look even within the same society.
 *
 * @param {string|string[]} society  - Society identifier or array of identifiers
 * @param {string}          customColor - Override default color (bootcamp primary)
 */
export default function SocietyBackground({ society, customColor }) {
  if (!society || (Array.isArray(society) && society.length === 0)) return null;

  // Render Antigravity effect for multiple societies
  if (Array.isArray(society) && society.length > 1) {
    return <AntigravityDots color={customColor || '#6C63FF'} />;
  }

  // Handle single society
  const singleSociety = Array.isArray(society) ? society[0] : society;

  const SOCIETY_TO_EFFECT = {
    computer_society: 'code_rain',
    student_branch: 'node_network',
    women_in_engineering: 'aurora',
    robotics: 'circuit_board',
    industrial_applications: 'blueprint_grid',
  };

  const effect = SOCIETY_TO_EFFECT[singleSociety];
  if (!effect) return null;

  const Component = BACKGROUND_MAP[effect];
  if (!Component) return null;

  return <Component color={customColor || COLOR_MAP[effect]} />;
}