#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import { installDependencies } from './utils.js';
import { handleAndroidOptions } from './android.js';
import { handleIosOptions } from './ios.js';
import { handleMacCleanup } from './macCleanup.js';
import { handleStudioOptions } from './studio.js';
import { handleAiderOptions } from './aider.js';
import { setupReactNative } from './reactNativeSetup.js';

const mainMenuOptions = [
  'android',
  'ios',
  'mac-cleanup',
  'studio',
  'aider',
  'react-native-setup'
].sort();

async function main() {
//   const { shouldInstall } = await inquirer.prompt([
//     {
//       type: 'confirm',
//       name: 'shouldInstall',
//       message: 'Do you want to install or update dependencies?',
//       default: false
//     }
//   ]);

//   if (shouldInstall) {
//     await installDependencies();
//   }

  while (true) {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'Select an option:',
        choices: mainMenuOptions
      }
    ]);

    switch (choice) {
      case 'android':
        await handleAndroidOptions();
        break;
      case 'ios':
        await handleIosOptions();
        break;
      case 'mac-cleanup':
        await handleMacCleanup();
        break;
      case 'studio':
        await handleStudioOptions();
        break;
      case 'aider':
        await handleAiderOptions();
        break;
      case 'react-native-setup':
        await setupReactNative();
        break;
    }

    const { continue: shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Do you want to perform another action?',
        default: true
      }
    ]);

    if (!shouldContinue) break;
  }
}

main().catch(error => console.error(chalk.red('Error:', error.message)));