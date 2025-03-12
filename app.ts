import { Hono } from "hono";
import nunjucks from "nunjucks";
import { serveStatic } from "@hono/node-server/serve-static";
import config from "./config.json";
nunjucks.configure({ autoescape: false });
const login_comp = `<login-></login->`;
const root_comp = `<root-></root->`;
const root = nunjucks.render("layout.html", { component: root_comp });
const callback_comp = `<callback-></callback->`;
const callback = nunjucks.render("layout.html", { component: callback_comp });
let login = nunjucks.render("layout.html", { component: login_comp });
const app = new Hono();
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
export default app;
