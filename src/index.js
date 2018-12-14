import Discord from "discord.js";
import * as Middleware from "./middleware";
import Log from "./logger";

const client = new Discord.Client();

client.on("ready", () => {
  Log.info("BotConnected");
});

client.on("disconnect", () => {
  Log.info("BotDisconnected");
});

client.on("message", Middleware.collectLinksFromDirectMessages());
client.on("message", Middleware.collectLinksFromMentions(client.user));

Log.info("BotConnecting");
client.login(process.env.DISCORD_BOT_TOKEN);
