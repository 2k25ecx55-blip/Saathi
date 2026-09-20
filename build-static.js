const fs = require('fs');

// 1. Convert i18n.ts to i18n.js
let i18n = fs.readFileSync('lib/i18n.ts', 'utf8');
// Remove imports
i18n = i18n.replace(/import .*?;\n/g, '');
// Remove interface
i18n = i18n.replace(/export interface Translations \{[\s\S]*?\n\}\n/g, '');
// Remove type annotations
i18n = i18n.replace(/const enTranslations: Translations = \{/g, 'const enTranslations = {');
i18n = i18n.replace(/export const translations: Record<SupportedLanguage, Translations> = \{/g, 'const translations = {');
// Expose to window
i18n += '\nwindow.translations = translations;\n';

fs.mkdirSync('js', { recursive: true });
fs.writeFileSync('js/i18n.js', i18n);

// 2. Convert prompt.ts to prompt.js
let prompt = fs.readFileSync('lib/prompt.ts', 'utf8');
// Remove imports
prompt = prompt.replace(/import .*?;\n/g, '');
// Remove type annotations
prompt = prompt.replace(/: Record<SupportedLanguage, string>/g, '');
prompt = prompt.replace(/export function buildAnalyzeSystemPrompt\(language: SupportedLanguage\): string \{/g, 'function buildAnalyzeSystemPrompt(language) {');
prompt = prompt.replace(/export function buildAnalyzeUserPrompt\(documentText: string, language: SupportedLanguage\): string \{/g, 'function buildAnalyzeUserPrompt(documentText, language) {');
prompt = prompt.replace(/export function buildRepairPrompt\(rawOutput: string, errorDetails: string\): string \{/g, 'function buildRepairPrompt(rawOutput, errorDetails) {');
prompt = prompt.replace(/export function buildAskSystemPrompt\([\s\S]*?\): string \{/g, 'function buildAskSystemPrompt(documentText, language, issuer = null, contacts = []) {');

// Expose to window
prompt += '\nwindow.promptBuilder = { LANGUAGE_NAMES, buildAnalyzeSystemPrompt, buildAnalyzeUserPrompt, buildRepairPrompt, buildAskSystemPrompt };\n';
fs.writeFileSync('js/prompts.js', prompt);

console.log('Successfully generated js/i18n.js and js/prompts.js');
