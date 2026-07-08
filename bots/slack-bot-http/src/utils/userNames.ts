import { eq, sql } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { slackCommandUsage, slackProfiles } from "../db/schema.js";

export type CommandUsageSummary = {
  commandName: string;
  runCount: number;
};

export const setStoredName = async (slackUserId: string, name: string): Promise<void> => {
  const db = getDb();

  await db
    .insert(slackProfiles)
    .values({ userId: slackUserId, name })
    .onConflictDoUpdate({
      target: slackProfiles.userId,
      set: {
        name,
        updatedAt: new Date(),
      },
    });
};

export const getStoredName = async (slackUserId: string): Promise<string | undefined> => {
  const db = getDb();
  const rows = await db
    .select({ name: slackProfiles.name })
    .from(slackProfiles)
    .where(eq(slackProfiles.userId, slackUserId))
    .limit(1);

  return rows[0]?.name;
};

export const trackCommandRun = async (slackUserId: string, commandName: string): Promise<void> => {
  const db = getDb();

  await db
    .insert(slackCommandUsage)
    .values({
      userId: slackUserId,
      commandName,
      runCount: 1,
      lastRunAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [slackCommandUsage.userId, slackCommandUsage.commandName],
      set: {
        runCount: sql`${slackCommandUsage.runCount} + 1`,
        lastRunAt: new Date(),
      },
    });
};

export const getCommandUsage = async (slackUserId: string): Promise<CommandUsageSummary[]> => {
  const db = getDb();

  return db
    .select({
      commandName: slackCommandUsage.commandName,
      runCount: slackCommandUsage.runCount,
    })
    .from(slackCommandUsage)
    .where(eq(slackCommandUsage.userId, slackUserId));
};
