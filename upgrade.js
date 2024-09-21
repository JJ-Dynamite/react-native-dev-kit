const { exec, execSync } = require('child_process');
const { createInterface } = require('readline');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { spawn } = require('child_process');
const ejs = require('ejs');
const ora = require('ora');
const yaml = require('js-yaml');
const chalk = require('chalk');
const diff = require('diff');
const open = require('open').default;
const { alignDeps } = require('./upgradeFunctions');
const os = require('os');
const dirTree = require('directory-tree');
const treeify = require('treeify');

let inquirer;

async function initializeInquirer() {
  if (!inquirer) {
    inquirer = (await import('inquirer')).default;
  }
  return inquirer;
}

// Call this function at the beginning of your main execution
async function main() {
  inquirer = await initializeInquirer();
  // Rest of your code...
}

async function ensurePackagesInstalled() {
  const packages = ['axios', 'anthropic', 'openai', 'gluegun', 'ejs', 'ora', 'cli-progress', 'js-yaml', 'inquirer', 'chalk', 'diff', 'open', 'os'];

  for (const pkg of packages) {
    try {
      // Check if the package is globally installed
      await execSync(`bun pm ls -g ${pkg}`, { stdio: 'ignore' });
      console.log(`${pkg} is already installed globally.`);
    } catch (error) {
      console.log(`Installing ${pkg} globally...`);
      try {
        // Use npm for global installation as Bun doesn't support it directly
        await execSync(`npm install -g ${pkg}`, { stdio: 'inherit' });
        console.log(`${pkg} installed globally successfully.`);
      } catch (installError) {
        console.error(`Failed to install ${pkg} globally:`, installError.message);
        console.log(`Attempting to install ${pkg} locally...`);
        try {
          await execSync(`bun add ${pkg}`, { stdio: 'inherit' });
          console.log(`${pkg} installed locally successfully.`);
        } catch (localInstallError) {
          console.error(`Failed to install ${pkg} locally:`, localInstallError.message);
          process.exit(1);
        }
      }
    }
  }
}

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
  const inquirer = await initializeInquirer();
  const { appName, appPackage, currentVersion, targetVersion } = answers;
  const branchName = `upgrade-${currentVersion}-to-${targetVersion}`;

  // Check if current directory is a React Native project
  console.log('Checking if the current directory is a React Native project...');
  if (!(await isReactNativeProject())) {
    console.error('Error: The current directory does not appear to be a React Native project.');
    console.log('Please ensure you are in the root directory of a React Native project.');
    console.log('Current directory contents:');
    const files = await fs.readdir(process.cwd());
    console.log(files.join('\n'));
    return;
  }

  console.log('Confirmed: This is a React Native project.');

  console.log('Ensuring all necessary packages are installed...');
  await ensurePackagesInstalled();

  console.log(`Checking for branch: ${branchName}`);
  try {
    execSync(`git rev-parse --verify ${branchName}`, { stdio: 'ignore' });
    console.log(`Branch ${branchName} already exists. Switching to it.`);
    execSync(`git checkout ${branchName}`);
  } catch (error) {
    console.log(`Creating new branch: ${branchName}`);
    execSync(`git checkout -b ${branchName}`);
    console.log(`Created new branch: ${branchName}`);
  }

  console.log(`Upgrading ${appName} from ${currentVersion} to ${targetVersion}`);

  try {
    // Ask user before running align-deps
    const { runAlignDeps } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'runAlignDeps',
        message: 'Do you want to run align-deps before fetching the upgrade diff?',
        default: true
      }
    ]);

    if (runAlignDeps) {
      console.log('Running align-deps...');
      const alignResult = await alignDeps(targetVersion, { write: true, verbose: true });
      if (!alignResult) {
        console.log('align-deps encountered an error, but we will proceed with the upgrade.');
        // You might want to ask the user if they want to continue here
      }
    } else {
      console.log('Skipping align-deps...');
    }

    console.log('Fetching upgrade diff...');
    const diffUrl = `https://raw.githubusercontent.com/react-native-community/rn-diff-purge/diffs/diffs/${currentVersion}..${targetVersion}.diff`;
    const response = await axios.get(diffUrl);
    const diffContent = response.data;
    console.log(`Fetched diff content (${diffContent.length} characters)`);

    console.log('Generating basic upgrade plan from diff...');
    const upgradePlan = generateBasicUpgradePlan(diffContent, appName, appPackage);

    // Ask for user confirmation before applying changes
    const { confirmApply } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmApply',
        message: 'Do you want to proceed with applying the upgrade changes?',
        default: true
      }
    ]);

    if (!confirmApply) {
      console.log('Upgrade process cancelled by user.');
      return;
    }

    console.log('Applying upgrade changes...');
    await applyUpgradeChanges(upgradePlan, diffContent, appName, appPackage, targetVersion, inquirer);

    console.log('Running React Native upgrade command...');
    execSync(`npx react-native upgrade --to ${targetVersion}`, { stdio: 'inherit' });

    console.log('Upgrade completed successfully.');
    console.log(`Please review the changes in the branch: ${branchName}`);
    console.log('After reviewing, you can merge this branch into your main branch if everything looks good.');
  } catch (error) {
    console.error('Error during auto-upgrade:', error.message);
    console.log('Falling back to manual upgrade...');
    
    // Ask for user confirmation before opening the browser
    const { confirmOpenBrowser } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmOpenBrowser',
        message: 'Do you want to open the React Native Upgrade Helper in your browser?',
        default: true
      }
    ]);

    if (confirmOpenBrowser) {
      await openUpgradeHelperInBrowser(answers);
    } else {
      console.log('Manual upgrade process cancelled by user.');
    }
  }
}

