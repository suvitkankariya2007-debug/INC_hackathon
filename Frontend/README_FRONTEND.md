# LedgerAI Frontend

Professional, enterprise-grade accounting and anomaly detection platform built with modern web technologies.

## 🎯 Features

### 📊 **Dashboard**
- Real-time overview of key metrics (total transactions, anomalies, revenue, expenses)
- 12-month revenue vs expense trend visualization
- Category breakdown pie chart
- Recent anomalies feed
- Interactive stat cards with trend indicators

### 💳 **Transaction Management**
- Create individual transactions with AI-powered auto-categorization
- Batch CSV import for bulk transaction uploads
- Advanced filtering (date range, category, status, account type)
- View transaction details with AI confidence scores
- Edit or delete transactions
- Reconciliation status tracking

### ⚠️ **Anomaly Detection Dashboard**
- Visual breakdown of anomaly types:
  - **Statistical Outliers**: 3-sigma detection from category mean
  - **Duplicate Detection**: Identical transactions within 2-day windows
  - **Pattern Analysis**: Behavioral clustering and unusual payment patterns
  - **Logical Inconsistencies**: Transaction type vs account type validation
- Sort by date, amount, or severity
- Color-coded severity levels (High/Medium/Low)
- Detailed anomaly reasons and context

### 🏷️ **AI Classification Playground**
- Real-time text classification with confidence scores
- Dual-mode classification:
  - ML Model: Fast, trained on historical data (confidence > 0.60)
  - GPT Fallback: GPT-4o-mini for complex/uncertain cases
- User feedback system to improve model accuracy
- Classification history tracking
- Popular category suggestions

### 🔒 **Audit & Compliance**
- SHA-256 blockchain-based hash chain verification
- Tamper detection and integrity checking
- Visual hash chain status (valid/broken)
- Block-level tracking and audit trail
- Compliance recommendations
- SOX, GDPR compliance support

## 🏗️ **Architecture**

### **Tech Stack**
- **Framework**: React 18 + TypeScript 5
- **Styling**: Tailwind CSS 3 with custom theme
- **Build Tool**: Vite 5 (lightning-fast development)
- **State Management**: Context API + useReducer
- **HTTP Client**: Axios with interceptors
- **Charts**: Recharts (responsive data visualization)
- **Icons**: Lucide React
- **Dates**: date-fns

### **Project Structure**
```
src/
├── components/          # Reusable UI components
│   ├── Card.tsx        # Layout & stat cards
│   ├── Button.tsx      # Button component
│   ├── FormElements.tsx # Input, Select, Badge, Alert
│   ├── Table.tsx       # Data table with formatters
│   ├── Layout.tsx      # Main layout with sidebar
│   └── index.ts        # Component exports
├── pages/              # Page components
│   ├── Dashboard.tsx   # Analytics dashboard
│   ├── Transactions.tsx# Transaction management
│   ├── Anomalies.tsx   # Anomaly detection
│   ├── Classify.tsx    # AI classification
│   ├── Audit.tsx       # Hash chain audit
│   └── index.ts        # Page exports
├── context/            # State management
│   └── AppContext.tsx  # Global app state
├── services/           # API integration
│   └── apiClient.ts    # Axios client + endpoints
├── types/              # TypeScript definitions
│   └── index.ts        # All type interfaces
├── App.tsx             # Main app component
├── main.tsx            # React entry point
└── index.css           # Global styles
```

### **Component Hierarchy**
```
<App>
  <AppProvider>
    <Layout>
      <Header />
      <Sidebar />
      <Page Component>
        <Card>
          <FormElements />
          <Table />
        </Card>
      </Page>
    </Layout>
  </AppProvider>
</App>
```

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ and npm/yarn
- Backend running on `http://localhost:8000`

### **Installation**

1. **Navigate to frontend folder**:
```bash
cd Frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env if needed (default points to localhost:8000)
```

4. **Start development server**:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### **Build for Production**
```bash
npm run build
npm run preview
```

## 📊 **API Integration**

