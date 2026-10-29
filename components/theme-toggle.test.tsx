import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { ThemeToggle } from "@/components/theme-toggle";

afterEach(() => {
  document.documentElement.classList.remove("dark");
  localStorage.clear();
});

test("토글을 누르면 다크/라이트가 바뀌고 선택한 값을 기억한다", () => {
  render(<ThemeToggle />);
  const toggle = screen.getByRole("button", { name: "다크모드 전환" });

  fireEvent.click(toggle);
  expect(document.documentElement).toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBe("dark");

  fireEvent.click(toggle);
  expect(document.documentElement).not.toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBe("light");
});
