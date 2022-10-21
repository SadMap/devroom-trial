import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, SlashCommandBuilder } from "discord.js";
import { evaluate } from "mathjs";
import { presencecache, redis } from "../index.js";
import { BaseCommand } from "../types";
import fetch from "node-fetch"
import {randomBytes} from "node:crypto"
const command:BaseCommand = {
    name:"work",
    emoji:"",
    cooldown:5*60_000*0,
    description:"Earn Money",
    data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Earn Money")
    .setDMPermission(false),
    execute: async (interaction) => {
        if (!interaction.inGuild()) return;
        function randomSelect <T extends unknown>  (array:T[]) {
            return array[Math.round(Math.random()*array.length)]
        }
        function randomNumber() {
            return Math.floor(Math.ceil(Math.random()*100))
        }
        function shuffleArray <T extends unknown>(arr:T[]) {
            return arr.sort(() => Math.random() - 0.5);
          }
        const balance = parseInt(await redis.hGet(`balance.${interaction.guildId}`,interaction.user.id) ?? "0")
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
            buttons.map(b => b.setDisabled(true))
            buttonrow.setComponents(buttons)
            if (response.customId !== answer+"") {
                console.log(response.customId,answer)
                response.update({
                    content:"You lost, try again next time :wink:",
                    components:[buttonrow]
                })
                return;
            }
            response.update({
                content:"Congrulations You Won **400 Coins!** :tada:",
                components:[buttonrow]
            })
            redis.hSet(`balance.${interaction.guildId}`,interaction.user.id,balance+400)
            return;
        }
        else if (["mathtrivia","mathtruefalse"].includes(task)) {
            const req = await fetch(`https://opentdb.com/api.php?amount=1&category=19&difficulty=easy&type=${task == "mathtruefalse" ? "boolean" : "multiple"}`)
            const res = (await req.json()) as {
                response_code:number,
                results:{
                    category:string,
                    type:"multiple"|"boolean",
                    difficulty:"easy"|"medium"|"hard",
                    question:string,
                    correct_answer:string,
                    incorrect_answers:string[]
                }[]
            }
            if (res.response_code !== 0) {
                interaction.reply("There was an error processing this command")
                console.log(res)
                return;
            }
            const answers = shuffleArray([res.results[0].correct_answer,...res.results[0].incorrect_answers])
            const buttonrow = new ActionRowBuilder<ButtonBuilder>()
            const buttons:ButtonBuilder[] = answers.map(a => new ButtonBuilder().setCustomId(a).setLabel(a+"").setStyle(ButtonStyle.Primary))
            buttonrow.addComponents(buttons)
            const message = await interaction.reply({
                content:res.results[0].question,
                components:[buttonrow],
                fetchReply:true
            })
            const response = await message.awaitMessageComponent({
                componentType:ComponentType.Button,
            })
            buttons.map(b => b.setDisabled(true))
            buttonrow.setComponents(buttons)
            if (response.customId !== res.results[0].correct_answer) {
                console.log(response.customId,res.results[0].correct_answer)
                response.update({
                    content:"You lost, try again next time :wink:",
                    components:[buttonrow]
                })
                return;
            }
            response.update({
                content:"Congrulations You Won **400 Coins!** :tada:",
                components:[buttonrow]
            })
            redis.hSet(`balance.${interaction.guildId}`,interaction.user.id,balance+400)
            return;
        }
        else if (task == "status") {
            const randomText = randomBytes(16).toString("hex")
            await interaction.reply({
                content:`Set **${randomText}** as your status you heave 10 seconds`,
                ephemeral:true
            })
            const timeout =setTimeout(() => {interaction.followUp({
                ephemeral:true,
                content:"Failed"
            })
            presencecache.delete(interaction.user.id)},10_000)
            presencecache.set(interaction.user.id,{
                text:randomText,
                cb:() => {interaction.followUp({
                    ephemeral:true,
                    content:"Added 400 Coins ! :tada:"
                })
                clearTimeout(timeout)
                redis.hSet(`balance.${interaction.guildId}`,interaction.user.id,balance+400)
            }
            })
        }
    },
}
export default command