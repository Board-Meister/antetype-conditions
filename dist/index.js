// ../antetype-core/dist/index.js
var s = ((t) => (t.INIT = "antetype.init", t.CLOSE = "antetype.close", t.DRAW = "antetype.draw", t.CALC = "antetype.calc", t.RECALC_FINISHED = "antetype.recalc.finished", t.MODULES = "antetype.modules", t.SETTINGS = "antetype.settings.definition", t))(s || {});

// src/type.d.tsx
var inputLayerSymbol = Symbol("Input Layer");
var actionLayerSymbol = Symbol("Action Layer");
var changeActionSymbol = Symbol("Change Action");
var Event = /* @__PURE__ */ ((Event2) => {
  Event2["REGISTER_INPUT"] = "antetype.conditions.input.register";
  Event2["REGISTER_METHOD"] = "antetype.conditions.method.register";
  return Event2;
})(Event || {});

// src/index.tsx
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
  /**
   * Example of lazy loading the module
   */
  async register(event) {
    const { modules, canvas } = event.detail;
    if (!this.#module) {
      const module = this.#injected.minstrel.getResourceUrl(this, "module.js");
      this.#module = (await import(module)).default;
    }
    this.#instance = modules.conditions = this.#module({
      canvas,
      modules,
      injected: this.#injected
    });
  }
  static subscriptions = {
    [s.MODULES]: "register"
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
