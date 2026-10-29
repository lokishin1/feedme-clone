"use client";

import { useState, type FormEvent } from "react";
import { CircleAlertIcon, XIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import type { ConvertResult } from "./convert";
import { NO_PROMPT, type PromptChoice } from "./llm-prompt";
import { ResultCard, type Page } from "./result-card";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; reason: Extract<ConvertResult, { ok: false }>["reason"] }
  | { kind: "done"; page: Page };

const ERRORS = {
  "invalid-url": [
    "올바른 URL이 아니에요",
    "http:// 또는 https://로 시작하는 전체 주소를 입력해 주세요.",
  ],
  unreachable: [
    "페이지에 접속하지 못했어요",
    "주소가 맞는지, 로그인 없이 외부에서 열 수 있는 페이지인지 확인해 주세요.",
  ],
  "no-content": [
    "본문을 찾지 못했어요",
    "로그인이 필요하거나 자바스크립트로 화면을 그리는 페이지는 본문이 비어 보일 수 있어요.",
  ],
} as const;

const STEPS = [
  ["URL을 붙여넣고 변환", "을 누르세요. 광고와 메뉴를 뺀 본문만 가져와요."],
  ["제목, 저자, 본문", "이 Markdown으로 정리돼 보여요."],
  ["복사·다운로드", "하거나, 프롬프트를 골라 ChatGPT·Claude로 열기를 누르세요."],
] as const;

export function UrlToMarkdown() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [prompt, setPrompt] = useState<PromptChoice>(NO_PROMPT);
  const loading = status.kind === "loading";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!url.trim() || loading) return;

    setStatus({ kind: "loading" });
    let result: ConvertResult;
    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      result = await response.json();
    } catch {
      result = { ok: false, reason: "unreachable" };
    }
    setStatus(
      result.ok
        ? { kind: "done", page: result }
        : { kind: "error", reason: result.reason }
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
          웹 페이지를 Markdown으로
        </h1>
        <p className="text-base text-pretty text-muted-foreground">
          URL을 붙여넣으면 본문만 뽑아 드려요. 복사하거나 ChatGPT·Claude에 바로
          넘겨 보세요.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-2 sm:flex-row"
      >
        <label htmlFor="url-input" className="sr-only">
          웹 페이지 URL
        </label>
        <Input
          id="url-input"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://example.com/article"
          value={url}
          readOnly={loading}
          onChange={(event) => setUrl(event.target.value)}
          className="h-10 flex-1"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1 sm:flex-none"
            disabled={loading || (!url && status.kind === "idle")}
            onClick={() => {
              setUrl("");
              setStatus({ kind: "idle" });
            }}
          >
            <XIcon data-icon="inline-start" />
            지우기
          </Button>
          <Button
            type="submit"
            size="lg"
            className="flex-1 sm:flex-none"
            disabled={!url.trim() || loading}
          >
            변환
          </Button>
        </div>
      </form>

      {status.kind === "error" && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>{ERRORS[status.reason][0]}</AlertTitle>
          <AlertDescription>{ERRORS[status.reason][1]}</AlertDescription>
        </Alert>
      )}

      {status.kind === "idle" && (
        <div className="flex flex-col gap-3 pt-2">
          <p className="text-sm font-medium text-muted-foreground">
            이렇게 사용해요
          </p>
          <ol className="flex flex-col gap-3">
            {STEPS.map(([strong, rest], index) => (
              <li
                key={strong}
                className="flex items-baseline gap-3 text-sm text-muted-foreground"
              >
                <span className="grid size-5.5 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
                  {index + 1}
                </span>
                <span>
                  <b className="font-medium text-foreground">{strong}</b>
                  {rest}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {loading && (
        <Card role="status" aria-label="변환 중">
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
            <Skeleton className="h-3.5 w-3/5" />
          </CardContent>
        </Card>
      )}

      {status.kind === "done" && (
        <ResultCard
          page={status.page}
          prompt={prompt}
          onPromptChange={setPrompt}
        />
      )}
    </div>
  );
}
