import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseSpecProcessor } from './base/spec-processor.interface';

@Injectable()
export class JsonCleanerProcessor extends BaseSpecProcessor<string, string> {
  public handle(rawText: string): string {
    if (!rawText || typeof rawText !== 'string') {
      throw new BadRequestException('Respuesta vacía');
    }

    let cleaned = rawText
      .replace(/```(?:json)?/gi, '')
      .replace(/```/g, '')
      .replace(/\r\n/g, '\n')
      .trim();

    cleaned = this.extractBalancedJsonBlock(cleaned) || cleaned;
    cleaned = this.collapseNewlinesInsideStrings(cleaned);
    cleaned = this.stripCommentsSafely(cleaned);
    cleaned = cleaned.replace(/[""]/g, '"').replace(/['']/g, "'");
    cleaned = cleaned.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    cleaned = this.convertSingleQuotedValuesSafely(cleaned);
    cleaned = cleaned.replace(/\bNaN|Infinity|-Infinity\b/g, 'null');

    return cleaned;
  }

  private extractBalancedJsonBlock(text: string): string {
    const s = (text ?? '').replace(/\uFEFF/g, '');
    const start = s.indexOf('{');
    if (start < 0) return '';

    let i = start, depth = 0, inStr: '"' | "'" | null = null, esc = false;
    for (; i < s.length; i++) {
      const ch = s[i];
      if (inStr) {
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === inStr) inStr = null;
        continue;
      }
      if (ch === '"' || ch === "'") { inStr = ch as '"' | "'"; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return s.slice(start, i + 1);
      }
    }
    return s.slice(start);
  }

  private collapseNewlinesInsideStrings(text: string): string {
    let out = '';
    let inStr = false;
    let esc = false;
    for (const ch of text) {
      if (inStr) {
        if (esc) { out += ch; esc = false; continue; }
        if (ch === '\\') { out += ch; esc = true; continue; }
        if (ch === '\n' || ch === '\r') { out += ' '; continue; }
        if (ch === '"') { inStr = false; out += ch; continue; }
        out += ch; continue;
      }
      if (ch === '"') { inStr = true; out += ch; continue; }
      out += ch;
    }
    return out;
  }

  private stripCommentsSafely(text: string): string {
    let out = '';
    let inStr = false, esc = false, inBlock = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = i + 1 < text.length ? text[i + 1] : '';

      if (inStr) {
        if (esc) { out += ch; esc = false; continue; }
        if (ch === '\\') { out += ch; esc = true; continue; }
        if (ch === '"') { inStr = false; out += ch; continue; }
        out += ch; continue;
      }

      if (inBlock) {
        if (ch === '*' && next === '/') { inBlock = false; i++; }
        continue;
      }

      if (ch === '"') { inStr = true; out += ch; continue; }
      if (ch === '/' && next === '*') { inBlock = true; i++; continue; }
      if (ch === '/' && next === '/') {
        while (i < text.length && text[i] !== '\n') i++;
        continue;
      }

      out += ch;
    }
    return out;
  }

  private convertSingleQuotedValuesSafely(jsonLike: string): string {
    let out = '';
    let inDouble = false;
    let inSingle = false;
    let esc = false;

    const isWs = (c: string) => c === ' ' || c === '\t' || c === '\n' || c === '\r';

    for (let i = 0; i < jsonLike.length; i++) {
      const ch = jsonLike[i];

      if (esc) { out += ch; esc = false; continue; }
      if (ch === '\\') { out += ch; esc = true; continue; }

      if (inDouble) {
        if (ch === '"') inDouble = false;
        out += ch; continue;
      }
      if (inSingle) {
        if (ch === "'") { inSingle = false; out += '"'; }
        else out += ch;
        continue;
      }

      if (ch === '"') { inDouble = true; out += ch; continue; }
      if (ch === "'") {
        let j = out.length - 1; while (j >= 0 && isWs(out[j])) j--;
        const prev = j >= 0 ? out[j] : '';
        if (prev === ':' || prev === '[' || prev === ',' || prev === '{') {
          inSingle = true; out += '"';
        } else {
          out += "'"; 
        }
        continue;
      }

      out += ch;
    }
    return out;
  }
}