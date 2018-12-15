import Log from "./logger";
import { collectLinksFromMessage } from "./link-collectors";

const mentionableChannels = {
  "ask-bots": true,
  "forum-bot": true
};

const watchedChannels = {
  "news-and-announcements": true,
  "addon-announcements": true
};

const isMessageChannelIn = (channelList, message) =>
  message.channel.name in channelList;

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

    if (!isMessageChannelIn(mentionableChannels, message)) {
      return;
    }

    Log.info("LinkReceived", {
      tags: {
        channel: message.channel.name,
        user: message.author.id,
        messageId: message.id
      }
    });
    await collectLinksFromMessage(message);
  };
}

export function collectLinksFromWatchedChannels() {
  return async message => {
    if (!isMessageChannelIn(watchedChannels, message)) {
      return;
    }

    Log.info("LinkReceived", {
      tags: {
        channel: message.channel.name,
        user: message.author.id,
        messageId: message.id
      }
    });

    await collectLinksFromMessage(message, { passiveMode: true });
  };
}
