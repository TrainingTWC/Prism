# TestSprite Testing Guide for Prism Dashboard

## Overview
This guide provides comprehensive testing setup and execution instructions for the Prism Training Dashboard using TestSprite MCP.

## Test Structure

### 📁 Test Files Created
- `tests/testsprite.config.js` - Main configuration and component definitions
- `tests/scenarios.js` - Detailed test scenarios for core functionality
- `tests/mockData.js` - Mock data and API response configurations  
- `tests/workflows.js` - End-to-end user workflow tests
- `tests/README.md` - This documentation file

## 🚀 Quick Start

### Prerequisites
1. TestSprite MCP is configured in VS Code (see `MCP_SETUP.md`)
2. Your TestSprite API key is set in `.vscode/settings.json`
3. Prism dashboard is running locally on `http://localhost:5173`

### Running Tests with TestSprite

#### Through VS Code Copilot Chat:
```
Use TestSprite to run the dashboard loading test from tests/scenarios.js
```

#### Specific Test Commands:
```
Test the filter cascade logic using TestSprite scenario FILT-001
```

```
Run the complete training audit workflow WF-001 with TestSprite
```

```
Execute performance tests for the dashboard with TestSprite
```

## 📋 Test Categories

### 1. Core Functionality Tests
- **Dashboard Loading** (`DASH-001`): Verify dashboard loads with all components
- **Filter Cascade** (`FILT-001`): Test Region → Store → AM → Trainer filtering logic
- **Modal Interactions** (`MODAL-001`): Test Audit Score Details modal functionality
- **Role-Based Access** (`ROLE-001`): Verify data access restrictions by user role
- **PDF Export** (`EXPORT-001`): Test filtered data export functionality

### 2. Workflow Tests
- **Complete Audit Workflow** (`WF-001`): End-to-end audit creation and verification
- **Filter and Export** (`WF-002`): Apply filters and export filtered results
- **Role Validation** (`WF-003`): Test different user role access patterns
- **Error Handling** (`WF-004`): Test system behavior under error conditions
- **Mobile Responsive** (`WF-005`): Test mobile device functionality

### 3. Performance Tests
- **Page Load Performance** (`PERF-001`): Measure loading times
- **Filter Response Times**: Test filter application speed
- **Large Dataset Handling**: Performance with 1000+ records
- **Chart Rendering**: Visualization performance benchmarks

### 4. Accessibility Tests
- **Keyboard Navigation** (`A11Y-001`): Test keyboard-only interaction
- **Screen Reader Support** (`A11Y-002`): Verify assistive technology compatibility

## 🎯 Key Test Scenarios

### Critical Priority Tests
1. **Dashboard Component Loading** - Ensures basic functionality works
2. **Role-Based Data Access** - Security and authorization testing  
3. **Complete Training Audit Workflow** - Core business process validation

### High Priority Tests  
1. **Filter Cascade Logic** - Key user interaction testing
2. **Modal Interactions** - Important UI component testing
3. **PDF Export Functionality** - Essential business feature

## 📊 Test Data

### Mock User Roles
- `admin`: Full access to all dashboards and data
- `area_manager_south`: Access to South region stores and training data
- `trainer_mahadev`: Access to assigned stores for audit creation
- `store_koramangala`: Limited to single store (S001) access

### Sample Data
- **Stores**: S001 (Koramangala), S002 (CMH Indira Nagar), S003 (HSR-1)
- **Trainers**: H1761 (Mahadev Nayak), H701 (Mallika M), H1697 (Sheldon)
- **Regions**: North, South, East, West
- **Audit Scores**: Range from 45-95% with realistic distributions

## 🔧 Configuration Options

### Environment Setup
```javascript
environment: {
  baseUrl: "http://localhost:5173",
  framework: "React", 
  language: "TypeScript",
  buildTool: "Vite"
}
```

### Performance Benchmarks
- Page Load: Target < 3s, Critical < 5s
- Filter Response: Target < 500ms, Critical < 1s  
- Modal Open: Target < 300ms, Critical < 800ms
- Chart Render: Target < 1s, Critical < 2s

### Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)  
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## 🐛 Error Testing

### Error Scenarios
- **API Timeout**: Test 10 second timeout handling
- **Network Error**: Test offline/connection failure behavior
- **Empty Data**: Test dashboard with no data
- **Malformed Data**: Test with incomplete/invalid data structures

## 📱 Responsive Testing

### Device Categories
- **Desktop**: 1920x1080, 1366x768
- **Tablet**: 768x1024, 1024x768  
- **Mobile**: 375x667, 414x896

### Mobile Features
- Filter drawer functionality
- Touch gesture support
- Responsive chart scaling
- Mobile-optimized modal layouts

## 🔐 Security Testing

### Access Control Tests
- Role-based data filtering
- Cross-role data leakage prevention
- API endpoint access restrictions
- Client-side data validation

## 📈 Integration Testing

### External Dependencies
- **Google Sheets API**: Historic trends data loading
- **Store Mapping**: Comprehensive store-to-trainer mapping validation
- **PDF Generation**: jsPDF library integration testing

## 🚨 Common TestSprite Commands

### Run Individual Tests
```
Use TestSprite to execute test scenario DASH-001
```

### Run Test Suites
```
Run all critical priority tests with TestSprite
```

### Performance Testing
```
Test dashboard performance with 1000 records using TestSprite
```

### Accessibility Testing  
```
Run keyboard navigation tests with TestSprite
```

### Error Condition Testing
```
Test API timeout scenarios using TestSprite error conditions
```

## 📋 Test Execution Checklist

### Before Testing
- [ ] Prism dashboard is running locally
- [ ] TestSprite MCP is configured and connected
- [ ] Test data is available in the application
- [ ] Required user roles are set up

### During Testing
- [ ] Monitor console for JavaScript errors
- [ ] Verify performance benchmarks are met
- [ ] Check responsive behavior across devices
- [ ] Validate accessibility compliance

### After Testing
- [ ] Review test results and failure reports
- [ ] Document any issues found
- [ ] Update test scenarios based on findings
- [ ] Plan regression testing for fixes

## 🔄 Continuous Testing

### Automated Test Runs
Set up TestSprite to run critical tests automatically:
- Before each deployment
- After major feature changes
- Weekly performance regression tests
- Monthly comprehensive test suite

## 📞 Support

For TestSprite-specific issues:
1. Check TestSprite documentation
2. Verify API key configuration
3. Ensure MCP server connection
4. Review test scenario syntax

For Prism Dashboard issues:
1. Check application logs
2. Verify data source connectivity
3. Test user permissions
4. Review component error boundaries

## 🎯 Success Metrics

### Test Coverage Goals
- **Critical Functionality**: 100% test coverage
- **User Workflows**: All major paths tested
- **Performance**: All benchmarks validated
- **Accessibility**: WCAG 2.1 AA compliance
- **Security**: All role scenarios verified

### Quality Gates
- Zero critical test failures
- Performance targets met
- Accessibility standards compliance
- Cross-browser compatibility confirmed