import { LitElement, css, html } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import {
  configureOAuth,
  createAuthorizationUrl,
  resolveFromService,
  resolveFromIdentity,
} from "@atcute/oauth-browser-client";
console.log("login");
//  clientMetadata: `http://localhost?redirect_uri=${encodeURIComponent('http://127.0.0.1:8080/callback')}`,
//
//
configureOAuth({
  metadata: {
    client_id: `http://localhost?redirect_uri=${encodeURIComponent("http://127.0.0.1:8080/callback")}`,
  },
});

// const { metadata } = await resolveFromService("bsky.social");

// const result: undefined | { session: OAuthSession; state?: string } =
//   await client.init();
// console.log({ result });
@customElement("login-")
export class Login extends LitElement {
  // Define scoped styles right with your component, in plain CSS
  static styles = css``;
  @state() private handle = "";
  // Render the UI as a function of component state
  render() {
    return html`
      <input
        @input=${this.handleInput}
        type="text"
        placeholder="Enter your atproto handle"
      />
      <button @click="${this._submit}">Submit</button>
    `;
  }

  handleInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.handle = inputElement.value;
    console.log("Handle:", this.handle);
  }

  private async _submit() {
    // const { identity, metadata } = await resolveFromIdentity("mary.my.id");
    // const authUrl = await createAuthorizationUrl({
    //   metadata: metadata,
    //   identity: identity,
    //   scope: "atproto transition:generic transition:chat.bsky",
    // });
    console.log(this.handle);
  }
}