function generateBasicUpgradePlan(diffContent, appName, appPackage) {
  const upgradePlan = { steps: [] };
  const lines = diffContent.split('\n');
  let currentFile = null;
  let currentChanges = [];

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      if (currentFile) {
        upgradePlan.steps.push({
          description: `Update ${replaceAppNameAndPackage(currentFile, appName, appPackage)}`,
          fileChanges: [{ file: replaceAppNameAndPackage(currentFile, appName, appPackage), content: currentChanges.join('\n') }]
        });
        currentChanges = [];
      }
      currentFile = line.split(' b/')[1];
    } else if (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ')) {
      currentChanges.push(replaceAppNameAndPackage(line, appName, appPackage));
    }
  }

  if (currentFile) {
    upgradePlan.steps.push({
      description: `Update ${replaceAppNameAndPackage(currentFile, appName, appPackage)}`,
      fileChanges: [{ file: replaceAppNameAndPackage(currentFile, appName, appPackage), content: currentChanges.join('\n') }]
    });
  }

  try {
    if (typeof chalk !== 'undefined' && chalk.bold && chalk.cyan) {
      console.log(chalk.bold.cyan('\nBasic upgrade plan generated from diff content:'));
      console.log(chalk.yellow('='.repeat(80)));

      upgradePlan.steps.forEach((step, index) => {
        console.log(chalk.green(`\nStep ${index + 1}: ${step.description}`));
        step.fileChanges.forEach(change => {
          console.log(chalk.blue(`  File: ${change.file}`));
          const lines = change.content.split('\n');
          lines.forEach(line => {
            if (line.startsWith('+')) {
              console.log(chalk.green(`    ${line}`));
            } else if (line.startsWith('-')) {
              console.log(chalk.red(`    ${line}`));
            } else {
              console.log(chalk.gray(`    ${line}`));
            }
          });
        });
      });

      console.log(chalk.yellow('='.repeat(80)));
    } else {
      // Fallback to non-colored output
      console.log('\nBasic upgrade plan generated from diff content:');
      console.log('='.repeat(80));

      upgradePlan.steps.forEach((step, index) => {
        console.log(`\nStep ${index + 1}: ${step.description}`);
        step.fileChanges.forEach(change => {
          console.log(`  File: ${change.file}`);
          console.log(change.content);
        });
      });

      console.log('='.repeat(80));
    }
  } catch (error) {
    console.error('Error formatting upgrade plan:', error);
    console.log('\nBasic upgrade plan generated from diff content:');
    console.log(JSON.stringify(upgradePlan, null, 2));
  }

  return upgradePlan;
}

