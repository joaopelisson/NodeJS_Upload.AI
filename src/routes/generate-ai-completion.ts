import { FastifyInstance } from "fastify";
import { createReadStream } from "fs";
import {streamToResponse, OpenAIStream} from 'ai';
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { Openai } from "../lib/openai";


export async function generateAICompletionRoute(app: FastifyInstance) {
  app.post("/ai/complete", async (req, reply) => {
    const bodySchema = z.object({
      videoId: z.string(),
      prompt: z.string(),
      temperature: z.number().min(0).max(1).default(0.5),
    });

    const { videoId, temperature, prompt } = bodySchema.parse(req.body);

    const video = await prisma.video.findUniqueOrThrow({
        where: {
            id: videoId,
        }
    })

    if(!video.transcription){
        return reply.status(400).send({error: `Video transcription was not generated yet.`})
    }
    const promptMessage = prompt.replace('{transcription}', video.transcription);

    const response = await Openai.chat.completions.create({
        model: 'gpt-3.5-turbo-16k',
        temperature,
        messages: [
            { role: 'user', content: promptMessage },
        ],
        stream: true
    });

    const stream = OpenAIStream(response);

    streamToResponse(stream, reply.raw, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      }
    });
  });
}
