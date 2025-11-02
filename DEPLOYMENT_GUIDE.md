# Amoeba Deployment Guide
## AWS Free Tier Production Deployment

---

## 🎯 Overview

Deploy Amoeba to AWS Free Tier for **$0-5/month** total cost.

**Architecture:**
- **Landing Page**: Vercel (free)
- **Main App**: EC2 t2.micro (free tier)
- **Database**: Neon.tech PostgreSQL (free) or RDS (free tier)
- **CDN**: CloudFront (free tier)

---

## 📋 Prerequisites

- [ ] AWS Account (free tier eligible)
- [ ] Vercel Account (free)
- [ ] Domain name (optional, ~$12/year)
- [ ] GitHub account (for deployments)
- [ ] Stripe account (for payments)

---

## 🚀 Step-by-Step Deployment

### **Step 1: Database Setup (15 minutes)**

**Option A: Neon.tech (Recommended - Actually Free Forever)**
```bash
# 1. Sign up at neon.tech
# 2. Create new project "amoeba-prod"
# 3. Copy connection string

DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/amoeba?sslmode=require"
```

**Option B: AWS RDS Free Tier**
```bash
# Create PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier amoeba-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.7 \
  --master-username amoebaadmin \
  --master-user-password "YOUR-STRONG-PASSWORD" \
  --allocated-storage 20 \
  --publicly-accessible \
  --backup-retention-period 7 \
  --vpc-security-group-ids sg-xxxxx

# Wait 10 minutes for creation
aws rds describe-db-instances \
  --db-instance-identifier amoeba-prod \
  --query 'DBInstances[0].Endpoint.Address'
```

---

### **Step 2: EC2 Instance Setup (30 minutes)**

**Create EC2 Instance:**
```bash
# 1. Launch t2.micro (free tier)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name amoeba-prod-key \
  --security-group-ids sg-xxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=amoeba-prod}]'

# 2. Configure security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0  # SSH

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0  # HTTP

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0  # HTTPS
```

**Connect and Setup:**
```bash
# SSH into instance
ssh -i amoeba-prod-key.pem ec2-user@<instance-ip>

# Install Docker
sudo yum update -y
sudo yum install docker git -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

---

### **Step 3: Application Deployment**

**Clone and Configure:**
```bash
# Clone repository
git clone https://github.com/yourusername/Amoeba.git
cd Amoeba

# Create production .env
cat > .env << EOF
NODE_ENV=production
PORT=5000

# Database (from Step 1)
DATABASE_URL="postgresql://user:pass@host/amoeba?sslmode=require"

# Security
ENCRYPTION_KEY="$(openssl rand -hex 32)"
SESSION_SECRET="$(openssl rand -hex 32)"

# Stripe (get from stripe.com/dashboard)
STRIPE_SECRET_KEY="sk_live_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
STRIPE_LICENSE_PRICE_ID="price_xxx"

# Optional: AI Provider Keys (or use BYOK)
OPENAI_API_KEY="sk-xxx"
ANTHROPIC_API_KEY="sk-ant-xxx"

# Optional: Email (or use BYOK)
SENDGRID_API_KEY="SG.xxx"

# Production URL
APP_URL="https://app.amoeba.io"
LANDING_URL="https://amoeba.io"
EOF

# Build and start
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs -f
```

---

### **Step 4: Landing Page Deployment (5 minutes)**

```bash
# In your local machine
cd landing

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard:
# NEXT_PUBLIC_APP_URL=https://app.amoeba.io
# STRIPE_PUBLIC_KEY=pk_live_xxx

# Custom domain (optional)
vercel domains add amoeba.io
vercel domains add www.amoeba.io
```

---

### **Step 5: Domain Configuration (Optional)**

**Route 53 DNS Setup:**
```bash
# Landing page (root domain)
amoeba.io → CNAME → cname.vercel-dns.com

# Main app (subdomain)
app.amoeba.io → A → <EC2-elastic-ip>

# API (subdomain)
api.amoeba.io → A → <EC2-elastic-ip>
```

---

### **Step 6: SSL Certificate (Let's Encrypt)**

```bash
# SSH into EC2
ssh -i amoeba-prod-key.pem ec2-user@<instance-ip>

# Install certbot
sudo yum install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d app.amoeba.io

