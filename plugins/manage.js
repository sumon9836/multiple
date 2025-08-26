const { plugin, isAccess, groupDB, mode } = require('../lib');

const defaultWords = ['sex', 'porn', 'xxx', 'xvideo', 'cum4k', 'randi', 'chuda', 'fuck', 'nude', 'bobs', 'vagina'];

plugin({
    pattern: 'antiword ?(.*)',
    formMe: mode,
    desc: '🔞 Manage antiword settings',
    type: 'manage'
}, async (message, match) => {
if (!message.isGroup)
      return await message.reply("*_This command is for groups_*");
  if (!await isAccess(message)) {
		return await message.send('*_Only bot owner and group admins can use this command_*');
  }
    const rawMatch = match?.trim();
    const lowerMatch = rawMatch?.toLowerCase();
    const actions = ['null', 'warn', 'kick'];

    let data = await groupDB(['word'], { jid: message.jid, content: {} }, 'get');
    let current = data?.word || {
        status: 'false',
        action: 'null',
        words: [],
        warns: {},
        warn_count: 3
    };

    // 💡 Fix: Ensure `words` is always an array
    if (!Array.isArray(current.words)) current.words = [];

    // 📝 Command: list
    if (lowerMatch === 'list') {
        const list = current.words.length > 0 ? current.words : defaultWords;
        return await message.send(`📃 *Banned Word List:*\n${list.map(w => `• ${w}`).join('\n')}`);
    }

    // ♻️ Reset to default
    if (lowerMatch === 'reset') {
        await groupDB(['word'], {
            jid: message.jid,
            content: {
                status: 'false',
                action: 'null',
                words: [],
                warns: {},
                warn_count: 3
            }
        }, 'set');
        return await message.send('♻️ *Antiword settings have been reset to default!*');
    }

    // 🛠️ Settings overview
    if (!rawMatch) {
        return await message.reply(
            `*🔞 Antiword Settings*\n\n` +
            `• *Status:* ${current.status === 'true' ? '✅ ON' : '❌ OFF'}\n` +
            `• *Action:* ${current.action === 'null' ? '🚫 Null' : current.action === 'warn' ? '⚠️ Warn' : '❌ Kick'}\n` +
            `• *Warn Before Kick:* ${current.warn_count}\n` +
            `• *Banned Words:* ${(current.words?.length > 0) ? current.words.join(', ') : defaultWords.join(', ')}\n\n` +
            `*Commands:*\n` +
            `• antiword on/off\n` +
            `• antiword action warn/kick/null\n` +
            `• antiword set_warn <number>\n` +
            `• antiword add <word>\n` +
            `• antiword remove <word>\n` +
            `• antiword list\n` +
            `• antiword reset`
        );
    }

    // ✅ Turn on
    if (lowerMatch === 'on') {
        await groupDB(['word'], {
            jid: message.jid,
            content: { ...current, status: 'true' }
        }, 'set');
        return await message.send(`✅ Antiword activated with action *${current.action}*`);
    }

    // ❌ Turn off
    if (lowerMatch === 'off') {
        await groupDB(['word'], {
            jid: message.jid,
            content: { ...current, status: 'false' }
        }, 'set');
        return await message.send(`❌ Antiword deactivated`);
    }

    // ⚙️ Set action
    if (lowerMatch.startsWith('action')) {
        const action = rawMatch.replace(/action/i, '').trim().toLowerCase();
        if (!actions.includes(action)) {
            return await message.send('❗ Invalid action! Use: `warn`, `kick`, or `null`');
        }

        await groupDB(['word'], {
            jid: message.jid,
            content: { ...current, action }
        }, 'set');
        return await message.send(`⚙️ Antiword action set to *${action}*`);
    }

    // 🚨 Set warn count
    if (lowerMatch.startsWith('set_warn')) {
        const count = parseInt(rawMatch.replace(/set_warn/i, '').trim());
        if (isNaN(count) || count < 1 || count > 10) {
            return await message.send('❗ Please provide a valid number between 1 and 10');
        }

        await groupDB(['word'], {
            jid: message.jid,
            content: { ...current, warn_count: count }
        }, 'set');
        return await message.send(`🚨 Warning count set to *${count}*`);
    }

    // ➕ Add word
    if (lowerMatch.startsWith('add')) {
        const word = rawMatch.replace(/add/i, '').trim().toLowerCase();
        if (!word || word.includes(' ')) {
            return await message.send('❗ Provide a valid single word to ban');
        }

        if (current.words.includes(word)) {
            return await message.send('⚠️ Word already exists in the list');
        }

        current.words.push(word);
        await groupDB(['word'], {
            jid: message.jid,
            content: { ...current }
        }, 'set');
        return await message.send(`✅ Word "*${word}*" added to banned list`);
    }

    // ➖ Remove word
    if (lowerMatch.startsWith('remove')) {
        const word = rawMatch.replace(/remove/i, '').trim().toLowerCase();
        const newWords = current.words.filter(w => w !== word);
        if (newWords.length === current.words.length) {
            return await message.send('⚠️ Word not found in the list');
        }

        await groupDB(['word'], {
            jid: message.jid,
            content: { ...current, words: newWords }
        }, 'set');
        return await message.send(`🗑️ Word "*${word}*" removed from banned list`);
    }

    return await message.send('⚠️ Invalid usage. Type `antiword` to see help.');
});

