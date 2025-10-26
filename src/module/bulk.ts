import type { IExportSettings } from "@boardmeister/antetype-workspace";
import type { Herald } from "@boardmeister/herald";
import type { IInputHandler, Modules } from "@src/module";

export interface IBulkProps {
  modules: Modules;
  herald: Herald;
}

export interface IBulkReturn {
  bulkGenerate: (inputValuesRows: IBulkValues[]) => Promise<string|null>[];
}

export interface IInputValues {
  [key: string]: string;
}

export interface IBulkValues {
  settings?: IExportSettings;
  values: IInputValues;
}

interface IInitialValues {
  [key:string]: any;
}

export default function bulk({ modules }: IBulkProps): IBulkReturn {
  let inputToNameMap: {[key: string]: IInputHandler}|null = null;
  const timeout = 1.2*10**5;
  const findInputByName = (name: string): IInputHandler | null => {
    if (!inputToNameMap) {
      inputToNameMap = {}
      for (const input of modules.conditions.getInputs()) {
        inputToNameMap[input.name] = input;
      }
    }

    return inputToNameMap[name] ?? null;
  }

  const prepareBulkValues = (initialValues: IInitialValues, rowValues: IInputValues): IInputValues => {
    const values: IInputValues = { ...rowValues };
    for (const input of modules.conditions.getInputs()) {
      if ((input.id!) in rowValues || input.name in rowValues) {
        continue;
      }

      values[input.id!] = JSON.stringify(initialValues[input.id!]);
    }

    return values;
  }

  const generateImageUrl = (
    resolve: (value: string | PromiseLike<string | null> | null) => void,
    inputValues: IBulkValues,
    initialValues: IInitialValues,
  ): void => {
    const timeoutId = setTimeout(() => {
      resolve(null);
    }, timeout)
    const values = prepareBulkValues(initialValues, inputValues.values);
    for (const nameOrId in values) {
      if (!Object.hasOwn(values, nameOrId)) continue;

      const value = values[nameOrId];
      const input = modules.conditions.getInputById(nameOrId) ?? findInputByName(nameOrId);

      if (!input) {
        continue;
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        input.value = JSON.parse(value);
      } catch {
        input.value = value;
      }
      modules.core.clone.getClone(input).value = input.value;
    }

    void modules.workspace.export(inputValues.settings).then(blob => {
      resolve(URL.createObjectURL(blob));
      clearTimeout(timeoutId);
    });
  }

  const generateImagesSync = (
    initialValues: IInitialValues,
    inputValuesRows: IBulkValues[],
  ): Promise<string|null>[] => {
    const urls: Promise<string|null>[] = [];
    // Awaiting previous promise allows us make this asyc operation sync and still receive triggers for each
    // image generated
    let previousPromise = new Promise<unknown>(resolve => {resolve(null)});

    for (const inputValues of inputValuesRows) {
      previousPromise = new Promise<string|null>(resolve => {
        void previousPromise.then(() => {
          generateImageUrl(resolve, inputValues, initialValues);
        });
      });
      urls.push(previousPromise as Promise<string|null>);
    }

    return urls;
  }

  const applyInitialValues = async (initialValues: IInitialValues): Promise<void> => {
    for (const inputId in initialValues) {
      if (!Object.hasOwn(initialValues, inputId)) continue;

      const input = modules.conditions.getInputById(inputId)!;
      if (input) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        input.value = modules.core.clone.getClone(input).value = initialValues[inputId];
      }
    }
    await modules.core.view.recalculate();
    modules.core.view.redraw();
  }

  const bulkGenerate = (inputValuesRows: IBulkValues[]): Promise<string|null>[] => {
    const initialValues = modules.conditions.getInputs().reduce<IInitialValues>(
      (acc, input) => ((acc[input.id!] = input.value), acc),
      {},
    );

    const setting = modules.core.setting;
    const defaultWaitForLoad = setting.get('illustrator.image.waitForLoad');
    setting.set('illustrator.image.waitForLoad', true);
    const urls = generateImagesSync(initialValues, inputValuesRows);
    void Promise.all(urls).then(() => {
      setting.set('illustrator.image.waitForLoad', defaultWaitForLoad);
      void applyInitialValues(initialValues);
    })

    return urls;
  }

  return {
    bulkGenerate,
  }
}