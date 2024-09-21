const { execSync } = require('child_process');

async function ensurePackagesInstalled() {
  const packages = ['axios', 'anthropic', 'openai', 'gluegun', 'ejs'];

  for (const pkg of packages) {
    try {
      await execSync(`bun pm ls -g ${pkg}`, { stdio: 'ignore' });
      console.log(`${pkg} is already installed globally.`);
    } catch (error) {
      console.log(`Installing ${pkg} globally...`);
      try {
        await execSync(`bun add -g ${pkg}`, { stdio: 'inherit' });
        console.log(`${pkg} installed globally successfully.`);
      } catch (installError) {
        console.error(`Failed to install ${pkg} globally:`, installError.message);
        console.log(`Attempting to install ${pkg} locally...`);
        await execSync(`bun add ${pkg}`, { stdio: 'inherit' });
        console.log(`${pkg} installed locally successfully.`);
      }
    }
  }
}

module.exports = {
  ensurePackagesInstalled
};