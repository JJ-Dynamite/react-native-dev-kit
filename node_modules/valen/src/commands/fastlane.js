const { handleFastlaneOptions } = require('../../fastlane.js');

module.exports = {
  name: 'fastlane',
  description: 'Fastlane-related tasks',
  run: async toolbox => {
    const { print } = toolbox;
    print.info('Running Fastlane tasks');
    await handleFastlaneOptions();
  }
};