async function applyUpgradeChanges(upgradePlan, diffContent, appName, appPackage, targetVersion, inquirer) {
  console.log('Applying upgrade changes based on diff content:');
  console.log('Current working directory:', process.cwd());

  if (!upgradePlan.steps || upgradePlan.steps.length === 0) {
    console.log('Upgrade plan is empty. No changes to apply.');
    return;
  }

  const patchesDir = path.join(process.cwd(), '.upgrade-patches');
  console.log(`Attempting to create patches directory: ${patchesDir}`);
  
  try {
    await fs.mkdir(patchesDir, { recursive: true });
    console.log(`Patches directory created successfully: ${patchesDir}`);
  } catch (error) {
    console.error(`Error creating patches directory: ${error.message}`);
    console.error('Error stack:', error.stack);
    return;
  }

  try {
    console.log('Generating patch files...');
    await generateAllPatches(upgradePlan, diffContent, patchesDir, appName, appPackage);
    
    console.log('Attempting to read patches directory...');
    const patchFiles = await fs.readdir(patchesDir);
    console.log(`Patches generated. Contents of ${patchesDir}:`);
    patchFiles.forEach(file => console.log(` - ${file}`));

    // Save diffContent to a temporary file
    const patchFilePath = path.join(patchesDir, 'upgrade.patch');
    await fs.writeFile(patchFilePath, diffContent);

    console.log('Applying patch...');
    try {
      execSync(`patch -p1 < "${patchFilePath}"`, { stdio: 'inherit' });
      console.log('Patch applied successfully.');
    } catch (error) {
      console.error('Error applying patch:', error.message);
      console.log('Attempting to apply patch with --reject-file option...');
      try {
        execSync(`patch -p1 --reject-file=- < "${patchFilePath}"`, { stdio: 'inherit' });
        console.log('Patch applied with reject file option. Please check for .rej files.');
      } catch (rejectError) {
        console.error('Error applying patch with reject file option:', rejectError.message);
      }
    }

    // Remove the temporary patch file
    await fs.unlink(patchFilePath);

    // Apply changes using generated patches
    for (const step of upgradePlan.steps) {
      console.log(`\nStep: ${step.description}`);
      
      if (step.fileChanges) {
        for (const change of step.fileChanges) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Do you want to apply changes to ${replaceAppNameAndPackage(change.file, appName, appPackage)}?`,
              default: true
            }
          ]);
          
          if (confirm) {
            try {
              await applyPatchFile(change, patchesDir, appName, appPackage, inquirer);
            } catch (error) {
              console.error(`Error applying change to ${replaceAppNameAndPackage(change.file, appName, appPackage)}:`, error.message);
              
              const { action } = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'action',
                  message: 'How would you like to proceed?',
                  choices: ['Skip this change', 'Try manual edit', 'Abort upgrade']
                }
              ]);

              switch (action) {
                case 'Skip this change':
                  console.log(`Skipped changes to ${replaceAppNameAndPackage(change.file, appName, appPackage)}`);
                  break;
                case 'Try manual edit':
                  await manualEdit(change, appName, appPackage);
                  break;
                case 'Abort upgrade':
                  throw new Error('Upgrade aborted by user');
              }
            }
          } else {
            console.log(`Skipped changes to ${replaceAppNameAndPackage(change.file, appName, appPackage)}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during upgrade process:', error.message);
    console.error('Error stack:', error.stack);
    
    // Add overall error recovery options
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'How would you like to proceed?',
        choices: ['Retry upgrade', 'Abort upgrade']
      }
    ]);

    if (action === 'Retry upgrade') {
      console.log('Retrying upgrade process...');
      return applyUpgradeChanges(upgradePlan, diffContent, appName, appPackage, targetVersion, inquirer);
    } else {
      console.log('Upgrade process aborted.');
      process.exit(1);
    }
  }
  
  console.log('\nUpgrade changes applied. Please review the changes before proceeding.');
}

async function generateAllPatches(upgradePlan, diffContent, patchesDir, appName, appPackage) {
  for (const step of upgradePlan.steps) {
    if (step.fileChanges) {
      for (const change of step.fileChanges) {
        let filePath = replaceAppNameAndPackage(change.file, appName, appPackage);
        
        // Remove the app name from the beginning of the file path for root files
        if (filePath.startsWith(`${appName}/`)) {
          filePath = filePath.slice(appName.length + 1);
        }
        
        const patchContent = generatePatchContent(filePath, change.content);
        const patchFileName = `${filePath.replace(/\//g, '_')}.patch`;
        const patchFilePath = path.join(patchesDir, patchFileName);
        
        await fs.writeFile(patchFilePath, patchContent);
        console.log(`Generated patch file: ${patchFilePath}`);
      }
    }
  }
}

function generatePatchContent(filePath, changes) {
  const header = `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,1 +1,1 @@\n`;
  return header + changes;
}

async function applyPatchFile(change, patchesDir, appName, appPackage, inquirer) {
  let filePath = replaceAppNameAndPackage(change.file, appName, appPackage);
  
  // Remove the app name from the beginning of the file path for root files
  if (filePath.startsWith(`${appName}/`)) {
    filePath = filePath.slice(appName.length + 1);
  }
  
  const patchFileName = `${filePath.replace(/\//g, '_')}.patch`;
  const patchFilePath = path.join(patchesDir, patchFileName);

  console.log(`Applying patch to ${filePath}...`);
  console.log(`Looking for patch file: ${patchFilePath}`);
  
  // Read the patch content
  let patchContent;
  try {
    patchContent = await fs.readFile(patchFilePath, 'utf8');
    console.log('Original patch content:', patchContent);
  } catch (error) {
    console.error(`Error reading patch file: ${error.message}`);
    console.error(`Full path of patch file: ${path.resolve(patchFilePath)}`);
    console.error(`Directory contents of ${patchesDir}:`, await fs.readdir(patchesDir));
    return;
  }
  
  if (!patchContent.trim()) {
    console.error('Patch file is empty. Skipping this change.');
    return;
  }

  // Replace RnDiffApp with the actual app name in the entire patch content
  let updatedPatchContent = patchContent.replace(/RnDiffApp/g, appName);
  
  // Ensure the patch has the correct format
  if (!updatedPatchContent.startsWith('--- a/')) {
    updatedPatchContent = `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,1 +1,1 @@\n${updatedPatchContent}`;
  }
  
  // Remove redundant app name in the patch header
  updatedPatchContent = updatedPatchContent.replace(
    new RegExp(`^(---\\s+a/)${appName}/`, 'gm'),
    '$1'
  ).replace(
    new RegExp(`^(\\+\\+\\+\\s+b/)${appName}/`, 'gm'),
    '$1'
  );
  
  console.log('Updated patch content:', updatedPatchContent);

  // Write the updated patch content to a temporary file
  const tempPatchFile = path.join(patchesDir, `temp_${patchFileName}`);
  await fs.writeFile(tempPatchFile, updatedPatchContent);

  // Determine the actual file path
  const actualFilePath = path.join(process.cwd(), filePath);

  // Apply the patch to the file
  await applyPatchToFile(actualFilePath, tempPatchFile);
}

