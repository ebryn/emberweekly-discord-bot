import Log from "./logger";
import { collectLinksFromMessage } from "./link-collectors";

export function collectLinksFromDirectMessages() {
  return async message => {
    if (message.channel.type !== "dm" || message.author.bot) {
      return;
    }

    Log.info("LinkReceived", {
      tags: {
        channel: "DirectMessage",
        user: message.author.username,
        messageId: message.id
      }
    });
    await collectLinksFromMessage(message);
  };
}

export function collectLinksFromMentions(clientUser) {
  return async message => {
    if (!message.isMentioned(clientUser)) {
      return;
    }

    Log.info("LinkReceived", {
      tags: {
        channel: message.channel.name,
        user: message.user.id,
        messageId: message.id
      }
    });
    await collectLinksFromMessage(message);
  };
}
