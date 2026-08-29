export interface AvatarOption {
  id: string;
  name: string;
  title: string;
  emoji: string;
  accentColor: string;
  bgGradient: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: "cyber_ninja",
    name: "Cyber Ninja",
    title: "Shadow Coder",
    emoji: "🥷",
    accentColor: "#00F0FF",
    bgGradient: "linear-gradient(135deg, #00F0FF22, #0047FF44)",
  },
  {
    id: "cyber_samurai",
    name: "Cyber Samurai",
    title: "Blade of Algorithms",
    emoji: "⚔️",
    accentColor: "#FF007F",
    bgGradient: "linear-gradient(135deg, #FF007F22, #7B00FF44)",
  },
  {
    id: "neon_phantom",
    name: "Neon Phantom",
    title: "Ghost in the Heap",
    emoji: "👻",
    accentColor: "#00FF66",
    bgGradient: "linear-gradient(135deg, #00FF6622, #00B89444)",
  },
  {
    id: "glitch_hacker",
    name: "Glitch Hacker",
    title: "Matrix Breaker",
    emoji: "👾",
    accentColor: "#FFB800",
    bgGradient: "linear-gradient(135deg, #FFB80022, #FF767544)",
  },
  {
    id: "pixel_knight",
    name: "Pixel Knight",
    title: "Defender of Pointers",
    emoji: "🛡️",
    accentColor: "#A29BFE",
    bgGradient: "linear-gradient(135deg, #A29BFE22, #6C5CE744)",
  },
  {
    id: "holo_vortex",
    name: "Holo Vortex",
    title: "Quantum Strategist",
    emoji: "🌀",
    accentColor: "#00CEC9",
    bgGradient: "linear-gradient(135deg, #00CEC922, #0984E344)",
  },
  {
    id: "fire_dragon",
    name: "Fire Dragon",
    title: "Streak Pyromancer",
    emoji: "🐉",
    accentColor: "#FF3838",
    bgGradient: "linear-gradient(135deg, #FF383822, #FF9F1A44)",
  },
  {
    id: "binary_wizard",
    name: "Binary Wizard",
    title: "Bitwise Enchanter",
    emoji: "🧙‍♂️",
    accentColor: "#9B59B6",
    bgGradient: "linear-gradient(135deg, #9B59B622, #3498DB44)",
  },
  {
    id: "mecha_robot",
    name: "Mecha Titan",
    title: "Automated Executioner",
    emoji: "🤖",
    accentColor: "#34E7E4",
    bgGradient: "linear-gradient(135deg, #34E7E422, #4BCFFA44)",
  },
  {
    id: "phoenix_king",
    name: "Phoenix Sovereign",
    title: "Reborn from Recursion",
    emoji: "🦅",
    accentColor: "#FF6B6B",
    bgGradient: "linear-gradient(135deg, #FF6B6B22, #EE525344)",
  },
  {
    id: "cosmic_owl",
    name: "Cosmic Sage",
    title: "Master of Complexity",
    emoji: "🦉",
    accentColor: "#575FCF",
    bgGradient: "linear-gradient(135deg, #575FCF22, #3C40C644)",
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    title: "O(1) Accelerator",
    emoji: "⚡",
    accentColor: "#FFDD59",
    bgGradient: "linear-gradient(135deg, #FFDD5922, #FFA80144)",
  },
];

export function getAvatar(id: string): AvatarOption {
  return (
    AVATAR_OPTIONS.find((a) => a.id === id) ??
    AVATAR_OPTIONS[0]
  );
}
