const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const inquirer = require('inquirer');
const https = require('https');
const fs = require('fs');
const path = require('path');

async function checkPythonAndPip() {
  try {
    await execAsync('python --version');
    await execAsync('pip --version');
    console.log('Python and pip are installed.');
    return true;
  } catch (error) {
    console.error('Python or pip is not installed. Please install them first.');
    return false;
  }
}

async function installSentient() {
  try {
    await execAsync('pip install sentient');
    console.log('Sentient installed successfully.');
    return true;
  } catch (error) {
    console.error('Failed to install Sentient:', error.message);
    return false;
  }
}

async function validateOpenAIKey(apiKey) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/engines',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.end();
  });
}

async function setSystemEnvVariable(key, value) {
  const platform = process.platform;
  let command;

  if (platform === 'win32') {
    command = `setx ${key} "${value}"`;
  } else {
    // For macOS and Linux
    const shellType = process.env.SHELL.includes('zsh') ? 'zsh' : 'bash';
    const rcFile = shellType === 'zsh' ? '~/.zshrc' : '~/.bashrc';
    command = `echo 'export ${key}="${value}"' >> ${rcFile} && source ${rcFile}`;
  }

  try {
    await execAsync(command);
    console.log(`${key} has been set as a system environment variable.`);
    process.env[key] = value; // Set for the current process
    return true;
  } catch (error) {
    console.error(`Failed to set ${key} as a system environment variable:`, error.message);
    return false;
  }
}

async function checkApiKey() {
  let apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('OPENAI_API_KEY is not set in the system environment variables.');
    const { enterKey } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enterKey',
        message: 'Would you like to enter your OpenAI API key now?',
        default: true
      }
    ]);

    if (enterKey) {
      const { key } = await inquirer.prompt([
        {
          type: 'password',
          name: 'key',
          message: 'Enter your OpenAI API key:',
          validate: async (input) => {
            if (input.length === 0) {
              return 'API key cannot be empty';
            }
            const isValid = await validateOpenAIKey(input);
            return isValid ? true : 'Invalid API key. Please check and try again.';
          }
        }
      ]);
      apiKey = key;
    } else {
      return false;
    }
  }

  const isValid = await validateOpenAIKey(apiKey);
  if (!isValid) {
    console.error('The provided OpenAI API key is invalid.');
    return false;
  }

  if (!process.env.OPENAI_API_KEY) {
    const setEnvVar = await setSystemEnvVariable('OPENAI_API_KEY', apiKey);
    if (!setEnvVar) {
      console.error('Failed to set OPENAI_API_KEY as a system environment variable.');
      return false;
    }
  }

  console.log('OPENAI_API_KEY is valid and set in the system environment variables.');
  return true;
}

async function startBrowser() {
  const platform = process.platform;
  let chromeCommand, braveCommand, braveBetaCommand, chromePath, bravePath, braveBetaPath;

  if (platform === 'darwin') {
    chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    bravePath = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
    braveBetaPath = '/Applications/Brave Browser Beta.app/Contents/MacOS/Brave Browser Beta';
    
    chromeCommand = `"${chromePath}" --remote-debugging-port=9222`;
    braveCommand = `"${bravePath}" --remote-debugging-port=9222 --guest`;
    braveBetaCommand = `"${braveBetaPath}" --remote-debugging-port=9222 --guest`;
  } else if (platform === 'linux') {
    chromeCommand = 'google-chrome --remote-debugging-port=9222';
    braveCommand = 'brave-browser --remote-debugging-port=9222 --guest';
    braveBetaCommand = 'brave-browser-beta --remote-debugging-port=9222 --guest';
  } else if (platform === 'win32') {
    chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    bravePath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
    braveBetaPath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser-Beta\\Application\\brave.exe';
    chromeCommand = `"${chromePath}" --remote-debugging-port=9222`;
    braveCommand = `"${bravePath}" --remote-debugging-port=9222 --guest`;
    braveBetaCommand = `"${braveBetaPath}" --remote-debugging-port=9222 --guest`;
  } else {
    console.error('Unsupported platform for automated browser launch.');
    return false;
  }

  async function checkBrowserExists(browserPath) {
    return new Promise(resolve => {
      fs.access(browserPath, fs.constants.F_OK, (err) => {
        resolve(!err);
      });
    });
  }

  async function tryStartBrowser(command, browserName, browserPath) {
    if (await checkBrowserExists(browserPath)) {
      try {
        // Kill any existing instances of the browser
        await execAsync(`pkill -f "${browserPath}"`);
        // Start the browser with the debugging port and additional flags
        const browserProcess = exec(`${command} --no-first-run --no-default-browser-check`);
        console.log(`${browserName} started in debug mode on port 9222.`);
        
        // Wait for the browser to fully start and open the debugging port
        let portOpen = false;
        for (let i = 0; i < 15; i++) {  // Increased wait time
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            await execAsync('nc -z localhost 9222');
            portOpen = true;
            break;
          } catch (error) {
            console.log(`Waiting for debugging port to open... (attempt ${i + 1})`);
          }
        }

        if (!portOpen) {
          console.log(`Failed to open debugging port for ${browserName}.`);
          browserProcess.kill();
          return false;
        }

        return true;
      } catch (error) {
        console.log(`Failed to start ${browserName}: ${error.message}`);
      }
    } else {
      console.log(`${browserName} not found at the expected location: ${browserPath}`);
    }
    return false;
  }

  if (await isPortInUse(9222)) {
    console.log('Port 9222 is already in use. Attempting to close the existing process...');
    await execAsync('lsof -ti:9222 | xargs kill -9');
  }

  if (await tryStartBrowser(chromeCommand, 'Chrome', chromePath)) return true;
  if (await tryStartBrowser(braveCommand, 'Brave', bravePath)) return true;
  if (await tryStartBrowser(braveBetaCommand, 'Brave Beta', braveBetaPath)) return true;

  console.error('Failed to start Chrome, Brave, or Brave Beta automatically.');
  console.log('Please start Chrome, Brave, or Brave Beta manually with one of the following commands:');
  console.log('Chrome:', chromeCommand);
  console.log('Brave:', braveCommand);
  console.log('Brave Beta:', braveBetaCommand);
  console.log('After starting the browser, ensure it\'s running with remote debugging enabled on port 9222.');
  console.log('Press Enter to continue once you\'ve started the browser...');
  
  await new Promise(resolve => process.stdin.once('data', resolve));
  return true;
}

async function setupSentient() {
  const pythonInstalled = await checkPythonAndPip();
  if (!pythonInstalled) return false;

  const sentinelInstalled = await installSentient();
  if (!sentinelInstalled) return false;

  const apiKeySet = await checkApiKey();
  if (!apiKeySet) return false;

  const browserStarted = await startBrowser();
  if (!browserStarted) {
    console.error('Failed to start or confirm browser. Sentient may not work correctly.');
    return false;
  }

  console.log('Sentient setup completed successfully.');
  return true;
}

module.exports = {
  setupSentient
};

async function isPortInUse(port) {
  try {
    await execAsync(`nc -z localhost ${port}`);
    return true;
  } catch (error) {
    return false;
  }
}