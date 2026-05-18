import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const createRtoSchema = z.object({
  name: z.string().min(2, 'RTO name must be at least 2 characters.'),
  asqa_code: z
    .string()
    .regex(/^\d{5}$/, 'ASQA code must be a 5-digit number.'),
  operating_states: z
    .array(z.enum(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']))
    .min(1, 'Select at least one state.'),
  contact_name: z.string().optional(),
  contact_email: z
    .string()
    .email('Please enter a valid email address.')
    .optional()
    .or(z.literal('')),
  contact_phone: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type CreateRtoFormValues = z.infer<typeof createRtoSchema>;
