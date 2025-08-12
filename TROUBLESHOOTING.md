# LM Studio Connection Troubleshooting Guide

## Simplified Connection ✅

The app now uses the default LM Studio SDK connection - no configuration required!

### Key Features:
- **Automatic Connection** - Connects to the default LM Studio server
- **Clear Error Messages** - Helpful instructions if connection fails
- **Simple Setup** - No baseUrl or configuration needed

## Quick Setup Checklist

### ✅ LM Studio Server Setup
1. **Open LM Studio**
2. **Go to Local Server tab** (on the left sidebar)
3. **Start Server** - Click the "Start Server" button
4. **Verify server is running** at `http://127.0.0.1:1234`
5. **Load the model** - Select and load `google/gemma-3n-e4b`

### ✅ App Configuration
1. The app automatically connects to the default LM Studio server
2. Connection status shows in the top bar (green = connected, red = disconnected)
3. Clear error messages if connection fails
4. Click "Reconnect" button to retry connection

## Common Issues and Solutions

### Issue 1: "ECONNREFUSED" Error
**Solution:**
- Ensure LM Studio is running
- Check that the local server is started in LM Studio
- Verify the server is on port 1234

### Issue 2: "Model not found" Error
**Solution:**
- Open LM Studio
- Go to the Models tab
- Search for and download `google/gemma-3n-e4b`
- Load the model before starting the chat

### Issue 3: Connection Times Out
**Solution:**
- Check firewall settings
- Ensure no other application is using port 1234
- Try restarting LM Studio

### Issue 4: Custom Server Port
**Solution:**
Create a `.env` file in the project root:
```env
VITE_LMSTUDIO_URL=http://127.0.0.1:YOUR_PORT
```

## Testing the Connection

1. **Start LM Studio** with the server enabled
2. **Load the model** `google/gemma-3n-e4b`
3. **Run the app**: `pnpm tauri dev`
4. **Check the connection indicator** - should show green "Connected to 127.0.0.1:1234"
5. **Try sending a message** - should receive a streaming response

## Console Debugging

Open the browser developer console (F12) to see detailed connection logs:
- Connection attempts
- Success/failure messages
- Detailed error information

## Need More Help?

If you're still experiencing issues:
1. Check the console for detailed error messages
2. Verify LM Studio is properly configured
3. Ensure the model is loaded and ready
4. Try the manual connection test using curl:
   ```bash
   curl http://127.0.0.1:1234/v1/models
   ```
   This should return a list of available models if the server is running correctly.