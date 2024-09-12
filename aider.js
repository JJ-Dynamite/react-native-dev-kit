import chalk from 'chalk';
import { execSync, spawn, exec } from 'child_process';
import inquirer from 'inquirer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';

async function checkAiderInstallation() {
  try {
    execSync('aider --version', { stdio: 'ignore' });
  } catch (error) {
    console.log(chalk.yellow('aider is not installed. Installing now...'));
    execSync('pip install aider', { stdio: 'inherit' });
  }
}

async function promptForAPIKeys(missingKeys) {
  const { selectedKeys } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedKeys',
      message: 'Select the API keys you want to enter:',
      choices: missingKeys.map(key => ({ name: key, value: key }))
    }
  ]);

  const newKeys = {};
  for (const key of selectedKeys) {
    const { apiKey } = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: `Enter your ${key.split('_')[0]} API key:`
      }
    ]);
    newKeys[key] = apiKey.trim();
  }

  return newKeys;
}

async function verifyAPIKey(apiName, apiKey) {
  console.log(chalk.yellow(`Verifying ${apiName} API key...`));
  try {
    switch (apiName) {
      case 'ANTHROPIC':
        await axios.post('https://api.anthropic.com/v1/messages', 
          { model: "claude-3-sonnet-20240229", max_tokens: 1, messages: [{ role: "user", content: "Hello" }] },
          { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' } }
        );
        break;
      case 'OPENAI':
        await axios.get('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        break;
      case 'DEEPSEEK':
        // DeepSeek doesn't have a public endpoint for key verification
        // We'll assume it's valid for now
        break;
    }
    console.log(chalk.green(`${apiName} API key is valid.`));
    return true;
  } catch (error) {
    console.log(chalk.red(`Invalid ${apiName} API key.`));
    return false;
  }
}

function updateZshrc(apiKeys) {
  const zshrcPath = path.join(os.homedir(), '.zshrc');
  let content = fs.readFileSync(zshrcPath, 'utf8');

  for (const [name, key] of Object.entries(apiKeys)) {
    if (key && !content.includes(`export ${name}=`)) {
      content += `\nexport ${name}="${key}"`;
    }
  }

  fs.writeFileSync(zshrcPath, content);
  console.log(chalk.green('Updated ~/.zshrc with new API keys.'));
}

function sourceZshrc() {
  try {
    execSync('source ~/.zshrc', { shell: '/bin/zsh', stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red('Error sourcing .zshrc:', error.message));
  }
}

function readApiKeysFromZshrc() {
  const zshrcPath = path.join(os.homedir(), '.zshrc');
  const zshrcContent = fs.readFileSync(zshrcPath, 'utf8');
  const apiKeys = {
    ANTHROPIC_API_KEY: null,
    OPENAI_API_KEY: null,
    DEEPSEEK_API_KEY: null
  };

  for (const key of Object.keys(apiKeys)) {
    const match = zshrcContent.match(new RegExp(`export ${key}="?(.+?)"?$`, 'm'));
    if (match) {
      apiKeys[key] = match[1].trim();
    }
  }

  return apiKeys;
}

async function updateAider() {
  const updateFilePath = path.join(os.homedir(), '.aider_last_update');
  const currentTime = new Date().getTime();
  const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;

  try {
    if (fs.existsSync(updateFilePath)) {
      const lastUpdateTime = parseInt(fs.readFileSync(updateFilePath, 'utf8'));
      if (currentTime - lastUpdateTime < oneWeekInMs) {
        console.log(chalk.yellow('Aider was updated within the last week. Skipping update.'));
        return;
      }
    }

    console.log(chalk.yellow('Checking for Aider updates...'));
    const result = execSync('/Users/apple/.pyenv/versions/3.9.7/bin/python -m pip install --upgrade aider-chat', { encoding: 'utf8' });
    console.log(chalk.green('Aider updated successfully.'));
    console.log(result);

    // Update the last update time
    fs.writeFileSync(updateFilePath, currentTime.toString());
  } catch (error) {
    console.error(chalk.red('Error updating Aider:', error.message));
  }
}

async function configureGit() {
  try {
    const name = execSync('git config user.name', { encoding: 'utf8' }).trim();
    const email = execSync('git config user.email', { encoding: 'utf8' }).trim();

    if (name && email) {
      console.log(chalk.green('Git is already configured:'));
      console.log(`Name: ${name}`);
      console.log(`Email: ${email}`);
      return;
    }

    if (!name) {
      const { newName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newName',
          message: 'Enter your Git name:',
        }
      ]);
      execSync(`git config user.name "${newName}"`, { stdio: 'inherit' });
    }

    if (!email) {
      const { newEmail } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newEmail',
          message: 'Enter your Git email:',
        }
      ]);
      execSync(`git config user.email "${newEmail}"`, { stdio: 'inherit' });
    }

    console.log(chalk.green('Git configuration updated successfully.'));
  } catch (error) {
    console.error(chalk.red('Error configuring Git:', error.message));
  }
}

