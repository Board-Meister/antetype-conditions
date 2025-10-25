import type { ICore, Modules } from "@boardmeister/antetype-core"
import crud from "@src/module/crud";
import setEvents from "@src/module/events";
import { IInput, IInputHandler, IMethod, type IConditions } from "@src/type.d";
import setConditionHandler from "@src/module/conditions";
import type { Herald } from "@boardmeister/herald";

export interface ModulesWithCore extends Modules {
  core: ICore;
}

export interface IParams {
  canvas: HTMLCanvasElement|null,
  modules: ModulesWithCore,
  herald: Herald,
}

export default function ConditionsModule(
  {
    herald,
    modules,
  }: IParams
): IConditions {
  const inputsMap: Record<string, IInputHandler> = {};
  const inputsTypeMap: Record<string, IInput> = {};
  const methodsMap: Record<string, IMethod> = {};
  const crudProps = crud({ inputsMap, inputsTypeMap, methodsMap, modules });

  const detectCSPRestriction = (): boolean => {
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

  const eventsProps = setEvents({ inputsMap, herald, modules, inputsTypeMap, methodsMap, crud: crudProps });
  const conditionProps = setConditionHandler({
    enableTextConditions: detectCSPRestriction(),
    inputsMap,
    herald,
    modules,
    crud: crudProps
  });

  return {
    getInputsMap: (): Record<string, IInput> => ({ ...inputsTypeMap }),
    getMethodsMap: (): Record<string, IMethod> => ({ ...methodsMap }),
    ...eventsProps,
    ...crudProps,
    ...conditionProps,
  };
}

export * from "@src/type.d";
