module.exports = {
  name: 'browse',
  description: 'Automated Browsing',
  alias: ['b'],
  run: async (toolbox) => {
    const { handleAutomatedBrowsing } = require('../../index.js');
    const { parameters } = toolbox;
    const query = parameters.first;
    
    if (!query) {
      console.log('Please provide a query for automated browsing.');
      return;
    }
    
    await handleAutomatedBrowsing(query);
  }
};