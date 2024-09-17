import asyncio
import sys
import subprocess
import platform
import requests
import time
from sentient import sentient
import traceback
import pkg_resources

async def check_browser_running():
    system = platform.system()
    if system == "Darwin":  # macOS
        cmd = "pgrep -f 'Google Chrome|Brave Browser|Brave Browser Beta'"
    elif system == "Linux":
        cmd = "pgrep -f 'chrome|brave|brave-browser-beta'"
    elif system == "Windows":
        cmd = "tasklist | findstr /I \"chrome.exe brave.exe\""
    else:
        print(f"Unsupported operating system: {system}")
        return False

    try:
        output = subprocess.check_output(cmd, shell=True).decode('utf-8')
        return bool(output.strip())
    except subprocess.CalledProcessError:
        return False

async def check_browser_debugging_port():
    max_retries = 10
    for attempt in range(max_retries):
        try:
            response = requests.get("http://localhost:9222/json/version", timeout=5)
            if response.status_code == 200:
                return True
        except requests.RequestException:
            print(f"Waiting for debugging port to open... (attempt {attempt + 1})")
            pass
        time.sleep(2)  # Wait for 2 seconds before retrying
    return False

async def run_sentient(goal):
    try:
        browser_running = await check_browser_running()
        debugging_port_open = await check_browser_debugging_port()

        if not browser_running or not debugging_port_open:
            print("Error: Browser is not running or debugging port is not open.")
            print("Please ensure Chrome, Brave, or Brave Beta is running with remote debugging enabled on port 9222.")
            return

        print("Attempting to connect to browser...")
        
        try:
            sentient_version = pkg_resources.get_distribution("sentient").version
            print(f"Sentient version: {sentient_version}")
        except pkg_resources.DistributionNotFound:
            print("Sentient version: Unable to determine")
        print(f"Goal: {goal}")

        try:
            print(f"Executing goal: {goal}")
            result = await sentient.invoke(goal=goal)
            print(f"Execution result: {result}")
            
            # Add more detailed logging
            print("Current URL:", await sentient.get_current_url())
            print("Page Title:", await sentient.get_page_title())
            
        except Exception as e:
            print(f"Error executing the command: {str(e)}")
            print("\nFull traceback:")
            traceback.print_exc()
            print("\nDetailed error information:")
            print(f"Error type: {type(e).__name__}")
            print(f"Error message: {str(e)}")
            if hasattr(e, 'args'):
                print(f"Error arguments: {e.args}")
            
            # Add more error context
            print("Current URL:", await sentient.get_current_url())
            print("Page Title:", await sentient.get_page_title())
            print("Page Source:", await sentient.get_page_source())

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        print("\nFull traceback:")
        traceback.print_exc()
        # ... (rest of the error handling)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        goal = " ".join(sys.argv[1:])
        asyncio.run(run_sentient(goal))
    else:
        print("Please provide a goal for Sentient.")