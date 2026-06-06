import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';

import type { CommandResult } from './types';

@Injectable()
export class CommandRunnerService {
  run(
    command: string,
    args: string[],
    options: { cwd?: string; timeoutMs: number },
  ): Promise<CommandResult> {
    return new Promise<CommandResult>((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd,
        windowsHide: true,
      });
      let output = '';
      let timedOut = false;

      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, options.timeoutMs);

      child.stdout.on('data', (chunk: Buffer) => {
        output += chunk.toString('utf8');
      });

      child.stderr.on('data', (chunk: Buffer) => {
        output += chunk.toString('utf8');
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      child.on('close', (exitCode) => {
        clearTimeout(timeout);
        resolve({ exitCode, output, timedOut });
      });
    });
  }
}