### **API Client** (`src/services/apiClient.ts`)
The `apiClient` handles all backend communication:

```typescript
// Import
import { apiClient } from '@/services/apiClient'

// Available methods
apiClient.getEntities()
apiClient.getTransactions(filters)
apiClient.createTransaction(data)
apiClient.updateTransaction(id, data)
apiClient.classifyText(description)
apiClient.getAnomalies(entityId)
apiClient.getMonthlyTrend(entityId)
apiClient.verifyAuditChain()
```

### **State Management** (`src/context/AppContext.tsx`)
Global state with actions:

```typescript
const { state, setTransactions, addTransaction, setAnomalies, setLoading } = useApp()
```

## 🎨 **Design System**

### **Colors**
- **Primary**: `#0066CC` (Blue)
- **Success**: `#10B981` (Green)
- **Warning**: `#F59E0B` (Amber)
- **Danger**: `#EF4444` (Red)
- **Info**: `#3B82F6` (Sky Blue)

### **Component Variants**
- **Buttons**: primary, secondary, danger, success, outline
- **Badges**: primary, success, warning, danger, info
- **Alerts**: success, warning, danger, info

### **Responsive Design**
- Mobile: 1 column
- Tablet: 2 columns (md breakpoint)
- Desktop: 3-4 columns (lg breakpoint)

## 📱 **Pages Guide**

### **Dashboard** (`/`)
- Load on app start
- Displays overview cards and charts
- Real-time anomaly feed

### **Transactions** (`/transactions`)
- Create manual transactions
- Upload CSV batch
- Filter and search
- Edit/delete transactions

### **Anomalies** (`/anomalies`)
- View all flagged transactions
- Sort by date, amount, severity
- See anomaly breakdown by type

### **Classify** (`/classify`)
- Test AI categorization
- Submit feedback for model improvement
- View classification history

### **Audit** (`/audit`)
- Verify hash chain integrity
- View compliance info
- See recommended actions

## 🔌 **Backend API Endpoints Used**

```
GET  /entities                      # List entities
POST /transactions                  # Create transaction
GET  /transactions                  # List transactions
PUT  /transactions/{id}             # Update transaction
POST /transactions/upload-csv       # Batch import
POST /classify                      # AI classification
POST /classify/feedback             # Submit feedback
GET  /analytics/anomalies           # Get anomalies
GET  /analytics/monthly-trend       # Get trends
GET  /audit/verify                  # Verify hash chain
```

## 🛠️ **Development**

### **Hot Module Replacement (HMR)**
Vite automatically reloads on file changes during development.

### **TypeScript**
- Strict mode enabled
- Path aliases configured (@/components, @/pages, etc.)
- Type-safe API client and component props

### **Debugging**
- React DevTools browser extension
- Network tab for API calls
- Console for errors/logs

## 📦 **Performance**

- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code removed in production
- **Lazy Loading**: Charts and components load on demand
- **Compression**: Gzip enabled in production build
- **Caching**: Proper cache headers set

## 🧪 **Testing** (Optional Enhancement)

To add testing:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

## 📚 **Dependencies**

- **React**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Axios**: HTTP client
- **Recharts**: Data visualization
- **Lucide React**: Icons
- **date-fns**: Date utilities
- **Vite**: Build tool

## 🤝 **Contributing**

1. Create feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Create Pull Request

## 📝 **License**

This project is part of the INC Hackathon 2026.

## 🎓 **Key Learnings**

### **State Management**
- Context API with useReducer for scalable state
- Avoid prop drilling with context
- Memoized callbacks for performance

### **API Integration**
- Centralized API client for consistency
- Error handling with user feedback
- Loading states for UX

### **Component Design**
- Reusable, composable components
- Props-based configuration
- Type-safe component contracts

## 🚀 **Next Steps**

1. Connect to backend (currently uses mocked data)
2. Add authentication/login page
3. Add user settings and preferences
4. Implement real-time WebSocket updates
5. Add export/download functionality
6. Mobile app with React Native

---

**Built with ❤️ by the LedgerAI Team**
