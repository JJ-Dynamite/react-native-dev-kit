const { renameProject } = require('../../index.js');

module.exports = {
  name: 'rename',
  description: 'Rename the React Native project',
  run: async toolbox => {
    const { print } = toolbox;
    print.info('Renaming project');
    await renameProject();
  }
};