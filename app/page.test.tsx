import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "@/app/page";

test("홈 화면은 URL 입력과 사용 방법을 보여준다", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: "웹 페이지를 Markdown으로" })
  ).toBeInTheDocument();
  expect(screen.getByLabelText("웹 페이지 URL")).toHaveValue("");
  expect(screen.getByRole("button", { name: "변환" })).toBeDisabled();
  expect(screen.getByText("이렇게 사용해요")).toBeInTheDocument();
});
