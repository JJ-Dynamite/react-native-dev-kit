const { build } = require('gluegun');
const { mainMenu, cleanupMac, setupIOS, setupAndroid, handleGitOptions, handleAiderOptions, handleFastlaneOptions, renameProject, monitorLogs } = require('../index.js');

async function run(argv) {
  const cli = build()
    .brand('valen')
    .src(__dirname)
    .plugins('./node_modules', { matching: 'valen-*', hidden: true })
    .help()
    .version()
    .create();

  const toolbox = await cli.run(argv);

  // Run the main menu or specific command based on argv
  if (argv.length <= 2) {
    await mainMenu(toolbox);
  } else {
    // Handle specific commands here
    // For example: toolbox.command.run('setup')
  }

  return toolbox;
}

module.exports = { run };