async function applyPatchToFile(filePath, patchFile) {
  try {
    // Ensure the directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Check if the file exists, if not, create an empty file
    try {
      await fs.access(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(filePath, '');
        console.log(`Created empty file: ${filePath}`);
      } else {
        throw error;
      }
    }

    // Apply the patch
    execSync(`patch -p1 < "${patchFile}"`, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`Patch applied successfully to ${filePath}.`);
  } catch (error) {
    console.error(`Error applying patch to ${filePath}:`, error.message);
    console.log('Attempting to apply patch with --reject-file option...');
    try {
      execSync(`patch -p1 --reject-file=- < "${patchFile}"`, { stdio: 'inherit', cwd: process.cwd() });
      console.log(`Patch applied with reject file option to ${filePath}. Please check for .rej files.`);
    } catch (rejectError) {
      console.error(`Error applying patch with reject file option to ${filePath}:`, rejectError.message);
      console.log('Attempting to create file with patch content...');
      try {
        const patchContent = await fs.readFile(patchFile, 'utf8');
        const fileContent = patchContent.split('\n').filter(line => line.startsWith('+')).map(line => line.slice(1)).join('\n');
        await fs.writeFile(filePath, fileContent);
        console.log(`Created ${filePath} with patch content.`);
      } catch (createError) {
        console.error(`Error creating file with patch content:`, createError.message);
      }
    }
  } finally {
    // Clean up the temporary patch file
    await fs.unlink(patchFile);
  }
}

function getRootFilesFromDiff(diffContent) {
  const rootFiles = new Set();
  const lines = diffContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      const filePath = line.split(' b/')[1];
      if (filePath && !filePath.includes('/')) {
        rootFiles.add(filePath);
      }
    }
  }
  return Array.from(rootFiles);
}

function replaceAppNameAndPackage(content, appName, appPackage) {
  return content
    .replace(/RnDiffApp/g, appName)
    .replace(/rndiffapp/g, appPackage.toLowerCase())
    .replace(/com\.rndiffapp/g, appPackage)
    .replace(/com\/rndiffapp/g, appPackage.replace(/\./g, '/'))
    .replace(new RegExp(`${appName}/android`, 'g'), `${appName.toLowerCase()}/android`)
    .replace(new RegExp(`${appName}/ios`, 'g'), `${appName.toLowerCase()}/ios`)
    .replace(new RegExp(`${appName}/app`, 'g'), `${appName.toLowerCase()}/app`);
}

function generateEJSTemplate(content, filePath, data) {
  const template = `
<% if (props.skipIndexFile && filename === 'index.js') { %>
  <%- original %>
<% } else { %>
  <%- content %>
<% } %>
`;
  return ejs.render(template, { content, filename: path.basename(filePath), ...data });
}

function extractFrontMatter(content) {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (match) {
    const frontMatter = yaml.parse(match[1]);
    return { frontMatter, content: match[2] };
  }
  
  return { frontMatter: {}, content };
}

async function handlePatch(patch, appName, appPackage) {
  const { path: patchPath, append, prepend, after, insert, skip } = patch;
  
  if (skip) return;
  
  const filePath = replaceAppNameAndPackage(patchPath, appName, appPackage);
  
  if (append) {
    await toolbox.patching.append(filePath, replaceAppNameAndPackage(append, appName, appPackage));
  }
  if (prepend) {
    await toolbox.patching.prepend(filePath, replaceAppNameAndPackage(prepend, appName, appPackage));
  }
  if (after && insert) {
    await toolbox.patching.patch(filePath, { after, insert: replaceAppNameAndPackage(insert, appName, appPackage) });
  }
}

