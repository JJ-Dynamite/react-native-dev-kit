import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { executeCommand } from './utils.js';

function listAndroidDevices() {
  try {
    const devices = execSync('emulator -list-avds').toString().trim().split('\n');
    return devices;
  } catch (error) {
    console.error(chalk.red('Error listing Android devices:', error.message));
    return [];
  }
}

function openAndroidDevice(deviceName) {
  try {
    execSync(`emulator -avd ${deviceName}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red('Error opening Android device:', error.message));
  }
}

const adbCommands = {
  'Device Management': [
    { name: 'List connected devices', command: 'adb devices' },
    { name: 'Reboot device', command: 'adb reboot' },
    { name: 'Reboot into bootloader', command: 'adb reboot bootloader' },
    { name: 'Reboot into recovery mode', command: 'adb reboot recovery' },
    { name: 'Reboot into fastboot mode', command: 'adb reboot fastboot' },
  ],
  'File Management': [
    { name: 'Push files to device', command: 'adb push <local> <remote>' },
    { name: 'Pull files from device', command: 'adb pull <remote> <local>' },
    { name: 'Install APK', command: 'adb install <path_to_apk>' },
    { name: 'Uninstall APK', command: 'adb uninstall <package_name>' },
  ],
  'Shell Access': [
    { name: 'Open a shell on the device', command: 'adb shell' },
    { name: 'Run a single shell command', command: 'adb shell <command>' },
  ],
  'Application Management': [
    { name: 'List installed packages', command: 'adb shell pm list packages' },
    { name: 'Clear app data', command: 'adb shell pm clear <package_name>' },
    { name: 'Force stop an app', command: 'adb shell am force-stop <package_name>' },
    { name: 'Start an activity', command: 'adb shell am start -n <package_name>/<activity_name>' },
  ],
  'Logcat': [
    { name: 'View device logs', command: 'adb logcat' },
    { name: 'Filter logs', command: 'adb logcat <tag>:I' },
    { name: 'Clear log buffer', command: 'adb logcat -c' },
  ],
  'Screen Capture': [
    { name: 'Take a screenshot', command: 'adb shell screencap /sdcard/screenshot.png' },
    { name: 'Pull the screenshot', command: 'adb pull /sdcard/screenshot.png' },
  ],
  'Screen Record': [
    { name: 'Record screen', command: 'adb shell screenrecord /sdcard/recording.mp4' },
    { name: 'Pull the recording', command: 'adb pull /sdcard/recording.mp4' },
  ],
  'Input Commands': [
    { name: 'Send key events', command: 'adb shell input keyevent <keycode>' },
    { name: 'Send text', command: 'adb shell input text "<text>"' },
    { name: 'Swipe', command: 'adb shell input swipe <x1> <y1> <x2> <y2> <duration>' },
  ],
  'Network Commands': [
    { name: 'Check network state', command: 'adb shell netcfg' },
    { name: 'Ping', command: 'adb shell ping <address>' },
    { name: 'Wi-Fi toggle', command: 'adb shell svc wifi enable/disable' },
  ],
  'Battery and Power Management': [
    { name: 'Check battery status', command: 'adb shell dumpsys battery' },
    { name: 'Set battery level', command: 'adb shell dumpsys battery set level <level>' },
    { name: 'Unplug battery', command: 'adb shell dumpsys battery unplug' },
  ],
  'Permissions': [
    { name: 'Grant permissions', command: 'adb shell pm grant <package_name> <permission>' },
    { name: 'Revoke permissions', command: 'adb shell pm revoke <package_name> <permission>' },
  ],
  'Backup and Restore': [
    { name: 'Create a backup', command: 'adb backup -f backup.ab -apk <package_name>' },
    { name: 'Restore a backup', command: 'adb restore backup.ab' },
  ],
  'Root Access': [
    { name: 'Check if device is rooted', command: 'adb shell su' },
    { name: 'Run commands as root', command: 'adb shell su -c <command>' },
  ],
  'Custom ROMs and Flashing': [
    { name: 'Flash a ZIP file', command: 'adb sideload <path_to_zip>' },
    { name: 'Reboot into recovery and sideload', command: 'adb reboot recovery && adb sideload <path_to_zip>' },
  ],
  'Debugging': [
    { name: 'Forward ports', command: 'adb forward tcp:<local_port> tcp:<remote_port>' },
    { name: 'Start a port forwarding service', command: 'adb forward tcp:<local_port> localabstract:<socket_name>' },
  ],
  'Device Information': [
    { name: 'Get device model', command: 'adb shell getprop ro.product.model' },
    { name: 'Get Android version', command: 'adb shell getprop ro.build.version.release' },
    { name: 'Get device serial number', command: 'adb get-serialno' },
  ],
  'Wireless Debugging': [
    { name: 'Connect to a device over Wi-Fi', command: 'adb connect <device_ip>:5555' },
    { name: 'Disconnect', command: 'adb disconnect <device_ip>:5555' },
  ],
  'Performance Monitoring': [
    { name: 'Monitor CPU usage', command: 'adb shell top' },
    { name: 'Monitor memory usage', command: 'adb shell dumpsys meminfo' },
    { name: 'Monitor battery usage', command: 'adb shell dumpsys batterystats' },
  ],
  'Security': [
    { name: 'Check for root', command: 'adb shell su' },
    { name: 'Check for busybox', command: 'adb shell which busybox' },
    { name: 'Check for Magisk', command: 'adb shell ls /sbin/magisk' },
  ],
};

async function handleAdbOptions() {
  while (true) {
    const { category } = await inquirer.prompt([
      {
        type: 'list',
        name: 'category',
        message: 'Select an ADB command category:',
        choices: [...Object.keys(adbCommands), 'Back to main menu']
      }
    ]);

    if (category === 'Back to main menu') {
      break;
    }

    const { command } = await inquirer.prompt([
      {
        type: 'list',
        name: 'command',
        message: 'Select a command:',
        choices: adbCommands[category].map(cmd => cmd.name)
      }
    ]);

    const selectedCommand = adbCommands[category].find(cmd => cmd.name === command);

    if (selectedCommand.command.includes('<') && selectedCommand.command.includes('>')) {
      const { customInput } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customInput',
          message: `Enter the custom part for: ${selectedCommand.command}`,
        }
      ]);
      const finalCommand = selectedCommand.command.replace(/<.*?>/, customInput);
      executeCommand(finalCommand);
    } else {
      executeCommand(selectedCommand.command);
    }

    const { continue: shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Do you want to execute another ADB command?',
        default: true
      }
    ]);

    if (!shouldContinue) break;
  }
}

export async function handleAndroidOptions() {
  const androidOptions = [
    'List Android devices',
    'Select device to open',
    'Other ADB options'
  ];

  const { androidChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'androidChoice',
      message: 'Android options:',
      choices: androidOptions
    }
  ]);

  switch (androidChoice) {
    case 'List Android devices':
      const devices = listAndroidDevices();
      if (devices.length > 0) {
        console.log(chalk.green('Android devices:'));
        devices.forEach(device => console.log(chalk.cyan(`- ${device}`)));
      } else {
        console.log(chalk.yellow('No Android devices found.'));
      }
      break;
    case 'Select device to open':
      const availableDevices = listAndroidDevices();
      if (availableDevices.length > 0) {
        const { selectedDevice } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedDevice',
            message: 'Select a device to open:',
            choices: availableDevices
          }
        ]);
        console.log(chalk.blue(`Opening device: ${selectedDevice}`));
        openAndroidDevice(selectedDevice);
      } else {
        console.log(chalk.yellow('No Android devices available to open.'));
      }
      break;
    case 'Other ADB options':
      await handleAdbOptions();
      break;
  }
}

export function setupAndroid() {
  // Implement Android setup logic here
  console.log('Setting up Android environment...');
  // Add your Android setup steps
}