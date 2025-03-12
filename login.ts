import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("login-")
export class Login extends LitElement {
  // Define scoped styles right with your component, in plain CSS
  static styles = css``;

  // Render the UI as a function of component state
  render() {
    return html`
      <input type="text" placeholder="Enter your atproto username" />
      <button @click="${this._submit}">Submit</button>
    `;
  }
  private _submit() {
    console.log("Submit button clicked");
  }
}
