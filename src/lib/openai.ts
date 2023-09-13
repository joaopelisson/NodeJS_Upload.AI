import 'dotenv/config'
import { OpenAI } from 'openai'

export const Openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
})