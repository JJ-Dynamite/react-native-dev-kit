# mdk: React Native Mobile Development Kit

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
   npm install -g mdk
   ```

## Usage

mdk can be used with the following command-line options:

- `-c, --cleanup`: Remove old React Native installations
- `-i, --ios`: Set up iOS development environment
- `-a, --android`: Set up Android development environment
- `-g, --git`: Manage Git
- `-ai, --aider`: Code with AI using Aider
- `-fl, --fastlane`: Run Fastlane tasks
- `-f, --full`: Perform full setup (cleanup, iOS, and Android)
- `-V, --version`: Output the version number
- `-h, --help`: Display help for command

If no options are provided, mdk will show an interactive menu.

## Video Demo

- Android
- [![Video Demo](https://img.youtube.com/vi/RctLdGofZOk/0.jpg)](https://youtu.be/RctLdGofZOk)

- iOS and Cleanup

- [![Video Demo](https://img.youtube.com/vi/uJEM3v3oUZM/0.jpg)](https://youtu.be/uJEM3v3oUZM)

- AI Assistant

- [![AI Assistant](https://img.youtube.com/vi/PCoLMqSlg8A/0.jpg)](https://youtu.be/PCoLMqSlg8A)

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
   mdk --full
   ```

2. Clean up old installations and set up iOS environment:

   ```bash
   mdk --cleanup --ios
   ```

3. Set up Android environment only:
   ```bash
   mdk --android
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

Here are some planned enhancements for future versions of mdk:

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
mdk --cleanup
mdk --ios
mdk --android
mdk --full

# Initialize a new React Native project
mdk init MyNewProject

# Run your React Native app
mdk run-android
mdk run-ios

# Generate components or screens
mdk generate component MyComponent
mdk generate screen MyScreen

# Add dependencies
mdk add redux react-redux
# Rename a project
mdk rename MyNewProject MyOldProject

# Auto migrate
mdk migrate 0.72 0.76

# Open the React Native Code Editor
mdk --open

# Run browser tasks

mdk --browse 'play shape of you on youtube'

```

We're always looking to improve mdk. If you have suggestions for additional features, please open an issue or submit a pull request!

## Tutorial

...

to do (`fastlane`)
- Compile and sign Android/iOS apps with custom native code (`mdk --build`)
- Upload your app to the Play Store or App Store with a single command. (`mdk --auto-submit`)
- Seamlessly deliver live app updates, critical bug fixes, content changes, beta features, and more to give your users the best experience possible.
 (`mdk --publish -b production -v 1.0.1`)
