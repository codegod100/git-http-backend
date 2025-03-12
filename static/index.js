var __legacyDecorateClassTS = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1;i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

// node_modules/@lit/reactive-element/development/css-tag.js
var NODE_MODE = false;
var global = globalThis;
var supportsAdoptingStyleSheets = global.ShadowRoot && (global.ShadyCSS === undefined || global.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var constructionToken = Symbol();
var cssTagCache = new WeakMap;

class CSSResult {
  constructor(cssText, strings, safeToken) {
    this["_$cssResult$"] = true;
    if (safeToken !== constructionToken) {
      throw new Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    }
    this.cssText = cssText;
    this._strings = strings;
  }
  get styleSheet() {
    let styleSheet = this._styleSheet;
    const strings = this._strings;
    if (supportsAdoptingStyleSheets && styleSheet === undefined) {
      const cacheable = strings !== undefined && strings.length === 1;
      if (cacheable) {
        styleSheet = cssTagCache.get(strings);
      }
      if (styleSheet === undefined) {
        (this._styleSheet = styleSheet = new CSSStyleSheet).replaceSync(this.cssText);
        if (cacheable) {
          cssTagCache.set(strings, styleSheet);
        }
      }
    }
    return styleSheet;
  }
  toString() {
    return this.cssText;
  }
}
var textFromCSSResult = (value) => {
  if (value["_$cssResult$"] === true) {
    return value.cssText;
  } else if (typeof value === "number") {
    return value;
  } else {
    throw new Error(`Value passed to 'css' function must be a 'css' function result: ` + `${value}. Use 'unsafeCSS' to pass non-literal values, but take care ` + `to ensure page security.`);
  }
};
var unsafeCSS = (value) => new CSSResult(typeof value === "string" ? value : String(value), undefined, constructionToken);
var css = (strings, ...values) => {
  const cssText = strings.length === 1 ? strings[0] : values.reduce((acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1], strings[0]);
  return new CSSResult(cssText, strings, constructionToken);
};
var adoptStyles = (renderRoot, styles) => {
  if (supportsAdoptingStyleSheets) {
    renderRoot.adoptedStyleSheets = styles.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  } else {
    for (const s of styles) {
      const style = document.createElement("style");
      const nonce = global["litNonce"];
      if (nonce !== undefined) {
        style.setAttribute("nonce", nonce);
      }
      style.textContent = s.cssText;
      renderRoot.appendChild(style);
    }
  }
};
var cssResultFromStyleSheet = (sheet) => {
  let cssText = "";
  for (const rule of sheet.cssRules) {
    cssText += rule.cssText;
  }
  return unsafeCSS(cssText);
};
var getCompatibleStyle = supportsAdoptingStyleSheets || NODE_MODE && global.CSSStyleSheet === undefined ? (s) => s : (s) => s instanceof CSSStyleSheet ? cssResultFromStyleSheet(s) : s;

// node_modules/@lit/reactive-element/development/reactive-element.js
var { is, defineProperty, getOwnPropertyDescriptor, getOwnPropertyNames, getOwnPropertySymbols, getPrototypeOf } = Object;
var NODE_MODE2 = false;
var global2 = globalThis;
if (NODE_MODE2) {
  global2.customElements ??= customElements;
}
var DEV_MODE = true;
var issueWarning;
var trustedTypes = global2.trustedTypes;
var emptyStringForBooleanAttribute = trustedTypes ? trustedTypes.emptyScript : "";
var polyfillSupport = DEV_MODE ? global2.reactiveElementPolyfillSupportDevMode : global2.reactiveElementPolyfillSupport;
if (DEV_MODE) {
  const issuedWarnings = global2.litIssuedWarnings ??= new Set;
  issueWarning = (code, warning) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!issuedWarnings.has(warning)) {
      console.warn(warning);
      issuedWarnings.add(warning);
    }
  };
  issueWarning("dev-mode", `Lit is in dev mode. Not recommended for production!`);
  if (global2.ShadyDOM?.inUse && polyfillSupport === undefined) {
    issueWarning("polyfill-support-missing", `Shadow DOM is being polyfilled via \`ShadyDOM\` but ` + `the \`polyfill-support\` module has not been loaded.`);
  }
}
var debugLogEvent = DEV_MODE ? (event) => {
  const shouldEmit = global2.emitLitDebugLogEvents;
  if (!shouldEmit) {
    return;
  }
  global2.dispatchEvent(new CustomEvent("lit-debug", {
    detail: event
  }));
} : undefined;
var JSCompiler_renameProperty = (prop, _obj) => prop;
var defaultConverter = {
  toAttribute(value, type) {
    switch (type) {
      case Boolean:
        value = value ? emptyStringForBooleanAttribute : null;
        break;
      case Object:
      case Array:
        value = value == null ? value : JSON.stringify(value);
        break;
    }
    return value;
  },
  fromAttribute(value, type) {
    let fromValue = value;
    switch (type) {
      case Boolean:
        fromValue = value !== null;
        break;
      case Number:
        fromValue = value === null ? null : Number(value);
        break;
      case Object:
      case Array:
        try {
          fromValue = JSON.parse(value);
        } catch (e) {
          fromValue = null;
        }
        break;
    }
    return fromValue;
  }
};
var notEqual = (value, old) => !is(value, old);
var defaultPropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual
};
Symbol.metadata ??= Symbol("metadata");
global2.litPropertyMetadata ??= new WeakMap;

class ReactiveElement extends HTMLElement {
  static addInitializer(initializer) {
    this.__prepare();
    (this._initializers ??= []).push(initializer);
  }
  static get observedAttributes() {
    this.finalize();
    return this.__attributeToPropertyMap && [...this.__attributeToPropertyMap.keys()];
  }
  static createProperty(name, options = defaultPropertyDeclaration) {
    if (options.state) {
      options.attribute = false;
    }
    this.__prepare();
    this.elementProperties.set(name, options);
    if (!options.noAccessor) {
      const key = DEV_MODE ? Symbol.for(`${String(name)} (@property() cache)`) : Symbol();
      const descriptor = this.getPropertyDescriptor(name, key, options);
      if (descriptor !== undefined) {
        defineProperty(this.prototype, name, descriptor);
      }
    }
  }
  static getPropertyDescriptor(name, key, options) {
    const { get, set } = getOwnPropertyDescriptor(this.prototype, name) ?? {
      get() {
        return this[key];
      },
      set(v) {
        this[key] = v;
      }
    };
    if (DEV_MODE && get == null) {
      if ("value" in (getOwnPropertyDescriptor(this.prototype, name) ?? {})) {
        throw new Error(`Field ${JSON.stringify(String(name))} on ` + `${this.name} was declared as a reactive property ` + `but it's actually declared as a value on the prototype. ` + `Usually this is due to using @property or @state on a method.`);
      }
      issueWarning("reactive-property-without-getter", `Field ${JSON.stringify(String(name))} on ` + `${this.name} was declared as a reactive property ` + `but it does not have a getter. This will be an error in a ` + `future version of Lit.`);
    }
    return {
      get() {
        return get?.call(this);
      },
      set(value) {
        const oldValue = get?.call(this);
        set.call(this, value);
        this.requestUpdate(name, oldValue, options);
      },
      configurable: true,
      enumerable: true
    };
  }
  static getPropertyOptions(name) {
    return this.elementProperties.get(name) ?? defaultPropertyDeclaration;
  }
  static __prepare() {
    if (this.hasOwnProperty(JSCompiler_renameProperty("elementProperties", this))) {
      return;
    }
    const superCtor = getPrototypeOf(this);
    superCtor.finalize();
    if (superCtor._initializers !== undefined) {
      this._initializers = [...superCtor._initializers];
    }
    this.elementProperties = new Map(superCtor.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(JSCompiler_renameProperty("finalized", this))) {
      return;
    }
    this.finalized = true;
    this.__prepare();
    if (this.hasOwnProperty(JSCompiler_renameProperty("properties", this))) {
      const props = this.properties;
      const propKeys = [
        ...getOwnPropertyNames(props),
        ...getOwnPropertySymbols(props)
      ];
      for (const p of propKeys) {
        this.createProperty(p, props[p]);
      }
    }
    const metadata = this[Symbol.metadata];
    if (metadata !== null) {
      const properties = litPropertyMetadata.get(metadata);
      if (properties !== undefined) {
        for (const [p, options] of properties) {
          this.elementProperties.set(p, options);
        }
      }
    }
    this.__attributeToPropertyMap = new Map;
    for (const [p, options] of this.elementProperties) {
      const attr = this.__attributeNameForProperty(p, options);
      if (attr !== undefined) {
        this.__attributeToPropertyMap.set(attr, p);
      }
    }
    this.elementStyles = this.finalizeStyles(this.styles);
    if (DEV_MODE) {
      if (this.hasOwnProperty("createProperty")) {
        issueWarning("no-override-create-property", "Overriding ReactiveElement.createProperty() is deprecated. " + "The override will not be called with standard decorators");
      }
      if (this.hasOwnProperty("getPropertyDescriptor")) {
        issueWarning("no-override-get-property-descriptor", "Overriding ReactiveElement.getPropertyDescriptor() is deprecated. " + "The override will not be called with standard decorators");
      }
    }
  }
  static finalizeStyles(styles) {
    const elementStyles = [];
    if (Array.isArray(styles)) {
      const set = new Set(styles.flat(Infinity).reverse());
      for (const s of set) {
        elementStyles.unshift(getCompatibleStyle(s));
      }
    } else if (styles !== undefined) {
      elementStyles.push(getCompatibleStyle(styles));
    }
    return elementStyles;
  }
  static __attributeNameForProperty(name, options) {
    const attribute = options.attribute;
    return attribute === false ? undefined : typeof attribute === "string" ? attribute : typeof name === "string" ? name.toLowerCase() : undefined;
  }
  constructor() {
    super();
    this.__instanceProperties = undefined;
    this.isUpdatePending = false;
    this.hasUpdated = false;
    this.__reflectingProperty = null;
    this.__initialize();
  }
  __initialize() {
    this.__updatePromise = new Promise((res) => this.enableUpdating = res);
    this._$changedProperties = new Map;
    this.__saveInstanceProperties();
    this.requestUpdate();
    this.constructor._initializers?.forEach((i) => i(this));
  }
  addController(controller) {
    (this.__controllers ??= new Set).add(controller);
    if (this.renderRoot !== undefined && this.isConnected) {
      controller.hostConnected?.();
    }
  }
  removeController(controller) {
    this.__controllers?.delete(controller);
  }
  __saveInstanceProperties() {
    const instanceProperties = new Map;
    const elementProperties = this.constructor.elementProperties;
    for (const p of elementProperties.keys()) {
      if (this.hasOwnProperty(p)) {
        instanceProperties.set(p, this[p]);
        delete this[p];
      }
    }
    if (instanceProperties.size > 0) {
      this.__instanceProperties = instanceProperties;
    }
  }
  createRenderRoot() {
    const renderRoot = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    adoptStyles(renderRoot, this.constructor.elementStyles);
    return renderRoot;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot();
    this.enableUpdating(true);
    this.__controllers?.forEach((c) => c.hostConnected?.());
  }
  enableUpdating(_requestedUpdate) {
  }
  disconnectedCallback() {
    this.__controllers?.forEach((c) => c.hostDisconnected?.());
  }
  attributeChangedCallback(name, _old, value) {
    this._$attributeToProperty(name, value);
  }
  __propertyToAttribute(name, value) {
    const elemProperties = this.constructor.elementProperties;
    const options = elemProperties.get(name);
    const attr = this.constructor.__attributeNameForProperty(name, options);
    if (attr !== undefined && options.reflect === true) {
      const converter = options.converter?.toAttribute !== undefined ? options.converter : defaultConverter;
      const attrValue = converter.toAttribute(value, options.type);
      if (DEV_MODE && this.constructor.enabledWarnings.includes("migration") && attrValue === undefined) {
        issueWarning("undefined-attribute-value", `The attribute value for the ${name} property is ` + `undefined on element ${this.localName}. The attribute will be ` + `removed, but in the previous version of \`ReactiveElement\`, ` + `the attribute would not have changed.`);
      }
      this.__reflectingProperty = name;
      if (attrValue == null) {
        this.removeAttribute(attr);
      } else {
        this.setAttribute(attr, attrValue);
      }
      this.__reflectingProperty = null;
    }
  }
  _$attributeToProperty(name, value) {
    const ctor = this.constructor;
    const propName = ctor.__attributeToPropertyMap.get(name);
    if (propName !== undefined && this.__reflectingProperty !== propName) {
      const options = ctor.getPropertyOptions(propName);
      const converter = typeof options.converter === "function" ? { fromAttribute: options.converter } : options.converter?.fromAttribute !== undefined ? options.converter : defaultConverter;
      this.__reflectingProperty = propName;
      this[propName] = converter.fromAttribute(value, options.type);
      this.__reflectingProperty = null;
    }
  }
  requestUpdate(name, oldValue, options) {
    if (name !== undefined) {
      if (DEV_MODE && name instanceof Event) {
        issueWarning(``, `The requestUpdate() method was called with an Event as the property name. This is probably a mistake caused by binding this.requestUpdate as an event listener. Instead bind a function that will call it with no arguments: () => this.requestUpdate()`);
      }
      options ??= this.constructor.getPropertyOptions(name);
      const hasChanged = options.hasChanged ?? notEqual;
      const newValue = this[name];
      if (hasChanged(newValue, oldValue)) {
        this._$changeProperty(name, oldValue, options);
      } else {
        return;
      }
    }
    if (this.isUpdatePending === false) {
      this.__updatePromise = this.__enqueueUpdate();
    }
  }
  _$changeProperty(name, oldValue, options) {
    if (!this._$changedProperties.has(name)) {
      this._$changedProperties.set(name, oldValue);
    }
    if (options.reflect === true && this.__reflectingProperty !== name) {
      (this.__reflectingProperties ??= new Set).add(name);
    }
  }
  async __enqueueUpdate() {
    this.isUpdatePending = true;
    try {
      await this.__updatePromise;
    } catch (e) {
      Promise.reject(e);
    }
    const result = this.scheduleUpdate();
    if (result != null) {
      await result;
    }
    return !this.isUpdatePending;
  }
  scheduleUpdate() {
    const result = this.performUpdate();
    if (DEV_MODE && this.constructor.enabledWarnings.includes("async-perform-update") && typeof result?.then === "function") {
      issueWarning("async-perform-update", `Element ${this.localName} returned a Promise from performUpdate(). ` + `This behavior is deprecated and will be removed in a future ` + `version of ReactiveElement.`);
    }
    return result;
  }
  performUpdate() {
    if (!this.isUpdatePending) {
      return;
    }
    debugLogEvent?.({ kind: "update" });
    if (!this.hasUpdated) {
      this.renderRoot ??= this.createRenderRoot();
      if (DEV_MODE) {
        const ctor = this.constructor;
        const shadowedProperties = [...ctor.elementProperties.keys()].filter((p) => this.hasOwnProperty(p) && (p in getPrototypeOf(this)));
        if (shadowedProperties.length) {
          throw new Error(`The following properties on element ${this.localName} will not ` + `trigger updates as expected because they are set using class ` + `fields: ${shadowedProperties.join(", ")}. ` + `Native class fields and some compiled output will overwrite ` + `accessors used for detecting changes. See ` + `https://lit.dev/msg/class-field-shadowing ` + `for more information.`);
        }
      }
      if (this.__instanceProperties) {
        for (const [p, value] of this.__instanceProperties) {
          this[p] = value;
        }
        this.__instanceProperties = undefined;
      }
      const elementProperties = this.constructor.elementProperties;
      if (elementProperties.size > 0) {
        for (const [p, options] of elementProperties) {
          if (options.wrapped === true && !this._$changedProperties.has(p) && this[p] !== undefined) {
            this._$changeProperty(p, this[p], options);
          }
        }
      }
    }
    let shouldUpdate = false;
    const changedProperties = this._$changedProperties;
    try {
      shouldUpdate = this.shouldUpdate(changedProperties);
      if (shouldUpdate) {
        this.willUpdate(changedProperties);
        this.__controllers?.forEach((c) => c.hostUpdate?.());
        this.update(changedProperties);
      } else {
        this.__markUpdated();
      }
    } catch (e) {
      shouldUpdate = false;
      this.__markUpdated();
      throw e;
    }
    if (shouldUpdate) {
      this._$didUpdate(changedProperties);
    }
  }
  willUpdate(_changedProperties) {
  }
  _$didUpdate(changedProperties) {
    this.__controllers?.forEach((c) => c.hostUpdated?.());
    if (!this.hasUpdated) {
      this.hasUpdated = true;
      this.firstUpdated(changedProperties);
    }
    this.updated(changedProperties);
    if (DEV_MODE && this.isUpdatePending && this.constructor.enabledWarnings.includes("change-in-update")) {
      issueWarning("change-in-update", `Element ${this.localName} scheduled an update ` + `(generally because a property was set) ` + `after an update completed, causing a new update to be scheduled. ` + `This is inefficient and should be avoided unless the next update ` + `can only be scheduled as a side effect of the previous update.`);
    }
  }
  __markUpdated() {
    this._$changedProperties = new Map;
    this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this.__updatePromise;
  }
  shouldUpdate(_changedProperties) {
    return true;
  }
  update(_changedProperties) {
    this.__reflectingProperties &&= this.__reflectingProperties.forEach((p) => this.__propertyToAttribute(p, this[p]));
    this.__markUpdated();
  }
  updated(_changedProperties) {
  }
  firstUpdated(_changedProperties) {
  }
}
ReactiveElement.elementStyles = [];
ReactiveElement.shadowRootOptions = { mode: "open" };
ReactiveElement[JSCompiler_renameProperty("elementProperties", ReactiveElement)] = new Map;
ReactiveElement[JSCompiler_renameProperty("finalized", ReactiveElement)] = new Map;
polyfillSupport?.({ ReactiveElement });
if (DEV_MODE) {
  ReactiveElement.enabledWarnings = [
    "change-in-update",
    "async-perform-update"
  ];
  const ensureOwnWarnings = function(ctor) {
    if (!ctor.hasOwnProperty(JSCompiler_renameProperty("enabledWarnings", ctor))) {
      ctor.enabledWarnings = ctor.enabledWarnings.slice();
    }
  };
  ReactiveElement.enableWarning = function(warning) {
    ensureOwnWarnings(this);
    if (!this.enabledWarnings.includes(warning)) {
      this.enabledWarnings.push(warning);
    }
  };
  ReactiveElement.disableWarning = function(warning) {
    ensureOwnWarnings(this);
    const i = this.enabledWarnings.indexOf(warning);
    if (i >= 0) {
      this.enabledWarnings.splice(i, 1);
    }
  };
}
(global2.reactiveElementVersions ??= []).push("2.0.4");
if (DEV_MODE && global2.reactiveElementVersions.length > 1) {
  issueWarning("multiple-versions", `Multiple versions of Lit loaded. Loading multiple versions ` + `is not recommended.`);
}

