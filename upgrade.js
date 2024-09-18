const { exec, execSync } = require('child_process');
const { createInterface } = require('readline');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { spawn } = require('child_process');
const { build } = require('gluegun');
const ejs = require('ejs');

async function promptUpgradeInfo() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  const answers = {
    appName: await question("What's your app name? "),
    appPackage: await question("What's your app package? "),
    currentVersion: await question("What's your current react-native version? "),
    targetVersion: await question("To which version would you like to upgrade? ")
  };

  rl.close();
  return answers;
}

async function openUpgradeHelperInBrowser(answers) {
  const { appName, appPackage, currentVersion, targetVersion } = answers;
  const url = `https://react-native-community.github.io/upgrade-helper/?from=${currentVersion}&to=${targetVersion}&name=${encodeURIComponent(appName)}&package=${encodeURIComponent(appPackage)}`;

  console.log(`Opening React Native Upgrade Helper in your default browser...`);
  console.log(`App Name: ${appName}`);
  console.log(`App Package: ${appPackage}`);
  console.log(`Upgrading from version ${currentVersion} to ${targetVersion}`);

  exec(`open "${url}"`, (error) => {
    if (error) {
      console.error('Failed to open the browser:', error);
    } else {
      console.log('Browser opened successfully.');
    }
  });
}

async function autoUpgradeWithNewBranch(answers) {
  const { appName, appPackage, currentVersion, targetVersion } = answers;
  const branchName = `upgrade-${currentVersion}-to-${targetVersion}`;

  // Check if current directory is a React Native project
  if (!isReactNativeProject()) {
    console.error('Error: The current directory does not appear to be a React Native project.');
    console.log('Please ensure you are in the root directory of a React Native project.');
    return;
  }

  console.log('Ensuring all necessary packages are installed...');
  await ensurePackagesInstalled();

  console.log(`Creating new branch: ${branchName}`);
  console.log(`Upgrading ${appName} from ${currentVersion} to ${targetVersion}`);

  try {
    execSync(`git checkout -b ${branchName}`);
    console.log(`Created new branch: ${branchName}`);

    console.log('Fetching upgrade diff...');
    const diffUrl = `https://raw.githubusercontent.com/react-native-community/rn-diff-purge/diffs/diffs/${currentVersion}..${targetVersion}.diff`;
    const response = await axios.get(diffUrl);
    const diffContent = response.data;

    console.log('Processing upgrade changes...');
    const { key, provider } = await getAPIKey();
    const upgradePlan = await generateUpgradePlan(key, provider, diffContent, appName, appPackage);

    console.log('Applying upgrade changes...');
    await applyUpgradeChanges(upgradePlan, diffContent);

    console.log('Running React Native upgrade command...');
    execSync(`npx react-native upgrade --to ${targetVersion}`, { stdio: 'inherit' });

    console.log('Upgrade completed successfully.');
    console.log(`Please review the changes in the new branch: ${branchName}`);
    console.log('After reviewing, you can merge this branch into your main branch if everything looks good.');
  } catch (error) {
    console.error('Error during auto-upgrade:', error.message);
  }
}

