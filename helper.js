/* eslint-disable no-throw-literal */
const moveerMessage = require('./moveerMessage.js')
const config = require('./config.js')

function checkIfVoiceChannelExist (message, voiceChannel, channelName) {
  const args = message.content.slice(config.discordPrefix.length).trim().split(/ +/g)
  const command = args.shift().toLowerCase()

  if (voiceChannel === null || voiceChannel.members === undefined) {
    throw {
      'logMessage': 'Cant find voiceChannel: ' + channelName + (message.content.slice(config.discordPrefix.length).trim().split(/ +/g).length > 3 ? ' - Sent fnutt helper' : ''),
      'sendMessage': command === 'move'
        ? moveerMessage.NO_VOICE_CHANNEL_NAMED_X + 'the name/id: "' + channelName + '" <@' + message.author.id + '>'
        : moveerMessage.NO_VOICE_CHANNEL_NAMED_X + 'the name/id: "' + channelName + '" <@' + message.author.id + '>' +
      (message.content.slice(config.discordPrefix.length).trim().split(/ +/g).length > 3
        ? '\nIf your voicechannel contains spaces, please use "" around it. Example `"channel with spaces"`'
        : '')
    }
  }
}

function checkArgsLength (args, expectedLength) {
  if (args.length < expectedLength) {
    throw {
      'logMessage': 'Missing one or more arguments',
      'sendMessage': 'Missing arguments'
    }
  }
}

function checkIfArgsTheSame (message, args) {
  if (args[0].toLowerCase() === args[1].toLowerCase()) {
    throw {
      'logMessage': 'Same voicechannel name',
      'sendMessage': moveerMessage.VOICE_CHANNEL_NAMES_THE_SAME + ' <@' + message.author.id + '>'
    }
  }
}

function checkIfUsersInsideVoiceChannel (message, fromVoiceChannelName, fromVoiceChannel) {
  if (fromVoiceChannel === null) return
  if (fromVoiceChannel.members.array().length < 1) {
    throw {
      'logMessage': 'No users inside the channel: ' + fromVoiceChannelName,
      'sendMessage': moveerMessage.NO_USERS_INSIDE_ROOM + ':  ' + fromVoiceChannelName + ' <@' + message.author.id + '>'
    }
  }
}

function checkIfTextChannelIsMoveerAdmin (message) {
  if (message.channel.name.toLowerCase() !== 'moveeradmin') {
    throw {
      'logMessage': 'Command made outside moveeradmin',
      'sendMessage': moveerMessage.CMOVE_OUTSIDE_MOVEERADMIN + ' <@' + message.author.id + '>'
    }
  }
}

function checkForUserMentions (message, messageMentions) {
  if (messageMentions.length < 1) {
    throw {
      'logMessage': '@Mention is missing',
      'sendMessage': moveerMessage.MESSAGE_MISSING_MENTION + ' <@' + message.author.id + '>'
    }
  }
}

function checkIfMessageContainsMentions (message) {
  if (message.mentions.users.array().length > 0) {
    throw {
      'logMessage': 'User tried to mention while moving groups',
      'sendMessage': moveerMessage.MOVE_MESSAGE_CONTAINS_MENTIONS + ' <@' + message.author.id + '>'
    }
  }
}

function checkIfSelfMention (message) {
  if (message.mentions.users.has(message.author.id)) {
    throw {
      'logMessage': 'User trying to move himself',
      'sendMessage': moveerMessage.USER_MOVING_SELF + ' <@' + message.author.id + '>'
    }
  }
}

function checkIfAuthorInsideAVoiceChannel (message, userVoiceRoomID) {
  if (userVoiceRoomID === undefined || userVoiceRoomID === null) {
    throw {
      'logMessage': 'User tried to move people without being inside a voice room',
      'sendMessage': moveerMessage.USER_NOT_IN_ANY_VOICE_CHANNEL + ' <@' + message.author.id + '>'
    }
  }
}

function checkIfVoiceChannelContainsMoveer (message, authorVoiceChannelName) {
  if (authorVoiceChannelName.toLowerCase().includes('moveer')) {
    throw {
      'logMessage': 'User trying to move people into a moveer channel',
      'sendMessage': moveerMessage.USER_INSIDE_MOVEER_VOICE_CHANNEL + ' <@' + message.author.id + '>'
    }
  }
}

