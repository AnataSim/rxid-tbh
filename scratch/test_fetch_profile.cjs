async function testProfile() {
  const res = await fetch('https://v4rx.me/user/profile.php?id=569', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  });
  const text = await res.text();
  console.log('Profile HTML length:', text.length);

  const h1Match = text.match(/<h1[^>]*>\s*(.*?)\s*<\/h1>/gi);
  console.log('H1 matches:', h1Match);

  const accMatch = text.match(/(\d{2}\.\d{1,2})\s*%/gi);
  console.log('Acc matches:', accMatch);

  const flagMatch = text.match(/flagsapi\.com\/([A-Z]{2})/gi) || text.match(/country[=_"']([a-z]{2})/gi) || text.match(/flag/gi);
  console.log('Flag snippet:', text.substring(0, 1000).match(/flag|country|id/gi));

  // Let's print snippets containing % or accuracy or flag
  const lines = text.split('\n');
  for (const l of lines) {
    if (l.includes('%') || l.includes('Accuracy') || l.includes('flag') || l.includes('country') || l.includes('ID')) {
      console.log('LINE:', l.trim().substring(0, 150));
    }
  }
}

testProfile();
