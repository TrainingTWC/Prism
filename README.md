# Prism Dashboard

A comprehensive performance analytics dashboard built with React, TypeScript, and Vite. This dashboard provides role-based access to HR analytics with real-time data from Google Sheets integration.

## Features

### 🎯 Core Functionality
- **Role-Based Access Control**: Dynamic dashboard filtering based on organizational hierarchy
- **Real-Time Data Integration**: Direct connection to Google Sheets for live survey data
- **Professional PDF Generation**: Export detailed reports with survey responses
- **Theme Toggle**: Beautiful light/dark mode with custom pearl morph animation

### 📊 Analytics & Visualizations
- **Score Distribution Charts**: Interactive bar charts showing performance metrics
- **Manager Performance Analysis**: Comparative charts across different managers
- **Regional Performance Tracking**: Geographic performance breakdown
- **Question-Level Analytics**: Detailed breakdown of survey responses
- **Performance Infographics**: Visual summaries with top/bottom performers

### 🎨 User Experience
- **Responsive Design**: Optimized for desktop and mobile devices
- **Custom Theme Toggle**: Smooth transitions between light and dark modes
- **Interactive Charts**: Built with Recharts for engaging data visualization
- **Modern UI**: Tailwind CSS with backdrop blur effects and smooth animations

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite with HMR (Hot Module Replacement)
- **Styling**: Tailwind CSS with custom theme configuration
- **Charts**: Recharts library for data visualization
- **PDF Generation**: jsPDF with autoTable plugin
- **Data Source**: Google Apps Script + Google Sheets
- **Theme Management**: React Context API

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hr-connect-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173`
   - Use URL parameters for role-based access: `?hrId=123&hrName=John%20Doe`

## Configuration

### Google Sheets Integration
The dashboard connects to Google Sheets via Apps Script. Update the endpoint in `services/dataService.ts`:

```typescript
const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

### Role Mapping
HR organizational structure is defined in `hr_mapping.json`:

```json
{
  "hr_mapping": [
    {
      "hrId": "123",
      "hrName": "John Doe",
      "amId": "456",
      "amName": "Jane Smith",
      "storeId": "789",
      "storeName": "Store Name",
      "region": "North"
    }
  ]
}
```

## Usage

### URL Parameters
Access specific HR data using URL parameters:
- `hrId`: HR Manager ID
- `hrName`: HR Manager Name
- `amId`: Area Manager ID (optional)
- `amName`: Area Manager Name (optional)

Example: `http://localhost:5173/?hrId=123&hrName=John%20Doe&amId=456&amName=Jane%20Smith`

### Dashboard Features
1. **Filter Controls**: Use the sidebar to filter by date range, managers, and regions
2. **Manual Refresh**: Click the refresh button to fetch latest data
3. **Theme Toggle**: Switch between light and dark modes using the pearl morph toggle
4. **PDF Export**: Generate professional reports with survey responses

## License

This project is licensed under the MIT License.
