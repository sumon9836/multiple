const { personalDB } = require('./index');
async function handleStatusUpdate(conn, msg) {
    if (!conn?.user?.id) return;
    
    try {
        const config = await personalDB(['autostatus'], {
            jid: conn.user.id,
            content: {}
        }, 'get');
        
        if (!config || config.autostatus !== 'true') return;
     if (msg.key.remoteJid !== 'status@broadcast') return;
        
        await conn.readMessages([msg.key]);
        console.log(`Auto-seen status from ${msg.key.participant || 'unknown sender'}`);
    } catch (e) {
        console.error(`❌ Failed to auto-see status:`, e.message);
    }
}

module.exports = { handleStatusUpdate };