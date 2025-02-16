import type { Modules, IParentDef, InitEvent } from "@boardmeister/antetype-core"
import type { ITextDef, IImageDef } from "@boardmeister/antetype-illustrator"
import { Event as CoreEvent } from "@boardmeister/antetype-core"
import {
  Event, IConditionAwareDef,
  IImageInputHandler,
  IInput, IInputHandler, inputLayerSymbol,
  ISelectInputHandler,
  ITitleInputHandler,
  RegisterInputEvent, RegisterMethodEvent, SetImageMethod, SetPropertyMethod, SetTextMethod,
  actionLayerSymbol,
  changeActionSymbol, IMultiselectInputHandler, IMethod,
} from "@src/type.d";
import { IInjected } from "@src/index";
import { ICrud } from "@src/segment/crud";

export interface IEventsProps {
  inputsMap: Record<string, IInputHandler>;
  injected: IInjected;
  modules: Modules;
  crud: ICrud;
  inputsTypeMap: Record<string, IInput>;
  methodsMap: Record<string, IMethod>;
}

export interface IEventReturn {
  retrieveInputs: () => Promise<Record<string, IInput>>;
  retrieveMethods: () => Promise<Record<string, IMethod>>;
}

export default function events(
  {
    inputsMap,
    modules,
    injected: { herald },
    crud,
    inputsTypeMap,
    methodsMap,
  }: IEventsProps
): IEventReturn {
  const retrieveInputs = async (): Promise<Record<string, IInput>> => {
    const inputs: Record<string, IInput> = {};
    const event = new CustomEvent(Event.REGISTER_INPUT, {
      detail: {
        inputs,
      }
    });
    await herald.dispatch(event);
    for (const key in inputsTypeMap) delete inputsTypeMap[key];
    for (const type in event.detail.inputs) {
      const input = event.detail.inputs[type];
      inputsTypeMap[input.type] = input;
    }
    return event.detail.inputs;
  }

  const retrieveMethods = async (): Promise<Record<string, IMethod>> => {
    const methods: Record<string, IMethod> = {};
    const event = new CustomEvent(Event.REGISTER_METHOD, {
      detail: {
        methods,
      }
    });
    await herald.dispatch(event);
    for (const key in methodsMap) delete methodsMap[key];
    for (const type in event.detail.methods) {
      const method = event.detail.methods[type];
      methodsMap[method.type] = method;
    }
    return event.detail.methods;
  }

  const imageToLayer: Record<string, WeakMap<IConditionAwareDef, true>> = {};

  const registerNewInputs = (layer: IConditionAwareDef): void => {
    const inputs = layer.conditions?.inputs ?? [];
    for(let i=0; i < inputs.length; i++) {
      let input = inputs[i];
      if (input[inputLayerSymbol]) {
        continue;
      }

      const template = crud.getInputByType(input.type);
      if (template) {
        const regenerated = template.generate(layer);
        for (const key in input) {
          regenerated[key] = input[key];
        }
        inputs[i] = input = regenerated;
      }

      if (input.id) {
        inputsMap[input.id] = input;
      }
      input[inputLayerSymbol] = layer;
    }

    for (const child of (layer as IParentDef).layout ?? []) {
      registerNewInputs(child);
    }
  }

  const registerNewActions = (layer: IConditionAwareDef): void => {
    for (const action of layer.conditions?.actions ?? []) {
      if (action[actionLayerSymbol]) {
        continue;
      }

      action[actionLayerSymbol] = layer;
      for (const change of action.changes) {
        change[changeActionSymbol] = action;
      }
    }

    for (const child of (layer as IParentDef).layout ?? []) {
      registerNewInputs(child);
    }
  }

  const unregister = herald.batch([
    {
      event: CoreEvent.CLOSE,
      subscription: () => {
        unregister();
      },
    },
    {
      event: CoreEvent.INIT,
      subscription: {
        method: async (e: CustomEvent<InitEvent>) => {
          await Promise.all([
            retrieveInputs(),
            retrieveMethods(),
          ]);
          const { base } = e.detail;
          for (const layer of base) {
            registerNewInputs(layer);
            registerNewActions(layer);
          }
        },
        priority: -10,
      }
    },
    {
      event: Event.REGISTER_INPUT,
      subscription: (e: RegisterInputEvent): void => {
        const { inputs } = e.detail;
        inputs.text = {
          type: 'title',
          name: 'Title',
          generate: () => ({
            type: 'title',
            name: 'Title Name',
            value: null,
          })
        } as IInput<ITitleInputHandler>;

        inputs.select = {
          type: 'select',
          name: 'Drop down',
          generate: () => ({
            _value: null,
            type: 'select',
            name: 'Drop down Name',
            set value(value: string|null) {
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
            get value(): string|null {
              for (const option of this.options) {
                if (option.checked) {
                  return option.value;
                }
              }

              return null;
            },
            options: [],
          })
        } as IInput<ISelectInputHandler>;

        inputs.multiselect = {
          type: 'multiselect',
          name: 'Multiselect',
          generate: () => ({
            type: 'multiselect',
            name: 'Multiselect Name',
            set value(value: string[]|null) {
              if (value === null) {
                for (const option of this.options) {
                  option.checked = false;
                }
                return;
              }

              for (const option of this.options) {
                if (value.indexOf(option.value)) {
                  option.checked = true;
                } else {
                  option.checked = false;
                }
              }
            },
            get value(): string[] {
              const selected: string[] = [];
              for (const option of this.options) {
                if (option.checked) {
                  selected.push(option.value);
                }
              }

              return selected;
            },
            options: [],
          })
        } as IInput<IMultiselectInputHandler>;

        inputs.image = {
          type: 'image',
          name: 'Image',
          generate: () => ({
            type: 'image',
            name: 'Image input Name',
            value: null,
          })
        } as IInput<IImageInputHandler>
      }
    },
    {
      event: Event.REGISTER_METHOD,
      subscription: (e: RegisterMethodEvent) => {
        const { methods } = e.detail;
        methods.hide = {
          name: 'Hide layer',
          type: 'hide',
          resolve: ({ event }) => {
            event.detail.element = null;
          }
        }
        methods.setImage = {
          name: 'Set image',
          type: 'set-image',
          arguments: [
            {
              type: 'image',
            }
          ],
          resolve: ({ layer }, image: string|null) => {
            if (!image || layer.type !== 'image') {
              return;
            }

            (layer as IImageDef).image.src = image;
            const original = modules.core.clone.getOriginal(layer);
            if (imageToLayer[image]?.has(original)) {
              return;
            }
            imageToLayer[image] ??= new WeakMap();
            imageToLayer[image].set(original, true);
            const newImg = new Image;
            newImg.onload = function() {
              void modules.core.view.recalculate().then(() => {
                modules.core.view.redraw();
              })
            }
            newImg.src = image;

          }
        } as SetImageMethod;

        methods.setText = {
          name: 'Set text',
          type: 'set-text',
          arguments: [
            {
              type: 'text',
              placeholder: 'New text',
            }
          ],
          resolve: ({ layer }, text: string|null) => {
            if (!text || layer.type !== 'text') {
              return;
            }

            (layer as ITextDef).text.value = text;
          }
        } as SetTextMethod;

        methods.setProperty = {
          name: 'Set property',
          type: 'set-property',
          arguments: [
            {
              type: 'text',
              placeholder: 'Path to property (path.to.property)',
            },
            {
              type: 'text',
              placeholder: 'New value',
            },
          ],
          resolve: ({ layer }, path: string|null, value: string|null) => {
            if (!path) {
              return;
            }

            const recursiveAccessAndSetProperty = (
              obj: Record<string, unknown>,
              legs: string[],
              value: string|null,
              pos = 0,
            ): void => {
              if (legs.length == pos + 1) {
                obj[legs[pos]] = value;
                return;
              }

              const type = typeof obj[legs[pos]];
              if (type != 'undefined' && type != 'object' && obj[legs[pos]] !== null) {
                console.error('Cannot replace scalar value with object by template actions', obj, legs, value);
                return;
              }

              obj[legs[pos]] ??= {};
              recursiveAccessAndSetProperty(obj[legs[pos]] as Record<string, unknown>, legs, value, pos + 1);
            }
            const legs = path.split('.');
            recursiveAccessAndSetProperty(layer as Record<string, unknown>, legs, value);
          }
        } as SetPropertyMethod;
      }
    }
  ]);

  return {
    retrieveInputs,
    retrieveMethods,
  }
}
