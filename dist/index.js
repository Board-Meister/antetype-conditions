// ../antetype-core/dist/index.js
var o = { INIT: "antetype.init", CLOSE: "antetype.close", DRAW: "antetype.draw", CALC: "antetype.calc", RECALC_FINISHED: "antetype.recalc.finished", MODULES: "antetype.modules", SETTINGS: "antetype.settings.definition", TYPE_DEFINITION: "antetype.layer.type.definition", FONTS_LOADED: "antetype.font.loaded" };
var i = class {
  #e;
  #n = null;
  static inject = { minstrel: "boardmeister/minstrel", herald: "boardmeister/herald" };
  inject(e) {
    this.#e = e;
  }
  async #t(e, n) {
    let t = this.#e.minstrel.getResourceUrl(this, "core.js");
    return this.#n = (await import(t)).default, this.#n({ canvas: n, modules: e, herald: this.#e.herald });
  }
  async register(e) {
    let { modules: n, canvas: t } = e.detail;
    n.core = await this.#t(n, t);
  }
  static subscriptions = { [o.MODULES]: "register" };
};

// src/type.d.ts
var inputLayerSymbol = Symbol("Input Layer");
var actionLayerSymbol = Symbol("Action Layer");
var changeActionSymbol = Symbol("Change Action");
var Event = /* @__PURE__ */ ((Event2) => {
  Event2["REGISTER_INPUT"] = "antetype.conditions.input.register";
  Event2["REGISTER_METHOD"] = "antetype.conditions.method.register";
  return Event2;
})(Event || {});

// src/index.ts
var Conditions = class {
  #injected;
  #module = null;
  // @ts-expect-error TS6133: '#instance' is declared but its value is never read.
  #instance = null;
  static inject = {
    minstrel: "boardmeister/minstrel",
    herald: "boardmeister/herald"
  };
  inject(injections) {
    this.#injected = injections;
  }
  async register(event) {
    const { modules, canvas } = event.detail;
    if (!this.#module) {
      const module = this.#injected.minstrel.getResourceUrl(this, "module.js");
      this.#module = (await import(module)).default;
    }
    this.#instance = modules.conditions = this.#module({
      canvas,
      modules,
      herald: this.#injected.herald
    });
  }
  static subscriptions = {
    [o.MODULES]: "register"
  };
};
var EnSkeleton = Conditions;
var src_default = EnSkeleton;
export {
  Conditions,
  Event,
  actionLayerSymbol,
  changeActionSymbol,
  src_default as default,
  inputLayerSymbol
};
