module.exports = {
  name: 'ai',
  description: 'Code with AI',
  alias: ['A'],
  run: async (toolbox) => {
    const { handleAiderOptions } = require('../../aider.js');
    await handleAiderOptions();
  }
};