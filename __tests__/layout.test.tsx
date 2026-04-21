import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RootLayout from "../app/layout";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans", className: "mock-geist" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono", className: "mock-geist-mono" }),
}));

// RootLayout은 <html>/<body>를 렌더링하므로 container를 document.documentElement로 설정
function renderLayout(children: React.ReactNode) {
  return render(<RootLayout>{children}</RootLayout>, {
    container: document.documentElement,
  });
}

describe("RootLayout", () => {
  it("children을 렌더링한다", () => {
    renderLayout(<p>자식 콘텐츠</p>);
    expect(screen.getByText("자식 콘텐츠")).toBeInTheDocument();
  });

  it("<html> 요소의 lang 속성이 'en'이다", () => {
    renderLayout(<span />);
    expect(document.documentElement).toHaveAttribute("lang", "en");
  });

  it("<body> 안에 children이 위치한다", () => {
    renderLayout(<div data-testid="child">내용</div>);
    const child = screen.getByTestId("child");
    expect(document.body).toContainElement(child);
  });
});
