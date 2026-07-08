import * as z from "zod";
import type { SLACK_BUTTON_TEST_ACTIONS } from "../constants/slack.js";
import type { slackInteractionPayloadSchema, slackSlashCommandSchema } from "../schemas/slack.js";

export type SlackSlashCommand = z.infer<typeof slackSlashCommandSchema>;

export type SlackInteractionPayload = z.infer<typeof slackInteractionPayloadSchema>;

export type SlackMrkdwnText = {
  type: "mrkdwn";
  text: string;
};

export type SlackPlainText = {
  type: "plain_text";
  text: string;
  emoji?: boolean;
};

export type SlackSectionBlock = {
  type: "section";
  text: SlackMrkdwnText;
};

export type SlackDividerBlock = {
  type: "divider";
};

export type SlackButtonElement = {
  type: "button";
  text: SlackPlainText;
  action_id: string;
  value: string;
  style?: "primary" | "danger";
};

export type SlackActionsBlock = {
  type: "actions";
  elements: SlackButtonElement[];
};

export type SlackBlock = SlackSectionBlock | SlackDividerBlock | SlackActionsBlock;

export type SlackResponse = {
  response_type?: "ephemeral" | "in_channel";
  text: string;
  blocks?: SlackBlock[];
  replace_original?: boolean;
};

export type ParsedSlackCommandText = {
  commandName: string;
  args: string[];
  publicResponse: boolean;
};

export type ButtonTestAction = (typeof SLACK_BUTTON_TEST_ACTIONS)[keyof typeof SLACK_BUTTON_TEST_ACTIONS];

export type SlackInfoResponseInput = {
  branch: string;
  functionUrl: string;
  method: string;
  platform: string;
  publicResponse: boolean;
  runtime: string;
};

export type SlackProfileResponseInput = {
  name: string | undefined;
  publicResponse: boolean;
  totalRuns: number;
  usageLines: string[];
};

export type SlackCommandContext = {
  payload: SlackSlashCommand;
  request: Request;
  url: URL;
  requestReceivedAtMs: number;
  commandName: string;
  args: string[];
  publicResponse: boolean;
};

export type SlackCommandHandler = (context: SlackCommandContext) => SlackResponse | Promise<SlackResponse>;

export type VerifySlackRequestInput = {
  body: string;
  signingSecret: string | undefined;
  signature: string | null;
  timestamp: string | null;
};
