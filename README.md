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

After installation, run the tool using:

```bash
rn-setup
```

You will be prompted to choose the setup options.

### Options

- `-c, --cleanup`: Remove old React Native installations
- `-i, --ios`: Set up iOS development environment
- `-a, --android`: Set up Android development environment
- `-f, --full`: Perform full setup (cleanup, iOS, and Android)
- `-V, --version`: Output the version number
- `-h, --help`: Display help for command

### Examples

1. Perform a full setup:

   ```bash
   rn-setup --full
   ```

2. Clean up old installations and set up iOS environment:

   ```bash
   rn-setup --cleanup --ios
   ```

3. Set up Android environment only:
   ```bash
   rn-setup --android
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
   rn-setup --cleanup
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
