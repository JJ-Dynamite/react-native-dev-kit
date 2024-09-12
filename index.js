#!/usr/bin/env node

import inquirer from 'inquirer';
import { program } from 'commander';
import { setupReactNative } from './reactNativeSetup.js';
import { cleanupMac } from './macCleanup.js';
import { setupIOS, handleIosOptions } from './ios.js';
import { setupAndroid, handleAndroidOptions } from './android.js';
import { handleAiderOptions } from './aider.js';
import { handleGitOptions } from './git.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

program
  .version('1.0.0')
  .description('RN-MDK: React Native Setup Automation CLI');

async function mainMenu() {
  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'Code with AI',  
          'Android',
          'iOS',
          'Manage Git',
          'Rename Project',
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
      case 'Code with AI':
        await handleAiderOptions();
        break;
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
      case 'Manage Git':
        await handleGitOptions();
        break;
      case 'Rename Project':
        await renameProject();
        break;
      case 'Exit':
        console.log('Thank you for using RN-MDK. Goodbye!');
        process.exit(0);
    }
  }
}

async function renameProject() {
  const { newName, bundleId } = await inquirer.prompt([
    {
      type: 'input',
      name: 'newName',
      message: 'Enter the new name for your project:',
      validate: input => input.trim() !== '' || 'Project name cannot be empty'
    },
    {
      type: 'input',
      name: 'bundleId',
      message: 'Enter the new bundle identifier (optional, e.g., com.example.app):',
      default: ''
    }
  ]);

  try {
    let command = `npx react-native-rename "${newName}"`;
    if (bundleId) {
      command += ` -b ${bundleId}`;
    }

    console.log('Renaming project...');
    const { stdout, stderr } = await execAsync(command);
    console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('Project renamed successfully!');
    console.log('Please note that you may need to manually update some files and clean your project.');
    console.log('Refer to the react-native-rename documentation for more details.');
  } catch (error) {
    console.error('Error renaming project:', error.message);
  }
}

console.log('Welcome to RN-MDK: React Native Mobile Development Kit 🚀 a complete automation kit for React Native');
mainMenu().catch(console.error);