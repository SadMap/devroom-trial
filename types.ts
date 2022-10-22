import { ChatInputCommandInteraction, EmojiResolvable, SlashCommandBuilder } from "discord.js"

export type BaseCommand ={
    name:string,
    description:string,
    emoji:EmojiResolvable,
    data:SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
    cooldown:number,
    execute:(interaction: ChatInputCommandInteraction) => Promise<void>
}