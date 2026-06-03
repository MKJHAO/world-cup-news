// 使用 flagcdn.com 提供的高质量国旗 SVG (支持2022+2026全部球队)
const COUNTRY_CODES = {
  'Argentina': 'ar', 'Australia': 'au', 'Belgium': 'be', 'Brazil': 'br',
  'Cameroon': 'cm', 'Canada': 'ca', 'Costa Rica': 'cr', 'Croatia': 'hr',
  'Denmark': 'dk', 'Ecuador': 'ec', 'England': 'gb-eng', 'France': 'fr',
  'Germany': 'de', 'Ghana': 'gh', 'Iran': 'ir', 'Japan': 'jp',
  'Mexico': 'mx', 'Morocco': 'ma', 'Netherlands': 'nl', 'Poland': 'pl',
  'Portugal': 'pt', 'Qatar': 'qa', 'Saudi Arabia': 'sa', 'Senegal': 'sn',
  'Serbia': 'rs', 'South Korea': 'kr', 'Spain': 'es', 'Switzerland': 'ch',
  'Tunisia': 'tn', 'Uruguay': 'uy', 'USA': 'us', 'Wales': 'gb-wls',
  // 2026 新增球队
  'South Africa': 'za', 'Czech Republic': 'cz', 'Bosnia & Herzegovina': 'ba',
  'Haiti': 'ht', 'Scotland': 'gb-sct', 'Paraguay': 'py', 'Turkey': 'tr',
  'Curaçao': 'cw', 'Ivory Coast': 'ci', 'Sweden': 'se', 'Egypt': 'eg',
  'New Zealand': 'nz', 'Cape Verde': 'cv', 'Iraq': 'iq', 'Norway': 'no',
  'Algeria': 'dz', 'Austria': 'at', 'Jordan': 'jo', 'DR Congo': 'cd',
  'Uzbekistan': 'uz', 'Colombia': 'co', 'Panama': 'pa', 'Italy': 'it',
  'Chile': 'cl', 'Nigeria': 'ng', 'Peru': 'pe', 'Venezuela': 've',
  'Russia': 'ru', 'Greece': 'gr', 'Ukraine': 'ua', 'Finland': 'fi',
  'Ireland': 'ie', 'Slovakia': 'sk', 'Hungary': 'hu', 'Romania': 'ro'
};

export function getFlagUrl(teamName, size = 'w80') {
  const code = COUNTRY_CODES[teamName];
  if (!code) return null;
  return `https://flagcdn.com/${size}/${code}.png`;
}

export default function FlagImage({ teamName, size = 'sm' }) {
  const sizes = { sm: 'w80', md: 'w160', lg: 'w320' };
  const dims = { sm: 'w-6 h-4', md: 'w-10 h-7', lg: 'w-14 h-10' };
  const url = getFlagUrl(teamName, sizes[size]);

  if (!url) {
    return <span className="text-lg">🏳️</span>;
  }

  return (
    <img
      src={url}
      alt={teamName}
      className={`${dims[size]} object-cover rounded shadow-md inline-block`}
      style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
      loading="lazy"
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
}

export function FlagPair({ homeTeam, awayTeam, size = 'sm' }) {
  return (
    <div className="flex items-center gap-0.5">
      <FlagImage teamName={homeTeam} size={size} />
      <FlagImage teamName={awayTeam} size={size} />
    </div>
  );
}
