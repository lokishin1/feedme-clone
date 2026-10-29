export const PRESETS = [
  { key: "summary", label: "요약해줘" },
  { key: "translate", label: "한국어로 번역해줘" },
  { key: "easy", label: "쉽게 설명해줘" },
] as const;

export type PromptKey = (typeof PRESETS)[number]["key"] | "custom";

export type PromptChoice = { key: PromptKey | null; custom: string };

export const NO_PROMPT: PromptChoice = { key: null, custom: "" };

export const LLM_TARGETS = {
  chatgpt: { label: "ChatGPT", url: "https://chatgpt.com/" },
  claude: { label: "Claude", url: "https://claude.ai/new" },
} as const;

export function promptText({ key, custom }: PromptChoice): string {
  if (key === "custom") return custom.trim();
  return PRESETS.find((preset) => preset.key === key)?.label ?? "";
}

export function withPrompt(choice: PromptChoice, markdown: string): string {
  const prompt = promptText(choice);
  return prompt ? `${prompt}\n\n${markdown}` : markdown;
}
