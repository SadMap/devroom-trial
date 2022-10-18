import { SlashCommandBuilder } from "discord.js";
import { BaseCommand } from "../types";

const command:BaseCommand = {
    name:"ping",
    emoji:"",
    cooldown:20_000,
    description:"Says pong",
    data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Says pong")
    .setDMPermission(false),
    execute: async (interaction) => {
        interaction.reply("pong")
    },
}
export default command