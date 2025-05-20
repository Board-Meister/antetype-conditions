import type { IInjectable } from "@boardmeister/marshal"
import type { Module, ModulesEvent } from "@boardmeister/antetype-core"
import { Event as CoreEvent } from "@boardmeister/antetype-core"
import type { Minstrel } from "@boardmeister/minstrel"
import type { Herald, ISubscriber, Subscriptions } from "@boardmeister/herald"
import ConditionsModule, { IConditions, type ModulesWithCore } from "@src/module";

export interface IInjected extends Record<string, object> {
  minstrel: Minstrel;
  herald: Herald;
}

export class Conditions implements Module {
  #injected?: IInjected;
  #module: typeof ConditionsModule|null = null;
  // @ts-expect-error TS6133: '#instance' is declared but its value is never read.
  #instance: IConditions|null = null;

  static inject: Record<string, string> = {
    minstrel: 'boardmeister/minstrel',
    herald: 'boardmeister/herald',
  }
  inject(injections: IInjected): void {
    this.#injected = injections;
  }

  async register(event: CustomEvent<ModulesEvent>): Promise<void> {
    const { modules, canvas } = event.detail;
    if (!this.#module) {
      const module = this.#injected!.minstrel.getResourceUrl(this, 'module.js');
      this.#module = ((await import(module)) as { default: typeof ConditionsModule }).default;
    }
    this.#instance = modules.conditions = this.#module({
      canvas,
      modules: modules as ModulesWithCore,
      herald: this.#injected!.herald
    });
  }

  static subscriptions: Subscriptions = {
    [CoreEvent.MODULES]: 'register',
  }
}
const EnSkeleton: IInjectable<IInjected>&ISubscriber = Conditions
export default EnSkeleton;

export * from '@src/module';
