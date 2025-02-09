// src/module.tsx
var Event = /* @__PURE__ */ ((Event2) => {
  Event2["REGISTER_INPUT"] = "antetype.conditions.input.register";
  Event2["REGISTER_METHOD"] = "antetype.conditions.method.register";
  return Event2;
})(Event || {});
function ConditionsModule({
  injected: { herald }
}) {
  const retrieveInputs = async () => {
    const inputs = {};
    const event = new CustomEvent("antetype.conditions.input.register" /* REGISTER_INPUT */, {
      detail: {
        inputs
      }
    });
    await herald.dispatch(event);
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
    return event.detail.methods;
  };
  herald.batch([
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
            value: null,
            get() {
              return this.value;
            },
            set(value) {
              this.value = value;
            },
            reset() {
              this.value = null;
            }
          })
        };
        inputs.select = {
          type: "select",
          name: "Drop down",
          generate: () => ({
            type: "select",
            name: "Drop down Name",
            value: null,
            options: [],
            get() {
              return this.value;
            },
            set(value) {
              this.value = value;
            },
            reset() {
              this.value = null;
            }
          })
        };
        inputs.image = {
          type: "image",
          name: "Image",
          generate: () => ({
            type: "image",
            name: "Image input Name",
            value: null,
            get() {
              return this.value;
            },
            set(value) {
              this.value = value;
            },
            reset() {
              this.value = null;
            }
          })
        };
      }
    }
  ]);
  return {
    retrieveInputs,
    retrieveMethods
  };
}
export {
  Event,
  ConditionsModule as default
};