# Auto-renewal
sudo certbot renew --dry-run
```

---

### **Step 7: Stripe Webhook Configuration**

```bash
# In Stripe Dashboard:
# 1. Go to Developers → Webhooks
# 2. Add endpoint: https://app.amoeba.io/api/webhooks/stripe
# 3. Select events:
#    - checkout.session.completed
#    - payment_intent.succeeded
#    - customer.subscription.created
#    - customer.subscription.updated
#    - customer.subscription.deleted
# 4. Copy webhook secret to .env as STRIPE_WEBHOOK_SECRET
```

---

### **Step 8: Database Migration**

```bash
# SSH into EC2
ssh -i amoeba-prod-key.pem ec2-user@<instance-ip>
cd Amoeba

# Run migrations
docker-compose exec app npm run db:push

# Verify
docker-compose exec app npm run check
```

---

### **Step 9: Monitoring & Health Checks**

```bash
# Create CloudWatch alarm for EC2
aws cloudwatch put-metric-alarm \
  --alarm-name amoeba-cpu-high \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Set up health check endpoint monitoring
aws route53 create-health-check \
  --type HTTPS \
  --resource-path /api/health \
  --fully-qualified-domain-name app.amoeba.io \
  --port 443
```

---

### **Step 10: Backup Strategy**

```bash
# Daily PostgreSQL backups
cat > /home/ec2-user/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > /backups/amoeba_$DATE.sql.gz
# Upload to S3
aws s3 cp /backups/amoeba_$DATE.sql.gz s3://amoeba-backups/
# Delete backups older than 30 days
find /backups -name "*.sql.gz" -mtime +30 -delete
EOF

chmod +x /home/ec2-user/backup.sh

# Add to crontab (daily at 3 AM)
crontab -e
# Add line:
0 3 * * * /home/ec2-user/backup.sh
```

---

## 📊 Cost Breakdown (AWS Free Tier)

| Service | Free Tier | Monthly Cost |
|---------|-----------|--------------|
| EC2 t2.micro | 750 hours/month | **$0** |
| RDS db.t3.micro | 750 hours/month | **$0** |
| RDS Storage | 20GB | **$0** |
| CloudFront | 1TB transfer | **$0** |
| Route 53 | 1 hosted zone | **$0.50** |
| Vercel | Hobby plan | **$0** |
| Neon.tech | 0.5 GB storage | **$0** |
| **TOTAL** | | **$0.50-5/month** |

**After 12 months (free tier expires):**
- EC2 t2.micro: ~$10/month
- RDS db.t3.micro: ~$15/month
- **Total: ~$25-30/month**

---

## 🔄 Updates & Maintenance

**Deploy New Version:**
```bash
# SSH into EC2
ssh -i amoeba-prod-key.pem ec2-user@<instance-ip>
cd Amoeba

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose logs -f
```

**Rollback:**
```bash
# Revert to previous version
git reset --hard <previous-commit>
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🐛 Troubleshooting

**App won't start:**
```bash
# Check logs
docker-compose logs -f app

# Check environment
docker-compose exec app env | grep DATABASE_URL

# Restart services
docker-compose restart
```

**Database connection issues:**
```bash
# Test connection from EC2
docker-compose exec app npx drizzle-kit introspect:pg

# Check RDS security group allows EC2
```

**High CPU usage:**
```bash
# Check running processes
docker stats

# Restart specific service
docker-compose restart app
```

---

## 🎉 Success Checklist

- [ ] Landing page live at https://amoeba.io
- [ ] Main app live at https://app.amoeba.io
- [ ] SSL certificate active
- [ ] Database connected and migrated
- [ ] Stripe webhooks configured
- [ ] Health check endpoint responds: https://app.amoeba.io/api/health
- [ ] Can create account and login
- [ ] Can purchase $3.50 license
- [ ] Can generate AI content
- [ ] Monitoring and backups configured

---

## 🔐 Security Hardening

**Post-Deployment Security:**
```bash
# Disable root SSH
sudo vi /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo service sshd restart

# Configure firewall
sudo yum install iptables-services -y
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -j DROP
sudo service iptables save

# Enable automatic security updates
sudo yum install yum-cron -y
sudo systemctl enable yum-cron
sudo systemctl start yum-cron
```

---

## 📈 Scaling (When You Outgrow Free Tier)

**Next Steps:**
1. Move to t3.medium EC2 ($30/month)
2. Add Application Load Balancer + Auto Scaling
3. Use Amazon ECS/Fargate for containers
4. Implement Redis for caching
5. Add CloudFront for global CDN
6. Use RDS Multi-AZ for high availability

---

**Questions? Issues?**
- GitHub Issues: https://github.com/yourusername/Amoeba/issues
- Email: support@amoeba.io
- Discord: discord.gg/amoeba

