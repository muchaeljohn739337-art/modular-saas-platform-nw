# **Advancia CLI Tool**

## Installation

```bash
npm install -g @advancia/sdk
```

## Environment Setup

```bash
# Set environment variables
export ADVANCIA_ACCESS_TOKEN="your_jwt_token_here"
export ADVANCIA_TENANT_ID="your_tenant_id"
```

## Usage

### Authentication
```bash
adv login admin@company.com
adv login user@company.com
adv logout
```

### Tenant Management
```bash
adv tenants
adv tenants list
adv tenants create --name "New Tenant" --plan "enterprise"
adv tenants upgrade --tenant-id "tenant-123" --plan "professional"
adv tenants suspend --tenant-id "tenant-456"
adv tenants activate --tenant-id "tenant-789"
```

### Billing Operations
```bash
adv billing subscribe --tenant-id "tenant-123" --plan "professional"
adv billing invoices --tenant-id "tenant-123"
adv billing stats --tenant-id "tenant-123"
```

### AI Operations
```bash
adv ai list
adv ai run fraud-detection --tenant-id "tenant-123"
adv ai run data_analysis --tenant-id "tenant-123"
adv ai run customer_support --tenant-id "tenant-123"
```

### Web3 Operations
```bash
adv web3 wallets
adv web3 transactions --tenant-id "tenant-123"
adv web3 contracts
adv web3 events --tenant-id "tenant-123"
```

### Monitoring & Security
```bash
adv monitoring metrics --service "api-gateway"
adv monitoring health
adv security health
adv security incidents
adv audit logs
```

### Data Export
```bash
adv audit logs export --tenant-id "tenant-123" --format "csv"
adv compliance reports --type "SOX"
adv billing export --tenant-id "tenant-123"
```

---

# **CLI Features:**

- **Auto-Authentication**: Token management
- **Tenant-Aware**: Automatic tenant ID detection
- **Error Handling**: Clear error messages
- **JSON Output**: Formatted JSON responses
- **Batch Operations**: Bulk operations support
- **Auto-Refresh**: Real-time data updates

---

# **Ready for Development**

The CLI tool is now ready for **programmatic access** to all backend services via the API Gateway! 🚀
