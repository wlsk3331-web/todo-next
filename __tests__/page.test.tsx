import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../app/page";

// Date만 fake — setTimeout/setInterval은 그대로 두어 userEvent가 정상 작동
const FIXED_TODAY = new Date("2026-04-21T00:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(FIXED_TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

function getDateInput(): HTMLInputElement {
  return document.querySelector('input[type="date"]') as HTMLInputElement;
}

function setup() {
  const user = userEvent.setup();
  render(<Home />);
  return { user };
}

// "N/M 완료" 형태의 텍스트는 여러 text node로 분리 렌더링됨 → textContent로 매칭
function byExactText(text: string) {
  return (_: string, el: Element | null) => el?.textContent === text;
}

// ─── 초기 렌더링 ────────────────────────────────────────────────────────────

describe("초기 렌더링", () => {
  it("제목 'Todo List'가 표시된다", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Todo List" })).toBeInTheDocument();
  });

  it("빈 상태 메시지 '할 일이 없습니다.'가 표시된다", () => {
    setup();
    expect(screen.getByText("할 일이 없습니다.")).toBeInTheDocument();
  });

  it("텍스트 입력 필드, 날짜 입력 필드, 추가 버튼이 렌더링된다", () => {
    setup();
    expect(screen.getByPlaceholderText("할 일을 입력하세요")).toBeInTheDocument();
    expect(getDateInput()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "추가" })).toBeInTheDocument();
  });

  it("진행 카운터와 초기화 버튼이 없다", () => {
    setup();
    expect(screen.queryByText(/완료/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "초기화" })).not.toBeInTheDocument();
  });
});

// ─── 유효성 검사 ─────────────────────────────────────────────────────────────

describe("유효성 검사", () => {
  it("텍스트와 기한 모두 비어 있으면 두 에러 메시지가 표시된다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByText("할 일을 입력하세요.")).toBeInTheDocument();
    expect(screen.getByText("작업 기한을 선택하세요.")).toBeInTheDocument();
  });

  it("텍스트만 비어 있으면 텍스트 에러 메시지만 표시된다", async () => {
    const { user } = setup();
    fireEvent.change(getDateInput(), { target: { value: "2026-04-25" } });
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByText("할 일을 입력하세요.")).toBeInTheDocument();
    expect(screen.queryByText("작업 기한을 선택하세요.")).not.toBeInTheDocument();
  });

  it("기한만 비어 있으면 기한 에러 메시지만 표시된다", async () => {
    const { user } = setup();
    await user.type(screen.getByPlaceholderText("할 일을 입력하세요"), "테스트");
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.queryByText("할 일을 입력하세요.")).not.toBeInTheDocument();
    expect(screen.getByText("작업 기한을 선택하세요.")).toBeInTheDocument();
  });

  it("공백만 입력한 경우에도 텍스트 에러가 표시된다", async () => {
    const { user } = setup();
    await user.type(screen.getByPlaceholderText("할 일을 입력하세요"), "   ");
    fireEvent.change(getDateInput(), { target: { value: "2026-04-25" } });
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByText("할 일을 입력하세요.")).toBeInTheDocument();
  });

  it("텍스트 입력 시 텍스트 에러가 사라진다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByText("할 일을 입력하세요.")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("할 일을 입력하세요"), "A");
    expect(screen.queryByText("할 일을 입력하세요.")).not.toBeInTheDocument();
  });

  it("기한 변경 시 기한 에러가 사라진다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByText("작업 기한을 선택하세요.")).toBeInTheDocument();
    fireEvent.change(getDateInput(), { target: { value: "2026-04-25" } });
    expect(screen.queryByText("작업 기한을 선택하세요.")).not.toBeInTheDocument();
  });
});

// ─── 할 일 추가 ─────────────────────────────────────────────────────────────

