async function testFetch() {
  try {
    const res = await fetch('https://v4rx.me/user/leaderboard/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    const html = await res.text();
    console.log('Leaderboard HTML length:', html.length);
    
    const trs = html.split(/<tr/i);
    console.log('Total TR rows:', trs.length);

    for (let i = 0; i < Math.min(trs.length, 15); i++) {
      console.log(`--- ROW ${i} ---`);
      console.log(trs[i].replace(/\s+/g, ' ').substring(0, 300));
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testFetch();