function checkIfGuildHasTwoMoveerChannels (message) {
  if (message.guild.channels.find(channel => channel.name === 'Moveer') !== null && message.guild.channels.find(channel => channel.name === 'moveer') !== null) {
    throw {
      'logMessage': 'User has two channels called moveer/Moveer',
      'sendMessage': moveerMessage.SERVER_HAS_TWO_MOVEER_VOICE_CHANNELS
    }
  }
}

function checkIfMentionsInsideVoiceChannel (message, messageMentions) {
  for (let i = 0; i < messageMentions.length; i++) {
    if (message.guild.members.get(messageMentions[i].id).voiceChannelID === undefined || message.guild.members.get(messageMentions[i].id).voiceChannelID === null) {
      moveerMessage.logger(message, 'Not moving user, not in any voice channel!')
      moveerMessage.sendMessage(message, messageMentions[i] + ' ' + moveerMessage.USER_MENTION_NOT_IN_ANY_CHANNEL)
    }
  }
  return messageMentions.filter(user => message.guild.members.get(user.id).voiceChannelID !== undefined && message.guild.members.get(user.id).voiceChannelID !== null)
}

function checkIfUsersAlreadyInChannel (message, messageMentions, toVoiceChannelId) {
  for (let i = 0; i < messageMentions.length; i++) {
    if (message.guild.members.get(messageMentions[i].id).voiceChannelID === toVoiceChannelId) {
      moveerMessage.logger(message, 'Not moving user, user already in the channel!')
      moveerMessage.sendMessage(message, messageMentions[i].username + ' ' + moveerMessage.USER_ALREADY_IN_CHANNEL)
    }
  }
  return messageMentions.filter(user => message.guild.members.get(user.id).voiceChannelID !== toVoiceChannelId)
}

async function checkForConnectPerms (message, users, voiceChannel) {
  for (let i = 0; i < users.length; i++) {
    const userVoiceChannelId = await message.guild.members.get(users[i]).voiceChannelID
    const userVoiceChannel = await message.guild.channels.get(userVoiceChannelId)
    if (await !userVoiceChannel.memberPermissions(message.guild.me).has('CONNECT')) {
      throw {
        'logMessage': 'Moveer is missing CONNECT permission',
        'sendMessage': moveerMessage.MOVEER_MISSING_CONNECT_PERMISSION + ' <@' + message.author.id + '> \n \n' + moveerMessage.SUPPORT_MESSAGE
      }
    }
  }
  if (await !voiceChannel.memberPermissions(message.guild.me).has('CONNECT')) {
    throw {
      'logMessage': 'Moveer is missing CONNECT permission',
      'sendMessage': moveerMessage.MOVEER_MISSING_CONNECT_PERMISSION + ' <@' + message.author.id + '> \n \n' + moveerMessage.SUPPORT_MESSAGE
    }
  }
}

async function checkForMovePerms (message, users, voiceChannel) {

  for (let i = 0; i < users.length; i++) {
    console.log('userId: ' + users[i])
    const userVoiceChannelId = await message.guild.members.get(users[i]).voiceChannelID
    console.log('uservoiceId ' + userVoiceChannelId)
    const userVoiceChannel = await message.guild.channels.get(userVoiceChannelId)
    if (await !userVoiceChannel.memberPermissions(message.guild.me).has('MOVE_MEMBERS')) {
      throw {
        'logMessage': 'Moveer is missing Move Members permission',
        'sendMessage': moveerMessage.MOVEER_MISSING_MOVE_PERMISSION + ' <@' + message.author.id + '> \n \n' + moveerMessage.SUPPORT_MESSAGE
      }
    }
  }
  if (await !voiceChannel.memberPermissions(message.guild.me).has('MOVE_MEMBERS')) {
    throw {
      'logMessage': 'Moveer is missing Move Members permission',
      'sendMessage': moveerMessage.MOVEER_MISSING_MOVE_PERMISSION + ' <@' + message.author.id + '> \n \n' + moveerMessage.SUPPORT_MESSAGE
    }
  }
}

function checkIfChannelIsTextChannel (message, channel) {
  if (channel.type === 'text') {
    throw {
      'logMessage': 'User tried to move with textchannels',
      'sendMessage': channel.name + moveerMessage.USER_MOVED_WITH_TEXT_CHANNEL + ' <@' + message.author.id + '> \n'
    }
  }
}

// Helper functions
function getNameOfVoiceChannel (message, voiceChannelId) {
  return message.guild.channels.get(voiceChannelId).name
}

