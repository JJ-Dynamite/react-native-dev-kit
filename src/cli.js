const { build } = require('gluegun');
const { mainMenu, cleanupMac, setupIOS, setupAndroid, handleGitOptions, handleAiderOptions, handleFastlaneOptions, renameProject, monitorLogs } = require('../index.js');

async function run(argv) {
  const cli = build()
    .brand('rn-mdk')
    .src(__dirname)
    .plugins('./node_modules', { matching: 'rn-mdk-*', hidden: true })
    .help()
    .version()
    .defaultCommand({
      run: async toolbox => {
        const { parameters, print } = toolbox;
        
        if (parameters.options.c || parameters.options.cleanup) {
          await cleanupMac();
        } else if (parameters.options.i || parameters.options.ios) {
          await setupIOS();
        } else if (parameters.options.a || parameters.options.android) {
          await setupAndroid();
        } else if (parameters.options.g || parameters.options.git) {
          await handleGitOptions();
        } else if (parameters.options.A || parameters.options.aider) {
          await handleAiderOptions();
        } else if (parameters.options.F || parameters.options.fastlane) {
          await handleFastlaneOptions();
        } else if (parameters.options.f || parameters.options.full) {
          await cleanupMac();
          await setupIOS();
          await setupAndroid();
        } else if (parameters.options.r || parameters.options.rename) {
          await renameProject();
        } else if (parameters.options.l || parameters.options.logs) {
          await monitorLogs();
        } else {
          print.info('Welcome to RN-MDK: React Native Mobile Development Kit 🚀 a complete automation kit for React Native');
          await mainMenu();
        }
      },
      description: 'RN-MDK: React Native Mobile Development Kit',
      name: 'default',
      alias: ['mdk'],
    })
    .create();

  const toolbox = await cli.run(argv);
  return toolbox;
}

module.exports = { run };