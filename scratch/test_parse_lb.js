const fs = require('fs');

async function testParse() {
  const res = await fetch('https://v4rx.me/user/leaderboard/');
  const html = await res.text();

  const trBlocks = html.split(/<tr\s/i);
  console.log('Total TR blocks found:', trBlocks.length);

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

  console.log('Parsed players count:', players.length);
  console.log('First 15 players:', players.slice(0, 15));

  const targetIds = ['85', '63', '1051', '23', '106', '43', '27'];
  const targets = players.filter(p => targetIds.includes(p.id) || ['sim', 'darkww', 'transcensionism', 'cookedfishrx', 'lostrushi', 'learnerx', 'melancholy'].includes(p.username.toLowerCase()));
  console.log('\nTarget players found in live leaderboard:', targets);
}

testParse().catch(console.error);