// node_modules/lit-html/development/lit-html.js
var DEV_MODE2 = true;
var ENABLE_EXTRA_SECURITY_HOOKS = true;
var ENABLE_SHADYDOM_NOPATCH = true;
var NODE_MODE3 = false;
var global3 = globalThis;
var debugLogEvent2 = DEV_MODE2 ? (event) => {
  const shouldEmit = global3.emitLitDebugLogEvents;
  if (!shouldEmit) {
    return;
  }
  global3.dispatchEvent(new CustomEvent("lit-debug", {
    detail: event
  }));
} : undefined;
var debugLogRenderId = 0;
var issueWarning2;
if (DEV_MODE2) {
  global3.litIssuedWarnings ??= new Set;
  issueWarning2 = (code, warning) => {
    warning += code ? ` See https://lit.dev/msg/${code} for more information.` : "";
    if (!global3.litIssuedWarnings.has(warning)) {
      console.warn(warning);
      global3.litIssuedWarnings.add(warning);
    }
  };
  issueWarning2("dev-mode", `Lit is in dev mode. Not recommended for production!`);
}
var wrap = ENABLE_SHADYDOM_NOPATCH && global3.ShadyDOM?.inUse && global3.ShadyDOM?.noPatch === true ? global3.ShadyDOM.wrap : (node) => node;
var trustedTypes2 = global3.trustedTypes;
var policy = trustedTypes2 ? trustedTypes2.createPolicy("lit-html", {
  createHTML: (s) => s
}) : undefined;
var identityFunction = (value) => value;
var noopSanitizer = (_node, _name, _type) => identityFunction;
var setSanitizer = (newSanitizer) => {
  if (!ENABLE_EXTRA_SECURITY_HOOKS) {
    return;
  }
  if (sanitizerFactoryInternal !== noopSanitizer) {
    throw new Error(`Attempted to overwrite existing lit-html security policy.` + ` setSanitizeDOMValueFactory should be called at most once.`);
  }
  sanitizerFactoryInternal = newSanitizer;
};
var _testOnlyClearSanitizerFactoryDoNotCallOrElse = () => {
  sanitizerFactoryInternal = noopSanitizer;
};
var createSanitizer = (node, name, type) => {
  return sanitizerFactoryInternal(node, name, type);
};
var boundAttributeSuffix = "$lit$";
var marker = `lit$${Math.random().toFixed(9).slice(2)}$`;
var markerMatch = "?" + marker;
var nodeMarker = `<${markerMatch}>`;
var d = NODE_MODE3 && global3.document === undefined ? {
  createTreeWalker() {
    return {};
  }
} : document;
var createMarker = () => d.createComment("");
var isPrimitive = (value) => value === null || typeof value != "object" && typeof value != "function";
var isArray = Array.isArray;
var isIterable = (value) => isArray(value) || typeof value?.[Symbol.iterator] === "function";
var SPACE_CHAR = `[ 	
\f\r]`;
var ATTR_VALUE_CHAR = `[^ 	
\f\r"'\`<>=]`;
var NAME_CHAR = `[^\\s"'>=/]`;
var textEndRegex = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var COMMENT_START = 1;
var TAG_NAME = 2;
var DYNAMIC_TAG_NAME = 3;
var commentEndRegex = /-->/g;
var comment2EndRegex = />/g;
var tagEndRegex = new RegExp(`>|${SPACE_CHAR}(?:(${NAME_CHAR}+)(${SPACE_CHAR}*=${SPACE_CHAR}*(?:${ATTR_VALUE_CHAR}|("|')|))|$)`, "g");
var ENTIRE_MATCH = 0;
var ATTRIBUTE_NAME = 1;
var SPACES_AND_EQUALS = 2;
var QUOTE_CHAR = 3;
var singleQuoteAttrEndRegex = /'/g;
var doubleQuoteAttrEndRegex = /"/g;
var rawTextElement = /^(?:script|style|textarea|title)$/i;
var HTML_RESULT = 1;
var SVG_RESULT = 2;
var MATHML_RESULT = 3;
var ATTRIBUTE_PART = 1;
var CHILD_PART = 2;
var PROPERTY_PART = 3;
var BOOLEAN_ATTRIBUTE_PART = 4;
var EVENT_PART = 5;
var ELEMENT_PART = 6;
var COMMENT_PART = 7;
var tag = (type) => (strings, ...values) => {
  if (DEV_MODE2 && strings.some((s) => s === undefined)) {
    console.warn(`Some template strings are undefined.
` + "This is probably caused by illegal octal escape sequences.");
  }
  if (DEV_MODE2) {
    if (values.some((val) => val?.["_$litStatic$"])) {
      issueWarning2("", `Static values 'literal' or 'unsafeStatic' cannot be used as values to non-static templates.
` + `Please use the static 'html' tag function. See https://lit.dev/docs/templates/expressions/#static-expressions`);
    }
  }
  return {
    ["_$litType$"]: type,
    strings,
    values
  };
};
var html = tag(HTML_RESULT);
var svg = tag(SVG_RESULT);
var mathml = tag(MATHML_RESULT);
var noChange = Symbol.for("lit-noChange");
var nothing = Symbol.for("lit-nothing");
var templateCache = new WeakMap;
var walker = d.createTreeWalker(d, 129);
var sanitizerFactoryInternal = noopSanitizer;
function trustFromTemplateString(tsa, stringFromTSA) {
  if (!isArray(tsa) || !tsa.hasOwnProperty("raw")) {
    let message = "invalid template strings array";
    if (DEV_MODE2) {
      message = `
          Internal Error: expected template strings to be an array
          with a 'raw' field. Faking a template strings array by
          calling html or svg like an ordinary function is effectively
          the same as calling unsafeHtml and can lead to major security
          issues, e.g. opening your code up to XSS attacks.
          If you're using the html or svg tagged template functions normally
          and still seeing this error, please file a bug at
          https://github.com/lit/lit/issues/new?template=bug_report.md
          and include information about your build tooling, if any.
        `.trim().replace(/\n */g, `
`);
    }
    throw new Error(message);
  }
  return policy !== undefined ? policy.createHTML(stringFromTSA) : stringFromTSA;
}
var getTemplateHtml = (strings, type) => {
  const l = strings.length - 1;
  const attrNames = [];
  let html2 = type === SVG_RESULT ? "<svg>" : type === MATHML_RESULT ? "<math>" : "";
  let rawTextEndRegex;
  let regex = textEndRegex;
  for (let i = 0;i < l; i++) {
    const s = strings[i];
    let attrNameEndIndex = -1;
    let attrName;
    let lastIndex = 0;
    let match;
    while (lastIndex < s.length) {
      regex.lastIndex = lastIndex;
      match = regex.exec(s);
      if (match === null) {
        break;
      }
      lastIndex = regex.lastIndex;
      if (regex === textEndRegex) {
        if (match[COMMENT_START] === "!--") {
          regex = commentEndRegex;
        } else if (match[COMMENT_START] !== undefined) {
          regex = comment2EndRegex;
        } else if (match[TAG_NAME] !== undefined) {
          if (rawTextElement.test(match[TAG_NAME])) {
            rawTextEndRegex = new RegExp(`</${match[TAG_NAME]}`, "g");
          }
          regex = tagEndRegex;
        } else if (match[DYNAMIC_TAG_NAME] !== undefined) {
          if (DEV_MODE2) {
            throw new Error("Bindings in tag names are not supported. Please use static templates instead. " + "See https://lit.dev/docs/templates/expressions/#static-expressions");
          }
          regex = tagEndRegex;
        }
      } else if (regex === tagEndRegex) {
        if (match[ENTIRE_MATCH] === ">") {
          regex = rawTextEndRegex ?? textEndRegex;
          attrNameEndIndex = -1;
        } else if (match[ATTRIBUTE_NAME] === undefined) {
          attrNameEndIndex = -2;
        } else {
          attrNameEndIndex = regex.lastIndex - match[SPACES_AND_EQUALS].length;
          attrName = match[ATTRIBUTE_NAME];
          regex = match[QUOTE_CHAR] === undefined ? tagEndRegex : match[QUOTE_CHAR] === '"' ? doubleQuoteAttrEndRegex : singleQuoteAttrEndRegex;
        }
      } else if (regex === doubleQuoteAttrEndRegex || regex === singleQuoteAttrEndRegex) {
        regex = tagEndRegex;
      } else if (regex === commentEndRegex || regex === comment2EndRegex) {
        regex = textEndRegex;
      } else {
        regex = tagEndRegex;
        rawTextEndRegex = undefined;
      }
    }
    if (DEV_MODE2) {
      console.assert(attrNameEndIndex === -1 || regex === tagEndRegex || regex === singleQuoteAttrEndRegex || regex === doubleQuoteAttrEndRegex, "unexpected parse state B");
    }
    const end = regex === tagEndRegex && strings[i + 1].startsWith("/>") ? " " : "";
    html2 += regex === textEndRegex ? s + nodeMarker : attrNameEndIndex >= 0 ? (attrNames.push(attrName), s.slice(0, attrNameEndIndex) + boundAttributeSuffix + s.slice(attrNameEndIndex)) + marker + end : s + marker + (attrNameEndIndex === -2 ? i : end);
  }
  const htmlResult = html2 + (strings[l] || "<?>") + (type === SVG_RESULT ? "</svg>" : type === MATHML_RESULT ? "</math>" : "");
  return [trustFromTemplateString(strings, htmlResult), attrNames];
};

