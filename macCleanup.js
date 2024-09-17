import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import cliProgress from 'cli-progress';
import chalk from 'chalk';
import inquirer from 'inquirer';
import readline from 'readline';

const execAsync = promisify(exec);

async function installMacCleanup() {
  try {
    console.log(chalk.yellow('Checking if mac-cleanup is installed...'));
    console.log('Cleaning up Mac cache...');
    try {
      // Clean Xcode derived data
      await execAsync('rm -rf ~/Library/Developer/Xcode/DerivedData');
  
      // Clean CocoaPods cache
      await execAsync('pod cache clean --all');
  
      // Clean npm cache
      await execAsync('npm cache clean --force');
  
      // Clean yarn cache
      await execAsync('yarn cache clean');
  
      // Clean Metro bundler cache
      await execAsync('rm -rf $TMPDIR/metro-*');
  
      // Clean React Native cache
      await execAsync('rm -rf $TMPDIR/react-*');
  
      console.log('Mac cleanup completed successfully!');
    } catch (error) {
      console.error('Error during Mac cleanup:', error.message);
    }

    await execAsync('mac-cleanup -h');
    console.log(chalk.green('mac-cleanup is already installed.'));
  } catch (error) {
    console.log(chalk.yellow('Installing mac-cleanup...'));
    try {
      await execAsync('pip3 install mac-cleanup');
      console.log(chalk.green('mac-cleanup installed successfully.'));
    } catch (installError) {
      console.error(chalk.red('Failed to install mac-cleanup:', installError.message));
      throw installError;
    }
  }
}

export async function cleanupMac() {
  await installMacCleanup();

  const options = [
    { name: 'Cleanup (no options)', value: '' },
    { name: 'Dry run (no deletions)', value: '-n' },
    { name: 'Update Homebrew', value: '-u' },
    { name: 'Configure modules', value: '-c' },
    { name: 'Force (accept all warnings)', value: '-f' }
  ];

  const { selectedOptions } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedOptions',
      message: 'Select cleanup options:',
      choices: options
    }
  ]);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const password = await new Promise(resolve => {
    rl.question('Enter your password: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });

  const commandOptions = selectedOptions.filter(option => option !== '').join(' ');
  const command = `echo "${password}" | sudo -S mac-cleanup ${commandOptions}`;
  
  console.log(chalk.blue('Running mac-cleanup...'));
  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  progressBar.start(100, 0);

  const child = spawn(command, { shell: true, stdio: ['pipe', 'pipe', 'pipe'] });

  let output = '';

  child.stdout.on('data', (data) => {
    output += data.toString();
    progressBar.increment(1);
  });

  child.stderr.on('data', (data) => {
    output += data.toString();
    progressBar.increment(1);
  });

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      progressBar.stop();
      console.log(chalk.cyan('Cleanup logs:'));
      console.log(output);
      if (code === 0) {
        console.log(chalk.green('Mac cleanup completed successfully.'));
        resolve();
      } else {
        console.error(chalk.red(`Mac cleanup failed with exit code ${code}`));
        reject(new Error(`Mac cleanup failed with exit code ${code}`));
      }
    });
  });
}