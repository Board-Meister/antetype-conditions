import type { Modules } from "@boardmeister/antetype-core"
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
  removeAction: (action: IAction) => void;
  addChange: (action: IAction, method: IMethod) => IChange;
  removeChange: (change: IChange) => void;
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

  const removeChange = (change: IChange): void => {
    const changes = change[changeActionSymbol]?.changes ?? [];
    for(let i=0; i < changes.length; i++) {
      const possibleChange = changes[i];
      if (possibleChange === change) {
        changes.splice(i, 1);
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

  const removeAction = (action: IAction): void => {
    const actions = action[actionLayerSymbol]?.conditions?.actions ?? [];
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

  const addInput = (layer: IConditionAwareDef, input: IInput): IInputHandler => {
    const handler = input.generate(layer);
    handler.id = modules.core.meta.generateId();
    handler[inputLayerSymbol] = layer;
    inputsMap[handler.id] = handler;
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
  };
}
