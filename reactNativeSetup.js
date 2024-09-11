import { exec } from 'child_process';
import { promisify } from 'util';
import inquirer from 'inquirer';
import ora from 'ora';
import cliProgress from 'cli-progress';
import chalk from 'chalk';
import fs from 'fs';

const execAsync = promisify(exec);

// Function to check if a command is available
function isCommandAvailable(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to install a package using Homebrew
async function installWithHomebrew(packageName) {
  console.log(`Installing ${packageName}...`);
  await execAsync(`brew install ${packageName}`);
}

// Function to install a package using npm
async function installWithNpm(packageName) {
  console.log(`Installing ${packageName}...`);
  await execAsync(`npm install -g ${packageName}`);
}

// Make checkAndInstallDependencies async
async function checkAndInstallDependencies() {
  console.log('Checking and installing necessary dependencies...');
  
  // Check for Homebrew
  await installHomebrew();

  // Only proceed with other installations if Homebrew is available
  if (isCommandAvailable('brew')) {
    // Check for Node.js
    if (!isCommandAvailable('node')) {
      await installWithHomebrew('node');
    }

    // Check for Watchman
    if (!isCommandAvailable('watchman')) {
      await installWithHomebrew('watchman');
    }

    // Check for React Native CLI
    if (!isCommandAvailable('react-native')) {
      await installWithNpm('react-native-cli');
    }

    // Check for CocoaPods
    if (!isCommandAvailable('pod')) {
      await installWithHomebrew('cocoapods');
    }

    console.log('All necessary dependencies are installed.');
  } else {
    console.log(chalk.yellow('Some dependencies could not be installed without Homebrew.'));
  }
}

// Run dependency check and installation first
// checkAndInstallDependencies();

async function fullAutomatedSetup() {
  console.log(chalk.blue('Starting full automated React Native setup...'));

  const dependencies = [
    { name: 'Homebrew', check: 'brew', install: installHomebrew },
    { name: 'Node.js', check: 'node', install: () => installWithHomebrew('node') },
    { name: 'Watchman', check: 'watchman', install: () => installWithHomebrew('watchman') },
    { name: 'React Native CLI', check: 'react-native', install: () => installWithNpm('react-native-cli') },
    { name: 'CocoaPods', check: 'pod', install: () => installWithHomebrew('cocoapods') },
    { name: 'JDK', check: 'java', install: () => installWithHomebrew('adoptopenjdk') },
    { name: 'Android Studio', check: 'studio', install: () => installWithHomebrew('android-studio', true) },
    { name: 'Xcode', check: 'xcode-select', install: installXcode },
    { name: 'Git', check: 'git', install: () => installWithHomebrew('git') },
  ];

  for (const dep of dependencies) {
    if (!isCommandAvailable(dep.check)) {
      console.log(chalk.yellow(`${dep.name} not found. Installing...`));
      await dep.install();
    } else {
      console.log(chalk.green(`${dep.name} is already installed.`));
    }
  }

  await setupAndroidSDK();
  await configureEnvironmentVariables();

  console.log(chalk.green('Full automated setup complete!'));
}

async function installHomebrew() {
  if (isCommandAvailable('brew')) {
    console.log(chalk.green('Homebrew is already installed.'));
    return;
  }

  console.log(chalk.yellow('Homebrew is not installed. Please install it manually.'));
  console.log(chalk.cyan('Run the following command in your terminal:'));
  console.log(chalk.cyan('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'));
  console.log(chalk.yellow('After installation, please run this setup script again.'));

  const { continue: shouldContinue } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: 'Do you want to continue with the rest of the setup?',
      default: false
    }
  ]);

  if (!shouldContinue) {
    process.exit(0);
  }
}

async function installXcode() {
  console.log(chalk.yellow('Xcode needs to be installed manually from the App Store.'));
  console.log('Please install Xcode and run `xcode-select --install` after installation.');
}

async function setupAndroidSDK() {
  console.log(chalk.blue('Setting up Android SDK...'));
  
  // Accept Android SDK licenses
  const acceptLicenses = async () => {
    const command = `yes | sdkmanager --licenses`;
    try {
      await execAsync(command);
      console.log(chalk.green('Android SDK licenses accepted.'));
    } catch (error) {
      console.error(chalk.red('Error accepting Android SDK licenses:', error.message));
    }
  };

  // Install necessary Android SDK components
  const installSDKComponents = async () => {
    const components = [
      "platform-tools",
      "platforms;android-31",
      "build-tools;31.0.0",
      "emulator",
      "system-images;android-31;google_apis;x86_64"
    ];

    for (const component of components) {
      const command = `sdkmanager "${component}"`;
      try {
        console.log(chalk.yellow(`Installing ${component}...`));
        await execAsync(command);
        console.log(chalk.green(`${component} installed successfully.`));
      } catch (error) {
        console.error(chalk.red(`Error installing ${component}:`, error.message));
      }
    }
  };

  await acceptLicenses();
  await installSDKComponents();
}

