import chalk from 'chalk';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

export async function setupIOS() {
  console.log(chalk.blue('Setting up iOS environment...'));
  console.log('not implemented yet');

  // Add your iOS setup steps here
  // For now, we'll just call the handleIosOptions function
}

export async function handleIosOptions() {
  const choices = [
    'List iOS devices',
    'Select device to open',
    'Open Xcode project',
    'Other options',
    'Back'
  ];

  const { option } = await inquirer.prompt([
    {
      type: 'list',
      name: 'option',
      message: 'Select an iOS option:',
      choices
    }
  ]);

  switch (option) {
    case 'List iOS devices':
      listIosDevices();
      break;
    case 'Select device to open':
      await selectAndOpenDevice();
      break;
    case 'Open Xcode project':
      openXcodeProject();
      break;
    case 'Other options':
      console.log(chalk.yellow('Other iOS options not implemented yet.'));
      break;
    case 'Back':
      return;
  }
}

function listIosDevices() {
  try {
    const devices = execSync('xcrun simctl list devices').toString();
    console.log(chalk.cyan('Available iOS devices:'));
    console.log(devices);
  } catch (error) {
    console.error(chalk.red('Error listing iOS devices:', error.message));
  }
}

async function selectAndOpenDevice() {
  try {
    const devices = execSync('xcrun simctl list devices').toString();
    const iosVersions = devices.match(/-- iOS \d+\.\d+ --/g) || [];

    if (iosVersions.length === 0) {
      console.log(chalk.yellow('No iOS devices found.'));
      return;
    }

    const { selectedVersion } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedVersion',
        message: 'Select an iOS version:',
        choices: iosVersions.map(v => v.replace(/--|\s/g, ''))
      }
    ]);

    // Remove the "iOS" prefix for regex matching
    const versionNumber = selectedVersion.replace('iOS', '');
    const versionRegex = new RegExp(`-- iOS ${versionNumber} --([\\s\\S]*?)(?=-- iOS|$)`);
    const versionDevicesMatch = devices.match(versionRegex);
    
    if (!versionDevicesMatch) {
      console.log(chalk.yellow(`No devices found for ${selectedVersion}.`));
      return;
    }

    const versionDevices = versionDevicesMatch[1].trim();
    const deviceList = versionDevices.split('\n').map(line => line.trim()).filter(line => line);

    if (deviceList.length === 0) {
      console.log(chalk.yellow(`No devices found for ${selectedVersion}.`));
      return;
    }

    const { selectedDevice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedDevice',
        message: 'Select an iOS device to open:',
        choices: deviceList
      }
    ]);

    const deviceId = selectedDevice.match(/\((.*?)\)/)[1];
    execSync(`xcrun simctl boot ${deviceId}`);
    execSync(`open -a Simulator --args -CurrentDeviceUDID ${deviceId}`);
    console.log(chalk.green(`Opened iOS simulator: ${selectedDevice}`));
  } catch (error) {
    console.error(chalk.red('Error selecting or opening iOS device:', error.message));
  }
}

function openXcodeProject() {
  const xcodeProjectExtensions = ['.xcodeproj', '.xcworkspace'];
  const currentDir = process.cwd();

  for (const ext of xcodeProjectExtensions) {
    const files = execSync(`find "${currentDir}" -maxdepth 1 -name "*${ext}"`).toString().trim().split('\n');
    if (files.length > 0 && files[0] !== '') {
      const projectPath = files[0];
      execSync(`open "${projectPath}"`);
      console.log(chalk.green(`Opened Xcode project: ${path.basename(projectPath)}`));
      return;
    }
  }

  console.log(chalk.yellow('No Xcode project found in the current directory.'));
}

// 'List iOS devices',
//     'Select device to open',
//     'open xcode project from the current directory if it exists else give an error',
//     'Other options'