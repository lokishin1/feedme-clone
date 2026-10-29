"use client";

import { useRef, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type { ConvertResult } from "./convert";
import { downloadMarkdown } from "./download-markdown";
import {
  LLM_TARGETS,
  PRESETS,
  promptText,
  withPrompt,
  type PromptChoice,
  type PromptKey,
} from "./llm-prompt";
import { MarkdownView } from "./markdown-view";

export type Page = Extract<ConvertResult, { ok: true }>;

type Notice = { ok: boolean; text: string };

export function ResultCard({
  page,
  prompt,
  onPromptChange,
}: {
  page: Page;
  prompt: PromptChoice;
  onPromptChange: (prompt: PromptChoice) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const selected = promptText(prompt);

  async function copyMarkdown() {
    await navigator.clipboard.writeText(page.markdown);
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  }

  async function openIn(target: keyof typeof LLM_TARGETS) {
    const { label, url } = LLM_TARGETS[target];
    // 클릭 직후 같은 틱에서 복사를 시작하고 탭을 열어야 브라우저가 막지 않는다.
    const copy = navigator.clipboard.writeText(withPrompt(prompt, page.markdown));
    window.open(url, "_blank", "noopener");
    try {
      await copy;
      setNotice({
        ok: true,
        text: `클립보드에 복사했어요. 열린 ${label} 탭에 붙여넣으세요.`,
      });
    } catch {
      setNotice({
        ok: false,
        text: "클립보드에 복사하지 못했어요. 복사하기 버튼으로 본문을 직접 복사해 주세요.",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2} className="text-xl">
          {page.title}
        </CardTitle>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          {page.author && (
            <>
              <span className="font-medium text-foreground">{page.author}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <span>{page.domain}</span>
          <span aria-hidden>·</span>
          <span>본문 {page.markdown.length.toLocaleString("ko-KR")}자</span>
        </p>
      </CardHeader>

      <Separator />

      <CardContent className="flex-row flex-wrap gap-2">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={copyMarkdown}
        >
          {copied ? (
            <CheckIcon data-icon="inline-start" />
          ) : (
            <CopyIcon data-icon="inline-start" />
          )}
          {copied ? "복사됨" : "복사하기"}
        </Button>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => downloadMarkdown(page.title, page.markdown)}
        >
          <DownloadIcon data-icon="inline-start" />
          .md 다운로드
        </Button>
      </CardContent>

      <Separator />

      <CardContent className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[0.9375rem] font-semibold">LLM으로 보내기</h3>
          <p className="text-sm text-muted-foreground">
            프롬프트는 고르지 않아도 돼요. 고르면 본문 앞에 붙어요.
          </p>
        </div>

        <ToggleGroup
          aria-label="프롬프트"
          variant="outline"
          size="sm"
          className="flex-wrap"
          value={prompt.key ? [prompt.key] : []}
          onValueChange={(value) =>
            onPromptChange({ ...prompt, key: (value[0] as PromptKey) ?? null })
          }
        >
          {PRESETS.map(({ key, label }) => (
            <ToggleGroupItem key={key} value={key}>
              {prompt.key === key && <CheckIcon data-icon="inline-start" />}
              {label}
            </ToggleGroupItem>
          ))}
          <ToggleGroupItem value="custom">
            {prompt.key === "custom" && <CheckIcon data-icon="inline-start" />}
            직접 입력
          </ToggleGroupItem>
        </ToggleGroup>

        {prompt.key === "custom" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="custom-prompt" className="sr-only">
              직접 입력한 프롬프트
            </label>
            <Input
              id="custom-prompt"
              className="h-10"
              autoComplete="off"
              placeholder="예: 핵심만 세 줄로 정리하고 반론도 알려줘"
              value={prompt.custom}
              onChange={(event) =>
                onPromptChange({ ...prompt, custom: event.target.value })
              }
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              직접 입력한 내용은 저장하지 않아요. 새로고침하면 사라져요.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          {(Object.keys(LLM_TARGETS) as (keyof typeof LLM_TARGETS)[]).map(
            (target) => (
              <Button
                key={target}
                className="sm:flex-none"
                onClick={() => openIn(target)}
              >
                {LLM_TARGETS[target].label}로 열기
                <ExternalLinkIcon data-icon="inline-end" />
              </Button>
            )
          )}
        </div>

        <p
          aria-live="polite"
          className={
            notice?.ok
              ? "min-h-5 text-sm text-foreground"
              : "min-h-5 text-sm text-muted-foreground"
          }
        >
          {notice?.text ??
            (selected
              ? `「${selected}」가 본문 앞에 붙어 복사돼요.`
              : "프롬프트 없이 본문만 복사돼요.")}
        </p>
      </CardContent>

      <Separator />

      <CardContent>
        <MarkdownView markdown={page.markdown} />
      </CardContent>
    </Card>
  );
}