function getChannelByName (message, findByName) {
  let voiceChannel = message.guild.channels.find(channel => channel.id === findByName)
  if (voiceChannel === null) {
    voiceChannel = message.guild.channels.find(channel => channel.name.toLowerCase() === findByName.toLowerCase() && channel.type === 'voice')
  }
  return voiceChannel
}

function moveUsers (message, usersToMove, toVoiceChannelId) {
  let usersMoved = 0
  for (let i = 0; i < usersToMove.length; i++) {
    message.guild.member(usersToMove[i]).setVoiceChannel(toVoiceChannelId)
      .catch(err => {
        console.log(err)
        moveerMessage.logger(message, 'Got above error when moving people...')
        moveerMessage.sendMessage(message, 'Got an error moving people :( If this keeps happening, please contact a moderator in the official discord: https://discord.gg/dTdH3gD')
        if (message.guild.id !== '569905989604868138') reportMoveerError(message)
      })
    usersMoved++
  }
  moveerMessage.logger(message, 'Moved ' + usersMoved + (usersMoved === 1 ? ' user' : ' users'))
  moveerMessage.sendMessage(message, 'Moved ' + usersMoved + (usersMoved === 1 ? ' user' : ' users') + ' by request of <@' + message.author.id + '>')
  if (message.guild.id === '569905989604868138') return
  if (config.postgreSQLConnection !== 'x') successfullmove(usersMoved)
}

function getChannelWithSpacesName (args) {
  const string = args.join()
  let fnuttCounter = string[0] === '"' ? 0 : 2
  let testFrom = ''
  let testTo = ''
  let fromVoiceChannelName
  let toVoiceChannelName

  for (let i = string[0] === '"' ? 0 : args[0].length; i < string.length; i++) {
    if (string[i] === '"') {
      fnuttCounter += 1
      continue
    }
    if (fnuttCounter === 2 && string[i] === ',') continue
    if (fnuttCounter < 2) testFrom += string[i] === ',' ? ' ' : string[i]
    if (fnuttCounter > 1) testTo += string[i] === ',' ? ' ' : string[i]
  }

  if (fnuttCounter ? !(fnuttCounter % 2) : void 0) {
    fromVoiceChannelName = string[0] === '"' ? testFrom : args[0]
    toVoiceChannelName = testTo
  } else {
    throw {
      'logMessage': moveerMessage.MISSING_FNUTTS_IN_ARGS,
      'sendMessage': moveerMessage.MISSING_FNUTTS_IN_ARGS
    }
  }
  return [fromVoiceChannelName, toVoiceChannelName]
}

async function successfullmove (usersMoved) {
  const { Client } = require('pg')
  const client = new Client({
    connectionString: config.postgreSQLConnection
  })
  try {
    await client.connect()
    await client.query('UPDATE moves SET successCount = successCount + ' + usersMoved + ' WHERE id = 1')
    await client.end()
  } catch (err) {
    console.log(err)
    reportMoveerError('DB')
  }
}

function reportMoveerError (message) {
  const Discord = require('discord.js')
  const hook = new Discord.WebhookClient(config.discordHookIdentifier, config.discordHookToken)
  if (message === 'DB') {
    hook.send('New Moveer DB error reported. Check the logs for information.\nError adding successful move to postgreSQL\n@everyone')
  } else {
    hook.send('New Moveer error reported. Check the logs for information.\nCommand: ' + message.content + '\nInside textChannel: ' + message.channel.name + '\nInside server: ' + message.guild.name + '\n@everyone')
  }
}

module.exports = {
  checkIfTextChannelIsMoveerAdmin,
  checkIfVoiceChannelExist,
  checkIfArgsTheSame,
  checkIfUsersInsideVoiceChannel,
  checkArgsLength,
  checkForUserMentions,
  checkIfAuthorInsideAVoiceChannel,
  checkForConnectPerms,
  checkForMovePerms,
  checkIfVoiceChannelContainsMoveer,
  checkIfGuildHasTwoMoveerChannels,
  getNameOfVoiceChannel,
  checkIfSelfMention,
  checkIfMessageContainsMentions,
  moveUsers,
  checkIfMentionsInsideVoiceChannel,
  checkIfUsersAlreadyInChannel,
  getChannelByName,
  getChannelWithSpacesName,
  checkIfChannelIsTextChannel,
  reportMoveerError
}
