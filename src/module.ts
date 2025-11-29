import type { ICore, Modules as ModulesRoot } from "@boardmeister/antetype-core"
import crud from "@src/module/crud";
import setEvents from "@src/module/events";
import { IInput, IInputHandler, IMethod, type IConditions } from "@src/type.d";
import setConditionHandler from "@src/module/conditions";
import type { Herald } from "@boardmeister/herald";
import type { IIllustrator } from "@boardmeister/antetype-illustrator";
import type { IWorkspace } from "@boardmeister/antetype-workspace";
import bulk from "@src/module/bulk";

export interface Modules extends ModulesRoot {
  core: ICore;
  illustrator: IIllustrator;
  workspace: IWorkspace;
  conditions: IConditions;
}

export interface IParams {
  modules: Modules,
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
  const bulkProps = bulk({ modules, herald });

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

  const { props: conditionProps, events: conditionEvents } = setConditionHandler({
    enableTextConditions: detectCSPRestriction(),
    inputsMap,
    herald,
    modules,
    crud: crudProps
  });
  const eventsProps = setEvents({
    inputsMap, herald, modules, inputsTypeMap, methodsMap, crud: crudProps,
    additional: [conditionEvents],
  });

  console.log(crudProps);

  return {
    getInputsMap: (): Record<string, IInput> => ({ ...inputsTypeMap }),
    getMethodsMap: (): Record<string, IMethod> => ({ ...methodsMap }),
    ...eventsProps,
    ...crudProps,
    ...conditionProps,
    ...bulkProps,
  };
}

export * from "@src/type.d";
