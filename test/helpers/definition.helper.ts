import { IConditionAwareDef } from '@src/type.d';
import type { Canvas, IBaseDef, InitEvent, ISettings, Layout } from "@boardmeister/antetype-core";
import { Event as CoreEvent } from "@boardmeister/antetype-core";
import type { Herald } from "@boardmeister/herald";
import type { IConditionParams } from "@src/type";

export const generateRandomConditionLayer = (
  type: string,
  conditions: IConditionParams = {},
  x: number|null = null,
  y: number|null = null,
  w: number|null = null,
  h: number|null = null,
): IBaseDef => {
  const layer: IConditionAwareDef = {
    type,
    start: { x: x ?? Math.random(), y: y ?? Math.random() },
    size: { w: w ?? Math.random(), h: h ?? Math.random() },
    _mark: Math.random(),
    conditions: conditions,
  };

  layer.area = {
    start: Object.assign({}, layer.start),
    size: Object.assign({}, layer.size),
  }

  return layer;
};

export const initialize = (
  origin: Canvas,
  herald: Herald,
  layout: Layout|null = null,
  settings: ISettings = {},
): Promise<void> => {
  return herald.dispatch(new CustomEvent<InitEvent>(CoreEvent.INIT, {
    detail: {
      base: layout ?? [
        generateRandomConditionLayer('clear1'),
        generateRandomConditionLayer('clear2'),
        generateRandomConditionLayer('clear3'),
        generateRandomConditionLayer('clear4'),
      ],
      settings,
    },
  }), { origin });
}

export const close = (origin: Canvas, herald: Herald): Promise<void> => {
  return herald.dispatch(new CustomEvent<CloseEvent>(CoreEvent.CLOSE), { origin });
}

export const awaitEvent = (herald: Herald, event: string, timeout = 100): Promise<void> => {
  return new Promise(resolve => {
    const timeoutId = setTimeout(() => {
      unregister();
      resolve();
    }, timeout);

    const unregister = herald.register(event, () => {
      unregister();
      resolve();
      clearTimeout(timeoutId);
    });
  });
}