#!/usr/bin/env node

const inquirer = require('inquirer');
const { program } = require('commander');
const { setupReactNative } = require('./reactNativeSetup.js');
const { cleanupMac } = require('./macCleanup.js');
const { setupIOS, handleIosOptions } = require('./ios.js');
const { setupAndroid, handleAndroidOptions } = require('./android.js');
const { handleAiderOptions } = require('./aider.js');
const { handleGitOptions } = require('./git.js');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const { setupFastlane, handleFastlaneOptions } = require('./fastlane.js');

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
          'Monitor Logs',
          'Fastlane', 
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
      case 'Monitor Logs':
        await monitorLogs();
        break;
      case 'Fastlane':
        await handleFastlaneOptions();
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

async function monitorLogs() {
  const { logType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'logType',
      message: 'Which logs would you like to monitor?',
      choices: ['Metro', 'iOS', 'Android', 'Reactotron']
    }
  ]);

  try {
    let command;
    let args;
    switch (logType) {
      case 'Metro':
        command = 'bunx';
        args = ['react-native', 'start'];
        break;
      case 'iOS':
        command = 'bunx';
        args = ['react-native', 'log-ios'];
        break;
      case 'Android':
        command = 'bunx';
        args = ['react-native', 'log-android'];
        break;
      case 'Reactotron':
        console.log('Starting Reactotron...');
        command = 'bunx';
        args = ['reactotron-cli'];
        break;
    }

    console.log(`Starting ${logType} logs...`);
    const child = spawn(command, args, { stdio: 'inherit' });
    
    // Allow the user to stop the logging process
    console.log('Press Ctrl+C to stop monitoring logs.');
    await new Promise((resolve) => {
      child.on('close', (code) => {
        console.log(`${logType} process exited with code ${code}`);
        resolve();
      });
    });
  } catch (error) {
    console.error(`Error monitoring ${logType} logs:`, error.message);
  }
}

console.log('Welcome to RN-MDK: React Native Mobile Development Kit 🚀 a complete automation kit for React Native');

module.exports = {
  mainMenu,
  renameProject,
  monitorLogs,
  cleanupMac,
  setupIOS,
  setupAndroid,
  handleGitOptions,
  handleAiderOptions,
  handleFastlaneOptions
};