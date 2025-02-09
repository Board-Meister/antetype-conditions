// ../antetype-core/dist/index.js
var i = ((e) => (e.STRUCTURE = "antetype.structure", e.MIDDLE = "antetype.structure.middle", e.BAR_BOTTOM = "antetype.structure.bar.bottom", e.CENTER = "antetype.structure.center", e.COLUMN_LEFT = "antetype.structure.column.left", e.COLUMN_RIGHT = "antetype.structure.column.right", e.COLUMN_RIGHT_AFTER = "antetype.structure.column.right.after", e.COLUMN_RIGHT_BEFORE = "antetype.structure.column.right.before", e.BAR_TOP = "antetype.structure.bar.top", e.MODULES = "antetype.modules", e.ACTIONS = "antetype.structure.column.left.actions", e.PROPERTIES = "antetype.structure.column.left.properties", e.SHOW_PROPERTIES = "antetype.structure.column.left.properties.show", e))(i || {});
var c = ((r) => (r.INIT = "antetype.init", r.CLOSE = "antetype.close", r.DRAW = "antetype.draw", r.CALC = "antetype.calc", r.RECALC_FINISHED = "antetype.recalc.finished", r.MODULES = "antetype.modules", r))(c || {});
var s = class {
  #t;
  #r = null;
  #e = null;
  static inject = { minstrel: "boardmeister/minstrel", herald: "boardmeister/herald" };
  inject(t) {
    this.#t = t;
  }
  async #n(t, n) {
    if (!this.#e) {
      let o = this.#t.minstrel.getResourceUrl(this, "core.js");
      this.#r = (await import(o)).default, this.#e = this.#r({ canvas: n, modules: t, injected: this.#t });
    }
    return this.#e;
  }
  async register(t) {
    let { modules: n, canvas: o } = t.detail;
    n.core = await this.#n(n, o);
  }
  async init(t) {
    if (!this.#e) throw new Error("Instance not loaded, trigger registration event first");
    let { base: n, settings: o } = t.detail;
    for (let r in o) this.#e.setting.set(r, o[r]);
    let a = this.#e.meta.document;
    a.base = n;
    let l = [];
    return (this.#e.setting.get("fonts") ?? []).forEach((r) => {
      l.push(this.#e.font.load(r));
    }), await Promise.all(l), a.layout = await this.#e.view.recalculate(a, a.base), await this.#e.view.redraw(a.layout), a;
  }
  async cloneDefinitions(t) {
    if (!this.#e) throw new Error("Instance not loaded, trigger registration event first");
    t.detail.element !== null && (t.detail.element = await this.#e.clone.definitions(t.detail.element));
  }
  static subscriptions = { [i.MODULES]: "register", "antetype.init": "init", "antetype.calc": [{ method: "cloneDefinitions", priority: -255 }] };
};

// src/module.tsx
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
    console.log("register??");
    this.#instance = modules.conditions = this.#module({
      canvas,
      modules,
      injected: this.#injected
    });
  }
  static subscriptions = {
    [c.MODULES]: "register"
  };
};
var EnSkeleton = Conditions;
var src_default = EnSkeleton;
export {
  Conditions,
  Event,
  src_default as default
};
