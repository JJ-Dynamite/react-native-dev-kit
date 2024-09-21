import sys
import json
import anthropic
from openai import OpenAI
import time

class DeepSeekAI:
    def __init__(self, api_key):
        self.api_key = api_key
        # Initialize DeepSeek client here
        # For now, we'll use a placeholder
        print("DeepSeek API initialized")

    def generate_response(self, prompt):
        # This is a placeholder implementation
        # Replace this with actual DeepSeek API call when implemented
        print("DeepSeek generate_response called with prompt:", prompt)
        return json.dumps({"response": "This is a placeholder response from DeepSeek"})

class AIAgent:
    def __init__(self, api_key, provider):
        self.api_key = api_key
        self.provider = provider
        if provider == 'anthropic':
            self.client = anthropic.Anthropic(api_key=api_key)
        elif provider == 'openai':
            self.client = OpenAI(api_key=api_key)
        elif provider == 'deepseek':
            self.client = DeepSeekAI(api_key=api_key)
        else:
            raise ValueError(f"Unsupported AI provider: {provider}")

    def generateUpgradePlan(self, diffContent, appName, appPackage):
        chunks = self.splitDiffContent(diffContent)
        upgradePlan = {"steps": []}

        for i, chunk in enumerate(chunks):
            prompt = f"""
            You are an AI assistant specializing in React Native upgrades. Given the following diff content (part {i+1} of {len(chunks)}) for upgrading from one React Native version to another, generate a step-by-step upgrade plan for the app named {appName} with package {appPackage}.

            Diff content:
            {chunk}

            Please provide a detailed, step-by-step plan for upgrading the React Native app, including:
            1. Files that need to be modified
            2. Specific changes to be made in each file
            3. Any new files that need to be added
            4. Any files that need to be deleted
            5. Any additional steps or considerations for this upgrade

            Format your response as a structured JSON object that can be easily parsed and applied programmatically.
            """

            try:
                if self.provider == 'anthropic':
                    response = self.client.messages.create(
                        model="claude-3-sonnet-20240229",
                        max_tokens=4000,
                        messages=[
                            {"role": "user", "content": prompt}
                        ]
                    )
                    chunk_plan = self.parse_anthropic_response(response)
                elif self.provider == 'openai':
                    response = self.client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": "You are a helpful assistant that specializes in React Native upgrades."},
                            {"role": "user", "content": prompt}
                        ],
                        max_tokens=4000
                    )
                    chunk_plan = self.parse_openai_response(response)
                elif self.provider == 'deepseek':
                    # Placeholder for DeepSeek API call
                    # Replace this with actual DeepSeek API call when implemented
                    response = self.client.generate_response(prompt)
                    chunk_plan = self.parse_deepseek_response(response)
                
                if chunk_plan and 'steps' in chunk_plan:
                    upgradePlan["steps"].extend(chunk_plan["steps"])
                else:
                    print(f"Warning: Unexpected response format for chunk {i+1}")
                
                # Add a delay between requests to avoid rate limiting
                time.sleep(2)
            
            except Exception as e:
                error_message = str(e)
                print(f"Error processing chunk {i+1}: {error_message}")
                if 'rate limit' in error_message.lower() or 'quota exceeded' in error_message.lower():
                    raise Exception(f"RateLimitError: {error_message}")
                # Continue with the next chunk instead of raising an exception
                continue

        return upgradePlan

    def splitDiffContent(self, diffContent, max_chunk_size=4000):
        lines = diffContent.split('\n')
        chunks = []
        current_chunk = []
        current_size = 0

        for line in lines:
            if current_size + len(line) > max_chunk_size and current_chunk:
                chunks.append('\n'.join(current_chunk))
                current_chunk = []
                current_size = 0
            current_chunk.append(line)
            current_size += len(line) + 1  # +1 for newline

        if current_chunk:
            chunks.append('\n'.join(current_chunk))

        return chunks

    def parse_anthropic_response(self, response):
        try:
            return json.loads(response.content[0].text)
        except json.JSONDecodeError:
            print("Warning: Unable to parse Anthropic response as JSON")
            return None

    def parse_openai_response(self, response):
        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            print("Warning: Unable to parse OpenAI response as JSON")
            return None

    def parse_deepseek_response(self, response):
        try:
            # Placeholder for DeepSeek response parsing
            # Adjust this based on the actual response format from DeepSeek
            return json.loads(response)
        except json.JSONDecodeError:
            print("Warning: Unable to parse DeepSeek response as JSON")
            return None

if __name__ == "__main__":
    if len(sys.argv) != 6:
        print(json.dumps({"error": "Invalid number of arguments"}))
        sys.exit(1)

    api_key = sys.argv[1]
    provider = sys.argv[2]
    diff_content = sys.argv[3]
    app_name = sys.argv[4]
    app_package = sys.argv[5]

    try:
        agent = AIAgent(api_key, provider)
        upgrade_plan = agent.generateUpgradePlan(diff_content, app_name, app_package)
        print(json.dumps(upgrade_plan))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)