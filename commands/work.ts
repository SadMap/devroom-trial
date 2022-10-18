import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, SlashCommandBuilder } from "discord.js";
import { evaluate } from "mathjs";
import { redis } from "../index.js";
import { BaseCommand } from "../types";

const command:BaseCommand = {
    name:"work",
    emoji:"",
    cooldown:5*60_000,
    description:"Earn Money",
    data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Earn Money")
    .setDMPermission(false),
    execute: async (interaction) => {
        if (!interaction.inGuild()) return;
        function randomSelect(array:string[]) {
            return array[Math.ceil(Math.random()*array.length)]
        }
        function randomNumber() {
            return Math.ceil(Math.ceil(Math.random()*100))
        }
        function shuffleArray(arr:any[]) {
            return arr.sort(() => Math.random() - 0.5);
          }
        const balance = parseInt(await redis.get(`balance.${interaction.guildId}.${interaction.user.id}`) ?? "0")
        const tasks = ["mathproblem","mathtrivia","mathtruefalse","status"]
        const task = randomSelect(tasks)
        if (task == "mathproblem") {
            const operators = ["+","-"]
            const operator = randomSelect(operators)
            const question = `${randomNumber()}${operator}${randomNumber()}`
            const fakeQuestions = [`${randomNumber()}${operator}${randomNumber()}`,`${randomNumber()}${operator}${randomNumber()}`,`${randomNumber()}${operator}${randomNumber()}`]
            const answer = evaluate(question)
            const fakeAnswers = fakeQuestions.map(q => evaluate(q))
            const answers = shuffleArray([...fakeAnswers,answer])
            const buttonrow = new ActionRowBuilder<ButtonBuilder>()
            const buttons:ButtonBuilder[] = answers.map(a => new ButtonBuilder().setCustomId(a+"").setLabel(a+"").setStyle(ButtonStyle.Primary))
            buttonrow.addComponents(buttons)
            const message = await interaction.reply({
                content:`Select the answer of **${question}**`,
                components:[buttonrow],
                ephemeral:true,
                fetchReply:true
            })
            const response = await message.awaitMessageComponent({
                componentType:ComponentType.Button,
            })
        }
    },
}
export default command