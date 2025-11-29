import { IConditionAwareDef, inputLayerSymbol } from './../src/type.d';
import type { ICore } from "@boardmeister/antetype-core";
import Core from "@boardmeister/antetype-core/dist/core";
import { Herald } from "@boardmeister/herald";
import ConditionsModule, { Event, type IMultiselectInputHandler, type ISelectInputHandler } from "@src/module";
import { type IConditions } from "@src/module";
import {
  initialize, close, generateRandomConditionLayer,
  awaitEvent
} from "test/helpers/definition.helper";

describe('Inputs are', () => {
  let condition: IConditions, core: ICore;
  const herald = new Herald();
  const canvas = document.createElement('canvas');
  beforeEach(async () => {
    core = Core({ herald, }) as ICore;
    condition = ConditionsModule({ modules: { core }, herald });
    await core.meta.setCanvas(canvas);
  });

  afterEach(async () => {
    await close(canvas, herald);
  })

  it('registered and assigned properly, and save data as expected', async () => {
    await initialize(canvas, herald, [
      generateRandomConditionLayer('testConditions'),
    ]);
    await awaitEvent(herald, Event.REGISTER_INPUT);
    const inputs = condition.getInputsMap();
    const inputTypes = Object.keys(inputs);
    expect(inputTypes.length).not.toBe(0);
    expect(inputTypes).toContain('title');
    expect(inputTypes).toContain('image');
    expect(inputTypes).toContain('select');
    expect(inputTypes).toContain('multiselect');

    const layer = core.meta.document.base[0];
    const titleInputHandler = condition.addInput(layer, inputs.title);
    expect(titleInputHandler).toEqual(jasmine.objectContaining({
      type: 'title',
      value: null,
    }));
    const imageInputHandler = condition.addInput(layer, inputs.image);
    expect(imageInputHandler).toEqual(jasmine.objectContaining({
      type: 'image',
      value: null,
    }));
    const selectInputHandler = condition.addInput(layer, inputs.select) as ISelectInputHandler;
    expect(selectInputHandler).toEqual(jasmine.objectContaining({
      type: 'select',
      value: null,
      options: [],
    }));
    selectInputHandler.options = [
      {
        label: 'test',
        value: '1',
        checked: false,
      },
      {
        label: 'test2',
        value: '2',
        checked: false,
      },
      {
        label: 'test3',
        value: '3',
        checked: false,
      },
    ];

    selectInputHandler.value = '1';
    expect(selectInputHandler.options[0].checked).withContext('Option first is automatically checked').toBeTrue();
    selectInputHandler.value = '3';
    expect(selectInputHandler.options[0].checked).withContext('Option first is automatically unchecked').toBeFalse();
    expect(selectInputHandler.options[2].checked).withContext('Option third is automatically checked').toBeTrue();
    selectInputHandler.options[1].checked = true;
    selectInputHandler.options[2].checked = false;
    expect(selectInputHandler.value).toBe('2');

    const multiSelectInputHandler = condition.addInput(layer, inputs.multiselect) as IMultiselectInputHandler;
    expect(multiSelectInputHandler).toEqual(jasmine.objectContaining({
      type: 'multiselect',
      value: [],
      options: [],
    }));
    multiSelectInputHandler.options = [
      {
        label: 'test',
        value: '1',
        checked: false,
      },
      {
        label: 'test2',
        value: '2',
        checked: false,
      },
      {
        label: 'test3',
        value: '3',
        checked: false,
      },
    ];

    multiSelectInputHandler.value = ['2', '3'];
    expect(multiSelectInputHandler.options[0].checked).toBeFalse();
    expect(multiSelectInputHandler.options[1].checked).toBeTrue();
    expect(multiSelectInputHandler.options[2].checked).toBeTrue();

    multiSelectInputHandler.value = ['1'];
    expect(multiSelectInputHandler.options[0].checked).toBeTrue();
    expect(multiSelectInputHandler.options[1].checked).toBeFalse();
    expect(multiSelectInputHandler.options[2].checked).toBeFalse();

    multiSelectInputHandler.value = null;
    expect(multiSelectInputHandler.options[0].checked).toBeFalse();
    expect(multiSelectInputHandler.options[1].checked).toBeFalse();
    expect(multiSelectInputHandler.options[2].checked).toBeFalse();

    multiSelectInputHandler.options[1].checked = true;
    multiSelectInputHandler.options[2].checked = true;
    expect(multiSelectInputHandler.value).toEqual(jasmine.objectContaining(['2', '3']));

    expect((layer as IConditionAwareDef).conditions?.inputs).toEqual(jasmine.objectContaining([
      jasmine.objectContaining({ type: 'title' }),
      jasmine.objectContaining({ type: 'image' }),
      jasmine.objectContaining({ type: 'select' }),
      jasmine.objectContaining({ type: 'multiselect' }),
    ]))


    expect(titleInputHandler[inputLayerSymbol]).toBe(layer);
    expect(imageInputHandler[inputLayerSymbol]).toBe(layer);
    expect(selectInputHandler[inputLayerSymbol]).toBe(layer);
    expect(multiSelectInputHandler[inputLayerSymbol]).toBe(layer);
    expect(imageInputHandler.id).not.toBeUndefined();
    expect(titleInputHandler.id).not.toBeUndefined();
    expect(selectInputHandler.id).not.toBeUndefined();
    expect(multiSelectInputHandler.id).not.toBeUndefined();
  });

  it('regenerated properly', async () => {
    await initialize(canvas, herald, [
      generateRandomConditionLayer('testConditions', {
        inputs: [
          {
            type: 'title',
            name: 'titleName',
            value: 'title'
          }, {
            type: 'image',
            name: 'imageName',
            value: 'image'
          }, {
            type: 'select',
            name: 'selectName',
            value: null,
            options: [
              {
                label: 'test',
                value: '1',
                checked: true,
              },
              {
                label: 'test2',
                value: '2',
                checked: false,
              },
              {
                label: 'test3',
                value: '3',
                checked: false,
              },
            ],
          }, {
            type: 'multiselect',
            name: 'multiselectName',
            value: null,
            options: [
              {
                label: 'test',
                value: '1',
                checked: true,
              },
              {
                label: 'test2',
                value: '2',
                checked: true,
              },
              {
                label: 'test3',
                value: '3',
                checked: false,
              },
            ],
          },
        ]
      }),
    ]);

    const layer = core.meta.document.base[0] as IConditionAwareDef;
    const inputs = layer.conditions?.inputs ?? [];
    expect(inputs.length).toBe(4);
    const [title, image, select, multiselect] = inputs;
    expect(title.value).toBe('title');
    expect(image.value).toBe('image');
    expect(select.value).toBe('1');
    expect((select as ISelectInputHandler).options[0].checked).toBeTrue();
    expect((select as ISelectInputHandler).options[1].checked).toBeFalse();
    expect((select as ISelectInputHandler).options[2].checked).toBeFalse();
    expect(multiselect.value).toEqual(['1', '2']);
    expect((multiselect as IMultiselectInputHandler).options[0].checked).toBeTrue();
    expect((multiselect as IMultiselectInputHandler).options[1].checked).toBeTrue();
    expect((multiselect as IMultiselectInputHandler).options[2].checked).toBeFalse();

    select.value = '3'
    expect((select as ISelectInputHandler).options[0].checked).toBeFalse();
    expect((select as ISelectInputHandler).options[1].checked).toBeFalse();
    expect((select as ISelectInputHandler).options[2].checked).toBeTrue();

    multiselect.value = ['3'];
    expect((multiselect as IMultiselectInputHandler).options[0].checked).toBeFalse();
    expect((multiselect as IMultiselectInputHandler).options[1].checked).toBeFalse();
    expect((multiselect as IMultiselectInputHandler).options[2].checked).toBeTrue();

    expect(title[inputLayerSymbol]).toBe(layer);
    expect(image[inputLayerSymbol]).toBe(layer);
    expect(select[inputLayerSymbol]).toBe(layer);
    expect(multiselect[inputLayerSymbol]).toBe(layer);

    expect(title.id).not.toBeUndefined();
    expect(image.id).not.toBeUndefined();
    expect(select.id).not.toBeUndefined();
    expect(multiselect.id).not.toBeUndefined();

    expect(title).toBe(condition.getInputById(title.id));
    expect(image).toBe(condition.getInputById(image.id));
    expect(select).toBe(condition.getInputById(select.id));
    expect(multiselect).toBe(condition.getInputById(multiselect.id));
  });
});