class Template {
  constructor({ strings, ["_$litType$"]: type }, options) {
    this.parts = [];
    let node;
    let nodeIndex = 0;
    let attrNameIndex = 0;
    const partCount = strings.length - 1;
    const parts = this.parts;
    const [html2, attrNames] = getTemplateHtml(strings, type);
    this.el = Template.createElement(html2, options);
    walker.currentNode = this.el.content;
    if (type === SVG_RESULT || type === MATHML_RESULT) {
      const wrapper = this.el.content.firstChild;
      wrapper.replaceWith(...wrapper.childNodes);
    }
    while ((node = walker.nextNode()) !== null && parts.length < partCount) {
      if (node.nodeType === 1) {
        if (DEV_MODE2) {
          const tag2 = node.localName;
          if (/^(?:textarea|template)$/i.test(tag2) && node.innerHTML.includes(marker)) {
            const m = `Expressions are not supported inside \`${tag2}\` ` + `elements. See https://lit.dev/msg/expression-in-${tag2} for more ` + `information.`;
            if (tag2 === "template") {
              throw new Error(m);
            } else
              issueWarning2("", m);
          }
        }
        if (node.hasAttributes()) {
          for (const name of node.getAttributeNames()) {
            if (name.endsWith(boundAttributeSuffix)) {
              const realName = attrNames[attrNameIndex++];
              const value = node.getAttribute(name);
              const statics = value.split(marker);
              const m = /([.?@])?(.*)/.exec(realName);
              parts.push({
                type: ATTRIBUTE_PART,
                index: nodeIndex,
                name: m[2],
                strings: statics,
                ctor: m[1] === "." ? PropertyPart : m[1] === "?" ? BooleanAttributePart : m[1] === "@" ? EventPart : AttributePart
              });
              node.removeAttribute(name);
            } else if (name.startsWith(marker)) {
              parts.push({
                type: ELEMENT_PART,
                index: nodeIndex
              });
              node.removeAttribute(name);
            }
          }
        }
        if (rawTextElement.test(node.tagName)) {
          const strings2 = node.textContent.split(marker);
          const lastIndex = strings2.length - 1;
          if (lastIndex > 0) {
            node.textContent = trustedTypes2 ? trustedTypes2.emptyScript : "";
            for (let i = 0;i < lastIndex; i++) {
              node.append(strings2[i], createMarker());
              walker.nextNode();
              parts.push({ type: CHILD_PART, index: ++nodeIndex });
            }
            node.append(strings2[lastIndex], createMarker());
          }
        }
      } else if (node.nodeType === 8) {
        const data = node.data;
        if (data === markerMatch) {
          parts.push({ type: CHILD_PART, index: nodeIndex });
        } else {
          let i = -1;
          while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
            parts.push({ type: COMMENT_PART, index: nodeIndex });
            i += marker.length - 1;
          }
        }
      }
      nodeIndex++;
    }
    if (DEV_MODE2) {
      if (attrNames.length !== attrNameIndex) {
        throw new Error(`Detected duplicate attribute bindings. This occurs if your template ` + `has duplicate attributes on an element tag. For example ` + `"<input ?disabled=\${true} ?disabled=\${false}>" contains a ` + `duplicate "disabled" attribute. The error was detected in ` + `the following template: 
` + "`" + strings.join("${...}") + "`");
      }
    }
    debugLogEvent2 && debugLogEvent2({
      kind: "template prep",
      template: this,
      clonableTemplate: this.el,
      parts: this.parts,
      strings
    });
  }
  static createElement(html2, _options) {
    const el = d.createElement("template");
    el.innerHTML = html2;
    return el;
  }
}
function resolveDirective(part, value, parent = part, attributeIndex) {
  if (value === noChange) {
    return value;
  }
  let currentDirective = attributeIndex !== undefined ? parent.__directives?.[attributeIndex] : parent.__directive;
  const nextDirectiveConstructor = isPrimitive(value) ? undefined : value["_$litDirective$"];
  if (currentDirective?.constructor !== nextDirectiveConstructor) {
    currentDirective?.["_$notifyDirectiveConnectionChanged"]?.(false);
    if (nextDirectiveConstructor === undefined) {
      currentDirective = undefined;
    } else {
      currentDirective = new nextDirectiveConstructor(part);
      currentDirective._$initialize(part, parent, attributeIndex);
    }
    if (attributeIndex !== undefined) {
      (parent.__directives ??= [])[attributeIndex] = currentDirective;
    } else {
      parent.__directive = currentDirective;
    }
  }
  if (currentDirective !== undefined) {
    value = resolveDirective(part, currentDirective._$resolve(part, value.values), currentDirective, attributeIndex);
  }
  return value;
}

class TemplateInstance {
  constructor(template, parent) {
    this._$parts = [];
    this._$disconnectableChildren = undefined;
    this._$template = template;
    this._$parent = parent;
  }
  get parentNode() {
    return this._$parent.parentNode;
  }
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  _clone(options) {
    const { el: { content }, parts } = this._$template;
    const fragment = (options?.creationScope ?? d).importNode(content, true);
    walker.currentNode = fragment;
    let node = walker.nextNode();
    let nodeIndex = 0;
    let partIndex = 0;
    let templatePart = parts[0];
    while (templatePart !== undefined) {
      if (nodeIndex === templatePart.index) {
        let part;
        if (templatePart.type === CHILD_PART) {
          part = new ChildPart(node, node.nextSibling, this, options);
        } else if (templatePart.type === ATTRIBUTE_PART) {
          part = new templatePart.ctor(node, templatePart.name, templatePart.strings, this, options);
        } else if (templatePart.type === ELEMENT_PART) {
          part = new ElementPart(node, this, options);
        }
        this._$parts.push(part);
        templatePart = parts[++partIndex];
      }
      if (nodeIndex !== templatePart?.index) {
        node = walker.nextNode();
        nodeIndex++;
      }
    }
    walker.currentNode = d;
    return fragment;
  }
  _update(values) {
    let i = 0;
    for (const part of this._$parts) {
      if (part !== undefined) {
        debugLogEvent2 && debugLogEvent2({
          kind: "set part",
          part,
          value: values[i],
          valueIndex: i,
          values,
          templateInstance: this
        });
        if (part.strings !== undefined) {
          part._$setValue(values, part, i);
          i += part.strings.length - 2;
        } else {
          part._$setValue(values[i]);
        }
      }
      i++;
    }
  }
}

