import dotenv from "dotenv";

if (process.env.NODE_ENV == "production") {
  dotenv.config({ path: ".env.production" });
} else {
  console.log("Using developement environment.");
  dotenv.config({ path: ".env.development" });
}

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !GUILD_ID) {
  throw new Error("Missing env variables.");
}

export const config = {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
  GUILD_ID,
};
