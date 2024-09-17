const { handleIosOptions } = require('../../ios.js');

module.exports = {
  name: '--ios',
  description: 'iOS-specific tasks',
  run: async toolbox => {
    const { print } = toolbox;
    print.info('Running iOS-specific tasks');
    await handleIosOptions();
  }
};