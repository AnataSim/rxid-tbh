async function fetchCasings() {
  const ids = ['85', '63', '1051', '23', '106', '43', '27', '453'];
  for (const id of ids) {
    try {
      const res = await fetch(`https://v4rx.me/user/profile.php?id=${id}`);
      const text = await res.text();
      const h1Match = text.match(/<h1[^>]*class="[^"]*truncate[^"]*"[^>]*>\s*(.*?)\s*<\/h1>/i);
      const titleMatch = text.match(/<title>(.*?)'s Profile<\/title>/i);
      console.log(`ID ${id}:`, h1Match ? h1Match[1].trim() : (titleMatch ? titleMatch[1].trim() : 'UNKNOWN'));
    } catch (e) {
      console.error(id, e.message);
    }
  }
}

fetchCasings();
