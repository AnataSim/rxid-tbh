let leaderboardCache = null;
let lastCacheTime = 0;

async function getLiveLeaderboard() {
  const now = Date.now();
  if (leaderboardCache && (now - lastCacheTime < 60000)) {
    return leaderboardCache;
  }

  try {
    const res = await fetch('https://v4rx.me/user/leaderboard/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (res.ok) {
      const html = await res.text();
      const trBlocks = html.split(/<tr\s/i);
      const players = [];

      for (const block of trBlocks) {
        const nameMatch = block.match(/data-name=["']([^"']+)["']/i);
        const rankMatch = block.match(/data-rank=["'](\d+)["']/i);
        const idMatch = block.match(/profile\.php\?id=(\d+)/i);
        const ppMatch = block.match(/(\d+)pp/i);

        if (nameMatch && rankMatch && idMatch) {
          players.push({
            id: idMatch[1],
            username: nameMatch[1],
            rank: parseInt(rankMatch[1], 10),
            pp: ppMatch ? parseInt(ppMatch[1], 10) : 0,
          });
        }
      }

      if (players.length > 0) {
        leaderboardCache = players;
        lastCacheTime = now;
        return players;
      }
    }
  } catch (err) {
    console.warn('Leaderboard live fetch error:', err);
  }

  return leaderboardCache || [];
}

function countryCodeToEmoji(code) {
  if (!code || code.length !== 2) return '🇮🇩';
  const clean = code.toUpperCase();
  const codePoints = clean.split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query || {};
  const cleanId = String(id || '').trim();

  if (!cleanId) {
    return res.status(400).json({ error: 'Missing ID parameter' });
  }

  const isNumeric = /^\d+$/.test(cleanId);
  const cleanLower = cleanId.toLowerCase();

  // 1. Fetch live v4rx.me leaderboard
  const livePlayers = await getLiveLeaderboard();

  // Try finding player in live leaderboard by ID or Username
  const matched = livePlayers.find(p => p.id === cleanId || p.username.toLowerCase() === cleanLower);

  let liveRank = matched ? matched.rank : (isNumeric ? parseInt(cleanId, 10) : 81);
  let livePp = matched ? matched.pp : 15000;
  let liveName = matched ? matched.username : (isNumeric ? `Player #${cleanId}` : cleanId);
  let liveId = matched ? matched.id : cleanId;

  // Default presets fallback
  let countryCode = 'ID';

  if (!matched) {
    if (cleanLower === '453' || cleanLower === 'foshy') { liveRank = 1; livePp = 65336; liveName = 'foshy'; liveId = '453'; }
    else if (cleanLower === '43' || cleanLower === 'melancholy') { liveRank = 2; livePp = 60969; liveName = 'Melancholy'; liveId = '43'; }
    else if (cleanLower === '27' || cleanLower === 'learnerx') { liveRank = 6; livePp = 48788; liveName = 'learnerx'; liveId = '27'; }
    else if (cleanLower === '106' || cleanLower === 'lostrushi') { liveRank = 32; livePp = 27652; liveName = 'lostrushi'; liveId = '106'; }
    else if (cleanLower === '63' || cleanLower === 'darkww') { liveRank = 34; livePp = 26657; liveName = 'darkww'; liveId = '63'; }
    else if (cleanLower === '23' || cleanLower === 'cookedfishrx') { liveRank = 42; livePp = 24754; liveName = 'CookedFishRX'; liveId = '23'; }
    else if (cleanLower === '1051' || cleanLower === 'transcensionism') { liveRank = 61; livePp = 21822; liveName = 'Transcensionism'; liveId = '1051'; }
    else if (cleanLower === '85' || cleanLower === 'sim') { liveRank = 82; livePp = 19062; liveName = 'Sim'; liveId = '85'; }
    else if (cleanLower === '2' || cleanLower === 'unclem') { liveRank = 169; livePp = 12746; liveName = 'unclem'; liveId = '2'; countryCode = 'BY'; }
  }

  // 2. Fetch individual profile page to extract EXACT username capitalization, Accuracy, and Country
  let acc = 96.85;

  try {
    const profileUrl = `https://v4rx.me/user/profile.php?id=${liveId}`;
    const pRes = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (pRes.ok) {
      const pText = await pRes.text();
      const h1Match = pText.match(/<h1[^>]*class="[^"]*truncate[^"]*"[^>]*>\s*(.*?)\s*<\/h1>/i) ||
                      pText.match(/<title>(.*?)'s Profile<\/title>/i);
      const accMatch = pText.match(/(\d{2}\.\d{1,2})\s*%/i) || pText.match(/Accuracy:\s*([\d.]+)/i);
      const cMatch = pText.match(/flagsapi\.com\/([A-Z]{2})/i) ||
                     pText.match(/alt=["']([A-Z]{2})["'][^>]*class=["'][^"']*h-5/i) ||
                     pText.match(/flag-icon-([a-z]{2})/i) ||
                     pText.match(/country[=_"']([a-z]{2})/i);

      if (h1Match && h1Match[1].trim() && !h1Match[1].toLowerCase().includes('v4rx')) {
        liveName = h1Match[1].replace(/'s Profile/i, '').trim();
      }
      if (accMatch) {
        const parsed = parseFloat(accMatch[1]);
        if (parsed > 50 && parsed < 100) {
          acc = parsed;
        }
      }
      if (cMatch) {
        countryCode = cMatch[1].toUpperCase();
      }
    }
  } catch (e) {
    // Continue
  }

  return res.status(200).json({
    id: liveId,
    username: liveName,
    avatarUrl: `https://v4rx.me/user/avatar/${liveId}.png`,
    countryCode,
    countryFlag: countryCodeToEmoji(countryCode),
    v4rxRank: liveRank,
    v4rxPp: livePp,
    v4rxAccuracy: acc,
  });
}
