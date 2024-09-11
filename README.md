# RN-MDK: React Native Mobile Development Kit

Streamline your React Native development environment setup with this powerful automation tool.

## Features

- Automated setup for macOS, iOS, and Android development environments
- Cleanup utility for removing old React Native installations
- Customizable configuration options
- Easy-to-use command-line interface

## Prerequisites

- Node.js 14+
- macOS 10.15+
- Homebrew
- Xcode (for iOS development)
- Android Studio (for Android development)

## Installation

1. Install Homebrew (if not already installed):

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

   Follow the instructions in the terminal to complete the Homebrew installation.

2. Install the CLI tool globally using npm:

   ```bash
   npm install -g rn-mdk
   ```

## Usage

After installation, you can use rn-mdk for various tasks in your React Native development workflow:

```bash
➜ rn-mdk                    
Welcome to RN-MDK: React Native Mobile Development Kit
? What would you like to do?
❯ Android
  iOS
  Cleanup Mac Cache
  Full Setup
  Setup React Native
  Setup iOS Environment
  Setup Android Environment
(Use arrow keys to reveal more choices) 
```

### Options(future flags)

- `-c, --cleanup`: Remove old React Native installations
- `-i, --ios`: Set up iOS development environment
- `-a, --android`: Set up Android development environment
- `-f, --full`: Perform full setup (cleanup, iOS, and Android)
- `-V, --version`: Output the version number
- `-h, --help`: Display help for command

### Examples

1. Perform a full setup:

   ```bash
   rn-mkd --full
   ```

2. Clean up old installations and set up iOS environment:

   ```bash
   rn-mkd --cleanup --ios
   ```

3. Set up Android environment only:
   ```bash
   rn-mkd --android
   ```

## Help

To view all available options and commands, use the help flag:

This will display a list of all available options and their descriptions.

## Troubleshooting

If you encounter any issues during the setup process, try the following:

1. Ensure Homebrew is installed and up to date:

   ```bash
   brew --version
   brew update
   ```

2. Ensure you have the latest version of the CLI tool installed:

   ```bash
   npm update -g rn-md
   ```

3. Check that your system meets all the prerequisites listed above.

4. Run the cleanup option before attempting a full setup:

   ```bash
   rn-mkd --cleanup
   ```

5. If problems persist, please open an issue on our GitHub repository with detailed information about the error and your system configuration.

## Contributing

We welcome contributions to improve the React Native Setup Automation tool. Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them with a clear commit message
4. Push your changes to your fork
5. Submit a pull request to the main repository

Please ensure your code adheres to our coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

If you need help or have any questions, please open an issue on our GitHub repository or contact our support team at cto@val-x.com

## Acknowledgements

We would like to thank the React Native community and all the contributors who have helped make this tool possible.

## Recent Updates

- Added Homebrew as a prerequisite and installation instructions
- Updated troubleshooting section with Homebrew-related checks
- Improved error handling for missing dependencies

## Setup

To set up the project, run the following commands:

## Future Features

Here are some planned enhancements for future versions of rn-mdk:

1. Automated dependency management: Intelligent updating and conflict resolution for project dependencies.
2. Custom template support: Allow users to create and use their own project templates.
3. Plugin system: Extend functionality through community-created plugins.
4. Cross-platform code sharing: Improved tools for sharing code between iOS and Android.
5. Performance optimization tools: Built-in profiling and suggestions for app performance improvements.
6. Integrated testing framework: Streamlined setup and execution of unit and integration tests.
7. CI/CD pipeline templates: Ready-to-use configurations for popular CI/CD platforms.
8. Hot module replacement enhancements: Faster and more reliable HMR during development.
9. Native module integration wizard: Simplified process for adding and configuring native modules.
10. App store submission helper: Automate parts of the app store submission process.

## Future Usage
 ```bash
 rn-mdk --cleanup
 rn-mdk --ios
 rn-mdk --android
 rn-mdk --full

# Initialize a new React Native project
rn-mdk init MyNewProject

# Run your React Native app
rn-mdk run-android
rn-mdk run-ios

# Generate components or screens
rn-mdk generate component MyComponent
rn-mdk generate screen MyScreen

# Add dependencies
rn-mdk add redux react-redux
# Rename a project
rn-mdk rename MyNewProject MyOldProject

# Auto migrate
rn-mdk migrate 0.72 0.76
 ```

We're always looking to improve rn-mdk. If you have suggestions for additional features, please open an issue or submit a pull request!

## Tutorial

Check out our tutorial video to get started:

<video width="640" height="360" controls>
  <source src="assets/tutorial.mov" type="video/quicktime">
  Your browser does not support the video tag.
</video>

If the video doesn't play, you can [download the tutorial video here](assets/tutorial.mov).
