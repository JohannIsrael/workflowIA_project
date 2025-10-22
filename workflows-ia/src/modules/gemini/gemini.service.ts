import { Injectable } from '@nestjs/common';
import { CreateGeminiDto } from './dto/create-gemini.dto';
import { UpdateGeminiDto } from './dto/update-gemini.dto';
import { GoogleGenAI } from '@google/genai';
import { WORKFLOW_CREATE_PROMPT } from './entities/prompts/Create';
import { Projects } from './entities/Projects.entity';
import { Tasks } from './entities/Tasks.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class GeminiService {
    private genAI: GoogleGenAI;
    private rules = WORKFLOW_CREATE_PROMPT;


    constructor(
      @InjectRepository(Projects)
      private projectsRepository: Repository<Projects>,
      @InjectRepository(Tasks)
      private tasksRepository: Repository<Tasks>,
    ) {
      this.genAI = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });
    }


    async generateProjectSpec(userInput: string) {
    const response = await this.genAI.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: `${this.rules}\n\nUser idea: ${userInput}`,
    });

    const text = (response.text ?? '').trim();

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return text;

  }
}
