# JobInt - Automated Job Application Platform

> **Stop wasting time filling forms. Let AI apply to jobs for you.**

JobInt is an automated job application platform that searches job boards, applies to matching positions, and books interviews on your behalf - all verified on the Binance Smart Chain (BSC).

## 🎯 Problem We Solve

Job seekers waste **10-15 hours/week**:
- Searching across multiple job boards (LinkedIn, Indeed, Glassdoor)
- Filling identical information on different forms
- Managing interview schedules manually
- Losing track of applications

## ✨ Features (v1 MVP)

### Core Features
- ✅ **One-Time Profile Setup** - Fill your details once
- ✅ **AI Job Matching** - Automatically find jobs matching your skills
- ✅ **Auto-Apply** - Apply to jobs automatically (configurable modes)
- ✅ **Interview Scheduler** - Books interviews in your calendar
- ✅ **Blockchain Verification** - All applications recorded on BSC
- ✅ **Mobile Notifications** - Real-time push notifications
- ✅ **Application Dashboard** - Track all your applications

### Apply Modes
1. **Auto Mode** - Apply to all matches automatically (80%+ match score)
2. **Review Mode** - Review each match before applying
3. **Whitelist Mode** - Only apply to pre-approved companies

---

## 🏗️ Architecture

```
┌─────────────────┐
│   React Web     │
│   Application   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│   Node.js API   │────▶│  PostgreSQL  │
│   (Express)     │     │   Database   │
└────────┬────────┘     └──────────────┘
         │
         ├──────▶ Redis (Job Queue)
         │
         ├──────▶ Puppeteer (Browser Automation)
         │
         ├──────▶ OpenAI API (Resume Parsing)
         │
         ├──────▶ Google Calendar API
         │
         ├──────▶ Firebase (Notifications)
         │
         └──────▶ BSC Smart Contract
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- MetaMask wallet (for blockchain features)
- Google Cloud account (for Calendar API)
- OpenAI API key

### 1. Clone Repository

```bash
git clone https://github.com/yourname/jobint.git
cd jobint
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Setup database
psql -U postgres
CREATE DATABASE jobint;
\q

# Run migrations
psql -U postgres -d jobint -f database/schema.sql

# Start backend
npm run dev
```

**Backend runs on:** `http://localhost:5000`

### 3. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Start React app
npm start
```

**Frontend runs on:** `http://localhost:3000`

### 4. Deploy Smart Contract

```bash
cd ../blockchain

# Install Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Create deployment script
npx hardhat run scripts/deploy.js --network bsc_testnet

# Copy contract address to backend .env
# CONTRACT_ADDRESS=0x...
```

---

## 🔧 Configuration

### Environment Variables

#### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/jobint

# Blockchain
BSC_RPC_URL=https://bsc-dataseed.binance.org/
CONTRACT_ADDRESS=0x...  # After deployment
PRIVATE_KEY=your_wallet_private_key

# APIs
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FIREBASE_PROJECT_ID=...

# Security
JWT_SECRET=your_super_secret_key
```

#### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_BSC_NETWORK=testnet  # or mainnet
REACT_APP_CONTRACT_ADDRESS=0x...
```

---

## 📊 Database Schema

### Key Tables

**users** - User authentication & settings
**user_profiles** - Resume, skills, preferences
**job_listings** - Scraped jobs from platforms
**applications** - Submitted applications
**interviews** - Scheduled interviews
**notifications** - Push notifications

See `backend/database/schema.sql` for complete schema.

---

## 🔐 Smart Contract

### Contract Address
- **BSC Testnet:** `0x...` (update after deployment)
- **BSC Mainnet:** `0x...` (deploy when ready)

### Key Functions

```solidity
submitApplication(applicationId, jobId, company, jobTitle, dataHash)
scheduleInterview(interviewId, applicationId, company, scheduledTime, dataHash)
getUserApplications(walletAddress)
getUserInterviews(walletAddress)
verifyApplicationData(applicationId, dataHash)
```

### Verify on BSCScan

After deployment, verify your contract:

```bash
npx hardhat verify --network bsc_testnet DEPLOYED_CONTRACT_ADDRESS
```

---

## 🤖 How Auto-Apply Works

### Job Discovery Flow

1. **Scheduled Cron Job** runs daily (configurable)
2. **Scrapes job boards**: LinkedIn, Indeed, Glassdoor, AngelList
3. **AI Matching**: OpenAI analyzes user profile vs. job descriptions
4. **Match Scoring**: 0-100 score based on:
   - Skills alignment
   - Location preferences
   - Salary range
   - Job title match
   - Industry fit

### Application Flow

```
User Profile → Job Match (80%+) → Auto-Apply Mode
                                         ↓
                                 ┌───────┴───────┐
                                 │               │
                          [Auto Mode]      [Review Mode]
                                 │               │
                          Apply Immediately   Show for approval
                                 │               │
                                 └───────┬───────┘
                                         ↓
                                 Puppeteer Automation
                                         ↓
                                 Fill Application Form
                                         ↓
                                 Submit Application
                                         ↓
                                 Record on Blockchain
                                         ↓
                                 Send Notification
```

