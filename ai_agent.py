import sys
import json
import anthropic
import openai
from deepseek import DeepSeekAI  # You'll need to import the appropriate DeepSeek library

class AIAgent:
    def __init__(self, api_key, provider):
        self.api_key = api_key
        self.provider = provider
        if provider == 'anthropic':
            self.client = anthropic.Anthropic(api_key=api_key)
        elif provider == 'openai':
            openai.api_key = api_key
        elif provider == 'deepseek':
            self.client = DeepSeekAI(api_key=api_key)  # Adjust this based on DeepSeek's actual API
        else:
            raise ValueError(f"Unsupported AI provider: {provider}")

    def generateUpgradePlan(self, diffContent, appName, appPackage):
        prompt = f"""
        You are an AI assistant specializing in React Native upgrades. Given the following diff content for upgrading from one React Native version to another, generate a step-by-step upgrade plan for the app named {appName} with package {appPackage}.

        Diff content:
        {diffContent}

        Please provide a detailed, step-by-step plan for upgrading the React Native app, including:
        1. Files that need to be modified
        2. Specific changes to be made in each file
        3. Any new files that need to be added
        4. Any files that need to be deleted
        5. Any additional steps or considerations for this upgrade

        Format your response as a structured JSON object that can be easily parsed and applied programmatically.
        """

        if self.provider == 'anthropic':
            response = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=200000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return json.loads(response.content[0].text)
        elif self.provider == 'openai':
            response = openai.ChatCompletion.create(
                model="gpt-4-0613",  # Use "gpt-4-1106-preview" for the latest GPT-4 Turbo
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that specializes in React Native upgrades."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200000
            )
            return json.loads(response.choices[0].message['content'])
        elif self.provider == 'deepseek':
            response = self.client.chat.completions.create(
                model="deepseek-chat",  # Use "DeepSeek-V2.5" if available
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that specializes in React Native upgrades."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200000
            )
            return json.loads(response.choices[0].message['content'])

if __name__ == "__main__":
    if len(sys.argv) != 6:
        print("Usage: python ai_agent.py <api_key> <provider> <diff_content> <app_name> <app_package>")
        sys.exit(1)

    api_key = sys.argv[1]
    provider = sys.argv[2]
    diff_content = sys.argv[3]
    app_name = sys.argv[4]
    app_package = sys.argv[5]

    agent = AIAgent(api_key, provider)
    upgrade_plan = agent.generateUpgradePlan(diff_content, app_name, app_package)
    print(json.dumps(upgrade_plan))