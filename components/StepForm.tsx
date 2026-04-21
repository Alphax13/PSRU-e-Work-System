"use client";

import { useState } from "react";

interface StepFormProps {
  steps: { label: string; content: React.ReactNode }[];
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export default function StepForm({ steps, onSubmit, isSubmitting }: StepFormProps) {
  const [current, setCurrent] = useState(0);
  const isFirst = current === 0;
  const isLast = current === steps.length - 1;

  return (
    <div>
      {/* Step indicators */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCurrent(i)}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition
                ${i === current
                  ? "bg-blue-600 text-white"
                  : i < current
                  ? "bg-blue-200 text-blue-800"
                  : "bg-gray-200 text-gray-500"
                }`}
            >
              {i + 1}
            </button>
            <span
              className={`text-sm ${i === current ? "font-semibold text-gray-800" : "text-gray-500"}`}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <span className="text-gray-300">›</span>
            )}
          </div>
        ))}
      </div>

      {/* Current step content */}
      <div className="min-h-[200px]">{steps[current].content}</div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={() => setCurrent((c) => c - 1)}
          disabled={isFirst}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          ← ย้อนกลับ
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? "กำลังบันทึก…" : "ส่งแบบประเมิน"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrent((c) => c + 1)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            ถัดไป →
          </button>
        )}
      </div>
    </div>
  );
}
