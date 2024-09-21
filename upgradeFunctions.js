const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function alignDeps(targetVersion, options = {}) {
  const {
    write = false,
    verbose = false,
    presets = [],
    excludePackages = [],
    loose = false,
    diffMode = 'strict',
  } = options;

  // Extract major and minor version
  const [major, minor] = targetVersion.split('.');
  let command = 'npx @rnx-kit/align-deps@latest';

  command += ` --requirements react-native@${major}.${minor}`;

  if (write) {
    command += ' --write';
  }

  if (verbose) {
    command += ' --verbose';
  }

  if (presets.length > 0) {
    command += ` --presets ${presets.join(',')}`;
  }

  if (excludePackages.length > 0) {
    command += ` --exclude-packages ${excludePackages.join(',')}`;
  }

  if (loose) {
    command += ' --loose';
  }

  if (diffMode !== 'strict') {
    command += ` --diff-mode ${diffMode}`;
  }

  try {
    console.log('Running align-deps...');
    const output = execSync(command, { encoding: 'utf-8' });
    console.log(output);

    if (write) {
      console.log('Dependencies have been aligned and written to package.json');
    } else {
      console.log('Alignment check completed. Run with --write to apply changes.');
    }

    return true;
  } catch (error) {
    console.error('Error running align-deps:', error.message);
    if (error.stdout) console.log('align-deps output:', error.stdout);
    if (error.stderr) console.error('align-deps error output:', error.stderr);

    // Check if the error is due to an unsupported React Native version
    if (error.stderr && error.stderr.includes('No profiles could satisfy requirements')) {
      console.log(`\nIt seems that React Native version ${major}.${minor} is not supported by align-deps.`);
      console.log('You may need to upgrade to a newer version of @rnx-kit/align-deps or use a different React Native version.');
      console.log('Proceeding with the upgrade without running align-deps.');
      
      // Attempt to manually update known problematic dependencies
    //   try {
    //     const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
    //     // Update problematic dependencies
    //     if (packageJson.dependencies) {
    //       if (packageJson.dependencies['@react-native-community/eslint-config']) {
    //         delete packageJson.dependencies['@react-native-community/eslint-config'];
    //         packageJson.dependencies['@react-native/eslint-config'] = '*';
    //       }
    //       if (packageJson.dependencies['@types/react-native']) {
    //         delete packageJson.dependencies['@types/react-native'];
    //       }
    //       if (packageJson.dependencies['metro-react-native-babel-preset']) {
    //         delete packageJson.dependencies['metro-react-native-babel-preset'];
    //         packageJson.dependencies['@react-native/babel-preset'] = '*';
    //       }
    //     }
        
    //     // Write updated package.json
    //     fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    //     console.log('Manually updated problematic dependencies in package.json');
    //   } catch (updateError) {
    //     console.error('Error updating package.json:', updateError.message);
    //   }
      
      return true; // Return true to continue with the upgrade process
    }

    return false;
  }
}

module.exports = {
  alignDeps,
};