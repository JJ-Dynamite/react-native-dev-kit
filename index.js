#!/usr/bin/env node

import inquirer from 'inquirer';
import { program } from 'commander';
import { setupReactNative } from './reactNativeSetup.js';
import { cleanupMac } from './macCleanup.js';
import { setupIOS, handleIosOptions } from './ios.js';
import { setupAndroid, handleAndroidOptions } from './android.js';

program
  .version('1.0.0')
  .description('RN-MDK: React Native Setup Automation CLI');

async function mainMenu() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'Android',
        'iOS',
        'Cleanup Mac Cache',
        'Full Setup',
        'Setup React Native',
        'Setup iOS Environment',
        'Setup Android Environment',
        'Exit'
      ]
    }
  ]);

  switch (action) {
    case 'Full Setup':
      await cleanupMac();
      await setupReactNative();
      await setupIOS();
      await setupAndroid();
      break;
    case 'Cleanup Mac Cache':
      await cleanupMac();
      break;
    case 'Setup React Native':
      await setupReactNative();
      break;
    case 'Setup iOS Environment':
      await setupIOS();
      break;
    case 'Setup Android Environment':
      await setupAndroid();
      break;
    case 'iOS':
      await handleIosOptions();
      break;
    case 'Android':
      await handleAndroidOptions();
      break;
    case 'Exit':
      console.log('Thank you for using RN-MDK. Goodbye!');
      process.exit(0);
  }

  // Return to main menu after action is complete
  await mainMenu();
}

console.log('Welcome to RN-MDK: React Native Mobile Development Kit 🚀 a complete automation kit for React Native');
mainMenu().catch(console.error);