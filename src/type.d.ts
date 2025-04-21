import type { CalcEvent, IBaseDef } from "@boardmeister/antetype-core"

export const inputLayerSymbol = Symbol('Input Layer');
export const actionLayerSymbol = Symbol('Action Layer');
export const changeActionSymbol = Symbol('Change Action');

export enum Event {
  REGISTER_INPUT = 'antetype.conditions.input.register',
  REGISTER_METHOD = 'antetype.conditions.method.register',
}

export interface IInputHandler<T = string|number|null|string[]|number[]> extends Record<string|symbol, unknown> {
  id?: string;
  [inputLayerSymbol]?: IConditionAwareDef;
  type: string;
  name: string;
  value: T;
}

export interface ITitleInputHandler extends IInputHandler<string|null> {
  placeholder?: string;
}

export interface ISelectOption {
  label: string;
  value: string;
  checked: boolean|null;
}

export interface IMultiselectOption {
  label: string;
  value: string;
  checked: boolean|null;
}

export interface ISelectInputHandler extends IInputHandler<string|null> {
  options: ISelectOption[];
}

export interface IMultiselectInputHandler extends IInputHandler<string[]> {
  options: IMultiselectOption[];
}

export type IImageInputHandler = IInputHandler<string|null>;

export interface IInput<G extends IInputHandler = IInputHandler> {
  type: string;
  name: string;
  generate: (layer: IBaseDef) => G;
  description?: string;
  icon?: string;
}

interface IConditionInstruction {
  text: string;
}

export interface IChange {
  [changeActionSymbol]: IAction;
  type: string;
  arguments: IMethodArgument[];
}

export interface IAction {
  [actionLayerSymbol]: IConditionAwareDef;
  rule: IConditionInstruction;
  changes: IChange[];
  name?: string;
}

export interface IConditionAwareDef extends IBaseDef {
  conditions?: {
    inputs?: IInputHandler[];
    actions?: IAction[];
  }
}

export interface IMethodArgument extends Record<string, any> {
  type: string;
  name: string;
  value?: any;
  inputId?: string;
}

export interface IResolveArgument {
  event: CustomEvent<CalcEvent>;
  layer: IConditionAwareDef;
}

export interface IMethod<T extends any[] = any[], P = unknown> {
  name: string;
  type: string;
  arguments?: IMethodArgument[];
  resolve: (argument: IResolveArgument, ...args: T) => P;
}

export type SetImageMethod = IMethod<(string|null)[]>;
export type SetTextMethod = IMethod<(string|null)[]>;
export type SetPropertyMethod = IMethod<(string|null)[]>;

export interface IRegisterInputEvent {
  inputs: Record<string, IInput>;
}

export type RegisterInputEvent = CustomEvent<IRegisterInputEvent>;

export interface IRegisterMethodEvent {
  methods: Record<string, IMethod>;
}

export type RegisterMethodEvent = CustomEvent<IRegisterMethodEvent>;
