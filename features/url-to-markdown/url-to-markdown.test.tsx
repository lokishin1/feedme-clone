import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { UrlToMarkdown } from "./url-to-markdown";

const article = {
  ok: true,
  title: "서버 컴포넌트로 번들 줄이기",
  author: "김지원",
  domain: "engineering.example.com",
  markdown: "> 번들 41% 감소\n\n## 측정 결과\n\n- 번들 1,284KB → 758KB",
};

function stubConvert(body: unknown) {
  const fetchMock = vi.fn(async () => Response.json(body));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function convert(url: string) {
  fireEvent.change(screen.getByLabelText("웹 페이지 URL"), {
    target: { value: url },
  });
  fireEvent.click(screen.getByRole("button", { name: "변환" }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("URL을 변환하면 제목, 저자, 렌더링된 Markdown 본문을 보여준다", async () => {
  stubConvert(article);
  render(<UrlToMarkdown />);

  convert("https://engineering.example.com/posts/bundle");

  expect(
    await screen.findByRole("heading", { level: 2, name: article.title })
  ).toBeInTheDocument();
  expect(screen.getByText("김지원")).toBeInTheDocument();
  expect(screen.getByText("engineering.example.com")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { level: 2, name: "측정 결과" })
  ).toBeInTheDocument();
  expect(screen.getByText("번들 1,284KB → 758KB")).toBeInTheDocument();
});

test.each([
  ["invalid-url", "올바른 URL이 아니에요"],
  ["unreachable", "페이지에 접속하지 못했어요"],
  ["no-content", "본문을 찾지 못했어요"],
])("변환에 실패하면(%s) 오류를 보여주고 입력한 URL은 유지한다", async (reason, message) => {
  stubConvert({ ok: false, reason });
  render(<UrlToMarkdown />);

  convert("https://app.example.com/dashboard");

  expect(await screen.findByRole("alert")).toHaveTextContent(message);
  expect(screen.getByLabelText("웹 페이지 URL")).toHaveValue(
    "https://app.example.com/dashboard"
  );
});

test("서버에 닿지 못해도 접속 실패 오류를 보여준다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    })
  );
  render(<UrlToMarkdown />);

  convert("https://app.example.com/dashboard");

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "페이지에 접속하지 못했어요"
  );
});

test("지우기를 누르면 입력, 결과, 오류가 모두 처음 상태로 돌아간다", async () => {
  stubConvert(article);
  render(<UrlToMarkdown />);
  convert("https://engineering.example.com/posts/bundle");
  await screen.findByRole("heading", { level: 2, name: article.title });

  fireEvent.click(screen.getByRole("button", { name: "지우기" }));

  expect(screen.getByLabelText("웹 페이지 URL")).toHaveValue("");
  expect(
    screen.queryByRole("heading", { level: 2, name: article.title })
  ).not.toBeInTheDocument();
  expect(screen.getByText("이렇게 사용해요")).toBeInTheDocument();

  stubConvert({ ok: false, reason: "no-content" });
  convert("https://app.example.com/dashboard");
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "지우기" }));

  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByLabelText("웹 페이지 URL")).toHaveValue("");
});

function stubClipboard() {
  const writeText = vi.fn(async () => {});
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

async function showResult() {
  stubConvert(article);
  render(<UrlToMarkdown />);
  convert("https://engineering.example.com/posts/bundle");
  await screen.findByRole("heading", { level: 2, name: article.title });
}

test("복사하기는 프롬프트를 골라도 순수 Markdown만 복사한다", async () => {
  const writeText = stubClipboard();
  await showResult();

  fireEvent.click(screen.getByRole("button", { name: "요약해줘" }));
  fireEvent.click(screen.getByRole("button", { name: "복사하기" }));

  expect(writeText).toHaveBeenCalledWith(article.markdown);
  expect(await screen.findByRole("button", { name: "복사됨" })).toBeInTheDocument();
});

test.each([
  ["ChatGPT로 열기", "https://chatgpt.com/"],
  ["Claude로 열기", "https://claude.ai/new"],
])("%s는 프롬프트, 빈 줄, 본문 순서로 복사하고 새 탭을 연다", async (button, target) => {
  const writeText = stubClipboard();
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  await showResult();

  fireEvent.click(screen.getByRole("button", { name: "한국어로 번역해줘" }));
  fireEvent.click(screen.getByRole("button", { name: button }));

  expect(writeText).toHaveBeenCalledWith(
    `한국어로 번역해줘\n\n${article.markdown}`
  );
  expect(open).toHaveBeenCalledWith(target, "_blank", "noopener");
  expect(await screen.findByText(/클립보드에 복사했어요/)).toBeInTheDocument();
});

test("프롬프트를 고르지 않거나 다시 눌러 해제하면 열기는 본문만 복사한다", async () => {
  const writeText = stubClipboard();
  vi.spyOn(window, "open").mockReturnValue(null);
  await showResult();

  fireEvent.click(screen.getByRole("button", { name: "ChatGPT로 열기" }));
  expect(writeText).toHaveBeenLastCalledWith(article.markdown);

  const easy = screen.getByRole("button", { name: "쉽게 설명해줘" });
  fireEvent.click(easy);
  expect(easy).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(easy);
  expect(easy).toHaveAttribute("aria-pressed", "false");

  fireEvent.click(screen.getByRole("button", { name: "Claude로 열기" }));
  expect(writeText).toHaveBeenLastCalledWith(article.markdown);
});

test("직접 입력을 고르면 입력창이 나타나고 입력한 문구가 본문 앞에 붙는다", async () => {
  const writeText = stubClipboard();
  vi.spyOn(window, "open").mockReturnValue(null);
  await showResult();
  expect(screen.queryByLabelText("직접 입력한 프롬프트")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "직접 입력" }));
  const input = screen.getByLabelText("직접 입력한 프롬프트");
  fireEvent.click(screen.getByRole("button", { name: "Claude로 열기" }));
  expect(writeText).toHaveBeenLastCalledWith(article.markdown);

  fireEvent.change(input, { target: { value: "핵심만 세 줄로 정리해줘" } });
  fireEvent.click(screen.getByRole("button", { name: "Claude로 열기" }));
  expect(writeText).toHaveBeenLastCalledWith(
    `핵심만 세 줄로 정리해줘\n\n${article.markdown}`
  );
  expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain(
    "핵심만"
  );
});

test("지우기를 눌러도 선택한 프롬프트는 유지된다", async () => {
  stubClipboard();
  await showResult();
  fireEvent.click(screen.getByRole("button", { name: "요약해줘" }));

  fireEvent.click(screen.getByRole("button", { name: "지우기" }));
  convert("https://engineering.example.com/posts/bundle");
  await screen.findByRole("heading", { level: 2, name: article.title });

  expect(screen.getByRole("button", { name: "요약해줘" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test(".md 다운로드는 화면과 같은 Markdown을 제목으로 만든 파일 이름으로 내려받는다", async () => {
  const blobs: Blob[] = [];
  const createObjectURL = vi.fn((blob: Blob) => {
    blobs.push(blob);
    return "blob:test";
  });
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
  let downloaded = "";
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    downloaded = this.download;
  });
  await showResult();

  fireEvent.click(screen.getByRole("button", { name: ".md 다운로드" }));

  expect(downloaded).toBe("서버-컴포넌트로-번들-줄이기.md");
  expect(await blobs[0].text()).toBe(article.markdown);
});
