import { Hono } from "hono";
import nunjucks from "nunjucks";
import { decodeTime, ulid } from "@std/ulid";
import { createBunWebSocket } from "hono/bun";
import { serveStatic } from "@hono/node-server/serve-static";
import config from "./config.json";
import { html } from "lit-html";
import { OAuthUserAgent } from "@atcute/oauth-browser-client";
import { CredentialManager, XRPC } from "@atcute/client";
nunjucks.configure({ autoescape: false });
const login_comp = `<login-></login->`;
const root_comp = `<root-></root->`;
const root = nunjucks.render("layout.html", { component: root_comp });
const callback_comp = `<callback-></callback->`;
const callback = nunjucks.render("layout.html", { component: callback_comp });
let login = nunjucks.render("layout.html", { component: login_comp });
const activeConnections = new Map();
const pendingRequests = new Map();
const app = new Hono();
const { upgradeWebSocket, websocket } = createBunWebSocket();
app.use("*", serveStatic({ root: "./static" }));
console.log(login);
app.get("/login", (c) => c.html(login));
app.get("/callback", (c) => c.html(callback));
app.get("/", (c) => c.html(root));
app.get("/repos/:handle", async (c) => {
  console.log("repos...");
  const handle = c.req.param("handle");
  const my_folder = `${config.server_folder}/${handle}`;
  const listFolders = async (): Promise<string[]> => {
    const { stdout } = await Bun.spawn([
      "find",
      my_folder,
      "-maxdepth",
      "1",
      "-type",
      "d",
    ]);
    const output = await new Response(stdout).text();
    // Split by newlines, filter out the parent directory, and extract folder names
    return output
      .split("\n")
      .filter((line) => line && line !== my_folder)
      .map((line) => {
        const folderName = line.split("/").pop() || "";
        return folderName;
      })
      .filter((folderName) => folderName && folderName !== my_folder);
  };
  return c.json(await listFolders());
});
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let resolver;
// app.post("/authorize", async (c) => {
//   console.log("Authorize request body:", body);
//   resolver("ok");
//   return c.json({ message: "Authorize endpoint" });
// });

app.post("/git-auth", async (c) => {
  // await sleep(100000);
  const ws = await activeConnections.get("nandi.weird.one");

  ws.send("testing git auth");
  const handle = "nandi.weird.one";
  const pds = "https://amanita.us-east.host.bsky.network";
  const response = await new Promise(async (resolve, reject) => {
    const timer = setInterval(async () => {
      const resp = await fetch(
        `${pds}/xrpc/com.atproto.repo.listRecords?repo=${handle}&collection=nandi.schemas.gitauthorize`,
      ).then((response) => response.json());
      // console.log({ resp });
      const records = resp.records;
      // console.log({ records });
      for (const record of records) {
        const stamp = record.value.stamp;
        if (!stamp) continue;
        const now = Date.now();
        const time = decodeTime(stamp);
        if (now - time < 10000) {
          console.log("WE FOUND IT!");
          clearInterval(timer);
          resolve("ok");
        }
        console.log(record.value.stamp);
      }
      // resolve(records);
    }, 1000);
  });

  // await sleep(100000);
  return c.req
    .json()
    .then((body) => {
      console.log("Received git auth request:", body);
      return c.json({ message: "Received git auth request", data: body });
    })
    .catch((error) => {
      return c.json({ error: "Error parsing JSON body" }, 400);
    });
});
app.get(
  "/ws",
  upgradeWebSocket((c) => {
    let intervalId;
    return {
      onOpen(_event, ws) {
        activeConnections.set("nandi.weird.one", ws);
      },
      onClose() {},
    };
  }),
);

export default {
  fetch: app.fetch,
  websocket,
};
