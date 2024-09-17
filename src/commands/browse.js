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
    
    const setupSentient = require('../../sentientSetup');
    
    async function browse(query) {
      console.log(`Initiating automated browsing for: ${query}`);

      try {
        const sentientSetupSuccess = await setupSentient();
        if (!sentientSetupSuccess) {
          console.log("Sentient setup failed. Please check your OpenAI API key and try again.");
          return;
        }

        // ... rest of the browsing logic ...
      } catch (error) {
        console.error("Error during browsing:", error);
      }
    }
    
    await browse(query);
  }
};