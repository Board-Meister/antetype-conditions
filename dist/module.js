// src/type.d.ts
var inputLayerSymbol = Symbol("Input Layer");
var actionLayerSymbol = Symbol("Action Layer");
var changeActionSymbol = Symbol("Change Action");
var Event = /* @__PURE__ */ ((Event2) => {
  Event2["REGISTER_INPUT"] = "antetype.conditions.input.register";
  Event2["REGISTER_METHOD"] = "antetype.conditions.method.register";
  return Event2;
})(Event || {});

// src/segment/crud.ts
function crud({
  inputsMap,
  inputsTypeMap,
  methodsMap,
  modules
}) {
  const getMethod = (type) => methodsMap[type] ?? null;
  const removeChange = (action, change) => {
    const changes = change[changeActionSymbol]?.changes ?? [];
    for (let i2 = 0; i2 < changes.length; i2++) {
      const possibleChange = changes[i2];
      if (possibleChange === change) {
        changes.splice(i2, 1);
        break;
      }
    }
    for (let i2 = 0; i2 < action.changes.length; i2++) {
      const possibleChange = action.changes[i2];
      if (possibleChange === change) {
        action.changes.splice(i2, 1);
        break;
      }
    }
  };
  const addChange = (action, method) => {
    const change = {
      [changeActionSymbol]: action,
      type: method.type,
      arguments: [...method.arguments ?? []]
    };
    action.changes.push(change);
    return change;
  };
  const removeAction = (actions, action) => {
    const actionsGrouper = action[actionLayerSymbol]?.conditions?.actions ?? [];
    for (let i2 = 0; i2 < actionsGrouper.length; i2++) {
      const possibleAction = actionsGrouper[i2];
      if (possibleAction === action) {
        actionsGrouper.splice(i2, 1);
        break;
      }
    }
    for (let i2 = 0; i2 < actions.length; i2++) {
      const possibleAction = actions[i2];
      if (possibleAction === action) {
        actions.splice(i2, 1);
        break;
      }
    }
  };
  const addEmptyAction = (layer) => {
    layer.conditions ??= {};
    layer.conditions.actions ??= [];
    const emptyAction = {
      [actionLayerSymbol]: layer,
      rule: {
        text: ""
      },
      changes: []
    };
    layer.conditions.actions.push(emptyAction);
    return emptyAction;
  };
  const registerInput = (layer, handler) => {
    handler.id = modules.core.meta.generateId();
    handler[inputLayerSymbol] = layer;
    inputsMap[handler.id] = handler;
  };
  const addInput = (layer, input) => {
    const handler = input.generate(layer);
    registerInput(layer, handler);
    layer.conditions ??= {};
    layer.conditions.inputs ??= [];
    layer.conditions.inputs.push(handler);
    return handler;
  };
  const removeInput = (handler) => {
    const inputs = handler[inputLayerSymbol]?.conditions?.inputs ?? [];
    for (let i2 = 0; i2 < inputs.length; i2++) {
      const input = inputs[i2];
      if (input === handler) {
        inputs.splice(i2, 1);
        break;
      }
    }
    if (handler.id) {
      delete inputsMap[handler.id];
    }
  };
  const getInputById = (id) => inputsMap[id] ?? null;
  const getInputLayer = (input) => input[inputLayerSymbol] ?? null;
  const getInputs = () => Object.values(inputsMap);
  const getInputByType = (type) => inputsTypeMap[type] ?? null;
  const registerNewInputs = (layer) => {
    const inputs = layer.conditions?.inputs ?? [];
    for (let i2 = 0; i2 < inputs.length; i2++) {
      let input = inputs[i2];
      if (input[inputLayerSymbol]) {
        continue;
      }
      const template = getInputByType(input.type);
      if (template) {
        const regenerated = template.generate(layer);
        for (const key in input) {
          regenerated[key] = input[key];
        }
        inputs[i2] = input = regenerated;
      }
      if (!input.id) {
        input.id = modules.core.meta.generateId();
      }
      inputsMap[input.id] = input;
      input[inputLayerSymbol] = layer;
    }
    for (const child of layer.layout ?? []) {
      registerNewInputs(child);
    }
  };
  const registerNewActions = (layer) => {
    for (const action of layer.conditions?.actions ?? []) {
      if (action[actionLayerSymbol]) {
        continue;
      }
      action[actionLayerSymbol] = layer;
      for (const change of action.changes) {
        change[changeActionSymbol] = action;
      }
    }
    for (const child of layer.layout ?? []) {
      registerNewActions(child);
    }
  };
  return {
    addInput,
    removeInput,
    getInputByType,
    getInputById,
    getInputs,
    getInputLayer,
    addEmptyAction,
    removeAction,
    addChange,
    removeChange,
    getMethod,
    registerInput,
    registerNewInputs,
    registerNewActions
  };
}