class ChildPart {
  get _$isConnected() {
    return this._$parent?._$isConnected ?? this.__isConnected;
  }
  constructor(startNode, endNode, parent, options) {
    this.type = CHILD_PART;
    this._$committedValue = nothing;
    this._$disconnectableChildren = undefined;
    this._$startNode = startNode;
    this._$endNode = endNode;
    this._$parent = parent;
    this.options = options;
    this.__isConnected = options?.isConnected ?? true;
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      this._textSanitizer = undefined;
    }
  }
  get parentNode() {
    let parentNode = wrap(this._$startNode).parentNode;
    const parent = this._$parent;
    if (parent !== undefined && parentNode?.nodeType === 11) {
      parentNode = parent.parentNode;
    }
    return parentNode;
  }
  get startNode() {
    return this._$startNode;
  }
  get endNode() {
    return this._$endNode;
  }
  _$setValue(value, directiveParent = this) {
    if (DEV_MODE2 && this.parentNode === null) {
      throw new Error(`This \`ChildPart\` has no \`parentNode\` and therefore cannot accept a value. This likely means the element containing the part was manipulated in an unsupported way outside of Lit's control such that the part's marker nodes were ejected from DOM. For example, setting the element's \`innerHTML\` or \`textContent\` can do this.`);
    }
    value = resolveDirective(this, value, directiveParent);
    if (isPrimitive(value)) {
      if (value === nothing || value == null || value === "") {
        if (this._$committedValue !== nothing) {
          debugLogEvent2 && debugLogEvent2({
            kind: "commit nothing to child",
            start: this._$startNode,
            end: this._$endNode,
            parent: this._$parent,
            options: this.options
          });
          this._$clear();
        }
        this._$committedValue = nothing;
      } else if (value !== this._$committedValue && value !== noChange) {
        this._commitText(value);
      }
    } else if (value["_$litType$"] !== undefined) {
      this._commitTemplateResult(value);
    } else if (value.nodeType !== undefined) {
      if (DEV_MODE2 && this.options?.host === value) {
        this._commitText(`[probable mistake: rendered a template's host in itself ` + `(commonly caused by writing \${this} in a template]`);
        console.warn(`Attempted to render the template host`, value, `inside itself. This is almost always a mistake, and in dev mode `, `we render some warning text. In production however, we'll `, `render it, which will usually result in an error, and sometimes `, `in the element disappearing from the DOM.`);
        return;
      }
      this._commitNode(value);
    } else if (isIterable(value)) {
      this._commitIterable(value);
    } else {
      this._commitText(value);
    }
  }
  _insert(node) {
    return wrap(wrap(this._$startNode).parentNode).insertBefore(node, this._$endNode);
  }
  _commitNode(value) {
    if (this._$committedValue !== value) {
      this._$clear();
      if (ENABLE_EXTRA_SECURITY_HOOKS && sanitizerFactoryInternal !== noopSanitizer) {
        const parentNodeName = this._$startNode.parentNode?.nodeName;
        if (parentNodeName === "STYLE" || parentNodeName === "SCRIPT") {
          let message = "Forbidden";
          if (DEV_MODE2) {
            if (parentNodeName === "STYLE") {
              message = `Lit does not support binding inside style nodes. ` + `This is a security risk, as style injection attacks can ` + `exfiltrate data and spoof UIs. ` + `Consider instead using css\`...\` literals ` + `to compose styles, and do dynamic styling with ` + `css custom properties, ::parts, <slot>s, ` + `and by mutating the DOM rather than stylesheets.`;
            } else {
              message = `Lit does not support binding inside script nodes. ` + `This is a security risk, as it could allow arbitrary ` + `code execution.`;
            }
          }
          throw new Error(message);
        }
      }
      debugLogEvent2 && debugLogEvent2({
        kind: "commit node",
        start: this._$startNode,
        parent: this._$parent,
        value,
        options: this.options
      });
      this._$committedValue = this._insert(value);
    }
  }
  _commitText(value) {
    if (this._$committedValue !== nothing && isPrimitive(this._$committedValue)) {
      const node = wrap(this._$startNode).nextSibling;
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        if (this._textSanitizer === undefined) {
          this._textSanitizer = createSanitizer(node, "data", "property");
        }
        value = this._textSanitizer(value);
      }
      debugLogEvent2 && debugLogEvent2({
        kind: "commit text",
        node,
        value,
        options: this.options
      });
      node.data = value;
    } else {
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        const textNode = d.createTextNode("");
        this._commitNode(textNode);
        if (this._textSanitizer === undefined) {
          this._textSanitizer = createSanitizer(textNode, "data", "property");
        }
        value = this._textSanitizer(value);
        debugLogEvent2 && debugLogEvent2({
          kind: "commit text",
          node: textNode,
          value,
          options: this.options
        });
        textNode.data = value;
      } else {
        this._commitNode(d.createTextNode(value));
        debugLogEvent2 && debugLogEvent2({
          kind: "commit text",
          node: wrap(this._$startNode).nextSibling,
          value,
          options: this.options
        });
      }
    }
    this._$committedValue = value;
  }
  _commitTemplateResult(result) {
    const { values, ["_$litType$"]: type } = result;
    const template = typeof type === "number" ? this._$getTemplate(result) : (type.el === undefined && (type.el = Template.createElement(trustFromTemplateString(type.h, type.h[0]), this.options)), type);
    if (this._$committedValue?._$template === template) {
      debugLogEvent2 && debugLogEvent2({
        kind: "template updating",
        template,
        instance: this._$committedValue,
        parts: this._$committedValue._$parts,
        options: this.options,
        values
      });
      this._$committedValue._update(values);
    } else {
      const instance = new TemplateInstance(template, this);
      const fragment = instance._clone(this.options);
      debugLogEvent2 && debugLogEvent2({
        kind: "template instantiated",
        template,
        instance,
        parts: instance._$parts,
        options: this.options,
        fragment,
        values
      });
      instance._update(values);
      debugLogEvent2 && debugLogEvent2({
        kind: "template instantiated and updated",
        template,
        instance,
        parts: instance._$parts,
        options: this.options,
        fragment,
        values
      });
      this._commitNode(fragment);
      this._$committedValue = instance;
    }
  }
  _$getTemplate(result) {
    let template = templateCache.get(result.strings);
    if (template === undefined) {
      templateCache.set(result.strings, template = new Template(result));
    }
    return template;
  }
  _commitIterable(value) {
    if (!isArray(this._$committedValue)) {
      this._$committedValue = [];
      this._$clear();
    }
    const itemParts = this._$committedValue;
    let partIndex = 0;
    let itemPart;
    for (const item of value) {
      if (partIndex === itemParts.length) {
        itemParts.push(itemPart = new ChildPart(this._insert(createMarker()), this._insert(createMarker()), this, this.options));
      } else {
        itemPart = itemParts[partIndex];
      }
      itemPart._$setValue(item);
      partIndex++;
    }
    if (partIndex < itemParts.length) {
      this._$clear(itemPart && wrap(itemPart._$endNode).nextSibling, partIndex);
      itemParts.length = partIndex;
    }
  }
  _$clear(start = wrap(this._$startNode).nextSibling, from) {
    this._$notifyConnectionChanged?.(false, true, from);
    while (start && start !== this._$endNode) {
      const n = wrap(start).nextSibling;
      wrap(start).remove();
      start = n;
    }
  }
  setConnected(isConnected) {
    if (this._$parent === undefined) {
      this.__isConnected = isConnected;
      this._$notifyConnectionChanged?.(isConnected);
    } else if (DEV_MODE2) {
      throw new Error("part.setConnected() may only be called on a " + "RootPart returned from render().");
    }
  }
}

class AttributePart {
  get tagName() {
    return this.element.tagName;
  }
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  constructor(element, name, strings, parent, options) {
    this.type = ATTRIBUTE_PART;
    this._$committedValue = nothing;
    this._$disconnectableChildren = undefined;
    this.element = element;
    this.name = name;
    this._$parent = parent;
    this.options = options;
    if (strings.length > 2 || strings[0] !== "" || strings[1] !== "") {
      this._$committedValue = new Array(strings.length - 1).fill(new String);
      this.strings = strings;
    } else {
      this._$committedValue = nothing;
    }
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      this._sanitizer = undefined;
    }
  }
  _$setValue(value, directiveParent = this, valueIndex, noCommit) {
    const strings = this.strings;
    let change = false;
    if (strings === undefined) {
      value = resolveDirective(this, value, directiveParent, 0);
      change = !isPrimitive(value) || value !== this._$committedValue && value !== noChange;
      if (change) {
        this._$committedValue = value;
      }
    } else {
      const values = value;
      value = strings[0];
      let i, v;
      for (i = 0;i < strings.length - 1; i++) {
        v = resolveDirective(this, values[valueIndex + i], directiveParent, i);
        if (v === noChange) {
          v = this._$committedValue[i];
        }
        change ||= !isPrimitive(v) || v !== this._$committedValue[i];
        if (v === nothing) {
          value = nothing;
        } else if (value !== nothing) {
          value += (v ?? "") + strings[i + 1];
        }
        this._$committedValue[i] = v;
      }
    }
    if (change && !noCommit) {
      this._commitValue(value);
    }
  }
  _commitValue(value) {
    if (value === nothing) {
      wrap(this.element).removeAttribute(this.name);
    } else {
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        if (this._sanitizer === undefined) {
          this._sanitizer = sanitizerFactoryInternal(this.element, this.name, "attribute");
        }
        value = this._sanitizer(value ?? "");
      }
      debugLogEvent2 && debugLogEvent2({
        kind: "commit attribute",
        element: this.element,
        name: this.name,
        value,
        options: this.options
      });
      wrap(this.element).setAttribute(this.name, value ?? "");
    }
  }
}

class PropertyPart extends AttributePart {
  constructor() {
    super(...arguments);
    this.type = PROPERTY_PART;
  }
  _commitValue(value) {
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      if (this._sanitizer === undefined) {
        this._sanitizer = sanitizerFactoryInternal(this.element, this.name, "property");
      }
      value = this._sanitizer(value);
    }
    debugLogEvent2 && debugLogEvent2({
      kind: "commit property",
      element: this.element,
      name: this.name,
      value,
      options: this.options
    });
    this.element[this.name] = value === nothing ? undefined : value;
  }
}

class BooleanAttributePart extends AttributePart {
  constructor() {
    super(...arguments);
    this.type = BOOLEAN_ATTRIBUTE_PART;
  }
  _commitValue(value) {
    debugLogEvent2 && debugLogEvent2({
      kind: "commit boolean attribute",
      element: this.element,
      name: this.name,
      value: !!(value && value !== nothing),
      options: this.options
    });
    wrap(this.element).toggleAttribute(this.name, !!value && value !== nothing);
  }
}

class EventPart extends AttributePart {
  constructor(element, name, strings, parent, options) {
    super(element, name, strings, parent, options);
    this.type = EVENT_PART;
    if (DEV_MODE2 && this.strings !== undefined) {
      throw new Error(`A \`<${element.localName}>\` has a \`@${name}=...\` listener with ` + "invalid content. Event listeners in templates must have exactly " + "one expression and no surrounding text.");
    }
  }
  _$setValue(newListener, directiveParent = this) {
    newListener = resolveDirective(this, newListener, directiveParent, 0) ?? nothing;
    if (newListener === noChange) {
      return;
    }
    const oldListener = this._$committedValue;
    const shouldRemoveListener = newListener === nothing && oldListener !== nothing || newListener.capture !== oldListener.capture || newListener.once !== oldListener.once || newListener.passive !== oldListener.passive;
    const shouldAddListener = newListener !== nothing && (oldListener === nothing || shouldRemoveListener);
    debugLogEvent2 && debugLogEvent2({
      kind: "commit event listener",
      element: this.element,
      name: this.name,
      value: newListener,
      options: this.options,
      removeListener: shouldRemoveListener,
      addListener: shouldAddListener,
      oldListener
    });
    if (shouldRemoveListener) {
      this.element.removeEventListener(this.name, this, oldListener);
    }
    if (shouldAddListener) {
      this.element.addEventListener(this.name, this, newListener);
    }
    this._$committedValue = newListener;
  }
  handleEvent(event) {
    if (typeof this._$committedValue === "function") {
      this._$committedValue.call(this.options?.host ?? this.element, event);
    } else {
      this._$committedValue.handleEvent(event);
    }
  }
}

class ElementPart {
  constructor(element, parent, options) {
    this.element = element;
    this.type = ELEMENT_PART;
    this._$disconnectableChildren = undefined;
    this._$parent = parent;
    this.options = options;
  }
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  _$setValue(value) {
    debugLogEvent2 && debugLogEvent2({
      kind: "commit to element binding",
      element: this.element,
      value,
      options: this.options
    });
    resolveDirective(this, value);
  }
}
var polyfillSupport2 = DEV_MODE2 ? global3.litHtmlPolyfillSupportDevMode : global3.litHtmlPolyfillSupport;
polyfillSupport2?.(Template, ChildPart);
(global3.litHtmlVersions ??= []).push("3.2.1");
if (DEV_MODE2 && global3.litHtmlVersions.length > 1) {
  issueWarning2("multiple-versions", `Multiple versions of Lit loaded. ` + `Loading multiple versions is not recommended.`);
}
var render = (value, container, options) => {
  if (DEV_MODE2 && container == null) {
    throw new TypeError(`The container to render into may not be ${container}`);
  }
  const renderId = DEV_MODE2 ? debugLogRenderId++ : 0;
  const partOwnerNode = options?.renderBefore ?? container;
  let part = partOwnerNode["_$litPart$"];
  debugLogEvent2 && debugLogEvent2({
    kind: "begin render",
    id: renderId,
    value,
    container,
    options,
    part
  });
  if (part === undefined) {
    const endNode = options?.renderBefore ?? null;
    partOwnerNode["_$litPart$"] = part = new ChildPart(container.insertBefore(createMarker(), endNode), endNode, undefined, options ?? {});
  }
  part._$setValue(value);
  debugLogEvent2 && debugLogEvent2({
    kind: "end render",
    id: renderId,
    value,
    container,
    options,
    part
  });
  return part;
};
if (ENABLE_EXTRA_SECURITY_HOOKS) {
  render.setSanitizer = setSanitizer;
  render.createSanitizer = createSanitizer;
  if (DEV_MODE2) {
    render._testOnlyClearSanitizerFactoryDoNotCallOrElse = _testOnlyClearSanitizerFactoryDoNotCallOrElse;
  }
}

// node_modules/lit-element/development/lit-element.js
var JSCompiler_renameProperty2 = (prop, _obj) => prop;
var DEV_MODE3 = true;
var issueWarning3;
if (DEV_MODE3) {
  const issuedWarnings = globalThis.litIssuedWarnings ??= new Set;
  issueWarning3 = (code, warning) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!issuedWarnings.has(warning)) {
      console.warn(warning);
      issuedWarnings.add(warning);
    }
  };
}

