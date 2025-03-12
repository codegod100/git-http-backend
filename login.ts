import { LitElement, TemplateResult, css, html } from "lit";
import { Task } from "@lit/task";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
const ws = new WebSocket("ws://localhost:3000/ws");
import { ulid } from "@std/ulid";
import { customElement, state, property } from "lit/decorators.js";
import {
  configureOAuth,
  createAuthorizationUrl,
  resolveFromService,
  resolveFromIdentity,
  finalizeAuthorization,
  getSession,
  OAuthUserAgent,
} from "@atcute/oauth-browser-client";
import { XRPC } from "@atcute/client";
console.log("login");
//  clientMetadata: `http://localhost?redirect_uri=${encodeURIComponent('http://127.0.0.1:8080/callback')}`,
//
const enc = encodeURIComponent;
const url = `http://127.0.0.1:3000`;
let meta = {
  client_name: "nandi oauth",
  client_id: `http://localhost?redirect_uri=${enc(`${url}/callback`)}&scope=${enc(
    "atproto transition:generic",
  )}`,

  client_uri: url,
  redirect_uri: `${url}/callback`,
  redirect_uris: [`${url}/callback`],
  scope: "atproto transition:generic",
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  application_type: "web",
  token_endpoint_auth_method: "none",
  dpop_bound_access_tokens: true,
};

configureOAuth({
  metadata: meta,
});

// Read URL hash fragment
const hashFragment = window.location.hash.substring(1); // Remove the # character
if (hashFragment) {
  // Parse the hash fragment into key-value pairs
  const params = new URLSearchParams(hashFragment);
  let session = await finalizeAuthorization(params);
  console.log({ session });
  location.href = "/";
}

// const { metadata } = await resolveFromService("bsky.social");

// const result: undefined | { session: OAuthSession; state?: string } =
//   await client.init();
// console.log({ result });
@customElement("login-")
export class Login extends LitElement {
  // Define scoped styles right with your component, in plain CSS
  static styles = css``;
  @state() private handle = "";
  @state() private authUrl = "";

  // Render the UI as a function of component state
  render() {
    let link;
    if (this.authUrl) {
      link = html`<a href="${this.authUrl}">Login</a>`;
    }
    return html`
      <input
        @input=${this.handleInput}
        type="text"
        placeholder="Enter your atproto handle"
      />
      <button @click="${this._submit}">Submit</button>
      ${link}
    `;
  }

  handleInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.handle = inputElement.value;
    localStorage.setItem("handle", this.handle);
    console.log("Handle:", this.handle);
  }

  private async _submit() {
    const { identity, metadata } = await resolveFromIdentity(this.handle);
    const authUrl = await createAuthorizationUrl({
      metadata: metadata,
      identity: identity,
      scope: "atproto transition:generic",
    });
    console.log(authUrl);
    this.authUrl = authUrl.href;
  }
}

@customElement("callback-")
export class Callback extends LitElement {
  // Define scoped styles right with your component, in plain CSS
  static styles = css``;

  // Render the UI as a function of component state
  render() {
    return html` <h1>Callback</h1> `;
  }
}

@customElement("root-")
export class Root extends LitElement {
  static styles = css``;
  @state() message = "";
  private _task = new Task(this, {
    task: async ([handle], { signal }) => {
      const response = await fetch(`/repos/${handle}`, {
        signal,
      });
      console.log(response);
      // Call the function immediately
      return response.json();
    },
    args: () => [localStorage.getItem("handle")],
  });
  // Render the UI as a function of component state
  render() {
    ws.onmessage = (event) => {
      this.message = event.data;
    };
    const button = html`<button
      @click=${async () => {
        const handle = localStorage.getItem("handle") as string;
        const { identity } = await resolveFromIdentity(handle);
        const session = await getSession(identity.id);
        const agent = new OAuthUserAgent(session);
        const rpc = new XRPC({ handler: agent });
        const stamp = ulid();
        const resp = await rpc.call("com.atproto.repo.putRecord", {
          data: {
            repo: handle,
            collection: "nandi.schemas.gitauthorize",
            rkey: stamp,
            record: {
              $type: "nandi.schemas.gitauthorize",
              stamp,
            },
          },
        });
        console.log(resp);
        console.log("button clicked");
      }}
    >
      Ok
    </button>`;
    const handle = localStorage.getItem("handle");
    return this._task.render({
      pending: () => html`<div>Loading...</div>`,
      complete: (result) =>
        html`<div>
            Hello ${handle}, your existing repos: ${JSON.stringify(result)}
          </div>
          ${this.message ? html`<dialog open>${button}</dialog>` : html``}`,
      error: (e) => html`error: ${e}`,
    });
    // return html`test`;
  }
}
