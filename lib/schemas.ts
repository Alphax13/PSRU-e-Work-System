import { z } from "zod";

// One row inside a DynamicTable section
export const entryRowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));

// A single section's form data
export const sectionFormSchema = z.object({
  section_id: z.string().uuid(),
  rows: z.array(entryRowSchema).min(0),
});

// Full evaluation form (array of sections)
export const evaluationFormSchema = z.object({
  sections: z.array(sectionFormSchema),
});

export type EntryRow = z.infer<typeof entryRowSchema>;
export type SectionForm = z.infer<typeof sectionFormSchema>;
export type EvaluationForm = z.infer<typeof evaluationFormSchema>;
