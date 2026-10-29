import { expect, test } from "vitest";

import { convertUrl } from "./convert";

const paragraph =
  "지난 분기에 사내 정산 대시보드를 App Router로 옮기면서 클라이언트로 내려가는 JavaScript를 줄이는 데 집중했습니다. 어떤 컴포넌트를 서버로 옮겼고 무엇이 예상과 달랐는지를 기록했습니다.";

const articleHtml = `<!doctype html>
<html lang="ko"><head>
  <title>서버 컴포넌트로 번들 줄이기 | 엔지니어링 블로그</title>
  <meta name="author" content="김지원">
</head><body>
  <nav><a href="/">홈</a><a href="/about">소개</a></nav>
  <article>
    <h1>서버 컴포넌트로 번들 줄이기</h1>
    <p>${paragraph}</p>
    <h2>측정 결과</h2>
    <p>${paragraph}</p>
    <ul><li>번들 41% 감소</li><li>LCP 1.9초</li></ul>
    <p>${paragraph}</p>
  </article>
  <footer>© 엔지니어링 블로그</footer>
</body></html>`;

const htmlResponse = (html: string, init?: ResponseInit) =>
  new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
    ...init,
  });

test("기사 URL을 변환하면 제목, 저자, 도메인, Markdown 본문을 돌려준다", async () => {
  const result = await convertUrl(
    "https://engineering.example.com/posts/bundle",
    async () => htmlResponse(articleHtml)
  );

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.title).toContain("서버 컴포넌트로 번들 줄이기");
  expect(result.author).toBe("김지원");
  expect(result.domain).toBe("engineering.example.com");
  expect(result.markdown).toContain("## 측정 결과");
  expect(result.markdown).toContain("- 번들 41% 감소");
});

test("URL 형식이 아니면 접속하지 않고 invalid-url을 돌려준다", async () => {
  let called = false;
  const fetcher = async () => {
    called = true;
    return htmlResponse("");
  };

  for (const bad of ["", "engineering.example.com/post", "ftp://example.com/a", "http://"]) {
    expect(await convertUrl(bad, fetcher)).toEqual({
      ok: false,
      reason: "invalid-url",
    });
  }
  expect(called).toBe(false);
});

test("접속에 실패하거나 HTML이 아니면 unreachable을 돌려준다", async () => {
  const url = "https://engineering.example.com/posts/bundle";
  const unreachable = { ok: false, reason: "unreachable" };

  const refused = async () => {
    throw new TypeError("fetch failed");
  };
  expect(await convertUrl(url, refused)).toEqual(unreachable);

  const notFound = async () => htmlResponse("없음", { status: 404 });
  expect(await convertUrl(url, notFound)).toEqual(unreachable);

  const pdf = async () =>
    new Response("%PDF-1.7", { headers: { "content-type": "application/pdf" } });
  expect(await convertUrl(url, pdf)).toEqual(unreachable);
});

test("본문이 비어 있는 페이지는 no-content를 돌려준다", async () => {
  const spaShell = `<!doctype html><html><head><title>대시보드</title></head>
    <body><div id="root"></div><script src="/app.js"></script></body></html>`;

  expect(
    await convertUrl("https://app.example.com/dashboard", async () =>
      htmlResponse(spaShell)
    )
  ).toEqual({ ok: false, reason: "no-content" });
});
