import type { Modules, CalcEvent } from "@boardmeister/antetype-core"
import { Event as CoreEvent } from "@boardmeister/antetype-core"
import { IAction, IInjected } from "@src/index";
import { IConditionAwareDef, IInputHandler, IMethodArgument } from "@src/type.d";
import { ICrud } from "@src/segment/crud";

export interface IConditionsProps {
  inputsMap: Record<string, IInputHandler>;
  injected: IInjected;
  modules: Modules;
  crud: ICrud;
  enableTextConditions: boolean;
}

export default function setConditionHandler(
  {
    injected: { herald },
    crud,
    enableTextConditions,
  }: IConditionsProps
): void {
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

  const canActionResolve = (action: IAction, args: Record<string, unknown>): boolean => {
    const rule = action.rule.text.trim();
    // When text conditions are disabled we just skip them
    if (!enableTextConditions || rule.length == 0) {
      return true;
    }

    try {
      if (!actionCache[rule]) {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        actionCache[rule] = new Function(
          ...Object.keys(args), 'return !!(' + rule + ')').bind({}
        ) as (...args: unknown[]) => boolean;
      }
      return actionCache[rule](...Object.values(args));
    } catch {
      return false;
    }

    return false;
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
            if (!canActionResolve(action, args)) {
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
}