// node_modules/@boardmeister/antetype-core/dist/index.js
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

// src/segment/events.ts
function events({
  modules,
  herald,
  crud: crud2,
  inputsTypeMap,
  methodsMap
}) {
  const retrieveInputs = async () => {
    const inputs = {};
    const event = new CustomEvent("antetype.conditions.input.register" /* REGISTER_INPUT */, {
      detail: {
        inputs
      }
    });
    await herald.dispatch(event);
    for (const key in inputsTypeMap) delete inputsTypeMap[key];
    for (const type in event.detail.inputs) {
      const input = event.detail.inputs[type];
      inputsTypeMap[input.type] = input;
    }
    return event.detail.inputs;
  };
  const retrieveMethods = async () => {
    const methods = {};
    const event = new CustomEvent("antetype.conditions.method.register" /* REGISTER_METHOD */, {
      detail: {
        methods
      }
    });
    await herald.dispatch(event);
    for (const key in methodsMap) delete methodsMap[key];
    for (const type in event.detail.methods) {
      const method = event.detail.methods[type];
      methodsMap[method.type] = method;
    }
    return event.detail.methods;
  };
  const imageToLayer = {};
  const unregister = herald.batch([
    {
      event: o.CLOSE,
      subscription: () => {
        unregister();
      }
    },
    {
      event: o.INIT,
      subscription: {
        method: async (e) => {
          await Promise.all([
            retrieveInputs(),
            retrieveMethods()
          ]);
          const { base } = e.detail;
          for (const layer of base) {
            crud2.registerNewInputs(layer);
            crud2.registerNewActions(layer);
          }
        },
        priority: -10
      }
    },
    {
      event: "antetype.conditions.input.register" /* REGISTER_INPUT */,
      subscription: (e) => {
        const { inputs } = e.detail;
        inputs.text = {
          type: "title",
          name: "Title",
          generate: () => ({
            type: "title",
            name: "Title Name",
            value: null
          })
        };
        inputs.select = {
          type: "select",
          name: "Drop down",
          generate: () => ({
            _value: null,
            type: "select",
            name: "Drop down Name",
            set value(value) {
              if (value === null) {
                for (const option of this.options) {
                  option.checked = false;
                }
                return;
              }
              for (const option of this.options) {
                if (value == option.value) {
                  option.checked = true;
                } else {
                  option.checked = false;
                }
              }
            },
            get value() {
              for (const option of this.options) {
                if (option.checked) {
                  return option.value;
                }
              }
              return null;
            },
            options: []
          })
        };
        inputs.multiselect = {
          type: "multiselect",
          name: "Multiselect",
          generate: () => ({
            type: "multiselect",
            name: "Multiselect Name",
            set value(value) {
              if (value === null) {
                for (const option of this.options) {
                  option.checked = false;
                }
                return;
              }
              for (const option of this.options) {
                if (-1 !== value.indexOf(option.value)) {
                  option.checked = true;
                } else {
                  option.checked = false;
                }
              }
            },
            get value() {
              const selected = [];
              for (const option of this.options) {
                if (option.checked) {
                  selected.push(option.value);
                }
              }
              return selected;
            },
            options: []
          })
        };
        inputs.image = {
          type: "image",
          name: "Image",
          generate: () => ({
            type: "image",
            name: "Image input Name",
            value: null
          })
        };
      }
    },
    {
      event: "antetype.conditions.method.register" /* REGISTER_METHOD */,
      subscription: (e) => {
        const { methods } = e.detail;
        methods.hide = {
          name: "Hide layer",
          type: "hide",
          resolve: ({ event }) => {
            event.detail.element = null;
          }
        };
        methods.setImage = {
          name: "Set image",
          type: "set-image",
          arguments: [
            {
              name: "image",
              type: "image"
            }
          ],
          resolve: ({ layer }, image) => {
            if (!image || layer.type !== "image") {
              return;
            }
            layer.image.src = image;
            const original = modules.core.clone.getOriginal(layer);
            if (imageToLayer[image]?.has(original)) {
              return;
            }
            imageToLayer[image] ??= /* @__PURE__ */ new WeakMap();
            imageToLayer[image].set(original, true);
            const newImg = new Image();
            newImg.onload = function() {
              void modules.core.view.recalculate().then(() => {
                modules.core.view.redraw();
              });
            };
            newImg.src = image;
          }
        };
        methods.setText = {
          name: "Set text",
          type: "set-text",
          arguments: [
            {
              name: "text",
              type: "text",
              placeholder: "New text"
            }
          ],
          resolve: ({ layer }, text) => {
            if (!text || layer.type !== "text") {
              return;
            }
            layer.text.value = text;
          }
        };
        methods.setProperty = {
          name: "Set property",
          type: "set-property",
          arguments: [
            {
              name: "path",
              type: "text",
              placeholder: "Path to property (path.to.property)"
            },
            {
              name: "value",
              type: "text",
              placeholder: "New value"
            }
          ],
          resolve: ({ layer }, path, value) => {
            if (!path) {
              return;
            }
            const recursiveAccessAndSetProperty = (obj, legs2, value2, pos = 0) => {
              if (legs2.length == pos + 1) {
                obj[legs2[pos]] = value2;
                return;
              }
              const type = typeof obj[legs2[pos]];
              if (type != "undefined" && type != "object" && obj[legs2[pos]] !== null) {
                console.error("Cannot replace scalar value with object by template actions", obj, legs2, value2);
                return;
              }
              obj[legs2[pos]] ??= {};
              recursiveAccessAndSetProperty(obj[legs2[pos]], legs2, value2, pos + 1);
            };
            const legs = path.split(".");
            recursiveAccessAndSetProperty(layer, legs, value);
          }
        };
      }
    }
  ]);
  return {
    retrieveInputs,
    retrieveMethods
  };
}