---

## 📱 Mobile Notifications

### Setup Firebase

1. Create Firebase project: https://console.firebase.google.com
2. Enable Cloud Messaging
3. Download service account JSON
4. Add to backend `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
```

### Notification Types

- ✅ Application submitted
- 📅 Interview scheduled
- ❌ Application rejected
- 🎉 Offer received
- ⏰ Interview reminder (24h before)

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Test Job Application (Sandbox)

```bash
# Test LinkedIn application (requires valid job URL)
curl -X POST http://localhost:5000/api/applications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "jobUrl": "https://www.linkedin.com/jobs/view/...",
    "platform": "linkedin"
  }'
```

---

## 📈 Monitoring & Analytics

### Application Metrics Dashboard

Access at: `http://localhost:3000/dashboard`

**Key Metrics:**
- Total applications submitted
- Interview rate (% of applications → interviews)
- Response time (days until first response)
- Top companies applied to
- Skills most in-demand

### Logs

Backend logs location: `backend/logs/`
- `error.log` - Error logs
- `combined.log` - All logs
- `application.log` - Application-specific logs

---

## 🚨 Important Notes

### Legal Compliance

⚠️ **Job Board Terms of Service**

Before deploying, review ToS for:
- LinkedIn: https://www.linkedin.com/legal/user-agreement
- Indeed: https://www.indeed.com/legal
- Glassdoor: https://www.glassdoor.com/about/terms.htm

**Automation may violate ToS.** Consider:
1. Using official APIs where available
2. Requesting partnership/API access
3. User-initiated automation (user clicks "apply")
4. Rate limiting to avoid spam detection

### Rate Limiting

Default limits (configurable in `.env`):
- **10 applications/hour**
- **50 applications/day**
- **3 retries on failure**

### Privacy & Data

- User data is encrypted at rest
- Resume files stored in S3 (configurable)
- Blockchain data is **public** (only hashes, not full data)
- GDPR compliant data export/deletion available

---

## 🔄 Deployment (Production)

### Backend Deployment (Railway/Render)

```bash
# Using Railway
railway login
railway init
railway up

# Or using Render
# Connect GitHub repo → Select backend folder → Deploy
```

### Frontend Deployment (Vercel)

```bash
cd frontend
vercel login
vercel --prod
```

### Database (Supabase/Neon)

1. Create PostgreSQL database
2. Run migration: Copy `schema.sql` to Supabase SQL editor
3. Update `DATABASE_URL` in production env

### Smart Contract (BSC Mainnet)

```bash
# Deploy to mainnet (costs BNB gas)
npx hardhat run scripts/deploy.js --network bsc_mainnet

# Verify on BSCScan
npx hardhat verify --network bsc_mainnet DEPLOYED_ADDRESS
```

---

## 🛣️ Roadmap

### v1.0 (MVP) - Current ✅
- [x] User authentication
- [x] Profile setup
- [x] Job discovery
- [x] Auto-apply (LinkedIn, Indeed, Glassdoor)
- [x] Blockchain verification
- [x] Interview scheduling
- [x] Mobile notifications

### v1.5 - Next
- [ ] Email parsing for interview invites
- [ ] Calendly/scheduling tool integration
- [ ] Application analytics dashboard
- [ ] Resume A/B testing

### v2.0 - Future
- [ ] Cold DM automation to founders
- [ ] AI chat with recruiters
- [ ] Salary negotiation assistant
- [ ] Multi-language support
- [ ] Chrome extension

---

## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

MIT License - see `LICENSE` file

---

## 💬 Support

- **Email:** support@jobint.app
- **Discord:** https://discord.gg/jobint
- **Twitter:** @jobint_app

---

## ⚡ Performance Tips

### Optimize Job Scraping
- Use proxy rotation to avoid IP bans
- Implement exponential backoff on failures
- Cache job listings for 24h

### Database Optimization
```sql
-- Add indexes for faster queries
CREATE INDEX idx_applications_user_status ON applications(user_id, status);
CREATE INDEX idx_job_listings_posted_date ON job_listings(posted_date DESC);
```

### Reduce Gas Costs
- Batch multiple applications before blockchain submission
- Use BSC (cheaper than Ethereum)
- Submit during low-traffic times

---

## 🎓 How It Works (Technical Deep Dive)

### Job Scraping Pipeline

```javascript
// Simplified scraper logic
1. Cron job triggers at 2 AM daily
2. For each job board (LinkedIn, Indeed, etc.):
   a. Launch headless browser (Puppeteer)
   b. Search for jobs matching user criteria
   c. Extract job details (title, company, description, URL)
   d. Store in database
3. Run AI matching algorithm
4. Queue matched jobs for application
```

### Application Automation

```javascript
// Simplified application logic
1. Fetch job from queue
2. Navigate to application URL
3. Detect platform (LinkedIn/Indeed/Generic)
4. Auto-fill form fields from user profile
5. Upload resume
6. Submit application
7. Record in database
8. Submit hash to blockchain
9. Send notification
```

---

**Built with  by JobInt Team**

**Star this repo if JobInt helps you land your dream job!**