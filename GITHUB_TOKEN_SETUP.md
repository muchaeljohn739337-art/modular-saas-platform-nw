# GitHub Personal Access Token Setup

## 🔑 Create GitHub Token (2 minutes)

### Step 1: Go to GitHub Token Settings
Visit: https://github.com/settings/tokens/new

Or navigate manually:
1. Click your profile picture (top right)
2. Settings
3. Developer settings (bottom left)
4. Personal access tokens → Tokens (classic)
5. Generate new token → Generate new token (classic)

### Step 2: Configure Token

**Note/Description:** `Advancia PayLedger - Git Push Access`

**Expiration:** Choose your preference (90 days recommended)

**Select scopes:**
- ✅ `repo` (Full control of private repositories)
  - This includes all sub-scopes

**Click "Generate token"** at the bottom

### Step 3: Copy Your Token

⚠️ **IMPORTANT:** Copy the token NOW - you won't see it again!

Token format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 💻 Configure Git to Use Token

### Option 1: Use Token Directly in Push Command

```bash
git push https://ghp_YOUR_TOKEN_HERE@github.com/muchaeljohn739337-art/advanciapayledger-new.git master
```

Replace `ghp_YOUR_TOKEN_HERE` with your actual token.

### Option 2: Configure Git Credential Manager (Recommended)

```bash
# Set remote URL with token
git remote set-url origin https://ghp_YOUR_TOKEN_HERE@github.com/muchaeljohn739337-art/advanciapayledger-new.git

# Now you can push normally
git push origin master
```

### Option 3: Use Git Credential Manager

Windows will prompt you for credentials. When it does:
- **Username:** `muchaeljohn739337-art`
- **Password:** Paste your token (not your GitHub password!)

---

## 🚀 Push Your Changes

After setting up the token:

```bash
git push origin master
```

---

## 🔒 Security Best Practices

1. **Never commit tokens** to your repository
2. **Store token securely** (password manager)
3. **Set expiration** (90 days recommended)
4. **Regenerate if exposed** immediately
5. **Use minimal scopes** needed

---

## 🆘 Troubleshooting

### "Authentication failed"
- Verify token is correct
- Check token hasn't expired
- Ensure `repo` scope is selected

### "remote: Permission denied"
- Verify you have write access to the repository
- Check you're using the correct repository URL

### "Support for password authentication was removed"
- You must use a token, not your GitHub password
- Create a new token if you don't have one

---

## 📝 Quick Reference

**Your Repository:** https://github.com/muchaeljohn739337-art/advanciapayledger-new

**Branch:** master

**Command to push:**
```bash
git push origin master
```

---

**Need help?** Let me know if you encounter any issues!
