const { handleAiderOptions } = require('../../aider.js');

module.exports = {
  name: 'ai',
  description: 'Code with AI',
  run: async toolbox => {
    const { print } = toolbox;
    print.info('Starting AI coding session');
    await handleAiderOptions();
  }
};