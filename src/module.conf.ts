import type { IInjectable } from "@boardmeister/marshal"
import type { Module, ModulesEvent } from "@boardmeister/antetype-core"
import type { Herald, ISubscriber, Subscriptions } from "@boardmeister/herald"
import type Marshal from "@boardmeister/marshal"
import type ConditionsModule from "@src/module";
import type { ModulesWithCore } from "@src/module";
import { Event as CoreEvent } from "@boardmeister/antetype-core"

export const ID = 'conditions';
export const VERSION = '0.0.4';

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

  register(event: ModulesEvent): void {
    const { registration } = event.detail;

    registration[ID] = {
      load: async () => {
        if (!this.#module) {
          const module = this.#injected!.marshal.getResourceUrl(this as Module, 'module.js');
          this.#module = ((await import(module)) as { default: typeof ConditionsModule }).default;
        }

        return (modules, canvas) => this.#module!({
          canvas,
          modules: modules as ModulesWithCore,
          herald: this.#injected!.herald,
        });
      },
      version: VERSION,
    };
  }

  static subscriptions: Subscriptions = {
    [CoreEvent.MODULES]: 'register',
  }
}
const EnSkeleton: IInjectable<IInjected>&ISubscriber = Conditions
export default EnSkeleton;

export * from '@src/module';
