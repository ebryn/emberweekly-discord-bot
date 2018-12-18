import axios from "axios";
import grabity from "grabity";
import btoa from "btoa";

import Log from "./logger";

const noLinkResponses = [
  "Hey there! :wave: Glad you've reached out for us. Want to contribute to Ember Weekly? Just write down a link on a DM channel with us or @mention us and we'll take care of it! :raised_hands:",
  ":wave: Hello! I'm a little bot helper :robot: for the Ember Weekly team. My job here is to take note of any interesting content you might want to share with us so we can feature it in future issues! Want to help me out? Paste a link on a DM channel or @mention me with the link :smiley:"
];

export async function collectLinksFromMessage(
  message,
  { passiveMode } = { passiveMode: false }
) {
  // 1. We extract any URLs in the message.
  const urls = message.content.match(
    /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
  );

  let postedLinks = 0;
  let thanked = false;

  if (urls === null) {
    Log.info("NoLinksFound", { tags: { messageId: message.id } });
    if (!passiveMode) {
      message.reply(
        noLinkResponses[Math.floor(Math.random() * noLinkResponses.length)]
      );
    }
    return;
  }

  try {
    await Promise.all(
      urls.map(async url => {
        let linkData;

        Log.info("ExtractingLinkMetadata");
        // 2. We use grabity to extract Open Graph / Twitter Cards data to build a Chameleon link.
        try {
          linkData = await grabity.grabIt(url);
          Log.info("ExtractedLinkMetadata", { tags: { ...linkData } });
        } catch (e) {
          // 2.1. If an error occurs, we skip this link.
          Log.info("InvalidLink", {
            tags: { httpStatusCode: e.statusCode }
          });
          if (!passiveMode) {
            message.reply(
              `Oops! Apparently that link isn't quite right. When we tried to open it, we received a ${
                e.statusCode
              } HTTP error code. Maybe you had a typo, or the site's down? :shrug:`
            );
            thanked = true;
          }
          return;
        }

        // 3. We check with Chameleon if the link has already been sent before.
        Log.info("CheckingForDuplicateLink");
        const getResult = await axios.get(
          `${process.env.CHAMELEON_API}/links?filter[href]=${url}`
        );

        // 3.1. If it's there, we notify the user and thank them for their collaboration.
        if (getResult.data.meta.count > 0) {
          Log.info("LinkIsDuplicated", {
            tags: {
              references: getResult.data.data.map(link => link.links.self)
            }
          });
          if (!passiveMode) {
            message.reply(
              ":tada: Thank you for collaborating! We already got this one, but keep 'em coming!"
            );
            thanked = true;
          }
          return Promise.resolve();
        }

        // 3.2. If it's not, we post it to Chameleon.
        Log.info("PostingToChameleon");
        const result = await axios.post(
          `${process.env.CHAMELEON_API}/links`,
          {
            data: {
              type: "links",
              attributes: {
                title: linkData.title || "",
                description: linkData.description || "",
                href: url,
                issueId: null,
                sectionId: 35, // Reading
                position: null,
                version: null,
                observerScore: null,
                downloadCount: null,
                // Probably need something like "source: 'bot'".
                scraped: false,
                status: "draft"
              }
            }
          },
          {
            headers: {
              "content-type": "application/json",
              authorization: `Access-Token ${btoa(
                [
                  process.env.CHAMELEON_USER,
                  process.env.CHAMELEON_PASSWORD
                ].join(":")
              )}`
            }
          }
        );

        if (result.status === 201) {
          Log.info("PostedToChameleon", { tags: { id: result.data.data.id } });
          postedLinks += 1;
          return Promise.resolve();
        } else {
          Log.warn("FailedPostingToChameleon", {
            tags: { status: result.status, statusText: result.statusText }
          });
          return Promise.reject(result.statusText);
        }
      })
    );

    if (!thanked && !passiveMode) {
      message.reply(
        ":tada: Thank you for collaborating with Ember Weekly! We've received your link. Who knows? It might get featured soon! :rocket:"
      );
    }

    Log.info("FinishedCollection");
  } catch (e) {
    Log.error("UnexpectedError", { tags: { ...e } });
    if (!passiveMode) {
      message.reply(
        ":boom: Oops! Apparently our bot has tripped on its own feet. While we help it get up again, why don't you look up some interesting links to share with us later?"
      );
    }
  }
}
