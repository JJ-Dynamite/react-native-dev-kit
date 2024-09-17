const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

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

function checkApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set in the system environment variables.');
    console.log('Please set the OPENAI_API_KEY environment variable before proceeding.');
    return false;
  }
  console.log('OPENAI_API_KEY is set in the system environment variables.');
  return true;
}

async function startBrowser() {
  const platform = process.platform;
  let chromeCommand, braveCommand;

  if (platform === 'darwin') {
    chromeCommand = 'open -a "Google Chrome" --args --remote-debugging-port=9222';
    braveCommand = 'open -a "Brave Browser" --args --remote-debugging-port=9222';
  } else if (platform === 'linux') {
    chromeCommand = 'google-chrome --remote-debugging-port=9222';
    braveCommand = 'brave-browser --remote-debugging-port=9222';
  } else if (platform === 'win32') {
    chromeCommand = 'start "" "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222';
    braveCommand = 'start "" "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe" --remote-debugging-port=9222 --guest';
  } else {
    console.error('Unsupported platform for automated browser launch.');
    return false;
  }

  async function tryStartBrowser(command, browserName) {
    try {
      await execAsync(command);
      console.log(`${browserName} started in debug mode on port 9222.`);
      return true;
    } catch (error) {
      console.log(`Failed to start ${browserName}: ${error.message}`);
      return false;
    }
  }

  if (await tryStartBrowser(chromeCommand, 'Chrome')) return true;
  if (await tryStartBrowser(braveCommand, 'Brave')) return true;

  console.error('Failed to start both Chrome and Brave automatically.');
  console.log('Please start Chrome or Brave manually with one of the following commands:');
  console.log('Chrome:', chromeCommand);
  console.log('Brave:', braveCommand);
  console.log('After starting the browser, press Enter to continue...');
  
  await new Promise(resolve => process.stdin.once('data', resolve));
  return true;
}

async function setupSentient() {
  const pythonInstalled = await checkPythonAndPip();
  if (!pythonInstalled) return false;

  const sentinelInstalled = await installSentient();
  if (!sentinelInstalled) return false;

  const apiKeySet = checkApiKey();
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