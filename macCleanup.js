import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import cliProgress from 'cli-progress';
import chalk from 'chalk';
import inquirer from 'inquirer';

const execAsync = promisify(exec);

export async function handleMacCleanup() {
  const progressBar = new cliProgress.SingleBar({
    format: 'Progress |' + chalk.cyan('{bar}') + '| {percentage}% || {value}/{total} Steps',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  try {
    progressBar.start(5, 0);

    // Step 1: Check if mac-cleanup is installed
    progressBar.update(1, { task: "Checking installation" });
    const { stdout: whichOutput } = await execAsync('which mac-cleanup');
    
    if (!whichOutput.trim()) {
      console.log(chalk.yellow('mac-cleanup is not installed. Installing now...'));
      await execAsync('brew install mac-cleanup/mac-cleanup-py/mac-cleanup');
      console.log(chalk.green('mac-cleanup has been installed successfully.'));
    } else {
      console.log(chalk.green('mac-cleanup is already installed.'));
    }

    // Step 2: Check for updates
    progressBar.update(2, { task: "Checking for updates" });
    console.log(chalk.blue('Checking for mac-cleanup updates...'));
    try {
      const { stdout: updateOutput } = await execAsync('brew upgrade mac-cleanup');
      if (updateOutput.includes("Already up-to-date.")) {
        console.log(chalk.green('mac-cleanup is already up to date.'));
      } else {
        console.log(chalk.yellow('mac-cleanup has been updated.'));
      }
    } catch (updateError) {
      console.log(chalk.yellow('Unable to check for updates. Continuing with current version.'));
    }

    // Step 3: Prompt for options
    progressBar.update(3, { task: "Selecting options" });
    const { options } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'options',
        message: 'Select mac-cleanup options:',
        choices: [
          { name: 'Dry run (no deletions)', value: '-n' },
          { name: 'Update Homebrew', value: '-u' },
          { name: 'Configure modules', value: '-c' },
          { name: 'Force (accept all warnings)', value: '-f' },
          new inquirer.Separator(),
          { name: 'Go back', value: 'go_back' }
        ]
      }
    ]);

    if (options.includes('go_back')) {
      console.log(chalk.yellow('Going back to the main menu.'));
      return;
    }

    // Step 4: Run mac-cleanup
    progressBar.update(4, { task: "Running mac-cleanup" });
    console.log(chalk.blue('Running mac-cleanup...'));
    console.log(chalk.yellow('You may be prompted for your password to run mac-cleanup with elevated privileges.'));
    
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Do you want to proceed? You might need to enter your password.',
        default: true
      }
    ]);

    if (!proceed) {
      console.log(chalk.yellow('mac-cleanup operation cancelled.'));
      return;
    }

    const command = `mac-cleanup ${options.join(' ')}`;
    const childProcess = spawn(command, [], { shell: true, stdio: 'inherit' });

    await new Promise((resolve, reject) => {
      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`mac-cleanup exited with code ${code}`));
        }
      });
    });

    // Step 5: Completion
    progressBar.update(5, { task: "Completed" });
    console.log(chalk.green('mac-cleanup process completed successfully.'));

  } catch (error) {
    console.error(chalk.red('An error occurred:', error.message));
  } finally {
    progressBar.stop();
  }
}