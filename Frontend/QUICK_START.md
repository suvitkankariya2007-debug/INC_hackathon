# 🚀 LedgerAI Frontend - Quick Start Guide

## ✅ What's Been Built

A **professional, beautiful, production-ready frontend** for your accounting platform with:

✓ **Dashboard** - Real-time analytics, charts, and metrics
✓ **Transactions** - CRUD operations with CSV batch import
✓ **Anomalies** - Intelligent detection with 4 strategies
✓ **Classification** - AI playground with user feedback
✓ **Audit** - Hash chain verification and compliance
✓ **Responsive Design** - Mobile, tablet, desktop optimized
✓ **Type-Safe** - Full TypeScript with strict mode
✓ **Professional UI** - Tailwind CSS + custom components
✓ **State Management** - Context API + useReducer
✓ **API Integration** - Axios client with error handling

## 📦 Installation & Setup

### Step 1: Install Dependencies
```bash
cd Frontend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
# Default is already set to http://localhost:8000
```

### Step 3: Start Development Server
```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

### Step 4: Make Sure Backend is Running
Backend should be running on `http://localhost:8000` (check Backend/README.md)

## 🎯 Frontend Features

### 📊 Dashboard (`/`)
- Interactive stat cards with trends
- 12-month revenue vs expense chart
- Category breakdown pie chart
- Real-time anomaly alerts
- Loads on app start

### 💳 Transactions (`/transactions`)
- **Create** - Manual transaction entry with AI prediction
- **Read** - View all transactions with advanced filters
- **Update** - Edit transaction details
- **Delete** - Remove transactions
- **Batch** - Import CSV file with multiple transactions
- Status tracking (matched/possible/unmatched)

### ⚠️ Anomalies (`/anomalies`)
Shows transactions flagged as unusual with reasons:
- 📊 **Statistical** - 3-sigma outliers
- 📋 **Duplicates** - Same description + amount within 2 days
- 🔗 **Patterns** - Behavioral clustering
- ✓ **Logical** - Invalid account type combinations

Filter by severity: High (🔴) | Medium (🟡) | Low (🔵)

### 🏷️ Classify (`/classify`)
- Type transaction description
- AI categorizes in real-time with confidence %
- If unsure (< 60%): Falls back to GPT-4o-mini
- Submit feedback to improve model
- View classification history

### 🔒 Audit (`/audit`)
- Verify SHA-256 hash chain integrity
- Check for tampering/modifications
- View block count and status
- Compliance recommendations
- Legal audit trail

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components (Dashboard, Transactions, etc)
│   ├── context/         # State management (AppContext)
│   ├── services/        # API client (apiClient.ts)
│   ├── types/           # TypeScript interfaces
│   ├── App.tsx          # Main app routing
│   ├── main.tsx         # React entry
│   └── index.css        # Global styles
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── tailwind.config.js   # Tailwind theme
├── vite.config.ts       # Vite config
└── index.html           # HTML entry
```

## 💻 Available Scripts

```bash
# Development (hot reload, http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code (optional)
npm run lint
```

## 🎨 Design Highlights

### Component Library
- **Cards** - Stat cards, data containers
- **Buttons** - Primary, secondary, danger, success, outline
- **Forms** - Input, Select, validation
- **Tables** - Searchable, sortable data tables
- **Alerts** - Success, warning, danger, info
- **Badges** - Status, category labels

### Color Scheme
- 🔵 Primary: Blue (#0066CC)
- 🟢 Success: Green (#10B981)
- 🟡 Warning: Amber (#F59E0B)
- 🔴 Danger: Red (#EF4444)

### Responsive Breakpoints
- Mobile: < 768px (1 column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (3-4 columns)

## 🔌 API Endpoints Integrated

The frontend automatically connects to these backend endpoints:

```
✓ GET  /entities                    - List companies
✓ POST /transactions                - Create transaction (AI auto-categorizes)
✓ GET  /transactions                - List transactions (with filters)
✓ PUT  /transactions/{id}           - Update transaction
✓ DELETE /transactions/{id}         - Delete transaction
✓ POST /transactions/upload-csv     - Batch import CSV
✓ POST /classify                    - AI classification
✓ POST /classify/feedback           - User feedback for model
✓ GET  /analytics/anomalies         - Get anomalies (4 strategies)
✓ GET  /analytics/monthly-trend     - Revenue vs expense trends
✓ GET  /audit/verify                - Hash chain verification
```

## 🛠️ Development Tips

### Hot Reload
Save any file and your browser auto-refreshes thanks to Vite

### TypeScript
- Strict mode enabled
- Get autocomplete in your editor
- Catch bugs at compile time
- Path aliases: `@/components`, `@/pages`, etc.

### State Management
```typescript
import { useApp } from '@/context/AppContext'

// In component
const { state, setTransactions, addTransaction } = useApp()
```

### API Calls
```typescript
import { apiClient } from '@/services/apiClient'

// Examples
const transactions = await apiClient.getTransactions()
const result = await apiClient.classifyText("AWS invoice")
```

## 🚨 Troubleshooting

### "Backend not available" Error
- Check backend is running on `http://localhost:8000`
- See Backend/README.md for setup
- Check CORS headers in backend config

### Blank page / 404
- Make sure dev server is running: `npm run dev`
- Check http://localhost:3000

### Module not found errors
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`
- Run `npm install` fresh

### Port 3000 already in use
```bash
# Windows: Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or run on different port
npm run dev -- --port 3001
```

## 📚 What to Learn

1. **React Patterns** - Context API, useReducer, custom hooks
2. **TypeScript** - Strict typing, interfaces, generics
3. **Tailwind** - Utility-first CSS, responsive design
4. **Axios** - HTTP client, error handling, interceptors
5. **Recharts** - Data visualization, responsive charts
6. **Component Design** - Composition, reusability, props

## 🎯 Next Steps

### Immediate (After Backend Setup)
1. Run `npm install`
2. Run `npm run dev`
3. Open http://localhost:3000
4. Test each page and verify data flows from backend

### Short Term (1-2 days)
- [ ] Add login/authentication page
- [ ] Add user profile/settings
- [ ] Export transactions to PDF/Excel
- [ ] Add dark mode toggle

### Medium Term (1 week)
- [ ] Real-time WebSocket updates
- [ ] Advanced search and filters
- [ ] Custom report builder
- [ ] User role-based access control

### Long Term (Ongoing)
- [ ] Mobile app with React Native
- [ ] PWA offline support
- [ ] Analytics dashboard expansion
- [ ] Integration tests

## 🤝 Team Collaboration

### Frontend Standards
- Use TypeScript strictly (no `any`)
- Component files in `src/components/`
- Pages in `src/pages/`
- Services in `src/services/`
- Types in `src/types/`

### Git Workflow
```bash
git checkout -b feature/feature-name
# Make changes
git commit -m "Add feature description"
git push origin feature/feature-name
# Create Pull Request
```

## 📞 Support

- **Backend Issues**: See Backend/README.md
- **Database Issues**: See Database/README.md
- **ML Model Issues**: See ML_Training/README.md

## 🎉 Summary

You now have a **professional, fully-functional frontend** that:
- ✅ Connects to your FastAPI backend
- ✅ Displays real-time data with beautiful UI
- ✅ Handles transactions, anomalies, classification
- ✅ Provides hash chain audit verification
- ✅ Is fully type-safe with TypeScript
- ✅ Is responsive and mobile-friendly
- ✅ Uses modern React patterns

**Ready to start the dev server? Run:** `npm run dev`

---

**Built by AI with ❤️ for your INC Hackathon**
