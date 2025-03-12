import { LitElement, css, html } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import {
  configureOAuth,
  createAuthorizationUrl,
  resolveFromService,
  resolveFromIdentity,
  finalizeAuthorization,
} from "@atcute/oauth-browser-client";
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
    return html`
      <input
        @input=${this.handleInput}
        type="text"
        placeholder="Enter your atproto handle"
      />
      <button @click="${this._submit}">Submit</button>
      <a href="${this.authUrl}">Login</a>
    `;
  }

  handleInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.handle = inputElement.value;
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
