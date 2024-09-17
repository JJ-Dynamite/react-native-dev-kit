#!/usr/bin/env node

const { program } = require('commander');
const { androidCommand } = require('./src/commands/android.js');
const { setupCommand } = require('./src/commands/setup.js');
const { setupReactNative } = require('./reactNativeSetup.js');
const { cleanupMac } = require('./macCleanup.js');
const { setupIOS, handleIosOptions } = require('./ios.js');
const { setupAndroid, handleAndroidOptions } = require('./android.js');
const { handleAiderOptions } = require('./aider.js');
const { handleGitOptions } = require('./git.js');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const { setupFastlane, handleFastlaneOptions } = require('./fastlane.js');
const inquirer = require('inquirer');
const { setupSentient } = require('./sentientSetup.js');

const execAsync = promisify(exec);

console.log('Welcome to Valen: React Native Mobile Development Kit 🚀 a complete automation kit for React Native');

program
  .version('1.0.0')
  .description('Valen: React Native Mobile Development Kit');

program
  .option('-a, --android', 'Run Android-related commands')
  .option('-i, --ios', 'Run iOS-related commands')
  .option('-s, --setup', 'Setup the development environment')
  .option('-c, --cleanup', 'Cleanup Mac cache')
  .option('-r, --rename <name>', 'Rename the project')
  .option('-l, --logs <type>', 'Monitor logs (Metro, iOS, Android, or Reactotron)')
  .option('-f, --fastlane', 'Run Fastlane commands')
  .option('-g, --git', 'Manage Git')
  .option('-A, --ai', 'Code with AI')
  .option('-b, --browse <what to browse>', 'Automated Browsing');

program.parse(process.argv);

const options = program.opts();

if (Object.keys(options).length === 0) {
  mainMenu();
} else {
  handleCommandLineOptions(options);
}

async function handleCommandLineOptions(options) {
  if (options.android) {
    await handleAndroidOptions();
  } else if (options.ios) {
    await handleIosOptions();
  } else if (options.setup) {
    await setupCommand();
  } else if (options.cleanup) {
    await cleanupMac();
  } else if (options.rename) {
    await renameProject(options.rename);
  } else if (options.logs) {
    await monitorLogs(options.logs);
  } else if (options.fastlane) {
    await handleFastlaneOptions();
  } else if (options.git) {
    await handleGitOptions();
  } else if (options.ai) {
    await handleAiderOptions();
  } else if (options.browse) {
    await handleAutomatedBrowsing(options.browse);
  }
}

async function handleAutomatedBrowsing(query) {
  console.log(`Initiating automated browsing for: ${query}`);
  
  // Validate and correct the input
  query = query.trim();
  if (query.toLowerCase() === 'open youtube') {
    query = 'Navigate to https://www.youtube.com';
  }
  
  try {
    const setupSuccessful = await setupSentient();
    if (!setupSuccessful) {
      console.error('Sentient setup failed. Unable to proceed with automated browsing.');
      return;
    }

    console.log(`Sentient is now browsing: ${query}`);
    console.log('Ensure that Chrome, Brave, or Brave Beta is running with remote debugging enabled on port 9222.');
    console.log('If you encounter issues, try closing all browser instances and run this command again.');
    
    const pythonProcess = spawn('python', ['sentient_task.py', ...query.split(' ')], { stdio: 'inherit' });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`Sentient browsing process completed successfully.`);
      } else {
        console.error(`Sentient browsing process exited with code ${code}`);
        console.log('If the error persists, try the following:');
        console.log('1. Close all instances of Chrome, Brave, and Brave Beta');
        console.log('2. Run the command again');
        console.log('3. If the issue continues, try manually starting the browser with:');
        console.log('   "/Applications/Brave Browser Beta.app/Contents/MacOS/Brave Browser Beta" --remote-debugging-port=9222 --guest');
        console.log('4. Check your internet connection');
        console.log('5. Verify that your OPENAI_API_KEY is correct and has sufficient credits');
        console.log('6. Ensure you have the latest version of Sentient installed:');
        console.log('   pip install --upgrade sentient');
        console.log('7. If you\'re using a virtual environment, make sure it\'s activated');
        console.log('8. Check the Python error output above for more detailed information');
      }
    });

    console.log('Sentient is running in the background. You can continue using the CLI.');
  } catch (error) {
    console.error('Error during automated browsing:', error.message);
  }
}

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
          'Exit',
          'Automated Browsing'
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
        console.log('Thank you for using Valen. Goodbye!');
        process.exit(0);
      case 'Automated Browsing':
        const { query } = await inquirer.prompt([
          {
            type: 'input',
            name: 'query',
            message: 'What would you like to browse?',
          }
        ]);
        await handleAutomatedBrowsing(query);
        break;
    }
  }
}

async function renameProject(newName) {
  const { bundleId } = await inquirer.prompt([
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

async function monitorLogs(logType) {
  if (!logType) {
    const { selectedLogType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedLogType',
        message: 'Which logs would you like to monitor?',
        choices: ['Metro', 'iOS', 'Android', 'Reactotron']
      }
    ]);
    logType = selectedLogType;
  }

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

module.exports = {
  mainMenu,
  cleanupMac,
  setupIOS,
  setupAndroid,
  handleGitOptions,
  handleAiderOptions,
  handleFastlaneOptions,
  renameProject,
  monitorLogs,
  handleAutomatedBrowsing
};