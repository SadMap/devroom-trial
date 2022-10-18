console.time("startup")
import { createClient } from 'redis';
import { DISCORD_TOKEN, REDIS_URL } from './config.js';
const redis = createClient(
    {
        url:REDIS_URL
    }
)
redis.on('error', (err) => console.log('Redis Client Error', err));
export const commands = new Collection<string,BaseCommand>()
console.time("redisConnect")
await redis.connect()
console.timeEnd("redisConnect")
import {Client, Collection, ContextMenuCommandBuilder} from "discord.js";
import { BaseCommand } from './types.js';
import { readdir } from 'fs/promises';
const client = new Client({intents:["Guilds"]})
console.time("discordLogin")
client.on("ready",async () => {
    console.timeEnd("discordLogin")
    console.time("syncCommands")
    const discordCommands = await client.application!.commands.fetch()
    const loadedCommands = await Promise.all(((await readdir("./commands")).filter(c => c.endsWith(".js")).map(async (c) => (((await import(`./commands/${c}`)).default))as Promise<BaseCommand>)))
    const toDelete = discordCommands.filter(c => !loadedCommands.some(lc => lc.data.name == c.name))
    for (const command of toDelete.values()) {
        await command.delete()
    }
    const toCreate = loadedCommands.filter(lc => !discordCommands.some(c => c.name == lc.data.name))
    for (const command of toCreate) {
        await client.application?.commands.create(command.data)
    }
    const toUpdate = discordCommands.filter(c => loadedCommands.some(lc => lc.name == c.name && !c.equals(lc.data.toJSON())))
    for (const command of toUpdate.values()) {
        await command.edit(loadedCommands.find(lc => lc.data.name == command.name)!.data)
    }
    for (const command of loadedCommands) {
        commands.set(command.data.name,command)
    }
    console.timeEnd("startup")
})
client.on("interactionCreate",async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = commands.get(interaction.commandName)
    if (!command) {
        interaction.reply("Unknown Command")
        return;
    }
    if (command.cooldown !== 0) {
        const cooldown = await redis.get(`cooldowns.${command.name}.${interaction.user.id}`)
        if (cooldown) {
            const diff = parseInt(cooldown)+command.cooldown - Date.now()
            console.log(diff)
            if (isNaN(parseInt(cooldown))) {
                await redis.set(`cooldowns.${command.name}.${interaction.user.id}`,Date.now())
            }
            else if (diff > 0) {
                interaction.reply(`You need to wait ${(new Intl.RelativeTimeFormat("en")).format((diff/1000) <60?(diff/1000):(diff/1000)/60,(diff/1000) < 60 ? "seconds":"minutes")} before using this command`)
                return;
            }
            else {
                await redis.set(`cooldowns.${command.name}.${interaction.user.id}`,Date.now())
            }
        }
        else {
            await redis.set(`cooldowns.${command.name}.${interaction.user.id}`,Date.now())
        }
    }
    command.execute(interaction)
})
client.login(DISCORD_TOKEN)