class LitElement extends ReactiveElement {
  constructor() {
    super(...arguments);
    this.renderOptions = { host: this };
    this.__childPart = undefined;
  }
  createRenderRoot() {
    const renderRoot = super.createRenderRoot();
    this.renderOptions.renderBefore ??= renderRoot.firstChild;
    return renderRoot;
  }
  update(changedProperties) {
    const value = this.render();
    if (!this.hasUpdated) {
      this.renderOptions.isConnected = this.isConnected;
    }
    super.update(changedProperties);
    this.__childPart = render(value, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback();
    this.__childPart?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.__childPart?.setConnected(false);
  }
  render() {
    return noChange;
  }
}
LitElement["_$litElement$"] = true;
LitElement[JSCompiler_renameProperty2("finalized", LitElement)] = true;
globalThis.litElementHydrateSupport?.({ LitElement });
var polyfillSupport3 = DEV_MODE3 ? globalThis.litElementPolyfillSupportDevMode : globalThis.litElementPolyfillSupport;
polyfillSupport3?.({ LitElement });
(globalThis.litElementVersions ??= []).push("4.1.1");
if (DEV_MODE3 && globalThis.litElementVersions.length > 1) {
  issueWarning3("multiple-versions", `Multiple versions of Lit loaded. Loading multiple versions ` + `is not recommended.`);
}
// node_modules/@lit/task/development/task.js
var TaskStatus = {
  INITIAL: 0,
  PENDING: 1,
  COMPLETE: 2,
  ERROR: 3
};
var initialState = Symbol();

class Task {
  get taskComplete() {
    if (this._taskComplete) {
      return this._taskComplete;
    }
    if (this._status === TaskStatus.PENDING) {
      this._taskComplete = new Promise((res, rej) => {
        this._resolveTaskComplete = res;
        this._rejectTaskComplete = rej;
      });
    } else if (this._status === TaskStatus.ERROR) {
      this._taskComplete = Promise.reject(this._error);
    } else {
      this._taskComplete = Promise.resolve(this._value);
    }
    return this._taskComplete;
  }
  constructor(host, task, args) {
    this._callId = 0;
    this._status = TaskStatus.INITIAL;
    (this._host = host).addController(this);
    const taskConfig = typeof task === "object" ? task : { task, args };
    this._task = taskConfig.task;
    this._argsFn = taskConfig.args;
    this._argsEqual = taskConfig.argsEqual ?? shallowArrayEquals;
    this._onComplete = taskConfig.onComplete;
    this._onError = taskConfig.onError;
    this.autoRun = taskConfig.autoRun ?? true;
    if ("initialValue" in taskConfig) {
      this._value = taskConfig.initialValue;
      this._status = TaskStatus.COMPLETE;
      this._previousArgs = this._getArgs?.();
    }
  }
  hostUpdate() {
    if (this.autoRun === true) {
      this._performTask();
    }
  }
  hostUpdated() {
    if (this.autoRun === "afterUpdate") {
      this._performTask();
    }
  }
  _getArgs() {
    if (this._argsFn === undefined) {
      return;
    }
    const args = this._argsFn();
    if (!Array.isArray(args)) {
      throw new Error("The args function must return an array");
    }
    return args;
  }
  async _performTask() {
    const args = this._getArgs();
    const prev = this._previousArgs;
    this._previousArgs = args;
    if (args !== prev && args !== undefined && (prev === undefined || !this._argsEqual(prev, args))) {
      await this.run(args);
    }
  }
  async run(args) {
    args ??= this._getArgs();
    this._previousArgs = args;
    if (this._status === TaskStatus.PENDING) {
      this._abortController?.abort();
    } else {
      this._taskComplete = undefined;
      this._resolveTaskComplete = undefined;
      this._rejectTaskComplete = undefined;
    }
    this._status = TaskStatus.PENDING;
    let result;
    let error;
    if (this.autoRun === "afterUpdate") {
      queueMicrotask(() => this._host.requestUpdate());
    } else {
      this._host.requestUpdate();
    }
    const key = ++this._callId;
    this._abortController = new AbortController;
    let errored = false;
    try {
      result = await this._task(args, { signal: this._abortController.signal });
    } catch (e) {
      errored = true;
      error = e;
    }
    if (this._callId === key) {
      if (result === initialState) {
        this._status = TaskStatus.INITIAL;
      } else {
        if (errored === false) {
          try {
            this._onComplete?.(result);
          } catch {
          }
          this._status = TaskStatus.COMPLETE;
          this._resolveTaskComplete?.(result);
        } else {
          try {
            this._onError?.(error);
          } catch {
          }
          this._status = TaskStatus.ERROR;
          this._rejectTaskComplete?.(error);
        }
        this._value = result;
        this._error = error;
      }
      this._host.requestUpdate();
    }
  }
  abort(reason) {
    if (this._status === TaskStatus.PENDING) {
      this._abortController?.abort(reason);
    }
  }
  get value() {
    return this._value;
  }
  get error() {
    return this._error;
  }
  get status() {
    return this._status;
  }
  render(renderer) {
    switch (this._status) {
      case TaskStatus.INITIAL:
        return renderer.initial?.();
      case TaskStatus.PENDING:
        return renderer.pending?.();
      case TaskStatus.COMPLETE:
        return renderer.complete?.(this.value);
      case TaskStatus.ERROR:
        return renderer.error?.(this.error);
      default:
        throw new Error(`Unexpected status: ${this._status}`);
    }
  }
}
var shallowArrayEquals = (oldArgs, newArgs) => oldArgs === newArgs || oldArgs.length === newArgs.length && oldArgs.every((v, i) => !notEqual(v, newArgs[i]));
// node_modules/@std/ulid/_util.js
var ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
var ENCODING_LEN = ENCODING.length;
var TIME_MAX = Math.pow(2, 48) - 1;
var TIME_LEN = 10;
var RANDOM_LEN = 16;
var ULID_LEN = TIME_LEN + RANDOM_LEN;
function replaceCharAt(str, index, char) {
  return str.substring(0, index) + char + str.substring(index + 1);
}
function encodeTime(timestamp) {
  if (!Number.isInteger(timestamp) || timestamp < 0 || timestamp > TIME_MAX) {
    throw new RangeError(`Time must be a positive integer less than ${TIME_MAX}`);
  }
  let str = "";
  for (let len = TIME_LEN;len > 0; len--) {
    const mod = timestamp % ENCODING_LEN;
    str = ENCODING[mod] + str;
    timestamp = Math.floor(timestamp / ENCODING_LEN);
  }
  return str;
}
function encodeRandom() {
  let str = "";
  const bytes = crypto.getRandomValues(new Uint8Array(RANDOM_LEN));
  for (const byte of bytes) {
    str += ENCODING[byte % ENCODING_LEN];
  }
  return str;
}
function incrementBase32(str) {
  let index = str.length;
  let char;
  let charIndex;
  const maxCharIndex = ENCODING_LEN - 1;
  while (--index >= 0) {
    char = str[index];
    charIndex = ENCODING.indexOf(char);
    if (charIndex === -1) {
      throw new TypeError("Incorrectly encoded string");
    }
    if (charIndex === maxCharIndex) {
      str = replaceCharAt(str, index, ENCODING[0]);
      continue;
    }
    return replaceCharAt(str, index, ENCODING[charIndex + 1]);
  }
  throw new Error("Cannot increment this string");
}
function monotonicFactory(encodeRand = encodeRandom) {
  let lastTime = 0;
  let lastRandom;
  return function ulid(seedTime = Date.now()) {
    if (seedTime <= lastTime) {
      const incrementedRandom = lastRandom = incrementBase32(lastRandom);
      return encodeTime(lastTime) + incrementedRandom;
    }
    lastTime = seedTime;
    const newRandom = lastRandom = encodeRand();
    return encodeTime(seedTime) + newRandom;
  };
}
// node_modules/@std/ulid/monotonic_ulid.js
var defaultMonotonicUlid = monotonicFactory();
// node_modules/@std/ulid/ulid.js
function ulid(seedTime = Date.now()) {
  return encodeTime(seedTime) + encodeRandom();
}
// node_modules/@lit/reactive-element/development/decorators/custom-element.js
var customElement = (tagName) => (classOrTarget, context) => {
  if (context !== undefined) {
    context.addInitializer(() => {
      customElements.define(tagName, classOrTarget);
    });
  } else {
    customElements.define(tagName, classOrTarget);
  }
};
// node_modules/@lit/reactive-element/development/decorators/property.js
var DEV_MODE4 = true;
var issueWarning4;
if (DEV_MODE4) {
  const issuedWarnings = globalThis.litIssuedWarnings ??= new Set;
  issueWarning4 = (code, warning) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!issuedWarnings.has(warning)) {
      console.warn(warning);
      issuedWarnings.add(warning);
    }
  };
}
var legacyProperty = (options, proto, name) => {
  const hasOwnProperty = proto.hasOwnProperty(name);
  proto.constructor.createProperty(name, hasOwnProperty ? { ...options, wrapped: true } : options);
  return hasOwnProperty ? Object.getOwnPropertyDescriptor(proto, name) : undefined;
};
var defaultPropertyDeclaration2 = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual
};
var standardProperty = (options = defaultPropertyDeclaration2, target, context) => {
  const { kind, metadata } = context;
  if (DEV_MODE4 && metadata == null) {
    issueWarning4("missing-class-metadata", `The class ${target} is missing decorator metadata. This ` + `could mean that you're using a compiler that supports decorators ` + `but doesn't support decorator metadata, such as TypeScript 5.1. ` + `Please update your compiler.`);
  }
  let properties = globalThis.litPropertyMetadata.get(metadata);
  if (properties === undefined) {
    globalThis.litPropertyMetadata.set(metadata, properties = new Map);
  }
  properties.set(context.name, options);
  if (kind === "accessor") {
    const { name } = context;
    return {
      set(v) {
        const oldValue = target.get.call(this);
        target.set.call(this, v);
        this.requestUpdate(name, oldValue, options);
      },
      init(v) {
        if (v !== undefined) {
          this._$changeProperty(name, undefined, options);
        }
        return v;
      }
    };
  } else if (kind === "setter") {
    const { name } = context;
    return function(value) {
      const oldValue = this[name];
      target.call(this, value);
      this.requestUpdate(name, oldValue, options);
    };
  }
  throw new Error(`Unsupported decorator location: ${kind}`);
};
function property(options) {
  return (protoOrTarget, nameOrContext) => {
    return typeof nameOrContext === "object" ? standardProperty(options, protoOrTarget, nameOrContext) : legacyProperty(options, protoOrTarget, nameOrContext);
  };
}
// node_modules/@lit/reactive-element/development/decorators/state.js
function state(options) {
  return property({
    ...options,
    state: true,
    attribute: false
  });
}
// node_modules/@lit/reactive-element/development/decorators/query.js
var DEV_MODE5 = true;
var issueWarning5;
if (DEV_MODE5) {
  const issuedWarnings = globalThis.litIssuedWarnings ??= new Set;
  issueWarning5 = (code, warning) => {
    warning += code ? ` See https://lit.dev/msg/${code} for more information.` : "";
    if (!issuedWarnings.has(warning)) {
      console.warn(warning);
      issuedWarnings.add(warning);
    }
  };
}
// node_modules/@atcute/oauth-browser-client/dist/utils/runtime.js
var encoder = new TextEncoder;
var locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
var toBase64Url = (input) => {
  const CHUNK_SIZE = 32768;
  const arr = [];
  for (let i = 0;i < input.byteLength; i += CHUNK_SIZE) {
    arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
  }
  return btoa(arr.join("")).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};
var fromBase64Url = (input) => {
  try {
    const binary = atob(input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0;i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    throw new TypeError(`invalid base64url`, { cause: err });
  }
};
var toSha256 = async (input) => {
  const bytes = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return toBase64Url(new Uint8Array(digest));
};
var randomBytes = (length) => {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(length)));
};
var generateState = () => {
  return randomBytes(16);
};
var generatePKCE = async () => {
  const verifier = randomBytes(32);
  return {
    verifier,
    challenge: await toSha256(verifier),
    method: "S256"
  };
};
var lastTimestamp = 0;
var randomString;
var generateJti = () => {
  if (randomString === undefined) {
    const random = crypto.getRandomValues(new BigUint64Array(1));
    randomString = random[0].toString(36);
  }
  const timestamp = Math.max(Date.now() * 1000, lastTimestamp);
  lastTimestamp = timestamp + 1;
  return `${timestamp.toString(36)}:${randomString}`;
};

