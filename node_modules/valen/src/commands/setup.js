const { setupReactNative } = require('../../reactNativeSetup.js');
const { cleanupMac } = require('../../macCleanup.js');
const { setupIOS } = require('../../ios.js');
const { setupAndroid } = require('../../android.js');

module.exports = {
  name: 'setup',
  description: 'Setup React Native environment',
  run: async toolbox => {
    const { print, prompt } = toolbox;
    
    const { action } = await prompt.ask({
      type: 'select',
      name: 'action',
      message: 'What would you like to set up?',
      choices: ['Full Setup', 'React Native', 'iOS Environment', 'Android Environment', 'Cleanup Mac Cache']
    });

    switch (action) {
      case 'Full Setup':
        await cleanupMac();
        await setupReactNative();
        await setupIOS();
        await setupAndroid();
        break;
      case 'React Native':
        await setupReactNative();
        break;
      case 'iOS Environment':
        await setupIOS();
        break;
      case 'Android Environment':
        await setupAndroid();
        break;
      case 'Cleanup Mac Cache':
        await cleanupMac();
        break;
    }
  }
};