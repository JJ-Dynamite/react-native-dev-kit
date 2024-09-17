import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync } from 'child_process';

export async function installDependencies() {
  console.log(chalk.blue('Selecting dependencies to install...'));

  const tools = [
    { name: 'Android SDK', command: 'brew install android-sdk' },
    { name: 'OpenJDK 11', command: 'brew install openjdk@11' },
    { name: 'Android Studio', command: 'brew install --cask android-studio' },
    { name: 'Xcode Command Line Tools', command: 'xcode-select --install' },
    { name: 'Git', command: 'brew install git' },
    { name: 'Aider', command: 'pip install aider' },
    { name: 'Bun', command: 'curl -fsSL https://bun.sh/install | bash' },
    { name: 'React Native CLI', command: 'npm install -g react-native-cli' },
  ];

  const { selectedTools } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedTools',
      message: 'Select the tools you want to install:',
      choices: tools.map(tool => ({ name: tool.name, value: tool })),
    }
  ]);

  if (selectedTools.length === 0) {
    console.log(chalk.yellow('No tools selected for installation.'));
    return;
  }

  for (const tool of selectedTools) {
    try {
      console.log(chalk.blue(`Installing ${tool.name}...`));
      execSync(tool.command, { stdio: 'inherit' });
      console.log(chalk.green(`${tool.name} installed successfully.`));
    } catch (error) {
      console.error(chalk.red(`Error installing ${tool.name}:`, error.message));
    }
  }

  console.log(chalk.green('Installation process completed.'));
}

export function executeCommand(command) {
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    console.log(chalk.green('Command output:'));
    console.log(output);
  } catch (error) {
    console.error(chalk.red('Error executing command:', error.message));
  }
}

export async function getUserInput(prompt) {
  const { input } = await inquirer.prompt([
    {
      type: 'input',
      name: 'input',
      message: prompt,
    },
  ]);
  return input;
}