export default async function handler(req, res) {
  // Allow requests from anywhere (CORS for your HTML)
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST method' });
  }
  
  const { cookie, webhook, gameIds } = req.body;
  
  if (!cookie || !webhook || !gameIds) {
    return res.status(400).json({ error: 'Missing cookie, webhook, or gameIds' });
  }
  
  try {
    // Step 1: Get user ID from cookie
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
    });
    
    if (!userRes.ok) {
      return res.status(401).json({ error: 'Cookie is wrong or expired' });
    }
    
    const user = await userRes.json();
    const userId = user.id;
    
    // Step 2: Get games this user has played
    const gamesRes = await fetch(`https://games.roblox.com/v1/users/${userId}/games?limit=50`);
    const games = await gamesRes.json();
    const playedIds = games.data.map(g => g.id);
    
    // Step 3: Check each game ID
    const gameIdList = gameIds.split(',').map(id => id.trim());
    let message = '**ROBLOX GAME CHECK RESULTS**\n';
    message += `User ID: ${userId}\n\n`;
    
    for (const id of gameIdList) {
      const played = playedIds.includes(parseInt(id));
      message += `${played ? '✅' : '❌'} Game ${id}: ${played ? 'PLAYED' : 'NOT PLAYED'}\n`;
    }
    
    // Step 4: Send to Discord
    const discordRes = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    });
    
    if (!discordRes.ok) {
      return res.status(500).json({ error: 'Failed to send to Discord' });
    }
    
    return res.status(200).json({ success: true, message: 'Results sent to Discord!' });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}