
export type TechStyle = { bg: string; text: string };

const normalizeTech = (t?: string) =>
  (t || '')
    .toLowerCase()
    .trim()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');

const TECH_STYLES: Record<string, TechStyle> = {};

const add = (names: string[], bg: string, text: string) => {
  names.forEach((n) => (TECH_STYLES[normalizeTech(n)] = { bg, text }));
};

// === CLOUD ===
add(['aws', 'amazon web services', 's3', 'lambda'], '#e3f2fd', '#1e88e5');
add(['gcp', 'google cloud', 'bigquery', 'cloud run'], '#e8f5e9', '#2e7d32');
add(['azure', 'microsoft azure'], '#e3f2fd', '#1565c0');
add(['firebase'], '#fff3e0', '#f57c00');
add(['vercel'], '#eeeeee', '#111111');
add(['netlify'], '#e8f5e9', '#228B22');
add(['supabase'], '#e0f2f1', '#00695c');
add(['railway', 'render', 'digitalocean'], '#ede7f6', '#6a1b9a');

// === BACK ===
add(['node', 'nodejs (express)', 'nodejs', 'express'], '#e8f5e9', '#2e7d32');
add(['nestjs'], '#ffebee', '#c62828');
add(['spring', 'spring boot'], '#e8f5e9', '#388e3c');
add(['java'], '#e3f2fd', '#1565c0');
add(['kotlin', 'ktor'], '#e3f2fd', '#1e88e5');
add(['python', 'django', 'flask', 'fastapi'], '#fffde7', '#f9a825');
add(['dotnet', 'aspnet', 'c#'], '#ede7f6', '#6a1b9a');
add(['php', 'laravel'], '#f3e5f5', '#7b1fa2');
add(['go', 'golang'], '#e0f2f1', '#00695c');
add(['rust'], '#fff3e0', '#e65100');

// === FRONT ===
add(['react', 'reactjs'], '#e3f2fd', '#1976d2');
add(['next', 'nextjs'], '#c3f7f1ff', '#0e8d9eff');
add(['angular'], '#ffebee', '#c62828');
add(['vue', 'vuejs'], '#e8f5e9', '#2e7d32');
add(['svelte'], '#fff3e0', '#ef6c00');
add(['astro'], '#ede7f6', '#5e35b1');
add(['tailwind', 'tailwindcss'], '#e0f2f1', '#00695c');
add(['bootstrap'], '#ede7f6', '#6f42c1');
add(['flutter'], '#e3f2fd', '#0288d1');
add(['react native', 'rn'], '#e0f2f1', '#00796b');

// === DATABASE / ETC ===
add(['postgres', 'postgresql'], '#e3f2fd', '#1976d2');
add(['mysql', 'mariadb'], '#fff3e0', '#f57c00');
add(['mongodb'], '#e8f5e9', '#2e7d32');
add(['redis'], '#ffebee', '#c62828');
add(['kafka'], '#f3e5f5', '#7b1fa2');

// === DEFAULTS ===
const DEFAULT_BG = '#f5f7fb';
const DEFAULT_TEXT = '#374151';

export const getTechColor = (tech: string) => {
  const key = normalizeTech(tech);
  return TECH_STYLES[key]?.bg ?? DEFAULT_BG;
};

export const getTechTextColor = (tech: string) => {
  const key = normalizeTech(tech);
  return TECH_STYLES[key]?.text ?? DEFAULT_TEXT;
}