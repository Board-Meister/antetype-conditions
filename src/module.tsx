import type { Modules, IBaseDef } from "@boardmeister/antetype-core"
import { IInjected } from "@src/index";

export interface IParams {
  canvas: HTMLCanvasElement|null,
  modules: Modules,
  injected: IInjected,
}

export enum Event {
  REGISTER_INPUT = 'antetype.conditions.input.register',
  REGISTER_METHOD = 'antetype.conditions.method.register',
}

export interface IInputHandler<T = any> extends Record<string, unknown> {
  type: string;
  name: string;
  get: () => T;
  reset: () => void;
  set: (value: T) => void;
}

export interface ITitleInputHandler extends IInputHandler<string|null> {
  placeholder?: string;
  value: string|null;
}

export interface ISelectOption {
  label: string;
  value: string;
}

export interface ISelectInputHandler extends IInputHandler<string|null> {
  value: string|null;
  default?: string;
  options: ISelectOption[];
}

export interface IImageInputHandler extends IInputHandler<string|null> {
  value: string|null;
}

export interface IInput<G extends IInputHandler = IInputHandler> {
  type: string;
  name: string;
  generate: (layer: IBaseDef) => G;
  description?: string;
  icon?: string;
}

export interface IConditionAction {

}

interface IConditionInstruction {
  text: string;
}

export interface IRule {
  instruction: IConditionInstruction;
  actions: IConditionAction[];
}

export interface IConditionAwareDef extends IBaseDef {
  conditions?: {
    inputs?: IInputHandler[];
    rules?: IRule[];
  }
}

export interface IMethodArgument {
  type: string;       // Must correspond to existing input type otherwise will be unfillable
  value?: unknown;    // Makes argument optional
}

export interface IMethod<T extends unknown[] = unknown[], P = unknown> {
  name: string;
  arguments: IMethodArgument[];
  resolve: (...args: T) => P;
}

export interface IConditions {
  retrieveInputs: () => Promise<Record<string, IInput>>;
  retrieveMethods: () => Promise<Record<string, IMethod>>;
}

export interface IRegisterInputEvent {
  inputs: Record<string, IInput>;
}

export type RegisterInputEvent = CustomEvent<IRegisterInputEvent>;

export interface IRegisterMethodEvent {
  inputs: Record<string, IMethod>;
}

export type RegisterMethodEvent = CustomEvent<IRegisterMethodEvent>;

export default function ConditionsModule(
  {
    injected: { herald }
  }: IParams
): IConditions {
  const retrieveInputs = async (): Promise<Record<string, IInput>> => {
    const inputs: Record<string, IInput> = {};
    const event = new CustomEvent(Event.REGISTER_INPUT, {
      detail: {
        inputs,
      }
    });
    await herald.dispatch(event);
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
    return event.detail.methods;
  }

  herald.batch([
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
            get() {
              return this.value;
            },
            set(value: string|null) {
              this.value = value;
            },
            reset() {
              this.value = null;
            }
          })
        } as IInput<ITitleInputHandler>;

        inputs.select = {
          type: 'select',
          name: 'Drop down',
          generate: () => ({
            type: 'select',
            name: 'Drop down Name',
            value: null,
            options: [],
            get() {
              return this.value;
            },
            set(value: string|null) {
              this.value = value;
            },
            reset() {
              this.value = null;
            }
          })
        } as IInput<ISelectInputHandler>;

        inputs.image = {
          type: 'image',
          name: 'Image',
          generate: () => ({
            type: 'image',
            name: 'Image input Name',
            value: null,
            get() {
              return this.value;
            },
            set(value: string|null) {
              this.value = value;
            },
            reset() {
              this.value = null;
            }
          })
        } as IInput<IImageInputHandler>
      }
    },
  ])

  return {
    retrieveInputs,
    retrieveMethods,
  };
}
