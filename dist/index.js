// ../antetype-core/dist/index.js
var Event = /* @__PURE__ */ ((Event22) => {
  Event22["INIT"] = "antetype.init";
  Event22["CLOSE"] = "antetype.close";
  Event22["DRAW"] = "antetype.draw";
  Event22["CALC"] = "antetype.calc";
  Event22["RECALC_FINISHED"] = "antetype.recalc.finished";
  Event22["MODULES"] = "antetype.modules";
  return Event22;
})(Event || {});

// src/type.d.tsx
var inputLayerSymbol = Symbol("Input Layer");
var actionLayerSymbol = Symbol("Action Layer");
var changeActionSymbol = Symbol("Change Action");
var Event2 = /* @__PURE__ */ ((Event3) => {
  Event3["REGISTER_INPUT"] = "antetype.conditions.input.register";
  Event3["REGISTER_METHOD"] = "antetype.conditions.method.register";
  return Event3;
})(Event2 || {});

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
    [Event.MODULES]: "register"
  };
};
var EnSkeleton = Conditions;
var src_default = EnSkeleton;
export {
  Conditions,
  Event2 as Event,
  actionLayerSymbol,
  changeActionSymbol,
  src_default as default,
  inputLayerSymbol
};