// src/segment/conditions.ts
function setConditionHandler({
  herald,
  crud: crud2,
  enableTextConditions
}) {
  const actionCache = {};
  const resolveArguments = (args) => {
    const values = [];
    for (const argument of args) {
      let value = argument.value;
      if (argument.inputId) {
        value = crud2.getInputById(argument.inputId)?.value ?? null;
      }
      values.push(value);
    }
    return values;
  };
  const canActionResolve = (action, args = null) => {
    const rule = action.rule.text.trim();
    if (!enableTextConditions || rule.length == 0) {
      return true;
    }
    args ??= generateActionArguments();
    if (!actionCache[rule]) {
      actionCache[rule] = new Function(
        ...Object.keys(args),
        "return !!(" + rule + ")"
      ).bind({});
    }
    return actionCache[rule](...Object.values(args));
  };
  const generateActionArguments = () => {
    const inputs = {};
    for (const input of crud2.getInputs()) {
      inputs[input.name] = input.value;
      inputs[input.id] = input.value;
    }
    return {
      inputs
    };
  };
  const unregister = herald.batch([
    {
      event: o.CLOSE,
      subscription: () => {
        unregister();
      }
    },
    {
      event: o.CALC,
      subscription: {
        method: (e) => {
          const element = e.detail.element;
          if (!element?.conditions?.actions || element.conditions.actions.length == 0) {
            return;
          }
          const args = generateActionArguments();
          for (const action of element.conditions.actions) {
            try {
              if (!canActionResolve(action, args)) {
                continue;
              }
            } catch {
              continue;
            }
            for (const change of action.changes) {
              const method = crud2.getMethod(change.type);
              if (!method) continue;
              method.resolve({ layer: element, event: e }, ...resolveArguments(change.arguments));
            }
          }
        },
        priority: -250
      }
    }
  ]);
  return {
    canActionResolve,
    generateActionArguments,
    resolveArguments
  };
}

// src/module.ts
function ConditionsModule({
  herald,
  modules
}) {
  const inputsMap = {};
  const inputsTypeMap = {};
  const methodsMap = {};
  const crudProps = crud({ inputsMap, inputsTypeMap, methodsMap, modules });
  const detectCSPRestriction = () => {
    try {
      new Function("return 1");
      return true;
    } catch (e) {
      if (/unsafe-eval|CSP/.exec(e.toString())) {
        console.error(
          "It seems you are using environment with Content Security Policy that prohibits unsafe-eval. The condition compiler from Antetype Conditions Module cannot work in this environment. Consider relaxing the policy to allow unsafe-eval or pre-compiling your templates into render functions. For now text based conditions are disabled."
        );
      }
      return false;
    }
  };
  const eventsProps = events({ inputsMap, herald, modules, inputsTypeMap, methodsMap, crud: crudProps });
  const conditionProps = setConditionHandler({
    enableTextConditions: detectCSPRestriction(),
    inputsMap,
    herald,
    modules,
    crud: crudProps
  });
  return {
    getInputsMap: () => ({ ...inputsTypeMap }),
    getMethodsMap: () => ({ ...methodsMap }),
    ...eventsProps,
    ...crudProps,
    ...conditionProps
  };
}
export {
  Event,
  actionLayerSymbol,
  changeActionSymbol,
  ConditionsModule as default,
  inputLayerSymbol
};
