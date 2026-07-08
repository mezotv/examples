import {
  SLACK_BUTTONS_COMMAND_NAME,
  SLACK_HELP_COMMAND_NAME,
  SLACK_INFO_COMMAND_NAME,
  SLACK_INTERACTIONS_PATH,
  SLACK_NAME_COMMAND_NAME,
  SLACK_PING_COMMAND_NAME,
  SLACK_PROFILE_COMMAND_NAME,
  SLACK_PUBLIC_RESPONSE_FLAG,
  SLACK_ROOT_COMMAND_NAME,
} from "../constants/slack.js";
import type {
  ParsedSlackCommandText,
  SlackCommandHandler,
  SlackResponse,
  SlackSlashCommand,
} from "../types/slack.js";
import { getCommandUsage, getStoredName, setStoredName, trackCommandRun } from "./userNames.js";
import {
  createButtonTestResponseData,
  createErrorResponseData,
  createHelpResponseData,
  createInfoResponseData,
  createPingResponseData,
  createProfileResponseData,
  createTextResponseData,
  createWarmingUpResponseData,
  escapeSlackText,
  withResponseDeadline,
} from "./slackResponses.js";

export const parseSlackCommandText = (text: string): ParsedSlackCommandText => {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const commandTokens: string[] = [];
  let publicResponse = false;

  for (const token of tokens) {
    if (token === SLACK_PUBLIC_RESPONSE_FLAG) {
      publicResponse = true;
    } else {
      commandTokens.push(token);
    }
  }

  return {
    commandName: commandTokens.shift()?.toLowerCase() ?? SLACK_HELP_COMMAND_NAME,
    args: commandTokens,
    publicResponse,
  };
};

const createNameCommandResponse = async (
  payload: SlackSlashCommand,
  args: string[],
  publicResponse: boolean,
): Promise<SlackResponse> => {
  try {
    const name = args.join(" ").trim();

    if (name) {
      await setStoredName(payload.user_id, name);

      return createTextResponseData(`Saved your name as *${escapeSlackText(name)}*.`, publicResponse);
    }

    const storedName = await getStoredName(payload.user_id);

    return createTextResponseData(
      storedName
        ? `Your stored name is *${escapeSlackText(storedName)}*.`
        : `You do not have a stored name yet. Run \`/${SLACK_ROOT_COMMAND_NAME} name <your name>\` to save one.`,
      publicResponse,
    );
  } catch (error) {
    console.error("Name command failed.", error);

    return createErrorResponseData("The `/name` command could not reach the Neon database.");
  }
};

const createProfileCommandResponse = async (
  payload: SlackSlashCommand,
  publicResponse: boolean,
): Promise<SlackResponse> => {
  try {
    const [storedName, commandUsage] = await Promise.all([getStoredName(payload.user_id), getCommandUsage(payload.user_id)]);
    const sortedCommandUsage = [...commandUsage].sort((first, second) =>
      first.commandName.localeCompare(second.commandName),
    );
    const totalRuns = sortedCommandUsage.reduce((total, usage) => total + usage.runCount, 0);
    const usageLines =
      sortedCommandUsage.length > 0
        ? sortedCommandUsage.map((usage) => `- \`/${escapeSlackText(usage.commandName)}\`: ${usage.runCount}`)
        : ["- No command usage tracked yet."];

    return createProfileResponseData({
      name: storedName,
      publicResponse,
      totalRuns,
      usageLines,
    });
  } catch (error) {
    console.error("Profile command failed.", error);

    return createErrorResponseData("The `/profile` command could not reach the Neon database.");
  }
};

export const trackSlackCommandRun = async (payload: SlackSlashCommand, commandName: string): Promise<void> => {
  try {
    await trackCommandRun(payload.user_id, commandName);
  } catch (error) {
    console.error("Command usage tracking failed.", error);
  }
};

export const commandHandlers: Record<string, SlackCommandHandler> = {
  [SLACK_PING_COMMAND_NAME]: ({ publicResponse, requestReceivedAtMs }) =>
    createPingResponseData(Math.max(0, Date.now() - requestReceivedAtMs), publicResponse),
  [SLACK_INFO_COMMAND_NAME]: ({ request, url, publicResponse }) =>
    createInfoResponseData({
      branch: process.env.NEON_BRANCH ?? "not set",
      functionUrl: `${url.origin}${SLACK_INTERACTIONS_PATH}`,
      method: request.method,
      platform: `${process.platform} ${process.arch}`,
      publicResponse,
      runtime: `Node.js ${process.version}`,
    }),
  [SLACK_HELP_COMMAND_NAME]: ({ publicResponse }) => createHelpResponseData(publicResponse),
  [SLACK_BUTTONS_COMMAND_NAME]: () => createButtonTestResponseData(false),
  [SLACK_NAME_COMMAND_NAME]: ({ payload, args, publicResponse }) =>
    withResponseDeadline(createNameCommandResponse(payload, args, publicResponse), createWarmingUpResponseData),
  [SLACK_PROFILE_COMMAND_NAME]: ({ payload, publicResponse }) =>
    withResponseDeadline(createProfileCommandResponse(payload, publicResponse), createWarmingUpResponseData),
};
