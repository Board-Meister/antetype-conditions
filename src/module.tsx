import type { Modules } from "@boardmeister/antetype-core"
import { IInjected } from "@src/index";
import crud, { ICrud } from "@src/segment/crud";
import setEvents, { IEventReturn } from "@src/segment/events";
import { IInput, IInputHandler, IMethod } from "@src/type.d";
import setConditionHandler from "@src/segment/conditions";

export interface IParams {
  canvas: HTMLCanvasElement|null,
  modules: Modules,
  injected: IInjected,
}

export interface IConditions extends ICrud, IEventReturn {
  getInputsMap: () => Record<string, IInput>;
  getMethodsMap: () => Record<string, IMethod>;
}

export default function ConditionsModule(
  {
    injected,
    modules,
  }: IParams
): IConditions {
  const inputsMap: Record<string, IInputHandler> = {};
  const inputsTypeMap: Record<string, IInput> = {};
  const methodsMap: Record<string, IMethod> = {};
  const crudProps = crud({ inputsMap, inputsTypeMap, methodsMap, modules });

  const detectCSPRestriction = (): boolean => {
    // detect possible CSP restriction
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      new Function('return 1');
      return true;
    } catch (e) {
      if (/unsafe-eval|CSP/.exec((e as Error).toString())) {
        console.error(
          'It seems you are using environment with Content Security Policy that prohibits unsafe-eval. '
          + 'The condition compiler from Antetype Conditions Module cannot work in this environment. Consider '
          + 'relaxing the policy to allow unsafe-eval or pre-compiling your '
          + 'templates into render functions. For now text based conditions are disabled.',
        );
      }
      return false;
    }
  }

  const eventsProps = setEvents({ inputsMap, injected, modules, inputsTypeMap, methodsMap, crud: crudProps });
  setConditionHandler({ enableTextConditions: detectCSPRestriction(), inputsMap, injected, modules, crud: crudProps })

  return {
    getInputsMap: (): Record<string, IInput> => ({ ...inputsTypeMap }),
    getMethodsMap: (): Record<string, IMethod> => ({ ...methodsMap }),
    ...eventsProps,
    ...crudProps,
  };
}

export * from "@src/type.d";
