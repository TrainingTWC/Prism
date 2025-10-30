# TestSprite MCP Setup Guide

## Overview
The TestSprite MCP (Model Context Protocol) server has been configured in this workspace to provide AI testing capabilities through VS Code's Copilot Chat.

## Configuration
The MCP server is configured in `.vscode/settings.json`:

```json
{
  "mcpServers": {
    "TestSprite": {
      "command": "npx",
      "args": [
        "@testsprite/testsprite-mcp@latest"
      ],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

## Setup Steps

### 1. Get your TestSprite API Key
- Visit the TestSprite website or documentation
- Sign up/log in to get your API key
- Copy the API key for the next step

### 2. Configure the API Key
Replace `"your-api-key"` in `.vscode/settings.json` with your actual API key:

```json
"env": {
  "API_KEY": "ts_your_actual_api_key_here"
}
```

### 3. Reload VS Code
- Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
- Run "Developer: Reload Window" to apply the MCP configuration

### 4. Verify Setup
Open Copilot Chat and try:
- "List available MCP tools"
- "Use TestSprite to [your testing task]"

## Usage
Once configured, you can use TestSprite through Copilot Chat for:
- Automated testing workflows
- Test case generation
- Bug reproduction scripts
- Performance testing scenarios

## Troubleshooting

### MCP Server Not Found
- Ensure you have Node.js installed
- The `npx` command will automatically download the latest TestSprite MCP package
- Check that your API key is correctly formatted

### Permission Issues
- Make sure your API key has the necessary permissions
- Check TestSprite's documentation for required scopes

### Connection Problems
- Restart VS Code completely
- Check your internet connection (npx needs to download the package)
- Verify the API key is valid

## Security Note
⚠️ **Never commit your actual API key to version control!**

Consider using environment variables or VS Code's secure storage for production setups.