async function applyFileChange(change, templatesDir, appName, appPackage, diffContent, targetVersion) {
  const rootFiles = getRootFilesFromDiff(diffContent);
  console.log('Root files identified from diff:', rootFiles);

  let actualFilePath = replaceAppNameAndPackage(change.file, appName, appPackage);

  // Special handling for files in the root directory
  if (rootFiles.includes(actualFilePath)) {
    actualFilePath = path.basename(actualFilePath);
  } else {
    // Remove the extra directory levels and the app name directory
    const parts = actualFilePath.split('/');
    const appNameLower = appName.toLowerCase();
    while (parts.length > 0 && (parts[0] === appNameLower || parts[0] === 'RnDiffApp' || parts[0] === appName)) {
      parts.shift();
    }
    actualFilePath = parts.join('/');
  }

  const filePath = path.join(process.cwd(), actualFilePath);
  const templatePath = path.join(templatesDir, `${actualFilePath}.ejs`);

  console.log('File path:', filePath);
  console.log('Template path:', templatePath);

  try {
    let originalContent = '';
    let isNewFile = false;
    let operationType = 'MODIFIED';

    try {
      originalContent = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`File does not exist: ${filePath}. This will be a new file.`);
        isNewFile = true;
        operationType = 'ADDED';
      } else {
        throw error;
      }
    }

    const templateContent = await fs.readFile(templatePath, 'utf8');
    const renderedTemplate = ejs.render(templateContent, {
      props: {
        original: originalContent,
        appName,
        appPackage,
        pascalCaseName: toPascalCase(appName),
        camelCaseName: toCamelCase(appName),
        skipIndexFile: false,
        applyChanges: true // Set this to false if you want to preview without changes
      }
    });

    const { data, content } = extractFrontMatter(renderedTemplate);

    // Check if the file is binary
    if (isBinaryFile(content)) {
      operationType = 'BINARY';
      console.log(`Binary file detected: ${actualFilePath}`);
      // Handle binary file (e.g., download to the path)
      await handleBinaryFile(filePath, content);
    } else if (content.trim() === '') {
      operationType = 'DELETED';
      console.log(`File will be deleted: ${actualFilePath}`);
    }

    const updatedFile = path.join(templatesDir, `${operationType}_${path.basename(filePath)}`);
    await fs.writeFile(updatedFile, content);

    let targetFilePath = filePath;
    let action;
    do {
      // Generate and show diff preview
      let diffPreview;
      if (isNewFile || operationType === 'ADDED') {
        diffPreview = `New file: ${targetFilePath}\n\n${content}`;
      } else if (operationType === 'DELETED') {
        diffPreview = `File to be deleted: ${targetFilePath}`;
      } else if (operationType === 'BINARY') {
        diffPreview = `Binary file: ${targetFilePath}\nContent cannot be displayed.`;
      } else {
        diffPreview = await generateDiff(originalContent, content, targetFilePath);
      }
      // Use console.log directly without color formatting
      console.log(`\nDiff preview for ${operationType} ${targetFilePath}:`);
      console.log(diffPreview);

      // Ask for action
      ({ action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: ['Apply changes', 'Edit changes', 'Change target file', 'Skip']
        }
      ]));

      switch (action) {
        case 'Apply changes':
          if (operationType === 'DELETED') {
            await fs.unlink(targetFilePath);
            console.log(`Deleted ${targetFilePath}`);
          } else {
            await fs.mkdir(path.dirname(targetFilePath), { recursive: true });
            await fs.copyFile(updatedFile, targetFilePath);
            console.log(`${operationType} ${targetFilePath}`);
          }
          if (data.patches) {
            await handlePatches(data.patches);
          }
          break;
        case 'Edit changes':
          if (operationType !== 'BINARY' && operationType !== 'DELETED') {
            await editContent(updatedFile);
          } else {
            console.log(`Cannot edit ${operationType} file.`);
          }
          break;
        case 'Change target file':
          const { newFilePath } = await inquirer.prompt([
            {
              type: 'input',
              name: 'newFilePath',
              message: 'Enter the new target file path:',
              default: targetFilePath
            }
          ]);
          targetFilePath = newFilePath;
          break;
        case 'Skip':
          console.log(`Skipped changes to ${targetFilePath}`);
          break;
      }
    } while (action === 'Edit changes' || action === 'Change target file');

  } catch (error) {
    console.error(`Failed to update ${filePath}: ${error.message}`);
    console.error('Error details:', error);
  }
}

// Helper function to check if a file is binary
function isBinaryFile(content) {
  const nullByteIndex = content.indexOf('\0');
  return nullByteIndex !== -1 && nullByteIndex < 1024;
}

// Helper function to handle binary files
async function handleBinaryFile(filePath, content) {
  // Implement logic to handle binary files (e.g., download to the path)
  // For now, we'll just write the content as is
  await fs.writeFile(filePath, content, 'binary');
}

function deepMerge(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], deepMerge(target[key], source[key]));
      }
    }
  }
  Object.assign(target || {}, source);
  return target;
}



async function handlePatches(patches) {
  for (const patch of patches) {
    const { path: patchPath, skip, ...patchOpts } = patch;
    if (patchPath && !skip) {
      try {
        const content = await fs.readFile(patchPath, 'utf8');
        let updatedContent = content;

        if (patchOpts.append) {
          updatedContent += patchOpts.append;
        }
        if (patchOpts.prepend) {
          updatedContent = patchOpts.prepend + updatedContent;
        }
        if (patchOpts.replace) {
          updatedContent = updatedContent.replace(patchOpts.replace, patchOpts.insert);
        }

        await fs.writeFile(patchPath, updatedContent);
        console.log(`Applied patch to ${patchPath}`);
      } catch (error) {
        console.error(`Failed to apply patch to ${patchPath}: ${error.message}`);
      }
    }
  }
}

function toPascalCase(str) {
  return str.replace(/(\w)(\w*)/g, (_, g1, g2) => g1.toUpperCase() + g2.toLowerCase());
}

function toCamelCase(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
    index === 0 ? word.toLowerCase() : word.toUpperCase()
  ).replace(/\s+/g, '');
}

