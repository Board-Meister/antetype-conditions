import type { IParentDef } from "@boardmeister/antetype-core"
import type { Modules } from "@src/module";
import {
  actionLayerSymbol,
  changeActionSymbol,
  inputLayerSymbol,
  IAction,
  IChange,
  IConditionAwareDef,
  IInput,
  IInputHandler,
  IMethod
} from "@src/type.d";

export interface ICrud {
  addInput: (layer: IConditionAwareDef, input: IInput) => IInputHandler;
  removeInput: (handler: IInputHandler) => void;
  getInputById: (id: string) => IInputHandler|null;
  getInputByType: (type: string) => IInput|null;
  getMethod: (type: string) => IMethod|null;
  getInputs: () => IInputHandler[];
  getInputLayer: (input: IInputHandler) => IConditionAwareDef|null;
  addEmptyAction: (layer: IConditionAwareDef) => IAction;
  removeAction: (actions: IAction[], action: IAction) => void;
  addChange: (action: IAction, method: IMethod) => IChange;
  removeChange: (action: IAction, change: IChange) => void;
  registerInput: (layer: IConditionAwareDef, handler: IInputHandler) => void;
  registerNewInputs: (layer: IConditionAwareDef) => void;
  registerNewActions: (layer: IConditionAwareDef) => void
}

export interface ICrudProps {
  inputsMap: Record<string, IInputHandler>;
  inputsTypeMap: Record<string, IInput>;
  methodsMap: Record<string, IMethod>;
  modules: Modules;
}

export default function crud(
  {
    inputsMap,
    inputsTypeMap,
    methodsMap,
    modules,
  }: ICrudProps
): ICrud {

  const getMethod = (type: string): IMethod|null => methodsMap[type] ?? null;

  const removeChange = (action: IAction, change: IChange): void => {
    const changes = change[changeActionSymbol]?.changes ?? [];
    for(let i=0; i < changes.length; i++) {
      const possibleChange = changes[i];
      if (possibleChange === change) {
        changes.splice(i, 1);
        break;
      }
    }

    for (let i = 0; i < action.changes.length; i++) {
      const possibleChange = action.changes[i];
      if (possibleChange === change) {
        action.changes.splice(i, 1);
        break;
      }
    }
  }

  const addChange = (action: IAction, method: IMethod): IChange => {
    const change = {
      [changeActionSymbol]: action,
      type: method.type,
      arguments: [...method.arguments ?? []],
    };
    action.changes.push(change);

    return change;
  }

  const removeAction = (actions: IAction[], action: IAction): void => {
    const actionsGrouper = action[actionLayerSymbol]?.conditions?.actions ?? [];
    for(let i=0; i < actionsGrouper.length; i++) {
      const possibleAction = actionsGrouper[i];
      if (possibleAction === action) {
        actionsGrouper.splice(i, 1);
        break;
      }
    }
    for(let i=0; i < actions.length; i++) {
      const possibleAction = actions[i];
      if (possibleAction === action) {
        actions.splice(i, 1);
        break;
      }
    }
  }

  const addEmptyAction = (layer: IConditionAwareDef): IAction => {
    layer.conditions ??= {};
    layer.conditions.actions ??= [];
    const emptyAction = {
      [actionLayerSymbol]: layer,
      rule: {
        text: '',
      },
      changes: []
    };
    layer.conditions.actions.push(emptyAction);

    return emptyAction;
  }

  const registerInput = (layer: IConditionAwareDef, handler: IInputHandler): void => {
    handler.id = modules.core.meta.generateId();
    handler[inputLayerSymbol] = layer;
    inputsMap[handler.id] = handler;
  }

  const addInput = (layer: IConditionAwareDef, input: IInput): IInputHandler => {
    const handler = input.generate(layer);
    registerInput(layer, handler);
    layer.conditions ??= {};
    layer.conditions.inputs ??= [];
    layer.conditions.inputs.push(handler);

    return handler;
  }

  const removeInput = (handler: IInputHandler): void => {
    const inputs = handler[inputLayerSymbol]?.conditions?.inputs ?? [];
    for(let i=0; i < inputs.length; i++) {
      const input = inputs[i];
      if (input === handler) {
        inputs.splice(i, 1);
        break;
      }
    }

    if (handler.id) {
      delete inputsMap[handler.id];
    }
  }

  const getInputById = (id: string): IInputHandler|null => inputsMap[id] ?? null;
  const getInputLayer = (input: IInputHandler): IConditionAwareDef|null => input[inputLayerSymbol] ?? null;
  const getInputs = (): IInputHandler[] => Object.values(inputsMap);

  const getInputByType = (type: string): IInput|null => inputsTypeMap[type] ?? null;

  const registerNewInputs = (layer: IConditionAwareDef): void => {
    const inputs = layer.conditions?.inputs ?? [];
    for(let i=0; i < inputs.length; i++) {
      let input = inputs[i];
      if (input[inputLayerSymbol]) {
        continue;
      }

      const template = getInputByType(input.type);
      if (template) {
        const regenerated = template.generate(layer);
        for (const key in input) {
          regenerated[key] = input[key];
        }
        inputs[i] = input = regenerated;
      }

      if (!input.id) {
        input.id = modules.core.meta.generateId();
      }
      inputsMap[input.id] = input;
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
      registerNewActions(child);
    }
  }

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
    registerNewActions,
  };
}