plugin({
    pattern: 'antilink ?(.*)',
    formMe: mode,
    desc: '🛡️ Manage anti-link settings',
    type: 'manage'
}, async (message, match) => {
    if (!message.isGroup)
      return await message.reply("*_This command is for groups_*");
  if (!await isAccess(message)) {
		return await message.send('*_Only bot owner and group admins can use this command_*');
  }
    const data = await groupDB(['link'], { jid: message.jid, content: {} }, 'get');
    const current = data?.link || {
        status: 'false',
        action: 'null',
        not_del: [],
        warns: {},
        warn_count: 3
    };

    const rawMatch = match?.trim(); 
    const lowerMatch = rawMatch?.toLowerCase(); 
    const actions = ['null', 'warn', 'kick'];
   if (lowerMatch === 'reset') {
        await groupDB(['link'], {
            jid: message.jid,
            content: {
                status: 'false',
                action: 'null',
                not_del: [],
                warns: {},
                warn_count: 3
            }
        }, 'set');
        return await message.send('♻️ *Antilink settings have been reset to default!*');
    }
    if (!rawMatch) {
        return await message.reply(
            `* Antilink Settings*\n\n` +
            `• *Status:* ${current.status === 'true' ? '✅ ON' : '❌ OFF'}\n` +
            `• *Action:* ${current.action === 'null' ? '🚫 Null' : current.action === 'warn' ? '⚠️ Warn' : '❌ Kick'}\n` +
            `• *Warn Before Kick:* ${current.warn_count}\n` +
            `• *Ignore URLs:* ${(current.not_del?.length > 0) ? current.not_del.join(', ') : 'None'}\n\n` +
            `*Commands:*\n` +
            `• antilink on/off\n` +
            `• antilink action warn/kick/null\n` +
            `• antilink set_warn <number>\n` +
            `• antilink not_del <url>\n` +
            `• antilink reset`
        );
    }
    if (lowerMatch === 'on') {
        await groupDB(['link'], {
            jid: message.jid,
            content: { ...current, status: 'true' }
        }, 'set');
        return await message.send(`✅ Antilink activated with action *${current.action}*`);
    }
    if (lowerMatch === 'off') {
        await groupDB(['link'], {
            jid: message.jid,
            content: { ...current, status: 'false' }
        }, 'set');
        return await message.send(`❌ Antilink deactivated`);
    }
    if (lowerMatch.startsWith('action')) {
        const action = rawMatch.replace(/action/i, '').trim().toLowerCase();
        if (!actions.includes(action)) {
            return await message.send('❗ Invalid action! Use: `warn`, `kick`, or `null`');
        }

        await groupDB(['link'], {
            jid: message.jid,
            content: { ...current, action }
        }, 'set');
        return await message.send(`⚙️ Antilink action set to *${action}*`);
    }

    if (lowerMatch.startsWith('set_warn')) {
        const count = parseInt(rawMatch.replace(/set_warn/i, '').trim());
        if (isNaN(count) || count < 1 || count > 10) {
            return await message.send('❗ Please provide a valid number between 1 and 10');
        }

        await groupDB(['link'], {
            jid: message.jid,
            content: { ...current, warn_count: count }
        }, 'set');
        return await message.send(`🚨 Antilink warning count set to *${count}*`);
    }
    if (lowerMatch.startsWith('not_del')) {
        const url = rawMatch.replace(/not_del/i, '').trim();
        if (!url.startsWith('http')) {
            return await message.send('❗ Please provide a valid URL (must start with http)');
        }
       const list = current.not_del || [];
        if (list.some(link => link.toLowerCase() === url.toLowerCase())) {
            return await message.send('⚠️ URL is already in the ignore list');
        }
     list.push(url);
        await groupDB(['link'], {
            jid: message.jid,
            content: { ...current, not_del: list }
        }, 'set');
     return await message.send('✅ URL added to ignore list (case preserved)');
    }
     return await message.send('⚠️ Invalid usage. Type `antilink` to see help.');
});

