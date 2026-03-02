# 🔔 Slack Webhook Setup for "Demo App"

## 📊 Your Slack App Configuration

```json
{
    "display_information": {
        "name": "Demo App"
    },
    "settings": {
        "org_deploy_enabled": false,
        "socket_mode_enabled": false,
        "is_hosted": false,
        "token_rotation_enabled": false
    }
}
```

**App Name:** Demo App  
**Status:** Configured but needs webhook

---

## 🎯 Next Step: Create Incoming Webhook

Your Slack app is set up, but you need to enable **Incoming Webhooks** to send notifications from Ava.

### **Step-by-Step Instructions:**

#### **1. Go to Your App Settings**
- Visit: https://api.slack.com/apps
- Click on "Demo App"

#### **2. Enable Incoming Webhooks**
- In the left sidebar, click **"Incoming Webhooks"**
- Toggle **"Activate Incoming Webhooks"** to **ON**

#### **3. Add Webhook to Workspace**
- Scroll down and click **"Add New Webhook to Workspace"**
- Select a channel where you want notifications:
  - Recommended: Create `#support-tickets` channel
  - Or use existing channel like `#general`
- Click **"Allow"**

#### **4. Copy Webhook URL**
After authorization, you'll see a webhook URL like:
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Copy this entire URL!**

#### **5. Add to `.env` File**
Open `backend/.env` and update:
```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"
```

#### **6. Restart Backend**
```bash
cd backend
npm run dev
```

#### **7. Test Integration**
```bash
curl -X POST http://localhost:3001/api/ava/ticket ^
  -H "Content-Type: application/json" ^
  -d "{\"customerName\": \"Test User\", \"email\": \"test@example.com\", \"issueType\": \"General\", \"priority\": \"Medium\", \"message\": \"Test notification from Ava\"}"
```

**Check your Slack channel - you should see a notification!**

---

## 🎨 What the Notification Will Look Like

```
🎫 New Support Ticket: AVA-1738396800000-ABC123

Customer: Test User
Email: test@example.com
Issue Type: General
Priority: Medium
Status: Open
AI Handled: No

Latest Message:
Test notification from Ava
```

---

## 🔧 Troubleshooting

### **"Incoming Webhooks" option not visible:**
- Make sure you're logged into the correct Slack workspace
- Verify you have admin permissions for the app

### **Webhook URL not working:**
- Check if URL is complete (starts with `https://hooks.slack.com/services/`)
- Verify channel still exists
- Try creating a new webhook

### **No notification in Slack:**
- Check if backend restarted after adding webhook URL
- Verify `.env` file has correct webhook URL
- Check backend logs for errors

---

## 📋 Current Integration Status

| Component | Status | Action Needed |
|-----------|--------|---------------|
| **Slack App** | ✅ Created | "Demo App" configured |
| **Incoming Webhooks** | ⚠️ Pending | Enable in app settings |
| **Webhook URL** | ❌ Missing | Copy after enabling webhooks |
| **Backend Config** | ⚠️ Ready | Add webhook URL to `.env` |
| **Notion API** | ✅ Configured | Ready to use |
| **Notion Database** | ⚠️ Pending | Create database and add ID |

---

## 🚀 Quick Checklist

- [ ] Go to https://api.slack.com/apps
- [ ] Select "Demo App"
- [ ] Enable "Incoming Webhooks"
- [ ] Add webhook to workspace
- [ ] Select channel (e.g., #support-tickets)
- [ ] Copy webhook URL
- [ ] Add to `backend/.env`
- [ ] Restart backend
- [ ] Test with curl command
- [ ] Verify notification in Slack

---

## 💡 Alternative: Use Slack Bot Token

If you prefer using the OAuth tokens you already have instead of webhooks:

### **Required:**
```bash
SLACK_BOT_TOKEN="xoxb-..."  # Need to get this from OAuth & Permissions
SLACK_REFRESH_TOKEN="xoxe-1-..."  # Already have this
```

### **Setup:**
1. Go to "OAuth & Permissions" in your app
2. Add bot token scopes: `chat:write`, `chat:write.public`
3. Reinstall app to workspace
4. Copy "Bot User OAuth Token"
5. Update Ava service to use Slack Web API

**Note:** Webhook is simpler and recommended for Ava's use case.

---

## 📚 Resources

- **Your Slack Apps:** https://api.slack.com/apps
- **Incoming Webhooks Guide:** https://api.slack.com/messaging/webhooks
- **Slack API Docs:** https://api.slack.com/

---

**Enable Incoming Webhooks in your "Demo App" to complete Slack integration!** 🔔✨
