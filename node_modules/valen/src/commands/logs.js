const { monitorLogs } = require('../../index.js');

module.exports = {
  name: 'logs',
  description: 'Monitor logs',
  run: async toolbox => {
    const { print } = toolbox;
    print.info('Monitoring logs');
    await monitorLogs();
  }
};