plugin({
    pattern: 'antifake ?(.*)',
    desc: 'remove fake numbers',
    formMe: mode,
    react: '🖕',
    type: 'manage',
    onlyGroup: true
}, async (message, match) => {
    if (!message.isGroup)
      return await message.reply("*_This command is for groups_*");
  if (!await isAccess(message)) {
		return await message.send('*_Only bot owner and group admins can use this command_*');
  }
    if (!match) return await message.reply('_*antifake* 94,92_\n_*antifake* on/off_\n_*antifake* list_');
    const {antifake} = await groupDB(['fake'], {jid: message.jid, content: {}}, 'get');
    if(match.toLowerCase()=='get'){
    if(!antifake || antifake.status == 'false' || !antifake.data) return await message.send('_Not Found_');
    return await message.send(`_*activated restricted numbers*: ${antifake.data}_`);
    } else if(match.toLowerCase() == 'on') {
    	const data = antifake && antifake.data ? antifake.data : '';
    	await groupDB(['fake'], {jid: message.jid, content: {status: 'true', data}}, 'set');
        return await message.send(`_Antifake Activated_`)
    } else if(match.toLowerCase() == 'off') {
        const data = antifake && antifake.data ? antifake.data : '';
    	await groupDB(['fake'], {jid: message.jid, content: {status: 'false', data}}, 'set');
    return await message.send(`_Antifake Deactivated_`)
    }
    match = match.replace(/[^0-9,!]/g, '');
    if(!match) return await message.send('value must be number');
    const status = antifake && antifake.status ? antifake.status : 'false';
    await groupDB(['fake'], {jid: message.jid, content: {status, data: match}}, 'set');
    return await message.send(`_Antifake Updated_`);
});

plugin({
    pattern: 'antidelete ?(.*)',
    desc: 'forward deleted messages',
    type: 'manage',
    formMe: mode
}, async (message, match) => {
    if (!message.isGroup)
      return await message.reply("*_This command is for groups_*");
  if (!await isAccess(message)) {
		return await message.send('*_Only bot owner and group admins can use this command_*');
  }
    if (!match) return message.reply('antidelete on/off');
    if (match != 'on' && match != 'off') return message.reply('antidelete on');
    const {antidelete} = await groupDB(['delete'], {jid: message.jid, content: {}}, 'get');
    if (match == 'on') {
        if (antidelete == 'true') return message.reply('_Already activated_');
        await groupDB(['delete'], {jid: message.jid, content: 'true'}, 'set');
        return await message.reply('_activated_')
    } else if (match == 'off') {
        if (antidelete == 'false') return message.reply('_Already Deactivated_');
        await groupDB(['delete'], {jid: message.jid, content: 'false'}, 'set');
        return await message.reply('_deactivated_')
    }
});