// Add this function after the processLine function
function replaceAppNameAndPackage(content, appName, appPackage) {
  return content
    .replace(/RnDiffApp/g, appName)
    .replace(/rndiffapp/g, appPackage.toLowerCase())
    .replace(/com\.rndiffapp/g, appPackage)
    .replace(/com\/rndiffapp/g, appPackage.replace(/\./g, '/'))
    .replace(new RegExp(`${appName}/android`, 'g'), `${appName.toLowerCase()}/android`)
    .replace(new RegExp(`${appName}/ios`, 'g'), `${appName.toLowerCase()}/ios`)
    .replace(new RegExp(`${appName}/app`, 'g'), `${appName.toLowerCase()}/app`);
}

async function applyUpgradeChanges(upgradePlan, diffContent, appName, appPackage, targetVersion, inquirer) {
  console.log('Applying upgrade changes based on diff content:');
  console.log('Current working directory:', process.cwd());

  if (!upgradePlan.steps || upgradePlan.steps.length === 0) {
    console.log('Upgrade plan is empty. No changes to apply.');
    return;
  }

  const patchesDir = path.join(process.cwd(), '.upgrade-patches');
  console.log(`Attempting to create patches directory: ${patchesDir}`);
  
  try {
    await fs.mkdir(patchesDir, { recursive: true });
    console.log(`Patches directory created successfully: ${patchesDir}`);
  } catch (error) {
    console.error(`Error creating patches directory: ${error.message}`);
    console.error('Error stack:', error.stack);
    return;
  }

  try {
    console.log('Generating patch files...');
    await generateAllPatches(upgradePlan, diffContent, patchesDir, appName, appPackage);
    
    console.log('Attempting to read patches directory...');
    const patchFiles = await fs.readdir(patchesDir);
    console.log(`Patches generated. Contents of ${patchesDir}:`);
    patchFiles.forEach(file => console.log(` - ${file}`));

    // Apply changes using generated patches
    for (const step of upgradePlan.steps) {
      console.log(`\nStep: ${step.description}`);
      
      if (step.fileChanges) {
        for (const change of step.fileChanges) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Do you want to apply changes to ${replaceAppNameAndPackage(change.file, appName, appPackage)}?`,
              default: true
            }
          ]);
          
          if (confirm) {
            try {
              await applyPatchFile(change, patchesDir, appName, appPackage, inquirer);
            } catch (error) {
              console.error(`Error applying change to ${replaceAppNameAndPackage(change.file, appName, appPackage)}:`, error.message);
              
              const { action } = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'action',
                  message: 'How would you like to proceed?',
                  choices: ['Skip this change', 'Try manual edit', 'Abort upgrade']
                }
              ]);

              switch (action) {
                case 'Skip this change':
                  console.log(`Skipped changes to ${replaceAppNameAndPackage(change.file, appName, appPackage)}`);
                  break;
                case 'Try manual edit':
                  await manualEdit(change, appName, appPackage);
                  break;
                case 'Abort upgrade':
                  throw new Error('Upgrade aborted by user');
              }
            }
          } else {
            console.log(`Skipped changes to ${replaceAppNameAndPackage(change.file, appName, appPackage)}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during upgrade process:', error.message);
    console.error('Error stack:', error.stack);
    
    // Add overall error recovery options
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'How would you like to proceed?',
        choices: ['Retry upgrade', 'Abort upgrade']
      }
    ]);

    if (action === 'Retry upgrade') {
      console.log('Retrying upgrade process...');
      return applyUpgradeChanges(upgradePlan, diffContent, appName, appPackage, targetVersion, inquirer);
    } else {
      console.log('Upgrade process aborted.');
      process.exit(1);
    }
  }
  
  console.log('\nUpgrade changes applied. Please review the changes before proceeding.');
}

async function generateAllPatches(upgradePlan, diffContent, patchesDir, appName, appPackage) {
  for (const step of upgradePlan.steps) {
    if (step.fileChanges) {
      for (const change of step.fileChanges) {
        let filePath = replaceAppNameAndPackage(change.file, appName, appPackage);
        
        // Remove the app name from the beginning of the file path for root files
        if (filePath.startsWith(`${appName}/`)) {
          filePath = filePath.slice(appName.length + 1);
        }
        
        const patchContent = generatePatchContent(filePath, change.content);
        const patchFileName = `${filePath.replace(/\//g, '_')}.patch`;
        const patchFilePath = path.join(patchesDir, patchFileName);
        
        await fs.writeFile(patchFilePath, patchContent);
        console.log(`Generated patch file: ${patchFilePath}`);
      }
    }
  }
}

function generatePatchContent(filePath, changes) {
  const header = `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,1 +1,1 @@\n`;
  return header + changes;
}

