import { CommandInteraction, EmojiResolvable, SlashCommandBuilder } from "discord.js"

export type BaseCommand ={
    name:string,
    description:string,
    emoji:EmojiResolvable,
    data:SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
    cooldown:number,
    execute:(interaction: CommandInteraction) => Promise<void>
}