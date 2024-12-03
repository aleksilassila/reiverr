import { Inject, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import axios from 'axios';
import * as vm from 'vm';

@Injectable()
export class PluginLoaderService {
  constructor(@Inject('PLUGIN_URL') private readonly pluginUrl: string) {}

  async loadPlugin(): Promise<any> {
    const response = await axios.get(this.pluginUrl);

    const sandbox = {
      module: { exports: {} },
      console: console,
    };

    vm.createContext(sandbox);

    const script = new vm.Script(response.data, {
      filename: 'plugin-module.js',
    });
    script.runInContext(sandbox, { displayErrors: true });

    return sandbox.module.exports;
  }
}
