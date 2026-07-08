import * as z from "zod";

export const slackSlashCommandSchema = z.object({
  api_app_id: z.string().optional(),
  channel_id: z.string().optional(),
  channel_name: z.string().optional(),
  command: z.string().min(1),
  enterprise_id: z.string().optional(),
  response_url: z.string().url().optional(),
  team_domain: z.string().optional(),
  team_id: z.string().optional(),
  text: z.string().optional().default(""),
  trigger_id: z.string().optional(),
  user_id: z.string().min(1),
  user_name: z.string().optional(),
});

export const slackInteractionPayloadSchema = z.object({
  type: z.string(),
  user: z.object({
    id: z.string().min(1),
    name: z.string().optional(),
    username: z.string().optional(),
  }),
  team: z
    .object({
      id: z.string().optional(),
      domain: z.string().optional(),
    })
    .optional(),
  channel: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  response_url: z.string().url().optional(),
  actions: z
    .array(
      z.object({
        action_id: z.string().optional(),
        type: z.string().optional(),
        value: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
});
