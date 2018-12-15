import Discord from "discord.js";
import * as Middleware from "./middleware";
import Log from "./logger";

const client = new Discord.Client();

client.on("ready", () => {
  Log.info("BotConnected");

  client.on("message", Middleware.collectLinksFromDirectMessages());
  client.on("message", Middleware.collectLinksFromMentions(client.user));
  client.on("message", Middleware.collectLinksFromWatchedChannels());
});

client.on("disconnect", () => {
  Log.info("BotDisconnected");
});

Log.info("BotConnecting");
client.login(process.env.DISCORD_BOT_TOKEN);
