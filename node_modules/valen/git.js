import inquirer from 'inquirer';
import { execSync } from 'child_process';

export async function handleGitOptions() {
  console.log('Managing Git');
  
  try {
    // Check if LazyGit is installed
    execSync('which lazygit', { stdio: 'ignore' });
  } catch (error) {
    console.log('Git Dependency is not installed. Installing now...');
    try {
      execSync('brew install lazygit', { stdio: 'inherit' });
    } catch (installError) {
      console.error('Failed to install Git Dependency:', installError.message);
      return;
    }
  }

  // Run LazyGit
  try {
    execSync('lazygit', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error running Git:', error.message);
  }
}