async function updateGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  let content = '';

  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
  }

  if (!content.includes('.aider*')) {
    content += '\n.aider*';
    fs.writeFileSync(gitignorePath, content);
    console.log(chalk.green('Added .aider* to .gitignore'));
  }
}

export async function handleAiderOptions() {
  await checkAiderInstallation();
  await updateAider();
  await configureGit();
  await updateGitignore();

  const apiKeys = readApiKeysFromZshrc();

  const missingKeys = Object.entries(apiKeys)
    .filter(([_, key]) => !key)
    .map(([name]) => name);

  if (missingKeys.length > 0) {
    console.log(chalk.yellow('The following API keys are missing:'));
    missingKeys.forEach(key => console.log(chalk.yellow(`- ${key}`)));

    const newKeys = await promptForAPIKeys(missingKeys);
    Object.assign(apiKeys, newKeys);

    updateZshrc(newKeys);
    sourceZshrc();
  }

  const validKeys = [];
  for (const [name, key] of Object.entries(apiKeys)) {
    if (key) {
      const isValid = await verifyAPIKey(name.split('_')[0], key);
      if (isValid) {
        validKeys.push(name);
      }
    }
  }

  if (validKeys.length === 0) {
    console.log(chalk.red('No valid API keys found. Exiting...'));
    process.exit(1);
  }

  console.log(chalk.green('Valid API keys found:'));
  validKeys.forEach(key => console.log(chalk.green(`- ${key}`)));

  let selectedKey;
  if (validKeys.length === 1) {
    selectedKey = validKeys[0];
    console.log(chalk.cyan(`Automatically selecting the only valid key: ${selectedKey}`));
  } else {
    const { chosenKey } = await inquirer.prompt([
      {
        type: 'list',
        name: 'chosenKey',
        message: 'Choose which API to use:',
        choices: validKeys.map(key => ({ name: key, value: key }))
      }
    ]);
    selectedKey = chosenKey;
  }

  console.log(chalk.yellow('Launching AI Assistant. This may take a moment...'));

  // Prepare the Aider command
  let aiderCommand = 'aider';
  switch (selectedKey) {
    case 'ANTHROPIC_API_KEY':
      aiderCommand += ' --sonnet';
      break;
    case 'OPENAI_API_KEY':
      aiderCommand += ' --4o';
      break;
    case 'DEEPSEEK_API_KEY':
      aiderCommand += ' --deepseek';
      break;
  }

  // console.log(chalk.cyan(`Executing command: ${aiderCommand}`));
  
  // Execute Aider command and replace the current process
  const aiderArgs = aiderCommand.split(' ').slice(1);
  console.log(chalk.yellow('AI Assistant is starting. To return to the main menu, exit AI Assistant and restart the CLI.'));
  process.on('exit', () => {
    require('child_process').spawn(aiderCommand.split(' ')[0], aiderArgs, {
      stdio: 'inherit',
      detached: true,
      shell: true
    });
  });
  process.exit();
}