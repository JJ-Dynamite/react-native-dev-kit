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
  let chromeCommand, braveCommand, braveBetaCommand;

  if (platform === 'darwin') {
    chromeCommand = 'open -a "Google Chrome" --args --remote-debugging-port=9222';
    braveCommand = 'open -a "Brave Browser" --args --remote-debugging-port=9222';
    braveBetaCommand = 'open -a "Brave Browser Beta" --args --remote-debugging-port=9222';
  } else if (platform === 'linux') {
    chromeCommand = 'google-chrome --remote-debugging-port=9222';
    braveCommand = 'brave-browser --remote-debugging-port=9222';
    braveBetaCommand = 'brave-browser-beta --remote-debugging-port=9222';
  } else if (platform === 'win32') {
    chromeCommand = 'start "" "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222';
    braveCommand = 'start "" "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe" --remote-debugging-port=9222 --guest';
    braveBetaCommand = 'start "" "C:\\Program Files\\BraveSoftware\\Brave-Browser-Beta\\Application\\brave.exe" --remote-debugging-port=9222 --guest';
  } else {
    console.error('Unsupported platform for automated browser launch.');
    return false;
  }

  async function checkDebugPort(attempts = 10, delay = 2000) {
    for (let i = 1; i <= attempts; i++) {
      console.log(`Checking debugging port (attempt ${i})...`);
      try {
        await execAsync('curl -s http://localhost:9222/json/version');
        console.log('Browser detected with remote debugging enabled.');
        return true;
      } catch (error) {
        if (i < attempts) {
          console.log(`Waiting for debugging port to open... (attempt ${i})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    return false;
  }

  console.log('Please start Chrome, Brave, or Brave Beta manually with remote debugging enabled:');
  console.log('1. Close all instances of the browser you want to use.');
  console.log('2. Open a terminal/command prompt and run one of the following commands:');
  console.log('   Chrome:', chromeCommand);
  console.log('   Brave:', braveCommand);
  console.log('   Brave Beta:', braveBetaCommand);
  console.log('3. Alternatively, you can start the browser normally and then:');
  console.log('   - For Chrome: Go to chrome://inspect and click "Open dedicated DevTools for Node"');
  console.log('   - For Brave/Brave Beta: Go to brave://inspect and click "Open dedicated DevTools for Node"');
  console.log('4. After starting the browser with remote debugging, press Enter to continue...');
  
  await new Promise(resolve => process.stdin.once('data', resolve));
  
  if (await checkDebugPort(15, 3000)) {
    return true;
  } else {
    console.error('Browser is not running or debugging port is not open.');
    console.log('Please ensure the browser is running with remote debugging enabled on port 9222.');
    console.log('You may need to check your firewall settings or antivirus software.');
    return false;
  }
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