import { EmbedBuilder, escapeMarkdown, SlashCommandBuilder } from "discord.js";
import { redis } from "../index.js";
import { BaseCommand } from "../types";

const command:BaseCommand = {
    name:"leadderboard",
    description:"Shows the top 10 coin holders",
    emoji:"🏆",
    cooldown:0,
    data:new SlashCommandBuilder()
    .setName("leadderboard")
    .setDescription("Shows the top 10 coin holders")
    .setDMPermission(false),
    execute: async (interaction) => {
        const keys = await redis.hGetAll(`balance.${interaction.guildId}`)
        let array:{user:string,balance:number}[] = []
        for (const key in keys) {
            if (Object.prototype.hasOwnProperty.call(keys, key)) {
                const element = keys[key];
                array.push({
                    user:key,
                    balance:parseInt(element)
                })
            }
        }
        array.sort((a,b) => b.balance-a.balance)
        array = array.slice(0,9)
        const embed = new EmbedBuilder()
        let str = ""
        for (const user of array) {
            const discordUser = await interaction.client.users.fetch(user.user)
            str += `${escapeMarkdown(discordUser.tag)}(\`${user.user}\`)-${user.balance}\n`
        }
        embed.setDescription(str)
        interaction.reply({
            ephemeral:true,
            embeds:[embed]
        })
    },
}
export default command;