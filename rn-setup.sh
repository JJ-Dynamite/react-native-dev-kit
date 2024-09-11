#!/bin/bash

SETUP_SCRIPT="$HOME/react_native_setup.sh"

echo "Creating React Native setup script..."

# Create the script file
cat << 'EOF' > "$SETUP_SCRIPT"
#!/bin/bash

echo "React Native Development Environment Setup"
echo "=========================================="

# Function to install a package using Homebrew
install_package() {
    if brew list $1 &>/dev/null; then
        echo "$1 is already installed"
    else
        echo "Installing $1..."
        brew install $1
    fi
}

# Function to install a cask using Homebrew
install_cask() {
    if brew list --cask $1 &>/dev/null; then
        echo "$1 is already installed"
    else
        echo "Installing $1..."
        brew install --cask $1
    fi
}

# Main menu
while true; do
    echo "\nChoose an option:"
    echo "1. Install/Update Node.js and npm"
    echo "2. Install/Update Yarn"
    echo "3. Install/Update React Native CLI"
    echo "4. Install/Update JDK"
    echo "5. Install/Update Android Studio"
    echo "6. Install/Update Watchman"
    echo "7. Install/Update CocoaPods"
    echo "8. Install/Update Git"
    echo "9. Install/Update Visual Studio Code"
    echo "10. Install/Update React Native Debugger"
    echo "11. Install/Update All"
    echo "0. Exit"
    
    read -p "Enter your choice: " choice

    case $choice in
        1) install_package node ;;
        2) npm install -g yarn ;;
        3) npm install -g react-native-cli ;;
        4) install_cask adoptopenjdk ;;
        5) install_cask android-studio ;;
        6) install_package watchman ;;
        7) sudo gem install cocoapods ;;
        8) install_package git ;;
        9) install_cask visual-studio-code ;;
        10) install_cask react-native-debugger ;;
        11)
            install_package node
            npm install -g yarn
            npm install -g react-native-cli
            install_cask adoptopenjdk
            install_cask android-studio
            install_package watchman
            sudo gem install cocoapods
            install_package git
            install_cask visual-studio-code
            install_cask react-native-debugger
            ;;
        0) exit 0 ;;
        *) echo "Invalid option. Please try again." ;;
    esac
done
EOF

# Make the script executable
chmod +x "$SETUP_SCRIPT"

echo "React Native setup script has been created at $SETUP_SCRIPT"
echo "You can now run it by executing: $SETUP_SCRIPT"