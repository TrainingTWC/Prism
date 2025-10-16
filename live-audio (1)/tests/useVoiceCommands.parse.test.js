// This test file assumes a Jest or Vitest-like environment.
// To run: `npm test` or `npx vitest`

import { parseCommand } from '../src/hooks/useVoiceCommands';

describe('useVoiceCommands.parseCommand', () => {

  test('should parse "fill" command with simple target', () => {
    const transcript = "fill the checklist for 12th main";
    const result = parseCommand(transcript);
    expect(result.action).toBe('fill');
    expect(result.target).toBe('12th main');
    expect(result.raw).toBe(transcript);
  });

  test('should parse "open" command with a quoted target', () => {
    const transcript = 'open checklist for "12th Main Cafe"';
    const result = parseCommand(transcript);
    expect(result.action).toBe('open');
    expect(result.target).toBe('12th Main Cafe');
  });

  test('should parse "populate" as a "fill" action', () => {
    const transcript = "let's populate the checklist for crown bakery";
    const result = parseCommand(transcript);
    expect(result.action).toBe('fill');
    expect(result.target).toBe('crown bakery');
  });

  test('should parse "show me" as an "open" action', () => {
    const transcript = 'show me the checklist for downtown';
    const result = parseCommand(transcript);
    expect(result.action).toBe('open');
    expect(result.target).toBe('downtown');
  });
  
  test('should be case-insensitive', () => {
    const transcript = 'FILL the Checklist FOR Uptown Branch';
    const result = parseCommand(transcript);
    expect(result.action).toBe('fill');
    expect(result.target).toBe('uptown branch');
  });

  test('should handle extra words before the command', () => {
    const transcript = "okay prism now open the checklist for the new store";
    const result = parseCommand(transcript);
    expect(result.action).toBe('open');
    expect(result.target).toBe('the new store');
  });

  test('should return "unknown" action for non-matching input', () => {
    const transcript = "what's the weather like today";
    const result = parseCommand(transcript);
    expect(result.action).toBe('unknown');
    expect(result.target).toBe(null);
  });
  
  test('should return "unknown" if a command is given without a target', () => {
    const transcript = 'open the checklist';
    const result = parseCommand(transcript);
    expect(result.action).toBe('unknown');
  });

  test('should handle trailing spaces and words gracefully', () => {
    const transcript = 'complete checklist for riverside please ';
    const result = parseCommand(transcript);
    expect(result.action).toBe('fill');
    expect(result.target).toBe('riverside');
  });
});
