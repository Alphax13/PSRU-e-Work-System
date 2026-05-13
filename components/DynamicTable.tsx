"use client";

import { useFieldArray, useFormContext, useController } from "react-hook-form";
import type { EvaluationForm } from "@/lib/schemas";
import FileUploadCell from "@/components/FileUploadCell";
import React, { useRef, useEffect } from "react";

const AutoTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function AutoTextarea(props, forwardedRef) {
  const internalRef = useRef<HTMLTextAreaElement>(null);

  function setRef(el: HTMLTextAreaElement | null) {
    (internalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    if (typeof forwardedRef === "function") forwardedRef(el);
    else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
  }

  function resize() {
    const el = internalRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => { resize(); });

  return (
    <textarea
      {...props}
      ref={setRef}
      rows={1}
      onInput={resize}
      className="w-full resize-none overflow-hidden rounded border border-gray-300 bg-gray-50 px-2 py-1 text-sm leading-snug outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
    />
  );
});
AutoTextarea.displayName = "AutoTextarea";

interface Column {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "file";
  options?: string[]; // for select type
  required?: boolean;
}

interface DynamicTableProps {
  sectionIndex: number;
  columns: Column[];
  periodId?: string;
  sectionNo?: number;
  locked?: boolean;
}

// Controlled file cell — needs useController to set URL back into form state
function FileCell({ sectionIndex, rowIdx, colKey, periodId, sectionNo }: { sectionIndex: number; rowIdx: number; colKey: string; periodId?: string; sectionNo?: number }) {
  const { control } = useFormContext<EvaluationForm>();
  const { field } = useController({
    control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: `sections.${sectionIndex}.rows.${rowIdx}.${colKey}` as any,
  });
  return (
    <FileUploadCell
      value={(field.value as string) ?? ""}
      onChange={field.onChange}
      periodId={periodId}
      sectionNo={sectionNo}
    />
  );
}

export default function DynamicTable({ sectionIndex, columns, periodId, sectionNo, locked }: DynamicTableProps) {
  const { register, control, formState: { errors } } = useFormContext<EvaluationForm>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.rows`,
  });

  function addRow() {
    const empty: Record<string, string> = {};
    columns.forEach((col) => (empty[col.key] = ""));
    append(empty);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700"
              >
                {col.label}
                {col.required && <span className="ml-1 text-red-500">*</span>}
              </th>
            ))}
            {!locked && <th className="border border-gray-200 px-3 py-2 text-center w-16">ลบ</th>}
          </tr>
        </thead>
        <tbody>
          {fields.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="border border-gray-200 py-6 text-center text-gray-400"
              >
                ยังไม่มีข้อมูล — กด "เพิ่มแถว" เพื่อเริ่มกรอก
              </td>
            </tr>
          )}
          {fields.map((field, rowIdx) => (
            <tr key={field.id} className="odd:bg-white even:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="border border-gray-200 px-2 py-1">
                  {col.type === "file" ? (
                    <FileCell
                      sectionIndex={sectionIndex}
                      rowIdx={rowIdx}
                      colKey={col.key}
                      periodId={periodId}
                      sectionNo={sectionNo}
                    />
                  ) : col.type === "select" ? (
                    <select
                      {...register(`sections.${sectionIndex}.rows.${rowIdx}.${col.key}`)}
                      disabled={locked}
                      className="w-full rounded border border-gray-300 bg-gray-50 px-2 py-1 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">-- เลือก --</option>
                      {col.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : col.type === "text" || col.type === undefined ? (
                    <AutoTextarea
                      {...register(`sections.${sectionIndex}.rows.${rowIdx}.${col.key}`)}
                      disabled={locked}
                    />
                  ) : (
                    <input
                      type={col.type}
                      {...register(`sections.${sectionIndex}.rows.${rowIdx}.${col.key}`)}
                      disabled={locked}
                      className="w-full rounded border border-gray-300 bg-gray-50 px-2 py-1 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  )}
                </td>
              ))}
              {!locked && (
                <td className="border border-gray-200 px-2 py-1 text-center">
                  <button
                    type="button"
                    onClick={() => remove(rowIdx)}
                    className="rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-50"
                  >
                    ลบ
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {!locked && (
        <button
          type="button"
          onClick={addRow}
          className="mt-3 rounded-lg border border-dashed border-[#F5C400]/50 px-4 py-1.5 text-sm text-[#7a5c00] hover:bg-[#FFFDE7]"
        >
          + เพิ่มแถว
        </button>
      )}
    </div>
  );
}
