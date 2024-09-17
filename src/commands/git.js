const { handleGitOptions } = require('../../git.js');

module.exports = {
  name: 'git',
  description: 'Git-related tasks',
  run: async toolbox => {
    const { print } = toolbox;
    print.info('Running Git tasks');
    await handleGitOptions();
  }
};