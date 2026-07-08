import {
  SLACK_APPLICATION_COMMANDS,
  SLACK_BUTTON_TEST_ACTIONS,
  SLACK_BUTTON_TEST_ACTION_ID_PREFIX,
  SLACK_DB_RESPONSE_DEADLINE_MS,
  SLACK_PUBLIC_RESPONSE_FLAG,
  SLACK_ROOT_COMMAND_NAME,
} from "../constants/slack.js";
import type {
  ButtonTestAction,
  SlackActionsBlock,
  SlackBlock,
  SlackButtonElement,
  SlackInfoResponseInput,
  SlackProfileResponseInput,
  SlackResponse,
} from "../types/slack.js";

const getResponseType = (publicResponse: boolean): SlackResponse["response_type"] =>
  publicResponse ? "in_channel" : "ephemeral";

export const escapeSlackText = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const section = (text: string): SlackBlock => ({
  type: "section",
  text: {
    type: "mrkdwn",
    text,
  },
});

const divider = (): SlackBlock => ({
  type: "divider",
});

const button = (
  action: ButtonTestAction,
  label: string,
  style?: SlackButtonElement["style"],
): SlackButtonElement => ({
  type: "button",
  text: {
    type: "plain_text",
    text: label,
    emoji: true,
  },
  action_id: `${SLACK_BUTTON_TEST_ACTION_ID_PREFIX}:${action}`,
  value: action,
  ...(style ? { style } : {}),
});

const buttonActions = (): SlackActionsBlock => ({
  type: "actions",
  elements: [
    button(SLACK_BUTTON_TEST_ACTIONS.PRIMARY, "Refresh", "primary"),
    button(SLACK_BUTTON_TEST_ACTIONS.SECONDARY, "Echo"),
    button(SLACK_BUTTON_TEST_ACTIONS.SUCCESS, "Success"),
    button(SLACK_BUTTON_TEST_ACTIONS.DANGER, "Danger", "danger"),
  ],
});

const blockResponse = ({
  blocks,
  publicResponse,
  text,
}: {
  blocks: SlackBlock[];
  publicResponse: boolean;
  text: string;
}): SlackResponse => ({
  response_type: getResponseType(publicResponse),
  text,
  blocks,
});

export const createTextResponseData = (text: string, publicResponse: boolean): SlackResponse => ({
  response_type: getResponseType(publicResponse),
  text,
});

export const createErrorResponseData = (description: string): SlackResponse =>
  createTextResponseData(`Something went wrong: ${description}`, false);

export const withResponseDeadline = (
  work: Promise<SlackResponse>,
  fallback: () => SlackResponse,
): Promise<SlackResponse> => {
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<SlackResponse>((resolve) => {
    timer = setTimeout(() => resolve(fallback()), SLACK_DB_RESPONSE_DEADLINE_MS);
  });

  return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
};

export const createWarmingUpResponseData = (): SlackResponse =>
  createTextResponseData(
    "The database is warming up (Neon scales to zero when idle). Please run the command again in a moment.",
    false,
  );

export const createPingResponseData = (latencyMs: number, publicResponse: boolean): SlackResponse =>
  createTextResponseData(`Pong. Neon Functions handled this Slack request in *${latencyMs}ms*.`, publicResponse);

export const createHelpResponseData = (publicResponse: boolean): SlackResponse =>
  blockResponse({
    publicResponse,
    text: "Neon Slack Bot Help",
    blocks: [
      section("*Neon Slack Bot Help*"),
      divider(),
      section(
        SLACK_APPLICATION_COMMANDS.map(
          (command) => `- \`/${SLACK_ROOT_COMMAND_NAME} ${command.usage}\` - ${command.description}`,
        ).join("\n"),
      ),
      divider(),
      section(`Add \`${SLACK_PUBLIC_RESPONSE_FLAG}\` to a command to post the response in-channel.`),
    ],
  });

export const createInfoResponseData = ({
  branch,
  functionUrl,
  method,
  platform,
  publicResponse,
  runtime,
}: SlackInfoResponseInput): SlackResponse =>
  blockResponse({
    publicResponse,
    text: "Neon Slack Bot Info",
    blocks: [
      section("*Neon Slack Bot Info*"),
      divider(),
      section(
        [
          `- *Runtime:* ${runtime}`,
          `- *Platform:* ${platform}`,
          `- *Request method:* ${method}`,
          `- *Neon branch:* ${escapeSlackText(branch)}`,
          `- *Function URL:* ${escapeSlackText(functionUrl)}`,
        ].join("\n"),
      ),
    ],
  });

export const createProfileResponseData = ({
  name,
  publicResponse,
  totalRuns,
  usageLines,
}: SlackProfileResponseInput): SlackResponse =>
  blockResponse({
    publicResponse,
    text: "Your Profile",
    blocks: [
      section("*Your Profile*"),
      divider(),
      section(
        [
          `- *Name:* ${name ? `*${escapeSlackText(name)}*` : "not set"}`,
          `- *Total commands run:* ${totalRuns}`,
          "- *Storage:* Neon Postgres via Drizzle",
        ].join("\n"),
      ),
      divider(),
      section(["*Command usage*", ...usageLines].join("\n")),
    ],
  });

export const createButtonTestResponseData = (
  publicResponse: boolean,
  status = "Click a button below to test Slack Block Kit interactions.",
): SlackResponse =>
  blockResponse({
    publicResponse,
    text: "Button Test",
    blocks: [section(["*Button Test*", status].join("\n")), divider(), buttonActions()],
  });

export const parseButtonTestActionId = (actionId: string): ButtonTestAction | undefined => {
  const [prefix, action] = actionId.split(":");

  if (prefix !== SLACK_BUTTON_TEST_ACTION_ID_PREFIX) {
    return undefined;
  }

  switch (action) {
    case SLACK_BUTTON_TEST_ACTIONS.PRIMARY:
    case SLACK_BUTTON_TEST_ACTIONS.SECONDARY:
    case SLACK_BUTTON_TEST_ACTIONS.SUCCESS:
    case SLACK_BUTTON_TEST_ACTIONS.DANGER:
      return action;
    default:
      return undefined;
  }
};

export const createButtonTestClickResponseData = (action: ButtonTestAction): SlackResponse => {
  const clickedAt = new Date().toISOString();
  const response = (() => {
    switch (action) {
      case SLACK_BUTTON_TEST_ACTIONS.PRIMARY:
        return createButtonTestResponseData(false, `Refreshed at ${clickedAt}.`);
      case SLACK_BUTTON_TEST_ACTIONS.SECONDARY:
        return createButtonTestResponseData(false, "Echo: the secondary button was clicked.");
      case SLACK_BUTTON_TEST_ACTIONS.SUCCESS:
        return createButtonTestResponseData(false, "Success: the button completed its action.");
      case SLACK_BUTTON_TEST_ACTIONS.DANGER:
        return createButtonTestResponseData(false, "Danger: the red button was clicked. Nothing destructive happened.");
    }
  })();

  return {
    ...response,
    replace_original: true,
  };
};