// node_modules/@atcute/oauth-browser-client/dist/store/db.js
var parse = (raw) => {
  if (raw != null) {
    const parsed = JSON.parse(raw);
    if (parsed != null) {
      return parsed;
    }
  }
  return {};
};
var createOAuthDatabase = ({ name }) => {
  const controller = new AbortController;
  const signal = controller.signal;
  const createStore = (subname, expiresAt, persistUpdatedAt = false) => {
    let store;
    const storageKey = `${name}:${subname}`;
    const persist = () => store && localStorage.setItem(storageKey, JSON.stringify(store));
    const read = () => {
      if (signal.aborted) {
        throw new Error(`store closed`);
      }
      return store ??= parse(localStorage.getItem(storageKey));
    };
    {
      const listener = (ev) => {
        if (ev.key === storageKey) {
          store = undefined;
        }
      };
      globalThis.addEventListener("storage", listener, { signal });
    }
    {
      const cleanup = async (lock) => {
        if (!lock || signal.aborted) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1e4));
        if (signal.aborted) {
          return;
        }
        let now = Date.now();
        let changed = false;
        read();
        for (const key in store) {
          const item = store[key];
          const expiresAt2 = item.expiresAt;
          if (expiresAt2 !== null && now > expiresAt2) {
            changed = true;
            delete store[key];
          }
        }
        if (changed) {
          persist();
        }
      };
      if (locks) {
        locks.request(`${storageKey}:cleanup`, { ifAvailable: true }, cleanup);
      } else {
        cleanup(true);
      }
    }
    return {
      get(key) {
        read();
        const item = store[key];
        if (!item) {
          return;
        }
        const expiresAt2 = item.expiresAt;
        if (expiresAt2 !== null && Date.now() > expiresAt2) {
          delete store[key];
          persist();
          return;
        }
        return item.value;
      },
      getWithLapsed(key) {
        read();
        const item = store[key];
        const now = Date.now();
        if (!item) {
          return [undefined, Infinity];
        }
        const updatedAt = item.updatedAt;
        if (updatedAt === undefined) {
          return [item.value, Infinity];
        }
        return [item.value, now - updatedAt];
      },
      set(key, value) {
        read();
        const item = {
          value,
          expiresAt: expiresAt(value),
          updatedAt: persistUpdatedAt ? Date.now() : undefined
        };
        store[key] = item;
        persist();
      },
      delete(key) {
        read();
        if (store[key] !== undefined) {
          delete store[key];
          persist();
        }
      },
      keys() {
        read();
        return Object.keys(store);
      }
    };
  };
  return {
    dispose: () => {
      controller.abort();
    },
    sessions: createStore("sessions", ({ token }) => {
      if (token.refresh) {
        return null;
      }
      return token.expires_at ?? null;
    }),
    states: createStore("states", (_item) => Date.now() + 10 * 60 * 1000),
    dpopNonces: createStore("dpopNonces", (_item) => Date.now() + 24 * 60 * 60 * 1000, true),
    inflightDpop: new Map
  };
};

// node_modules/@atcute/oauth-browser-client/dist/environment.js
var CLIENT_ID;
var REDIRECT_URI;
var database;
var configureOAuth = (options) => {
  ({ client_id: CLIENT_ID, redirect_uri: REDIRECT_URI } = options.metadata);
  database = createOAuthDatabase({ name: options.storageName ?? "atcute-oauth" });
};
// node_modules/@atcute/oauth-browser-client/dist/errors.js
class LoginError extends Error {
  name = "LoginError";
}

class AuthorizationError extends Error {
  name = "AuthorizationError";
}

class ResolverError extends Error {
  name = "ResolverError";
}

class TokenRefreshError extends Error {
  sub;
  name = "TokenRefreshError";
  constructor(sub, message, options) {
    super(message, options);
    this.sub = sub;
  }
}

class OAuthResponseError extends Error {
  response;
  data;
  name = "OAuthResponseError";
  error;
  description;
  constructor(response, data) {
    const error = ifString(ifObject(data)?.["error"]);
    const errorDescription = ifString(ifObject(data)?.["error_description"]);
    const messageError = error ? `"${error}"` : "unknown";
    const messageDesc = errorDescription ? `: ${errorDescription}` : "";
    const message = `OAuth ${messageError} error${messageDesc}`;
    super(message);
    this.response = response;
    this.data = data;
    this.error = error;
    this.description = errorDescription;
  }
  get status() {
    return this.response.status;
  }
  get headers() {
    return this.response.headers;
  }
}

class FetchResponseError extends Error {
  response;
  status;
  name = "FetchResponseError";
  constructor(response, status, message) {
    super(message);
    this.response = response;
    this.status = status;
  }
}
var ifString = (v) => {
  return typeof v === "string" ? v : undefined;
};
var ifObject = (v) => {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? v : undefined;
};
// node_modules/@atcute/client/dist/utils/did.js
var getPdsEndpoint = (doc) => {
  return getServiceEndpoint(doc, "#atproto_pds", "AtprotoPersonalDataServer");
};
var getServiceEndpoint = (doc, serviceId, serviceType) => {
  const did = doc.id;
  const didServiceId = did + serviceId;
  const found = doc.service?.find((service) => service.id === serviceId || service.id === didServiceId);
  if (!found || found.type !== serviceType || typeof found.serviceEndpoint !== "string") {
    return;
  }
  return validateUrl(found.serviceEndpoint);
};
var validateUrl = (urlStr) => {
  let url;
  try {
    url = new URL(urlStr);
  } catch {
    return;
  }
  const proto = url.protocol;
  if (url.hostname && (proto === "http:" || proto === "https:")) {
    return urlStr;
  }
};

// node_modules/@atcute/oauth-browser-client/dist/constants.js
var DEFAULT_APPVIEW_URL = "https://public.api.bsky.app";

// node_modules/@atcute/oauth-browser-client/dist/utils/response.js
var extractContentType = (headers) => {
  return headers.get("content-type")?.split(";")[0];
};

// node_modules/@atcute/oauth-browser-client/dist/utils/strings.js
var isUrlParseSupported = "parse" in URL;
var isDid = (value) => {
  return value.startsWith("did:");
};
var isValidUrl = (urlString) => {
  let url = null;
  if (isUrlParseSupported) {
    url = URL.parse(urlString);
  } else {
    try {
      url = new URL(urlString);
    } catch {
    }
  }
  if (url !== null) {
    return url.protocol === "https:" || url.protocol === "http:";
  }
  return false;
};

// node_modules/@atcute/oauth-browser-client/dist/resolvers.js
var DID_WEB_RE = /^([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,}))$/;
var resolveHandle = async (handle) => {
  const url = DEFAULT_APPVIEW_URL + `/xrpc/com.atproto.identity.resolveHandle` + `?handle=${handle}`;
  const response = await fetch(url);
  if (response.status === 400) {
    throw new ResolverError(`domain handle not found`);
  } else if (!response.ok) {
    throw new ResolverError(`directory is unreachable`);
  }
  const json = await response.json();
  return json.did;
};
var getDidDocument = async (did) => {
  const colon_index = did.indexOf(":", 4);
  const type = did.slice(4, colon_index);
  const ident = did.slice(colon_index + 1);
  let doc;
  if (type === "plc") {
    const response = await fetch(`https://plc.directory/${did}`);
    if (response.status === 404) {
      throw new ResolverError(`did not found in directory`);
    } else if (!response.ok) {
      throw new ResolverError(`directory is unreachable`);
    }
    const json = await response.json();
    doc = json;
  } else if (type === "web") {
    if (!DID_WEB_RE.test(ident)) {
      throw new ResolverError(`invalid identifier`);
    }
    const response = await fetch(`https://${ident}/.well-known/did.json`);
    if (!response.ok) {
      throw new ResolverError(`did document is unreachable`);
    }
    const json = await response.json();
    doc = json;
  } else {
    throw new ResolverError(`unsupported did method`);
  }
  return doc;
};
var getProtectedResourceMetadata = async (host) => {
  const url = new URL(`/.well-known/oauth-protected-resource`, host);
  const response = await fetch(url, {
    redirect: "manual",
    headers: {
      accept: "application/json"
    }
  });
  if (response.status !== 200 || extractContentType(response.headers) !== "application/json") {
    throw new ResolverError(`unexpected response`);
  }
  const metadata = await response.json();
  if (metadata.resource !== url.origin) {
    throw new ResolverError(`unexpected issuer`);
  }
  return metadata;
};
var getAuthorizationServerMetadata = async (host) => {
  const url = new URL(`/.well-known/oauth-authorization-server`, host);
  const response = await fetch(url, {
    redirect: "manual",
    headers: {
      accept: "application/json"
    }
  });
  if (response.status !== 200 || extractContentType(response.headers) !== "application/json") {
    throw new ResolverError(`unexpected response`);
  }
  const metadata = await response.json();
  if (metadata.issuer !== url.origin) {
    throw new ResolverError(`unexpected issuer`);
  }
  if (!isValidUrl(metadata.authorization_endpoint)) {
    throw new ResolverError(`authorization server provided incorrect authorization endpoint`);
  }
  if (!metadata.client_id_metadata_document_supported) {
    throw new ResolverError(`authorization server does not support 'client_id_metadata_document'`);
  }
  if (!metadata.pushed_authorization_request_endpoint) {
    throw new ResolverError(`authorization server does not support 'pushed_authorization request'`);
  }
  if (metadata.response_types_supported) {
    if (!metadata.response_types_supported.includes("code")) {
      throw new ResolverError(`authorization server does not support 'code' response type`);
    }
  }
  return metadata;
};
var resolveFromIdentity = async (ident) => {
  let did;
  if (isDid(ident)) {
    did = ident;
  } else {
    const resolved = await resolveHandle(ident);
    did = resolved;
  }
  const doc = await getDidDocument(did);
  const pds = getPdsEndpoint(doc);
  if (!pds) {
    throw new ResolverError(`missing pds endpoint`);
  }
  return {
    identity: {
      id: did,
      raw: ident,
      pds: new URL(pds)
    },
    metadata: await getMetadataFromResourceServer(pds)
  };
};
var getMetadataFromResourceServer = async (input) => {
  const rs_metadata = await getProtectedResourceMetadata(input);
  if (rs_metadata.authorization_servers?.length !== 1) {
    throw new ResolverError(`expected exactly one authorization server in the listing`);
  }
  const issuer = rs_metadata.authorization_servers[0];
  const as_metadata = await getAuthorizationServerMetadata(issuer);
  if (as_metadata.protected_resources) {
    if (!as_metadata.protected_resources.includes(rs_metadata.resource)) {
      throw new ResolverError(`server is not in authorization server's jurisdiction`);
    }
  }
  return as_metadata;
};
// node_modules/@atcute/oauth-browser-client/dist/dpop.js
var ES256_ALG = { name: "ECDSA", namedCurve: "P-256" };
var createES256Key = async () => {
  const pair = await crypto.subtle.generateKey(ES256_ALG, true, ["sign", "verify"]);
  const key = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  const { ext: _ext, key_ops: _key_opts, ...jwk } = await crypto.subtle.exportKey("jwk", pair.publicKey);
  return {
    typ: "ES256",
    key: toBase64Url(new Uint8Array(key)),
    jwt: toBase64Url(encoder.encode(JSON.stringify({ typ: "dpop+jwt", alg: "ES256", jwk })))
  };
};
var createDPoPSignage = (issuer, dpopKey) => {
  const headerString = dpopKey.jwt;
  const keyPromise = crypto.subtle.importKey("pkcs8", fromBase64Url(dpopKey.key), ES256_ALG, true, ["sign"]);
  const constructPayload = (method, url, nonce, ath) => {
    const payload = {
      iss: issuer,
      iat: Math.floor(Date.now() / 1000),
      jti: generateJti(),
      htm: method,
      htu: url,
      nonce,
      ath
    };
    return toBase64Url(encoder.encode(JSON.stringify(payload)));
  };
  return async (method, url, nonce, ath) => {
    const payloadString = constructPayload(method, url, nonce, ath);
    const signed = await crypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, await keyPromise, encoder.encode(headerString + "." + payloadString));
    const signatureString = toBase64Url(new Uint8Array(signed));
    return headerString + "." + payloadString + "." + signatureString;
  };
};
var createDPoPFetch = (issuer, dpopKey, isAuthServer) => {
  const nonces = database.dpopNonces;
  const pending = database.inflightDpop;
  const sign = createDPoPSignage(issuer, dpopKey);
  return async (input, init) => {
    const request = init == null && input instanceof Request ? input : new Request(input, init);
    const authorizationHeader = request.headers.get("authorization");
    const ath = authorizationHeader?.startsWith("DPoP ") ? await toSha256(authorizationHeader.slice(5)) : undefined;
    const { method, url } = request;
    const { origin } = new URL(url);
    let deferred = pending.get(origin);
    if (deferred) {
      await deferred.promise;
      deferred = undefined;
    }
    let initNonce;
    let expiredOrMissing = false;
    try {
      const [nonce, lapsed] = nonces.getWithLapsed(origin);
      initNonce = nonce;
      expiredOrMissing = lapsed > 3 * 60 * 1000;
    } catch {
    }
    if (expiredOrMissing) {
      pending.set(origin, deferred = Promise.withResolvers());
    }
    let nextNonce;
    try {
      const initProof = await sign(method, url, initNonce, ath);
      request.headers.set("dpop", initProof);
      const initResponse = await fetch(request);
      nextNonce = initResponse.headers.get("dpop-nonce");
      if (nextNonce === null || nextNonce === initNonce) {
        return initResponse;
      }
      try {
        nonces.set(origin, nextNonce);
      } catch {
      }
      const shouldRetry = await isUseDpopNonceError(initResponse, isAuthServer);
      if (!shouldRetry) {
        return initResponse;
      }
      if (input === request || init?.body instanceof ReadableStream) {
        return initResponse;
      }
    } finally {
      if (deferred) {
        pending.delete(origin);
        deferred.resolve();
      }
    }
    {
      const nextProof = await sign(method, url, nextNonce, ath);
      const nextRequest = new Request(input, init);
      nextRequest.headers.set("dpop", nextProof);
      return await fetch(nextRequest);
    }
  };
};
var isUseDpopNonceError = async (response, isAuthServer) => {
  if (isAuthServer === undefined || isAuthServer === false) {
    if (response.status === 401) {
      const wwwAuth = response.headers.get("www-authenticate");
      if (wwwAuth?.startsWith("DPoP")) {
        return wwwAuth.includes('error="use_dpop_nonce"');
      }
    }
  }
  if (isAuthServer === undefined || isAuthServer === true) {
    if (response.status === 400 && extractContentType(response.headers) === "application/json") {
      try {
        const json = await response.clone().json();
        return typeof json === "object" && json?.["error"] === "use_dpop_nonce";
      } catch {
        return false;
      }
    }
  }
  return false;
};

