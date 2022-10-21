import { SlashCommandBuilder } from "discord.js";
import { redis } from "../index.js";
import { BaseCommand } from "../types";

const command:BaseCommand = {
    name:"balance",
    description:"Shows user's balance",
    cooldown:5_000,
    data:new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Shows user's balance")
    .setDMPermission(false)
    .addUserOption(o => o.setName("user").setRequired(false).setDescription("Sellect user to view balance")),
    emoji:"",
    execute: async (interaction) => {
        if (!interaction.inGuild()) return;
        const user = interaction.options.getUser("user",false) ?? interaction.user
        const balance = parseInt(await redis.hGet(`balance.${interaction.guildId}`,interaction.user.id) ?? "0")
        interaction.reply(`User has ${balance} Coins`)
    },
}
export default command