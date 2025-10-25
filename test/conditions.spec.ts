import type { ICore } from "@boardmeister/antetype-core";
import Core from "@boardmeister/antetype-core/dist/core";
import { Herald } from "@boardmeister/herald";
import ConditionsModule, { Event } from "@src/module";
import { type IConditions } from "@src/module";
import {
  initialize, close, generateRandomConditionLayer,
  awaitEvent
} from "test/helpers/definition.helper";

describe('Conditions are', () => {
  let condition: IConditions, core: ICore;
  const herald = new Herald();
  const canvas = document.createElement('canvas');
  beforeEach(() => {
    core = Core({ herald, canvas }) as ICore;
    condition = ConditionsModule({ canvas, modules: { core }, herald });
  });

  afterEach(async () => {
    await close(herald);
  })

  it('resolved properly', async () => {
    await initialize(herald, [
      generateRandomConditionLayer('testConditions'),
    ]);
    await awaitEvent(herald, Event.REGISTER_METHOD);
    const layer = core.meta.document.base[0];
    const action = condition.addEmptyAction(layer);
    const inputs = condition.getInputsMap();

    action.rule.text = 'true'
    expect(condition.canActionResolve(action)).toBeTrue();
    action.rule.text = 'false'
    expect(condition.canActionResolve(action)).toBeFalse();
    action.rule.text = '12 > 0 && Object.keys({"a" : ""}).length > 0';
    expect(condition.canActionResolve(action)).toBeTrue();
    const input = condition.addInput(layer, inputs.title);
    input.value = '1';
    input.name = 'textTest'
    action.rule.text = 'inputs["textTest"] === "1" && inputs["' + input.id! + '"] === "1"';
    expect(condition.canActionResolve(action)).toBeTrue();
  });

  it('are handled on draw', async () => {
    await awaitEvent(herald, Event.REGISTER_METHOD);
    await awaitEvent(herald, Event.REGISTER_INPUT);
    await initialize(herald, [
      generateRandomConditionLayer('testConditions', {
        actions: [
          {
            rule: {
              text: 'false',
            },
            changes: [
              {
                type: 'hide',
                arguments: [],
              }
            ]
          }
        ]
      }),
    ]);
    expect(core.meta.document.layout.length).withContext('Condition blocks action').toBe(1);
    core.meta.document.base[0].conditions.actions[0].rule.text = 'true';
    await core.view.recalculate();
    core.view.redraw();
    expect(core.meta.document.layout.length).withContext('Action is preformed').toBe(1);
    expect(core.meta.document.layout[0].type).withContext('Action is preformed (hide)').toBe('none');
  });
});