// node_modules/@atcute/oauth-browser-client/dist/utils/misc.js
var pick = (obj, keys) => {
  const cloned = {};
  for (let idx = 0, len = keys.length;idx < len; idx++) {
    const key = keys[idx];
    cloned[key] = obj[key];
  }
  return cloned;
};

// node_modules/@atcute/oauth-browser-client/dist/agents/server-agent.js
class OAuthServerAgent {
  #fetch;
  #metadata;
  constructor(metadata, dpopKey) {
    this.#metadata = metadata;
    this.#fetch = createDPoPFetch(CLIENT_ID, dpopKey, true);
  }
  async request(endpoint, payload) {
    const url = this.#metadata[`${endpoint}_endpoint`];
    if (!url) {
      throw new Error(`no endpoint for ${endpoint}`);
    }
    const response = await this.#fetch(url, {
      method: "post",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, client_id: CLIENT_ID })
    });
    if (extractContentType(response.headers) !== "application/json") {
      throw new FetchResponseError(response, 2, `unexpected content-type`);
    }
    const json = await response.json();
    if (response.ok) {
      return json;
    } else {
      throw new OAuthResponseError(response, json);
    }
  }
  async revoke(token) {
    try {
      await this.request("revocation", { token });
    } catch {
    }
  }
  async exchangeCode(code, verifier) {
    const response = await this.request("token", {
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      code,
      code_verifier: verifier
    });
    try {
      return await this.#processExchangeResponse(response);
    } catch (err) {
      await this.revoke(response.access_token);
      throw err;
    }
  }
  async refresh({ sub, token }) {
    if (!token.refresh) {
      throw new TokenRefreshError(sub, "no refresh token available");
    }
    const response = await this.request("token", {
      grant_type: "refresh_token",
      refresh_token: token.refresh
    });
    try {
      if (sub !== response.sub) {
        throw new TokenRefreshError(sub, `sub mismatch in token response; got ${response.sub}`);
      }
      return this.#processTokenResponse(response);
    } catch (err) {
      await this.revoke(response.access_token);
      throw err;
    }
  }
  #processTokenResponse(res) {
    if (!res.sub) {
      throw new TypeError(`missing sub field in token response`);
    }
    if (!res.scope) {
      throw new TypeError(`missing scope field in token response`);
    }
    if (res.token_type !== "DPoP") {
      throw new TypeError(`token response returned a non-dpop token`);
    }
    return {
      scope: res.scope,
      refresh: res.refresh_token,
      access: res.access_token,
      type: res.token_type,
      expires_at: typeof res.expires_in === "number" ? Date.now() + res.expires_in * 1000 : undefined
    };
  }
  async#processExchangeResponse(res) {
    const sub = res.sub;
    if (!sub) {
      throw new TypeError(`missing sub field in token response`);
    }
    const token = this.#processTokenResponse(res);
    const resolved = await resolveFromIdentity(sub);
    if (resolved.metadata.issuer !== this.#metadata.issuer) {
      throw new TypeError(`issuer mismatch; got ${resolved.metadata.issuer}`);
    }
    return {
      token,
      info: {
        sub,
        aud: resolved.identity.pds.href,
        server: pick(resolved.metadata, [
          "issuer",
          "authorization_endpoint",
          "introspection_endpoint",
          "pushed_authorization_request_endpoint",
          "revocation_endpoint",
          "token_endpoint"
        ])
      }
    };
  }
}

// node_modules/@atcute/oauth-browser-client/dist/agents/sessions.js
var pending = new Map;
var getSession = async (sub, options) => {
  options?.signal?.throwIfAborted();
  let allowStored = isTokenUsable;
  if (options?.noCache) {
    allowStored = returnFalse;
  } else if (options?.allowStale) {
    allowStored = returnTrue;
  }
  let previousExecutionFlow;
  while (previousExecutionFlow = pending.get(sub)) {
    try {
      const { isFresh, value: value2 } = await previousExecutionFlow;
      if (isFresh || allowStored(value2)) {
        return value2;
      }
    } catch {
    }
    options?.signal?.throwIfAborted();
  }
  const run = async () => {
    const storedSession = database.sessions.get(sub);
    if (storedSession && allowStored(storedSession)) {
      return { isFresh: false, value: storedSession };
    }
    const newSession = await refreshToken(sub, storedSession);
    await storeSession(sub, newSession);
    return { isFresh: true, value: newSession };
  };
  let promise;
  if (locks) {
    promise = locks.request(`atcute-oauth:${sub}`, run);
  } else {
    promise = run();
  }
  promise = promise.finally(() => pending.delete(sub));
  if (pending.has(sub)) {
    throw new Error("concurrent request for the same key");
  }
  pending.set(sub, promise);
  const { value } = await promise;
  return value;
};
var storeSession = async (sub, newSession) => {
  try {
    database.sessions.set(sub, newSession);
  } catch (err) {
    await onRefreshError(newSession);
    throw err;
  }
};
var deleteStoredSession = (sub) => {
  database.sessions.delete(sub);
};
var returnTrue = () => true;
var returnFalse = () => false;
var refreshToken = async (sub, storedSession) => {
  if (storedSession === undefined) {
    throw new TokenRefreshError(sub, `session deleted by another tab`);
  }
  const { dpopKey, info, token } = storedSession;
  const server = new OAuthServerAgent(info.server, dpopKey);
  try {
    const newToken = await server.refresh({ sub: info.sub, token });
    return { dpopKey, info, token: newToken };
  } catch (cause) {
    if (cause instanceof OAuthResponseError && cause.status === 400 && cause.error === "invalid_grant") {
      throw new TokenRefreshError(sub, `session was revoked`, { cause });
    }
    throw cause;
  }
};
var onRefreshError = async ({ dpopKey, info, token }) => {
  const server = new OAuthServerAgent(info.server, dpopKey);
  await server.revoke(token.refresh ?? token.access);
};
var isTokenUsable = ({ token }) => {
  const expires = token.expires_at;
  return expires == null || Date.now() + 60000 <= expires;
};

// node_modules/@atcute/oauth-browser-client/dist/agents/exchange.js
var createAuthorizationUrl = async ({ metadata, identity, scope }) => {
  const state3 = generateState();
  const pkce = await generatePKCE();
  const dpopKey = await createES256Key();
  const params = {
    redirect_uri: REDIRECT_URI,
    code_challenge: pkce.challenge,
    code_challenge_method: pkce.method,
    state: state3,
    login_hint: identity?.raw,
    response_mode: "fragment",
    response_type: "code",
    display: "page",
    scope
  };
  database.states.set(state3, {
    dpopKey,
    metadata,
    verifier: pkce.verifier
  });
  const server = new OAuthServerAgent(metadata, dpopKey);
  const response = await server.request("pushed_authorization_request", params);
  const authUrl = new URL(metadata.authorization_endpoint);
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("request_uri", response.request_uri);
  return authUrl;
};
var finalizeAuthorization = async (params) => {
  const issuer = params.get("iss");
  const state3 = params.get("state");
  const code = params.get("code");
  const error = params.get("error");
  if (!state3 || !(code || error)) {
    throw new LoginError(`missing parameters`);
  }
  const stored = database.states.get(state3);
  if (stored) {
    database.states.delete(state3);
  } else {
    throw new LoginError(`unknown state provided`);
  }
  const dpopKey = stored.dpopKey;
  const metadata = stored.metadata;
  if (error) {
    throw new AuthorizationError(params.get("error_description") || error);
  }
  if (!code) {
    throw new LoginError(`missing code parameter`);
  }
  if (issuer === null) {
    throw new LoginError(`missing issuer parameter`);
  } else if (issuer !== metadata.issuer) {
    throw new LoginError(`issuer mismatch`);
  }
  const server = new OAuthServerAgent(metadata, dpopKey);
  const { info, token } = await server.exchangeCode(code, stored.verifier);
  const sub = info.sub;
  const session = { dpopKey, info, token };
  await storeSession(sub, session);
  return session;
};
// node_modules/@atcute/oauth-browser-client/dist/agents/user-agent.js
class OAuthUserAgent {
  session;
  #fetch;
  #getSessionPromise;
  constructor(session) {
    this.session = session;
    this.#fetch = createDPoPFetch(CLIENT_ID, session.dpopKey, false);
  }
  get sub() {
    return this.session.info.sub;
  }
  getSession(options) {
    const promise = getSession(this.session.info.sub, options);
    promise.then((session) => {
      this.session = session;
    }).finally(() => {
      this.#getSessionPromise = undefined;
    });
    return this.#getSessionPromise = promise;
  }
  async signOut() {
    const sub = this.session.info.sub;
    try {
      const { dpopKey, info, token } = await getSession(sub, { allowStale: true });
      const server = new OAuthServerAgent(info.server, dpopKey);
      await server.revoke(token.refresh ?? token.access);
    } finally {
      deleteStoredSession(sub);
    }
  }
  async handle(pathname, init) {
    await this.#getSessionPromise;
    const headers = new Headers(init?.headers);
    let session = this.session;
    let url = new URL(pathname, session.info.aud);
    headers.set("authorization", `${session.token.type} ${session.token.access}`);
    let response = await this.#fetch(url, { ...init, headers });
    if (!isInvalidTokenResponse(response)) {
      return response;
    }
    try {
      if (this.#getSessionPromise) {
        session = await this.#getSessionPromise;
      } else {
        session = await this.getSession();
      }
    } catch {
      return response;
    }
    if (init?.body instanceof ReadableStream) {
      return response;
    }
    url = new URL(pathname, session.info.aud);
    headers.set("authorization", `${session.token.type} ${session.token.access}`);
    return await this.#fetch(url, { ...init, headers });
  }
}
var isInvalidTokenResponse = (response) => {
  if (response.status !== 401) {
    return false;
  }
  const auth = response.headers.get("www-authenticate");
  return auth != null && (auth.startsWith("Bearer ") || auth.startsWith("DPoP ")) && auth.includes('error="invalid_token"');
};
// node_modules/@atcute/client/dist/fetch-handler.js
var buildFetchHandler = (handler) => {
  if (typeof handler === "object") {
    return handler.handle.bind(handler);
  }
  return handler;
};
var simpleFetchHandler = ({ service, fetch: _fetch = fetch }) => {
  return async (pathname, init) => {
    const url = new URL(pathname, service);
    return _fetch(url, init);
  };
};

// node_modules/@atcute/client/dist/utils/http.js
var mergeHeaders = (init, defaults) => {
  let headers;
  for (const name in defaults) {
    const value = defaults[name];
    if (value !== null) {
      headers ??= new Headers(init);
      if (!headers.has(name)) {
        headers.set(name, value);
      }
    }
  }
  return headers ?? init;
};

// node_modules/@atcute/client/dist/rpc.js
class XRPCError extends Error {
  constructor(status, { kind = `HTTP error ${status}`, description = `Unspecified error description`, headers, cause } = {}) {
    super(`${kind} > ${description}`, { cause });
    this.name = "XRPCError";
    this.status = status;
    this.kind = kind;
    this.description = description;
    this.headers = headers || {};
  }
}

