// If you have any shared functionality, import it here
// const { sharedFunction } = require('../../shared.js');

module.exports = {
  name: 'shared',
  description: 'Shared tasks',
  run: async toolbox => {
    const { print } = toolbox;
    print.info('Running shared tasks');
    // Add your shared functionality here
    // await sharedFunction();
  }
};