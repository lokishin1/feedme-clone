"use client";

import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  function toggle() {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // 저장소를 쓸 수 없어도 현재 화면에는 적용된다.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="다크모드 전환"
      onClick={toggle}
    >
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </Button>
  );
}
