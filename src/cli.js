const { build } = require('gluegun');

async function run(argv) {
  const cli = build()
    .brand('valen')
    .src(__dirname)
    .plugins('./node_modules', { matching: 'valen-*', hidden: true })
    .help()
    .version()
    .create();

  const toolbox = await cli.run(argv);

  // If no command was run, show the main menu
  if (!toolbox.command) {
    const { mainMenu } = require('../index.js');
    await mainMenu();
  }

  return toolbox;
}

module.exports = { run };