async function configureEnvironmentVariables() {
  console.log(chalk.blue('Configuring environment variables...'));
  const rcFile = `${process.env.HOME}/.zshrc`;
  const androidHome = '/Users/apple/Library/Android/sdk';
  const paths = [
    `export ANDROID_HOME=${androidHome}`,
    'export PATH=$PATH:$ANDROID_HOME/emulator',
    'export PATH=$PATH:$ANDROID_HOME/tools',
    'export PATH=$PATH:$ANDROID_HOME/tools/bin',
    'export PATH=$PATH:$ANDROID_HOME/platform-tools',
  ];

  fs.appendFileSync(rcFile, '\n' + paths.join('\n'));
  console.log(chalk.green('Environment variables configured. Please restart your terminal or run `source ~/.zshrc`.'));
}

const setupOptions = [
  { name: 'Install/Update Node.js and npm', value: 'node' },
  { name: 'Install/Update Yarn', value: 'yarn' },
  { name: 'Install/Update React Native CLI', value: 'react-native-cli' },
  { name: 'Install/Update JDK', value: 'jdk' },
  { name: 'Install/Update Android Studio', value: 'android-studio' },
  { name: 'Install/Update Watchman', value: 'watchman' },
  { name: 'Install/Update CocoaPods', value: 'cocoapods' },
  { name: 'Install/Update Git', value: 'git' },
  { name: 'Install/Update Visual Studio Code', value: 'vscode' },
  { name: 'Install/Update React Native Debugger', value: 'rn-debugger' },
];

async function customInstall() {
  while (true) {
    const { selectedOptions } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedOptions',
        message: 'Select React Native setup options:',
        choices: [
          ...setupOptions,
          new inquirer.Separator(),
          { name: 'Install/Update All', value: 'all' },
          { name: 'Back', value: 'back' }
        ]
      }
    ]);

    if (selectedOptions.includes('back')) {
      return;
    }

    const optionsToInstall = selectedOptions.includes('all') ? setupOptions.map(o => o.value) : selectedOptions;
    
    const progressBar = new cliProgress.SingleBar({
      format: 'Installation Progress |' + chalk.cyan('{bar}') + '| {percentage}% || {value}/{total} Packages',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    progressBar.start(optionsToInstall.length, 0);

    for (const option of optionsToInstall) {
      await performSetup(option, progressBar);
    }

    progressBar.stop();

    const { continue: shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Do you want to perform more React Native setup actions?',
        default: false
      }
    ]);

    if (!shouldContinue) return;
  }
}

export async function setupReactNative() {
  // Run dependency check and installation first
  await checkAndInstallDependencies();

  while (true) {
    const { setupType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'setupType',
        message: 'Choose setup type:',
        choices: [
          { name: 'Full Automated Setup', value: 'full' },
          { name: 'Custom Installation', value: 'custom' },
          { name: 'Back to Main Menu', value: 'back' }
        ]
      }
    ]);

    if (setupType === 'back') return;

    if (setupType === 'full') {
      await fullAutomatedSetup();
    } else {
      await customInstall();
    }

    const { continue: shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Do you want to perform more React Native setup actions?',
        default: false
      }
    ]);

    if (!shouldContinue) return;
  }
}

async function performSetup(option, progressBar) {
  switch (option) {
    case 'node':
      await installWithHomebrew('node');
      break;
    case 'yarn':
      await installWithNpm('yarn');
      break;
    case 'react-native-cli':
      await installWithNpm('react-native-cli');
      break;
    case 'jdk':
      await installWithHomebrew('adoptopenjdk');
      break;
    case 'android-studio':
      await installWithHomebrew('android-studio', true);
      break;
    case 'watchman':
      await installWithHomebrew('watchman');
      break;
    case 'cocoapods':
      await installWithHomebrew('cocoapods');
      break;
    case 'git':
      await installWithHomebrew('git');
      break;
    case 'vscode':
      await installWithHomebrew('visual-studio-code', true);
      break;
    case 'rn-debugger':
      await installWithHomebrew('react-native-debugger', true);
      break;
  }
  progressBar.increment();
}
