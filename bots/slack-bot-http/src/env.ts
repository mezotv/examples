import { parseEnv } from "@neon/env";
import neonConfig from "../neon.js";

let slackEnv: ReturnType<typeof readSlackEnv> | undefined;
let databaseUrl: string | undefined;

const readSlackEnv = () => parseEnv(neonConfig, "slack").function;

export const getSlackEnv = () => {
  slackEnv ??= readSlackEnv();

  return slackEnv;
};

export const getDatabaseUrl = () => {
  databaseUrl ??= parseEnv(neonConfig, ["DATABASE_URL"]).postgres.databaseUrl;

  return databaseUrl;
};