describe("할 일 추가", () => {
  it("버튼 클릭으로 할 일이 추가된다", async () => {
    const { user } = setup();
    await user.type(screen.getByPlaceholderText("할 일을 입력하세요"), "운동하기");
    fireEvent.change(getDateInput(), { target: { value: "2026-04-25" } });
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByText("운동하기")).toBeInTheDocument();
    expect(screen.queryByText("할 일이 없습니다.")).not.toBeInTheDocument();
  });

  it("Enter 키로 할 일이 추가된다", async () => {
    const { user } = setup();
    fireEvent.change(getDateInput(), { target: { value: "2026-04-25" } });
    await user.type(screen.getByPlaceholderText("할 일을 입력하세요"), "독서하기{Enter}");
    expect(screen.getByText("독서하기")).toBeInTheDocument();
  });

  it("추가 후 텍스트 입력 필드와 기한이 초기화된다", async () => {
    const { user } = setup();
    const textInput = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(textInput, "산책하기");
    fireEvent.change(getDateInput(), { target: { value: "2026-04-25" } });
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(textInput).toHaveValue("");
    expect(getDateInput()).toHaveValue("");
  });

  it("여러 할 일을 순서대로 추가할 수 있다", async () => {
    const { user } = setup();

    await user.type(screen.getByPlaceholderText("할 일을 입력하세요"), "첫 번째");
    fireEvent.change(getDateInput(), { target: { value: "2026-04-25" } });
    await user.click(screen.getByRole("button", { name: "추가" }));

    vi.setSystemTime(new Date(FIXED_TODAY.getTime() + 1)); // ID 충돌 방지
    await user.type(screen.getByPlaceholderText("할 일을 입력하세요"), "두 번째");
    fireEvent.change(getDateInput(), { target: { value: "2026-04-26" } });
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByText("첫 번째")).toBeInTheDocument();
    expect(screen.getByText("두 번째")).toBeInTheDocument();
  });
});

// ─── 할 일 토글 ─────────────────────────────────────────────────────────────

describe("할 일 완료 토글", () => {
  async function addTodo(user: ReturnType<typeof userEvent.setup>, text: string) {
    await user.type(screen.getByPlaceholderText("할 일을 입력하세요"), text);
    fireEvent.change(getDateInput(), { target: { value: "2026-04-25" } });
    await user.click(screen.getByRole("button", { name: "추가" }));
  }

  it("체크박스 클릭 시 텍스트에 취소선이 생긴다", async () => {
    const { user } = setup();
    await addTodo(user, "완료 테스트");
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByText("완료 테스트")).toHaveClass("line-through");
  });

  it("완료된 할 일을 다시 클릭하면 취소선이 제거된다", async () => {
    const { user } = setup();
    await addTodo(user, "되돌리기 테스트");
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    await user.click(checkbox);
    expect(screen.getByText("되돌리기 테스트")).not.toHaveClass("line-through");
  });

  it("진행 카운터가 올바르게 업데이트된다", async () => {
    const { user } = setup();
    await addTodo(user, "항목 1");
    vi.setSystemTime(new Date(FIXED_TODAY.getTime() + 1)); // ID 충돌 방지
    await addTodo(user, "항목 2");

    expect(screen.getByText(byExactText("0/2 완료"))).toBeInTheDocument();

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    expect(screen.getByText(byExactText("1/2 완료"))).toBeInTheDocument();

    await user.click(checkboxes[1]);
    expect(screen.getByText(byExactText("2/2 완료"))).toBeInTheDocument();
  });
});

// ─── 할 일 삭제 ─────────────────────────────────────────────────────────────