async function generateUpgradePlan(apiKey, provider, diffContent, appName, appPackage) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      'ai_agent.py',
      apiKey,
      provider,
      diffContent,
      appName,
      appPackage
    ]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}: ${error}`));
      } else {
        try {
          const upgradePlan = JSON.parse(result);
          resolve(upgradePlan);
        } catch (e) {
          reject(new Error(`Failed to parse upgrade plan: ${e.message}`));
        }
      }
    });
  });
}

async function applyUpgradeChanges(upgradePlan, diffContent) {
  console.log('Applying upgrade changes based on AI recommendations:');
  
  const toolbox = build()
    .brand('upgrade-tool')
    .src(__dirname)
    .plugins('./node_modules', { pattern: 'gluegun-*' })
    .create();

  const templatesDir = path.join(process.cwd(), '.upgrade-templates');
  await fs.mkdir(templatesDir, { recursive: true });

  try {
    // Generate EJS templates for all files
    await generateAllTemplates(upgradePlan, diffContent, templatesDir);

    // Apply changes using generated templates
    for (const step of upgradePlan.steps) {
      console.log(`\nStep: ${step.description}`);
      
      if (step.fileChanges) {
        for (const change of step.fileChanges) {
          await applyFileChange(toolbox, change, templatesDir);
        }
      }
      
      if (step.newFiles) {
        for (const newFile of step.newFiles) {
          await createNewFile(toolbox, newFile, templatesDir);
        }
      }
      
      if (step.deletedFiles) {
        for (const deletedFile of step.deletedFiles) {
          await deleteFile(toolbox, deletedFile);
        }
      }
      
      if (step.additionalActions) {
        await handleAdditionalActions(toolbox, step.additionalActions);
      }
    }
  } finally {
    // Clean up the templates directory
    await fs.rm(templatesDir, { recursive: true, force: true });
  }
  
  console.log('\nAI-recommended changes applied. Please review the changes before proceeding.');
}

async function generateAllTemplates(upgradePlan, diffContent, templatesDir) {
  for (const step of upgradePlan.steps) {
    if (step.fileChanges) {
      for (const change of step.fileChanges) {
        const templateContent = generateEJSTemplate(diffContent, change.file);
        const templatePath = path.join(templatesDir, `${change.file}.ejs`);
        await fs.writeFile(templatePath, templateContent);
      }
    }
    if (step.newFiles) {
      for (const newFile of step.newFiles) {
        const templateContent = generateEJSTemplate(newFile.content);
        const templatePath = path.join(templatesDir, `${newFile.path}.ejs`);
        await fs.writeFile(templatePath, templateContent);
      }
    }
  }
}

async function applyFileChange(toolbox, change, templatesDir) {
  const { template, filesystem, print } = toolbox;
  
  console.log(`  Modifying file: ${change.file}`);
  
  const filePath = path.join(process.cwd(), change.file);
  const templatePath = path.join(templatesDir, `${change.file}.ejs`);
  
  if (!filesystem.exists(filePath)) {
    print.error(`File not found: ${change.file}`);
    return;
  }
  
  if (!filesystem.exists(templatePath)) {
    print.error(`Template not found for: ${change.file}`);
    return;
  }
  
  const originalContent = await filesystem.read(filePath);
  
  try {
    // Use Gluegun's template.generate to apply the changes
    await template.generate({
      template: templatePath,
      target: change.file,
      props: { original: originalContent }
    });
    
    print.success(`Updated ${change.file}`);
  } catch (error) {
    print.error(`Failed to update ${change.file}: ${error.message}`);
  }
}

async function createNewFile(toolbox, newFile, templatesDir) {
  const { template, filesystem, print } = toolbox;
  
  console.log(`  Creating new file: ${newFile.path}`);
  
  const filePath = path.join(process.cwd(), newFile.path);
  const templatePath = path.join(templatesDir, `${newFile.path}.ejs`);
  
  if (filesystem.exists(filePath)) {
    print.warning(`File already exists: ${newFile.path}`);
    return;
  }
  
  if (!filesystem.exists(templatePath)) {
    print.error(`Template not found for: ${newFile.path}`);
    return;
  }
  
  try {
    // Use Gluegun's template.generate to create the new file
    await template.generate({
      template: templatePath,
      target: newFile.path,
      props: {}
    });
    
    print.success(`Created ${newFile.path}`);
  } catch (error) {
    print.error(`Failed to create ${newFile.path}: ${error.message}`);
  }
}

async function deleteFile(toolbox, deletedFile) {
  const { filesystem, print } = toolbox;
  
  console.log(`  Deleting file: ${deletedFile}`);
  
  const filePath = path.join(process.cwd(), deletedFile);
  
  if (!filesystem.exists(filePath)) {
    print.warning(`File not found: ${deletedFile}`);
    return;
  }
  
  await filesystem.remove(filePath);
  
  print.success(`Deleted ${deletedFile}`);
}

async function handleAdditionalActions(toolbox, actions) {
  const { prompt, system, print } = toolbox;
  
  console.log('  Additional actions:');
  for (const action of actions) {
    console.log(`    - ${action}`);
    // Prompt user for confirmation before executing additional actions
    const { confirm } = await prompt.ask({
      type: 'confirm',
      name: 'confirm',
      message: `Do you want to execute this action: ${action}?`
    });
    if (confirm) {
      try {
        await system.run(action);
        print.success(`Executed: ${action}`);
      } catch (error) {
        print.error(`Failed to execute: ${action}`);
        print.error(error);
      }
    }
  }
}

function generateEJSTemplate(diffContent, fileName = null) {
  // Parse the diff content and generate an EJS template
  // This is a simplified example and may need to be expanded based on your specific diff format
  let template = '';
  const lines = diffContent.split('\n');
  
  for (const line of lines) {
    if (fileName && !line.includes(fileName)) continue;
    
    if (line.startsWith('+')) {
      template += line.slice(1) + '\n';
    } else if (line.startsWith('-')) {
      template += '<%# ' + line.slice(1) + ' %>\n';
    } else {
      template += '<%= original.includes("' + line.replace(/"/g, '\\"') + '") ? "' + line.replace(/"/g, '\\"') + '" : "" %>\n';
    }
  }
  
  return template;
}

function isReactNativeProject() {
  const requiredFiles = ['package.json', 'index.js', 'app.json'];
  const optionalFiles = ['App.js', 'index.ios.js', 'index.android.js'];

  // Check for required files
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
      return false;
    }
  }

  // Check package.json for react-native dependency
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  if (!packageJson.dependencies || !packageJson.dependencies['react-native']) {
    return false;
  }

  // Check for at least one of the optional files
  const hasOptionalFile = optionalFiles.some(file => fs.existsSync(path.join(process.cwd(), file)));

  return hasOptionalFile;
}

async function handleReactNativeUpgrade() {
  const answers = await promptUpgradeInfo();

  const inquirer = require('inquirer');
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'Open in web browser',
        'Auto upgrade with new branch',
        'Cancel'
      ]
    }
  ]);

  switch (action) {
    case 'Open in web browser':
      await openUpgradeHelperInBrowser(answers);
      break;
    case 'Auto upgrade with new branch':
      await autoUpgradeWithNewBranch(answers);
      break;
    case 'Cancel':
      console.log('Upgrade cancelled.');
      break;
  }
}

async function handleUpgradeOption(type) {
  const answers = await promptUpgradeInfo();
  if (type === 'web') {
    await openUpgradeHelperInBrowser(answers);
  } else if (type === 'auto') {
    await autoUpgradeWithNewBranch(answers);
  } else {
    console.log('Invalid upgrade type. Use "web" or "auto".');
  }
}

async function getAPIKey() {
  const keys = ['DEEPSEEK_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'];
  for (const key of keys) {
    if (process.env[key]) {
      return { key: process.env[key], provider: key.split('_')[0].toLowerCase() };
    }
  }

  // If no key is found, prompt the user
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log('No API key found. Please provide one of the following:');
  const apiKey = await question('Enter your DeepSeek, Anthropic, or OpenAI API key: ');
  rl.close();

  // Determine the provider based on the key format or prefix
  let provider;
  if (apiKey.startsWith('sk-')) {
    provider = 'openai';
  } else if (apiKey.startsWith('sk-ant-')) {
    provider = 'anthropic';
  } else {
    provider = 'deepseek';
  }

  // Set the environment variable
  process.env[`${provider.toUpperCase()}_API_KEY`] = apiKey;

  return { key: apiKey, provider };
}

async function ensurePackageInstalled(packageName) {
  try {
    require.resolve(packageName);
  } catch (e) {
    console.log(`Installing ${packageName}...`);
    try {
      execSync(`bun add ${packageName}`, { stdio: 'inherit' });
      console.log(`${packageName} installed successfully.`);
    } catch (error) {
      console.error(`Failed to install ${packageName}:`, error.message);
      process.exit(1);
    }
  }
}

async function ensurePackagesInstalled() {
  const requiredPackages = ['axios', 'anthropic', 'openai', 'gluegun', 'ejs'];
  for (const pkg of requiredPackages) {
    await ensurePackageInstalled(pkg);
  }
}

module.exports = {
  handleReactNativeUpgrade,
  handleUpgradeOption
};