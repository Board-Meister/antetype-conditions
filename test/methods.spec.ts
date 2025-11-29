import type { ICore } from "@boardmeister/antetype-core";
import Core from "@boardmeister/antetype-core/dist/core";
import type { IImageDef, ITextDef } from "@boardmeister/antetype-illustrator";
import { Herald } from "@boardmeister/herald";
import ConditionsModule, { Event, type IConditionAwareDef } from "@src/module";
import { type IConditions } from "@src/module";
import {
  initialize, close, generateRandomConditionLayer,
  awaitEvent
} from "test/helpers/definition.helper";

describe('Methods are', () => {
  let condition: IConditions, core: ICore;
  const herald = new Herald();
  const canvas = document.createElement('canvas');
  beforeEach(async () => {
    core = Core({ herald }) as ICore;
    condition = ConditionsModule({ modules: { core }, herald });
    await core.meta.setCanvas(canvas);
  });

  afterEach(async () => {
    await close(canvas, herald);
  })

  it('registered and assigned properly', async () => {
    await initialize(canvas, herald, [
      generateRandomConditionLayer('testConditions'),
    ]);
    await awaitEvent(herald, Event.REGISTER_METHOD);
    const methods = condition.getMethodsMap();
    const methodTypes = Object.keys(methods);
    expect(methodTypes.length).not.toBe(0);
    expect(methodTypes).toContain('hide');
    expect(methodTypes).toContain('set-image');
    expect(methodTypes).toContain('set-text');
    expect(methodTypes).toContain('set-property');
    expect(methods.hide.type).toBe('hide');
    expect((methods.hide.arguments ?? [])?.length).toBe(0);
    expect(methods['set-image'].type).toBe('set-image');
    expect(methods['set-image'].arguments?.length).toBe(1);
    expect((methods['set-image'].arguments ?? [])[0].type).toBe('image');
    expect((methods['set-image'].arguments ?? [])[0].name).toBe('image');
    expect(methods['set-text'].type).toBe('set-text');
    expect(methods['set-text'].arguments?.length).toBe(1);
    expect((methods['set-text'].arguments ?? [])[0].type).toBe('text');
    expect((methods['set-text'].arguments ?? [])[0].name).toBe('text');
    expect(methods['set-property'].type).toBe('set-property');
    expect(methods['set-property'].arguments?.length).toBe(2);
    expect((methods['set-property'].arguments ?? [])[0].type).toBe('text');
    expect((methods['set-property'].arguments ?? [])[0].name).toBe('path');
    expect((methods['set-property'].arguments ?? [])[1].type).toBe('text');
    expect((methods['set-property'].arguments ?? [])[1].name).toBe('value');
  });

  it('correctly resolved - hide', async () => {
    await initialize(canvas, herald, [
      generateRandomConditionLayer('testConditions'),
    ]);

    const layer = core.meta.document.base[0] as IConditionAwareDef;
    condition.addEmptyAction(layer);
    expect(layer.conditions?.actions).not.toBeUndefined();
    const methods = condition.getMethodsMap();
    condition.addChange(layer.conditions!.actions![0], methods.hide);
    expect(layer.conditions!.actions![0].changes.length).toBe(1);

    expect(core.meta.document.layout.length).toBe(1);
    expect(core.meta.document.layout[0].type).toBe('testConditions');
    await core.view.recalculate();
    core.view.redraw();
    expect(core.meta.document.layout.length).toBe(1);
    expect(core.meta.document.layout[0].type).toBe('none');
  });

  it('correctly resolved - text', async () => {
    await initialize(canvas, herald, [
      Object.assign(generateRandomConditionLayer('text'), {
        text: {
          value: 'test'
        }
      }) as ITextDef,
    ]);

    const layer = core.meta.document.base[0] as IConditionAwareDef;
    const action = condition.addEmptyAction(layer);
    const methods = condition.getMethodsMap();
    const change = condition.addChange(action, methods['set-text']);
    change.arguments[0].value = 'test2';

    expect((core.meta.document.layout[0] as ITextDef).text.value).toBe('test');
    await core.view.recalculate();
    core.view.redraw();
    expect((core.meta.document.layout[0] as ITextDef).text.value).toBe('test2');
  });

  it('correctly resolved - image', async () => {
    await initialize(canvas, herald, [
      Object.assign(generateRandomConditionLayer('image'), {
        image: {
          src: 'image'
        }
      }) as IImageDef,
    ]);

    const layer = core.meta.document.base[0] as IConditionAwareDef;
    const action = condition.addEmptyAction(layer);
    const methods = condition.getMethodsMap();
    const change = condition.addChange(action, methods['set-image']);
    change.arguments[0].value = 'image2';

    expect((core.meta.document.layout[0] as IImageDef).image.src).toBe('image');
    await core.view.recalculate();
    core.view.redraw();
    expect((core.meta.document.layout[0] as IImageDef).image.src).toBe('image2');
  });

  it('correctly resolved - property', async () => {
    await initialize(canvas, herald, [
      Object.assign(generateRandomConditionLayer('conditionTest'), {
        foo: {
          bar: {
            ter: 'test'
          }
        }
      }),
    ]);

    const layer = core.meta.document.base[0] as IConditionAwareDef;
    const action = condition.addEmptyAction(layer);
    const methods = condition.getMethodsMap();
    const change = condition.addChange(action, methods['set-property']);
    change.arguments[0].value = 'foo.bar.ter';
    change.arguments[1].value = 'test2';

    expect((core.meta.document.layout[0] as any).foo.bar.ter).toBe('test');
    await core.view.recalculate();
    core.view.redraw();
    expect((core.meta.document.layout[0] as any).foo.bar.ter).toBe('test2');
  });
});