async function applyPatchFile(change, patchesDir, appName, appPackage, inquirer) {
  let filePath = replaceAppNameAndPackage(change.file, appName, appPackage);
  
  // Remove the app name from the beginning of the file path for root files
  if (filePath.startsWith(`${appName}/`)) {
    filePath = filePath.slice(appName.length + 1);
  }
  
  const patchFileName = `${filePath.replace(/\//g, '_')}.patch`;
  const patchFilePath = path.join(patchesDir, patchFileName);

  console.log(`Applying patch to ${filePath}...`);
  console.log(`Looking for patch file: ${patchFilePath}`);
  
  // Read the patch content
  let patchContent;
  try {
    patchContent = await fs.readFile(patchFilePath, 'utf8');
    console.log('Original patch content:', patchContent);
  } catch (error) {
    console.error(`Error reading patch file: ${error.message}`);
    console.error(`Full path of patch file: ${path.resolve(patchFilePath)}`);
    console.error(`Directory contents of ${patchesDir}:`, await fs.readdir(patchesDir));
    return;
  }
  
  if (!patchContent.trim()) {
    console.error('Patch file is empty. Skipping this change.');
    return;
  }

  // Replace RnDiffApp with the actual app name in the entire patch content
  let updatedPatchContent = patchContent.replace(/RnDiffApp/g, appName);
  
  // Ensure the patch has the correct format
  if (!updatedPatchContent.startsWith('--- a/')) {
    updatedPatchContent = `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,1 +1,1 @@\n${updatedPatchContent}`;
  }
  
  // Remove redundant app name in the patch header
  updatedPatchContent = updatedPatchContent.replace(
    new RegExp(`^(---\\s+a/)${appName}/`, 'gm'),
    '$1'
  ).replace(
    new RegExp(`^(\\+\\+\\+\\s+b/)${appName}/`, 'gm'),
    '$1'
  );
  
  console.log('Updated patch content:', updatedPatchContent);

  // Write the updated patch content to a temporary file
  const tempPatchFile = path.join(patchesDir, `temp_${patchFileName}`);
  await fs.writeFile(tempPatchFile, updatedPatchContent);

  // Determine the actual file path
  const actualFilePath = path.join(process.cwd(), filePath);

  // Apply the patch to the file
  await applyPatchToFile(actualFilePath, tempPatchFile);
}

async function applyPatchToFile(filePath, patchFile) {
  try {
    // Ensure the directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Check if the file exists, if not, create an empty file
    try {
      await fs.access(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(filePath, '');
        console.log(`Created empty file: ${filePath}`);
      } else {
        throw error;
      }
    }

    // Apply the patch
    execSync(`patch -p1 < "${patchFile}"`, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`Patch applied successfully to ${filePath}.`);
  } catch (error) {
    console.error(`Error applying patch to ${filePath}:`, error.message);
    console.log('Attempting to apply patch with --reject-file option...');
    try {
      execSync(`patch -p1 --reject-file=- < "${patchFile}"`, { stdio: 'inherit', cwd: process.cwd() });
      console.log(`Patch applied with reject file option to ${filePath}. Please check for .rej files.`);
    } catch (rejectError) {
      console.error(`Error applying patch with reject file option to ${filePath}:`, rejectError.message);
      console.log('Attempting to create file with patch content...');
      try {
        const patchContent = await fs.readFile(patchFile, 'utf8');
        const fileContent = patchContent.split('\n').filter(line => line.startsWith('+')).map(line => line.slice(1)).join('\n');
        await fs.writeFile(filePath, fileContent);
        console.log(`Created ${filePath} with patch content.`);
      } catch (createError) {
        console.error(`Error creating file with patch content:`, createError.message);
      }
    }
  } finally {
    // Clean up the temporary patch file
    await fs.unlink(patchFile);
  }
}

function getRootFilesFromDiff(diffContent) {
  const rootFiles = new Set();
  const lines = diffContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('--- a/')) {
      const filePath = line.slice(6);
      const rootFile = filePath.split('/')[0];
      rootFiles.add(rootFile);
    }
  }
  return Array.from(rootFiles);
}

function extractFrontMatter(content) {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  if (match) {
    const frontMatter = yaml.load(match[1]);
    const contentWithoutFrontMatter = match[2];
    return { frontMatter, content: contentWithoutFrontMatter };
  }
  return { frontMatter: {}, content };
}

async function isReactNativeProject() {
  const requiredFiles = ['package.json', 'app.json'];
  const optionalFiles = ['App.js', 'index.js', 'metro.config.js', 'babel.config.js', 'react-native.config.js'];

  try {
    // Check for required files
    for (const file of requiredFiles) {
      await fs.access(path.join(process.cwd(), file));
    }

    // Check package.json for react-native dependency
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    if (!packageJson.dependencies || !packageJson.dependencies['react-native']) {
      return false;
    }

    // Check for at least one of the optional files
    for (const file of optionalFiles) {
      try {
        await fs.access(path.join(process.cwd(), file));
        return true; // If any optional file exists, it's likely a React Native project
      } catch (error) {
        // Ignore errors, just continue checking other files
      }
    }

    return true; // If we've made it this far, it's likely a React Native project
  } catch (error) {
    console.error('Error checking React Native project:', error);
    return false; // If any required file is missing or there's an error
  }
}

