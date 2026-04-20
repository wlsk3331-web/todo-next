"use client";

import { useState } from "react";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  deadline: string;
}

function deadlineLabel(deadline?: string): { text: string; className: string } | null {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: "기한 초과", className: "text-red-500" };
  if (diff === 0) return { text: "오늘 마감", className: "text-orange-500" };
  if (diff === 1) return { text: "내일 마감", className: "text-yellow-500" };
  return { text: `${due.getMonth() + 1}/${due.getDate()} 마감`, className: "text-gray-400" };
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [deadline, setDeadline] = useState("");
  const [errors, setErrors] = useState<{ text?: string; deadline?: string }>({});

  const addTodo = () => {
    const text = input.trim();
    const newErrors: { text?: string; deadline?: string } = {};
    if (!text) newErrors.text = "할 일을 입력하세요.";
    if (!deadline) newErrors.deadline = "작업 기한을 선택하세요.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setTodos([...todos, { id: Date.now(), text, completed: false, deadline }]);
    setInput("");
    setDeadline("");
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Todo List</h1>

        <div className="flex flex-col gap-2 mb-4">
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <input
                type="text"
                value={input}
                onChange={(e) => { setInput(e.target.value); setErrors((p) => ({ ...p, text: undefined })); }}
                onKeyDown={(e) => e.key === "Enter" && addTodo()}
                placeholder="할 일을 입력하세요"
                className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.text ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.text && <p className="text-xs text-red-500">{errors.text}</p>}
            </div>
            <button
              onClick={addTodo}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors self-start"
            >
              추가
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">작업 기한 <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={deadline}
                min={today}
                onChange={(e) => { setDeadline(e.target.value); setErrors((p) => ({ ...p, deadline: undefined })); }}
                className={`flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 ${errors.deadline ? "border-red-400" : "border-gray-300"}`}
              />
              {deadline && (
                <button
                  onClick={() => setDeadline("")}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  초기화
                </button>
              )}
            </div>
            {errors.deadline && <p className="text-xs text-red-500 pl-14">{errors.deadline}</p>}
          </div>
        </div>

        {todos.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">할 일이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {todos.map((todo) => {
              const label = deadlineLabel(todo.deadline);
              return (
                <li
                  key={todo.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="w-4 h-4 accent-blue-500 cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className={`block text-sm truncate ${
                        todo.completed ? "line-through text-gray-400" : "text-gray-700"
                      }`}
                    >
                      {todo.text}
                    </span>
                    {label && (
                      <span className={`text-xs ${todo.completed ? "text-gray-300" : label.className}`}>
                        {label.text}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors shrink-0"
                  >
                    삭제
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {todos.length > 0 && (
          <p className="text-xs text-gray-400 text-right mt-4">
            {todos.filter((t) => t.completed).length}/{todos.length} 완료
          </p>
        )}
      </div>
    </main>
  );
}
