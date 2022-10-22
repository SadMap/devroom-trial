import { SlashCommandBuilder } from "discord.js";
import { redis } from "../index.js";
import { BaseCommand } from "../types";

const command:BaseCommand = {
    name:"pay",
    description:"Send Money to another user",
    cooldown:5_000,
    data:new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Send Money to another user")
    .setDMPermission(false)
    .addUserOption(o => o.setName("user").setRequired(true).setDescription("Sellect user to send money"))
    .addIntegerOption(o => o.setRequired(true).setName("amount").setDescription("Amount to send").setMinValue(0)),
    emoji:"",
    execute: async (interaction) => {
        const user = interaction.options.getUser("user",true)
        const amount = interaction.options.getInteger("amount",true)
        const executorBalance = parseInt(await redis.hGet(`balance.${interaction.guildId}`,interaction.user.id) ?? "0")
        const targetBalance = await redis.hGet(`balance.${interaction.guildId}`,user.id)
        if (executorBalance < amount) {
            interaction.reply({
                ephemeral:true,
                content:"You don't heave that much money"
            })
            return;
        }
        // idk i think redis don't heave decBy
        redis.hSet(`balance.${interaction.guildId}`,interaction.user.id,executorBalance-amount)
        targetBalance ? redis.hIncrBy(`balance.${interaction.guildId}`,user.id,amount):redis.hSet(`balance.${interaction.guildId}`,user.id,amount)
        interaction.reply({
            ephemeral:true,
            content:`Sent ${amount} coins to ${user}`
        })
    },
}
export default command