async function editContent(filePath) {
  const editor = process.env.EDITOR || 'cursor'|| 'code' ||'micro' || 'nano';
  const child = spawn(editor, [filePath], {
    stdio: 'inherit'
  });

  return new Promise((resolve, reject) => {
    child.on('exit', async (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Editor exited with code ${code}`));
      }
    });
  });
}

async function generateDiff(originalContent, updatedContent, filePath) {
  const currentDir = process.cwd();
  const templatesDir = path.join(currentDir, '.upgrade-templates');
  const actualFile = path.resolve(currentDir, filePath);
  const updatedFile = path.join(templatesDir, `updated_${path.basename(filePath)}`);

  try {
    // Ensure the .upgrade-templates directory exists
    await fs.mkdir(templatesDir, { recursive: true });

    // Read the actual file content
    let actualContent;
    try {
      actualContent = await fs.readFile(actualFile, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`File does not exist: ${actualFile}. Creating an empty file.`);
        actualContent = '';
        await fs.writeFile(actualFile, actualContent);
      } else {
        throw error;
      }
    }

    // Write the updated content to the updated_ file
    await fs.writeFile(updatedFile, updatedContent);

    console.log(`Updated file created at: ${updatedFile}`);

    // Verify that the files exist and log their stats
    const actualStats = await fs.stat(actualFile);
    const updatedStats = await fs.stat(updatedFile);
    console.log(`Actual file size: ${actualStats.size} bytes`);
    console.log(`Updated file size: ${updatedStats.size} bytes`);

    // Generate unified diff
    const patches = diff.createPatch(filePath, actualContent, updatedContent);
    console.log('Unified diff:');
    console.log(patches);

    // Try to open the files in a diff view using various editors
    const editors = [
      { name: 'cursor', args: ['--diff', actualFile, updatedFile] },
      { name: 'micro', args: ['--diff', actualFile, updatedFile]},
      { name: 'code', args: ['--diff', actualFile, updatedFile] },
      { name: 'vim', args: ['-d', actualFile, updatedFile] },
      { name: 'nvim', args: ['-d', actualFile, updatedFile] },
      { name: 'subl', args: ['-n', '--command', `sublimerge_diff {"left":"${actualFile}", "right":"${updatedFile}"}`] },
    ];

    for (const editor of editors) {
      try {
        console.log(`Attempting to open diff with ${editor.name}...`);
        const child = spawn(editor.name, editor.args, { stdio: 'inherit' });
        await new Promise((resolve, reject) => {
          child.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Editor exited with code ${code}`));
            }
          });
          child.on('error', (error) => {
            reject(new Error(`Failed to start ${editor.name}: ${error.message}`));
          });
        });
        console.log(`Diff opened in ${editor.name}`);
        return "Diff view opened in editor.";
      } catch (error) {
        console.log(`Failed to open diff with ${editor.name}: ${error.message}`);
      }
    }

    // If no editor could open the diff, return the unified diff as a string
    return patches;

  } catch (error) {
    console.error('Error creating or processing diff:', error);
    return `Failed to create or process diff. Error: ${error.message}\n\nActual file: ${actualFile}\nUpdated file: ${updatedFile}`;
  }
}

async function handleReactNativeUpgrade() {
  const inquirer = await initializeInquirer();
  const answers = await promptUpgradeInfo();

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'Auto upgrade with new branch',
        'Open in web browser',
        'Cancel'
      ]
    }
  ]);

  switch (action) {
    case 'Open in web browser':
      const { confirmOpen } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmOpen',
          message: 'Do you want to open the React Native Upgrade Helper in your web browser?',
          default: true
        }
      ]);
      if (confirmOpen) {
        await openUpgradeHelperInBrowser(answers);
      } else {
        console.log('Web browser opening cancelled.');
      }
      break;
    case 'Auto upgrade with new branch':
      const spinner = ora('Processing upgrade...').start();
      try {
        await autoUpgradeWithNewBranch(answers, inquirer);
        spinner.succeed('Upgrade process completed.');
      } catch (error) {
        spinner.fail('Upgrade process failed.');
        console.error('Error:', error.message);
      }
      break;
    case 'Cancel':
      console.log('Upgrade cancelled.');
      break;
  }
}

async function handleUpgradeOption(type, appName, appPackage, currentVersion, targetVersion) {
  const inquirer = await initializeInquirer();
  let answers;
  if (appName && appPackage && currentVersion && targetVersion) {
    answers = { appName, appPackage, currentVersion, targetVersion };
  } else {
    answers = await promptUpgradeInfo();
  }

  if (type === 'web') {
    await openUpgradeHelperInBrowser(answers);
  } else if (type === 'auto') {
    await autoUpgradeWithNewBranch(answers, inquirer);
  } else {
    console.log('Invalid upgrade type. Use "web" or "auto".');
  }
}

// Update the main function to initialize inquirer
async function main() {
  inquirer = await initializeInquirer();
  // Rest of your code...
}

// Make sure to call main() at the start of your script
main().catch(error => {
  console.error('Error in main execution:', error);
  process.exit(1);
});

module.exports = {
  handleReactNativeUpgrade,
  handleUpgradeOption
};