class XRPC {
  constructor({ handler, proxy }) {
    this.handle = buildFetchHandler(handler);
    this.proxy = proxy;
  }
  get(nsid, options) {
    return this.request({ type: "get", nsid, ...options });
  }
  call(nsid, options) {
    return this.request({ type: "post", nsid, ...options });
  }
  async request(options) {
    const data = options.data;
    const url = `/xrpc/${options.nsid}` + constructSearchParams(options.params);
    const isInputJson = isJsonValue(data);
    const response = await this.handle(url, {
      method: options.type,
      signal: options.signal,
      body: isInputJson ? JSON.stringify(data) : data,
      headers: mergeHeaders(options.headers, {
        "content-type": isInputJson ? "application/json" : null,
        "atproto-proxy": constructProxyHeader(this.proxy)
      })
    });
    const responseStatus = response.status;
    const responseHeaders = Object.fromEntries(response.headers);
    const responseType = responseHeaders["content-type"];
    let promise;
    let ret;
    if (responseType) {
      if (responseType.startsWith("application/json")) {
        promise = response.json();
      } else if (responseType.startsWith("text/")) {
        promise = response.text();
      }
    }
    try {
      ret = await (promise || response.arrayBuffer().then((buffer) => new Uint8Array(buffer)));
    } catch (err) {
      throw new XRPCError(2, {
        cause: err,
        kind: "InvalidResponse",
        description: `Failed to parse response body`,
        headers: responseHeaders
      });
    }
    if (responseStatus === 200) {
      return {
        data: ret,
        headers: responseHeaders
      };
    }
    if (isErrorResponse(ret)) {
      throw new XRPCError(responseStatus, {
        kind: ret.error,
        description: ret.message,
        headers: responseHeaders
      });
    }
    throw new XRPCError(responseStatus, { headers: responseHeaders });
  }
}
var constructProxyHeader = (proxy) => {
  if (proxy) {
    return `${proxy.service}#${proxy.type}`;
  }
  return null;
};
var constructSearchParams = (params) => {
  let searchParams;
  for (const key in params) {
    const value = params[key];
    if (value !== undefined) {
      searchParams ??= new URLSearchParams;
      if (Array.isArray(value)) {
        for (let idx = 0, len = value.length;idx < len; idx++) {
          const val = value[idx];
          searchParams.append(key, "" + val);
        }
      } else {
        searchParams.set(key, "" + value);
      }
    }
  }
  return searchParams ? `?` + searchParams.toString() : "";
};
var isJsonValue = (o) => {
  if (typeof o !== "object" || o === null) {
    return false;
  }
  if ("toJSON" in o) {
    return true;
  }
  const proto = Object.getPrototypeOf(o);
  return proto === null || proto === Object.prototype;
};
var isErrorResponse = (value) => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const kindType = typeof value.error;
  const messageType = typeof value.message;
  return (kindType === "undefined" || kindType === "string") && (messageType === "undefined" || messageType === "string");
};
// node_modules/@atcute/client/dist/utils/jwt.js
var decodeJwt = (token2) => {
  const pos = 1;
  const part = token2.split(".")[1];
  let decoded;
  if (typeof part !== "string") {
    throw new Error("invalid token: missing part " + (pos + 1));
  }
  try {
    decoded = base64UrlDecode(part);
  } catch (e) {
    throw new Error("invalid token: invalid b64 for part " + (pos + 1) + " (" + e.message + ")");
  }
  try {
    return JSON.parse(decoded);
  } catch (e) {
    throw new Error("invalid token: invalid json for part " + (pos + 1) + " (" + e.message + ")");
  }
};
var base64UrlDecode = (str) => {
  let output = str.replace(/-/g, "+").replace(/_/g, "/");
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += "==";
      break;
    case 3:
      output += "=";
      break;
    default:
      throw new Error("base64 string is not of the correct length");
  }
  try {
    return b64DecodeUnicode(output);
  } catch {
    return atob(output);
  }
};
var b64DecodeUnicode = (str) => {
  return decodeURIComponent(atob(str).replace(/(.)/g, (_m, p) => {
    let code = p.charCodeAt(0).toString(16).toUpperCase();
    if (code.length < 2) {
      code = "0" + code;
    }
    return "%" + code;
  }));
};

// node_modules/@atcute/client/dist/credential-manager.js
class CredentialManager {
  #server;
  #refreshSessionPromise;
  #onExpired;
  #onRefresh;
  #onSessionUpdate;
  constructor({ service, onExpired, onRefresh, onSessionUpdate, fetch: _fetch = fetch }) {
    this.serviceUrl = service;
    this.fetch = _fetch;
    this.#server = new XRPC({ handler: simpleFetchHandler({ service, fetch: _fetch }) });
    this.#onRefresh = onRefresh;
    this.#onExpired = onExpired;
    this.#onSessionUpdate = onSessionUpdate;
  }
  get dispatchUrl() {
    return this.session?.pdsUri ?? this.serviceUrl;
  }
  async handle(pathname, init) {
    await this.#refreshSessionPromise;
    const url = new URL(pathname, this.dispatchUrl);
    const headers = new Headers(init.headers);
    if (!this.session || headers.has("authorization")) {
      return (0, this.fetch)(url, init);
    }
    headers.set("authorization", `Bearer ${this.session.accessJwt}`);
    const initialResponse = await (0, this.fetch)(url, { ...init, headers });
    const isExpired = await isExpiredTokenResponse(initialResponse);
    if (!isExpired) {
      return initialResponse;
    }
    try {
      await this.#refreshSession();
    } catch {
      return initialResponse;
    }
    if (!this.session || init.body instanceof ReadableStream) {
      return initialResponse;
    }
    headers.set("authorization", `Bearer ${this.session.accessJwt}`);
    return await (0, this.fetch)(url, { ...init, headers });
  }
  #refreshSession() {
    return this.#refreshSessionPromise ||= this.#refreshSessionInner().finally(() => this.#refreshSessionPromise = undefined);
  }
  async#refreshSessionInner() {
    const currentSession = this.session;
    if (!currentSession) {
      return;
    }
    try {
      const { data } = await this.#server.call("com.atproto.server.refreshSession", {
        headers: {
          authorization: `Bearer ${currentSession.refreshJwt}`
        }
      });
      this.#updateSession({ ...currentSession, ...data });
      this.#onRefresh?.(this.session);
    } catch (err) {
      if (err instanceof XRPCError) {
        const kind = err.kind;
        if (kind === "ExpiredToken" || kind === "InvalidToken") {
          this.session = undefined;
          this.#onExpired?.(currentSession);
        }
      }
    }
  }
  #updateSession(raw) {
    const didDoc = raw.didDoc;
    let pdsUri;
    if (didDoc) {
      pdsUri = getPdsEndpoint(didDoc);
    }
    const newSession = {
      accessJwt: raw.accessJwt,
      refreshJwt: raw.refreshJwt,
      handle: raw.handle,
      did: raw.did,
      pdsUri,
      email: raw.email,
      emailConfirmed: raw.emailConfirmed,
      emailAuthFactor: raw.emailConfirmed,
      active: raw.active ?? true,
      inactiveStatus: raw.status
    };
    this.session = newSession;
    this.#onSessionUpdate?.(newSession);
    return newSession;
  }
  async resume(session) {
    const now = Date.now() / 1000 + 60 * 5;
    const refreshToken2 = decodeJwt(session.refreshJwt);
    if (now >= refreshToken2.exp) {
      throw new XRPCError(401, { kind: "InvalidToken" });
    }
    const accessToken = decodeJwt(session.accessJwt);
    this.session = session;
    if (now >= accessToken.exp) {
      await this.#refreshSession();
    } else {
      const promise = this.#server.get("com.atproto.server.getSession", {
        headers: {
          authorization: `Bearer ${session.accessJwt}`
        }
      });
      promise.then((response) => {
        const existing = this.session;
        const next = response.data;
        if (!existing) {
          return;
        }
        this.#updateSession({ ...existing, ...next });
      });
    }
    if (!this.session) {
      throw new XRPCError(401, { kind: "InvalidToken" });
    }
    return this.session;
  }
  async login(options) {
    this.session = undefined;
    const res = await this.#server.call("com.atproto.server.createSession", {
      data: {
        identifier: options.identifier,
        password: options.password,
        authFactorToken: options.code,
        allowTakendown: options.allowTakendown
      }
    });
    return this.#updateSession(res.data);
  }
}
var isExpiredTokenResponse = async (response) => {
  if (response.status !== 400) {
    return false;
  }
  if (extractContentType2(response.headers) !== "application/json") {
    return false;
  }
  if (extractContentLength(response.headers) > 54 * 1.5) {
    return false;
  }
  try {
    const { error, message } = await response.clone().json();
    return error === "ExpiredToken" && (typeof message === "string" || message === undefined);
  } catch {
  }
  return false;
};
var extractContentType2 = (headers) => {
  return headers.get("content-type")?.split(";")[0]?.trim();
};
var extractContentLength = (headers) => {
  return Number(headers.get("content-length") ?? ";");
};
// login.ts
console.log("login");
var enc = encodeURIComponent;
var url = `http://127.0.0.1:3000`;
var meta = {
  client_name: "nandi oauth",
  client_id: `http://localhost?redirect_uri=${enc(`${url}/callback`)}&scope=${enc("atproto transition:generic")}`,
  client_uri: url,
  redirect_uri: `${url}/callback`,
  redirect_uris: [`${url}/callback`],
  scope: "atproto transition:generic",
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  application_type: "web",
  token_endpoint_auth_method: "none",
  dpop_bound_access_tokens: true
};
configureOAuth({
  metadata: meta
});
var hashFragment = window.location.hash.substring(1);
if (hashFragment) {
  const params = new URLSearchParams(hashFragment);
  let session = await finalizeAuthorization(params);
  console.log({ session });
  location.href = "/";
}

class Login extends LitElement {
  constructor() {
    super(...arguments);
    this.handle = "";
    this.authUrl = "";
  }
  static styles = css``;
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
  handleInput(event) {
    const inputElement = event.target;
    this.handle = inputElement.value;
    localStorage.setItem("handle", this.handle);
    console.log("Handle:", this.handle);
  }
  async _submit() {
    const { identity: identity2, metadata } = await resolveFromIdentity(this.handle);
    const authUrl = await createAuthorizationUrl({
      metadata,
      identity: identity2,
      scope: "atproto transition:generic"
    });
    console.log(authUrl);
    this.authUrl = authUrl.href;
  }
}
__legacyDecorateClassTS([
  state()
], Login.prototype, "handle", undefined);
__legacyDecorateClassTS([
  state()
], Login.prototype, "authUrl", undefined);
Login = __legacyDecorateClassTS([
  customElement("login-")
], Login);

class Callback extends LitElement {
  static styles = css``;
  render() {
    return html` <h1>Callback</h1> `;
  }
}
Callback = __legacyDecorateClassTS([
  customElement("callback-")
], Callback);

class Root extends LitElement {
  constructor() {
    super(...arguments);
    this.message = "";
  }
  static styles = css``;
  _task = new Task(this, {
    task: async ([handle], { signal }) => {
      const response = await fetch(`/repos/${handle}`, {
        signal
      });
      console.log(response);
      return response.json();
    },
    args: () => [localStorage.getItem("handle")]
  });
  render() {
    const handle = localStorage.getItem("handle");
    const ws = new WebSocket("ws://localhost:3000/ws");
    ws.onopen = () => {
      console.log("WebSocket connection opened");
      ws.send(handle);
    };
    ws.onmessage = (event) => {
      this.message = event.data;
    };
    const button = html`<button
      @click=${async () => {
      const { identity: identity2 } = await resolveFromIdentity(handle);
      const session = await getSession(identity2.id);
      const agent = new OAuthUserAgent(session);
      const rpc2 = new XRPC({ handler: agent });
      const stamp = ulid();
      const resp = await rpc2.call("com.atproto.repo.putRecord", {
        data: {
          repo: handle,
          collection: "nandi.schemas.gitauthorize",
          rkey: stamp,
          record: {
            $type: "nandi.schemas.gitauthorize",
            stamp
          }
        }
      });
      console.log(resp);
      console.log("button clicked");
      this.message = "";
    }}
    >
      Ok
    </button>`;
    return this._task.render({
      pending: () => html`<div>Loading...</div>`,
      complete: (result) => html`<div>
            Hello ${handle}, your existing repos: ${JSON.stringify(result)}
          </div>
          ${this.message ? html`<dialog open>${button}</dialog>` : html``}`,
      error: (e) => html`error: ${e}`
    });
  }
}
__legacyDecorateClassTS([
  state()
], Root.prototype, "message", undefined);
Root = __legacyDecorateClassTS([
  customElement("root-")
], Root);

//# debugId=AA957D38595606E264756E2164756E21
//# sourceMappingURL=index.js.map
