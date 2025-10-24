import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseSpecProcessor } from './base/spec-processor.interface';

@Injectable()
export class JsonParserProcessor extends BaseSpecProcessor<string, any> {
  public handle(cleanedJson: string): any {
    try {
      const parsed = JSON.parse(cleanedJson);
      return parsed;
    } catch (e: any) {
      const msg: string = e.message || 'JSON inválido';
      const m = msg.match(/position\s+(\d+)/i);
      
      if (m) {
        const pos = Number(m[1]);
        const start = Math.max(0, pos - 30);
        const end = Math.min(cleanedJson.length, pos + 30);
        const snippet = cleanedJson.slice(start, end);
        throw new BadRequestException(
          `JSON inválido: ${msg}. Contexto: "…${snippet}…"`
        );
      }
      
      throw new BadRequestException(`JSON inválido: ${msg}`);
    }
  }
}