describe("할 일 삭제", () => {
  it("삭제 버튼 클릭 시 해당 항목이 제거된다", async () => {
    const { user } = setup();
    await user.type(screen.getByPlaceholderText("할 일을 입력하세요"), "삭제할 항목");
    fireEvent.change(getDateInput(), { target: { value: "2026-04-25" } });
    await user.click(screen.getByRole("button", { name: "추가" }));

    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(screen.queryByText("삭제할 항목")).not.toBeInTheDocument();
  });

  it("마지막 항목 삭제 시 빈 상태 메시지가 표시된다", async () => {
    const { user } = setup();
    await user.type(screen.getByPlaceholderText("할 일을 입력하세요"), "유일한 항목");
    fireEvent.change(getDateInput(), { target: { value: "2026-04-25" } });
    await user.click(screen.getByRole("button", { name: "추가" }));

    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(screen.getByText("할 일이 없습니다.")).toBeInTheDocument();
  });

  it("여러 항목 중 특정 항목만 삭제된다", async () => {
    const { user } = setup();

    await user.type(screen.getByPlaceholderText("할 일을 입력하세요"), "남길 항목");
    fireEvent.change(getDateInput(), { target: { value: "2026-04-25" } });
    await user.click(screen.getByRole("button", { name: "추가" }));

    vi.setSystemTime(new Date(FIXED_TODAY.getTime() + 1)); // ID 충돌 방지
    await user.type(screen.getByPlaceholderText("할 일을 입력하세요"), "지울 항목");
    fireEvent.change(getDateInput(), { target: { value: "2026-04-26" } });
    await user.click(screen.getByRole("button", { name: "추가" }));

    const listItems = screen.getAllByRole("listitem");
    const targetItem = listItems.find((li) => within(li).queryByText("지울 항목"))!;
    await user.click(within(targetItem).getByRole("button", { name: "삭제" }));

    expect(screen.getByText("남길 항목")).toBeInTheDocument();
    expect(screen.queryByText("지울 항목")).not.toBeInTheDocument();
  });
});

// ─── 기한 라벨 (deadlineLabel) ──────────────────────────────────────────────

describe("기한 라벨", () => {
  async function addTodoWithDeadline(
    user: ReturnType<typeof userEvent.setup>,
    deadline: string
  ) {
    await user.type(screen.getByPlaceholderText("할 일을 입력하세요"), "테스트");
    fireEvent.change(getDateInput(), { target: { value: deadline } });
    await user.click(screen.getByRole("button", { name: "추가" }));
  }

  it("오늘 이전 날짜는 '기한 초과'를 빨간색으로 표시한다", async () => {
    const { user } = setup();
    await addTodoWithDeadline(user, "2026-04-20");
    const label = screen.getByText("기한 초과");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("text-red-500");
  });

  it("오늘 날짜는 '오늘 마감'을 주황색으로 표시한다", async () => {
    const { user } = setup();
    await addTodoWithDeadline(user, "2026-04-21");
    const label = screen.getByText("오늘 마감");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("text-orange-500");
  });

  it("내일 날짜는 '내일 마감'을 노란색으로 표시한다", async () => {
    const { user } = setup();
    await addTodoWithDeadline(user, "2026-04-22");
    const label = screen.getByText("내일 마감");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("text-yellow-500");
  });

  it("먼 미래 날짜는 'M/D 마감' 형식을 회색으로 표시한다", async () => {
    const { user } = setup();
    await addTodoWithDeadline(user, "2026-04-25");
    const label = screen.getByText("4/25 마감");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("text-gray-400");
  });

  it("완료 상태에서는 기한 라벨이 회색(text-gray-300)으로 변경된다", async () => {
    const { user } = setup();
    await addTodoWithDeadline(user, "2026-04-20");
    const label = screen.getByText("기한 초과");
    expect(label).toHaveClass("text-red-500");

    await user.click(screen.getByRole("checkbox"));
    expect(label).toHaveClass("text-gray-300");
    expect(label).not.toHaveClass("text-red-500");
  });
});

// ─── 기한 초기화 버튼 ──────────────────────────────────────────────────────

describe("기한 초기화 버튼", () => {
  it("기한 입력 전에는 초기화 버튼이 없다", () => {
    setup();
    expect(screen.queryByRole("button", { name: "초기화" })).not.toBeInTheDocument();
  });

  it("기한 입력 후 초기화 버튼이 나타난다", () => {
    setup();
    fireEvent.change(getDateInput(), { target: { value: "2026-04-25" } });
    expect(screen.getByRole("button", { name: "초기화" })).toBeInTheDocument();
  });

  it("초기화 버튼 클릭 시 기한이 비워진다", async () => {
    const { user } = setup();
    fireEvent.change(getDateInput(), { target: { value: "2026-04-25" } });
    await user.click(screen.getByRole("button", { name: "초기화" }));
    expect(getDateInput()).toHaveValue("");
    expect(screen.queryByRole("button", { name: "초기화" })).not.toBeInTheDocument();
  });
});
