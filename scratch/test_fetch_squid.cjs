async function findSquid() {
  const res = await fetch('https://v4rx.me/user/leaderboard/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  });
  const html = await res.text();
  const trs = html.split(/<tr/i);

  for (const tr of trs) {
    if (tr.toLowerCase().includes('squid')) {
      console.log('FOUND SQUID TR:\n', tr);
    }
  }
}

findSquid();