plugin({
    pattern: 'antibot ?(.*)',
    desc: 'remove users who use bot',
    type: "manage",
    formMe: mode
}, async (message, match) => {
    if (!message.isGroup)
      return await message.reply("*_This command is for groups_*");
    if (!await isAccess(message)) {
      return await message.send('*_Only bot owner and group admins can use this command_*');
    }
    if (!match) return await message.reply("_*antibot* on/off_\n_*antibot* action warn/kick/null_");
    
    const actions = ['null', 'warn', 'kick'];
    const {antibot} = await groupDB(['bot'], {jid: message.jid, content: {}}, 'get');
    
    if(match.toLowerCase() == 'on') {
      const action = antibot && antibot.action ? antibot.action : 'null';
      await groupDB(['bot'], {jid: message.jid, content: {status: 'true', action }}, 'set');
      return await message.send(`_antibot Activated with action ${action}_\n_*antibot action* warn/kick/null for changing actions_`)
    } else if(match.toLowerCase() == 'off') {
      const action = antibot && antibot.action ? antibot.action : 'null';
      await groupDB(['bot'], {jid: message.jid, content: {status: 'false', action }}, 'set')
      return await message.send(`_antibot deactivated_`)
    } else if(match.toLowerCase().match('action')) {
      const status = antibot && antibot.status ? antibot.status : 'false';
      match = match.replace(/action/gi,'').trim();
      if(!actions.includes(match)) return await message.send('_action must be warn,kick or null_')
      await groupDB(['bot'], {jid: message.jid, content: {status, action: match }}, 'set')
      return await message.send(`_AntiBot Action Updated_`);
    }
});

plugin({
    pattern: 'antidemote ?(.*)',
    desc: 'demote actor and re-promote demoted person',
    type: 'manage',
    formMe: mode
}, async (message, match) => {
    if (!message.isGroup)
      return await message.reply("*_This command is for groups_*");
  if (!await isAccess(message)) {
		return await message.send('*_Only bot owner and group admins can use this command_*');
  }
    if (!match) return message.reply('antidemote on/off');
    if (match != 'on' && match != 'off') return message.reply('antidemote on');
    const {antidemote} = await groupDB(['demote'], {jid: message.jid, content: {}}, 'get');
    if (match == 'on') {
        if (antidemote == 'true') return message.reply('_Already activated_');
        await groupDB(['demote'], {jid: message.jid, content: 'true'}, 'set');
        return await message.reply('_activated_')
    } else if (match == 'off') {
        if (antidemote == 'false') return message.reply('_Already Deactivated_');
        await groupDB(['demote'], {jid: message.jid, content: 'false'}, 'set');
        return await message.reply('_deactivated_')
    }
});

plugin({
    pattern: 'antipromote ?(.*)',
    desc: 'demote actor and re-promote demoted person',
    type: 'manage',
    formMe: mode
}, async (message, match) => {
    if (!message.isGroup)
      return await message.reply("*_This command is for groups_*");
  if (!await isAccess(message)) {
		return await message.send('*_Only bot owner and group admins can use this command_*');
  }
    if (!match) return message.reply('antipromote on/off');
    if (match != 'on' && match != 'off') return message.reply('antipromote on');
    const {antipromote} = await groupDB(['promote'], {jid: message.jid, content: {}}, 'get');
    if (match == 'on') {
        if (antipromote == 'true') return message.reply('_Already activated_');
        await groupDB(['promote'], {jid: message.jid, content: 'true'}, 'set');
        return await message.reply('_activated_')
    } else if (match == 'off') {
        if (antipromote == 'false') return message.reply('_Already Deactivated_');
        await groupDB(['promote'], {jid: message.jid, content: 'false'}, 'set');
        return await message.reply('_deactivated_')
    }
});
