const { handleAndroidOptions } = require('../../android.js');

module.exports = {
  name: 'android',
  description: 'Android-specific tasks',
  run: async toolbox => {
    const { print } = toolbox;
    print.info('Running Android-specific tasks');
    await handleAndroidOptions();
  }
};