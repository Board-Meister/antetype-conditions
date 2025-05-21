import type { IInjectable } from "@boardmeister/marshal"
import type { Module, ModulesEvent } from "@boardmeister/antetype-core"
import { Event as CoreEvent } from "@boardmeister/antetype-core"
import type { Herald, ISubscriber, Subscriptions } from "@boardmeister/herald"
import ConditionsModule, { type ModulesWithCore } from "@src/module";
import type Marshal from "@boardmeister/marshal"

export interface IInjected extends Record<string, object> {
  marshal: Marshal;
  herald: Herald;
}

export class Conditions implements Module {
  #injected?: IInjected;
  #module: typeof ConditionsModule|null = null;

  static inject: Record<string, string> = {
    marshal: 'boardmeister/marshal',
    herald: 'boardmeister/herald',
  }
  inject(injections: IInjected): void {
    this.#injected = injections;
  }

  async register(event: CustomEvent<ModulesEvent>): Promise<void> {
    const { modules, canvas } = event.detail;
    if (!this.#module) {
      const module = this.#injected!.marshal.getResourceUrl(this, 'module.js');
      this.#module = ((await import(module)) as { default: typeof ConditionsModule }).default;
    }
    modules.conditions = this.#module({
      canvas,
      modules: modules as ModulesWithCore,
      herald: this.#injected!.herald,
    });
  }

  static subscriptions: Subscriptions = {
    [CoreEvent.MODULES]: 'register',
  }
}
const EnSkeleton: IInjectable<IInjected>&ISubscriber = Conditions
export default EnSkeleton;

export * from '@src/module';
