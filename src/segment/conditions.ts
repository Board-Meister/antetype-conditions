import type { Modules, CalcEvent } from "@boardmeister/antetype-core"
import type { Herald } from "@boardmeister/herald";
import { Event as CoreEvent } from "@boardmeister/antetype-core"
import { IAction } from "@src/index";
import { IConditionAwareDef, IInputHandler, IMethodArgument } from "@src/type.d";
import { ICrud } from "@src/segment/crud";

export interface IConditionsProps {
  inputsMap: Record<string, IInputHandler>;
  herald: Herald;
  modules: Modules;
  crud: ICrud;
  enableTextConditions: boolean;
}

export interface IReturnProps {
  generateActionArguments: () => Record<string, unknown>;
  canActionResolve: (action: IAction, args: Record<string, unknown>|null) => boolean;
  resolveArguments: (args: IMethodArgument[]) => unknown[];
}

export default function setConditionHandler(
  {
    herald,
    crud,
    enableTextConditions,
  }: IConditionsProps
): IReturnProps {
  const actionCache: Record<string, (...args: unknown[]) => boolean> = {};

  const resolveArguments = (args: IMethodArgument[]): unknown[] => {
    const values: unknown[] = [];
    for (const argument of args) {
      let value: unknown = argument.value;
      if (argument.inputId) {
        value = crud.getInputById(argument.inputId)?.value ?? null;
      }
      values.push(value);
    }

    return values;
  }

  const canActionResolve = (action: IAction, args: Record<string, unknown>|null = null): boolean => {
    args ??= generateActionArguments();
    const rule = action.rule.text.trim();

    // When text conditions are disabled we just skip them
    if (!enableTextConditions || rule.length == 0) {
      return true;
    }

    if (!actionCache[rule]) {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      actionCache[rule] = new Function(
        ...Object.keys(args), 'return !!(' + rule + ')').bind({}
      ) as (...args: unknown[]) => boolean;
    }
    return actionCache[rule](...Object.values(args));
  }

  const generateActionArguments = (): Record<string, unknown> => {
    const inputs: Record<string, unknown> = {};
    for (const input of crud.getInputs()) {
      inputs[input.name] = input.value; // @TODO at latter point remove by name selection
      inputs[input.id!] = input.value;
    }

    return {
      inputs,
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
      event: CoreEvent.CALC,
      subscription: {
        method: (e: CustomEvent<CalcEvent>) => {
          const element: IConditionAwareDef|null = e.detail.element;
          if (!element?.conditions?.actions || element.conditions.actions.length == 0) {
            return;
          }

          // @TODO if too heavy think of a way to set it at the start of calc and clear at the end
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
              const method = crud.getMethod(change.type);
              if (!method) continue;

              method.resolve({ layer: element, event: e }, ...resolveArguments(change.arguments))
            }
          }
        },
        priority: -250,
      },
    },
  ]);

  return {
    canActionResolve,
    generateActionArguments,
    resolveArguments,
  }
}
