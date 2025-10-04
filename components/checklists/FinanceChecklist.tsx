import React from 'react';
import BaseChecklist, { ChecklistSection } from './BaseChecklist';
import { UserRole } from '../../roleMapping';

interface FinanceChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
}

const FINANCE_CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    id: 'cash_management',
    category: 'Cash Management',
    objective: 'Proper cash handling and reconciliation procedures',
    maxScore: 20,
    items: [
      {
        id: 'daily_cash_reconciliation',
        text: 'Daily cash reconciliation completed and documented',
        score: 3,
        answer: ''
      },
      {
        id: 'cash_drawer_balancing',
        text: 'Cash drawer balancing performed at shift changes',
        score: 3,
        answer: ''
      },
      {
        id: 'petty_cash_management',
        text: 'Petty cash properly managed with supporting receipts',
        score: 2,
        answer: ''
      },
      {
        id: 'cash_security_measures',
        text: 'Cash security measures in place and followed',
        score: 3,
        answer: ''
      },
      {
        id: 'cash_deposit_procedures',
        text: 'Daily cash deposit procedures followed and documented',
        score: 3,
        answer: ''
      },
      {
        id: 'cash_variance_reporting',
        text: 'Cash variances investigated and reported promptly',
        score: 2,
        answer: ''
      },
      {
        id: 'change_fund_maintenance',
        text: 'Adequate change fund maintained at all times',
        score: 2,
        answer: ''
      },
      {
        id: 'counterfeit_detection',
        text: 'Counterfeit currency detection procedures in place',
        score: 2,
        answer: ''
      }
    ]
  },
  {
    id: 'sales_revenue',
    category: 'Sales & Revenue Tracking',
    objective: 'Accurate sales recording and revenue management',
    maxScore: 18,
    items: [
      {
        id: 'daily_sales_reporting',
        text: 'Daily sales reports generated and reviewed accurately',
        score: 3,
        answer: ''
      },
      {
        id: 'pos_system_reconciliation',
        text: 'POS system data reconciled with physical cash',
        score: 3,
        answer: ''
      },
      {
        id: 'promotional_discount_tracking',
        text: 'Promotional discounts properly tracked and authorized',
        score: 2,
        answer: ''
      },
      {
        id: 'refund_void_procedures',
        text: 'Refund and void transaction procedures followed',
        score: 3,
        answer: ''
      },
      {
        id: 'revenue_trend_analysis',
        text: 'Revenue trend analysis conducted regularly',
        score: 2,
        answer: ''
      },
      {
        id: 'sales_tax_compliance',
        text: 'Sales tax calculations accurate and compliant',
        score: 3,
        answer: ''
      },
      {
        id: 'gift_card_loyalty_tracking',
        text: 'Gift card and loyalty program transactions tracked properly',
        score: 2,
        answer: ''
      }
    ]
  },
  {
    id: 'inventory_costing',
    category: 'Inventory & Cost Management',
    objective: 'Accurate inventory valuation and cost control',
    maxScore: 22,
    items: [
      {
        id: 'inventory_valuation',
        text: 'Regular inventory valuation conducted and documented',
        score: 4,
        answer: ''
      },
      {
        id: 'cost_of_goods_sold',
        text: 'Cost of goods sold calculated accurately',
        score: 3,
        answer: ''
      },
      {
        id: 'waste_shrinkage_tracking',
        text: 'Waste and shrinkage properly tracked and analyzed',
        score: 3,
        answer: ''
      },
      {
        id: 'supplier_invoice_reconciliation',
        text: 'Supplier invoices reconciled with purchase orders',
        score: 3,
        answer: ''
      },
      {
        id: 'inventory_turnover_analysis',
        text: 'Inventory turnover analysis performed regularly',
        score: 2,
        answer: ''
      },
      {
        id: 'pricing_strategy_review',
        text: 'Pricing strategy reviewed based on cost analysis',
        score: 2,
        answer: ''
      },
      {
        id: 'vendor_payment_terms',
        text: 'Vendor payment terms tracked and optimized',
        score: 2,
        answer: ''
      },
      {
        id: 'purchase_authorization_controls',
        text: 'Purchase authorization controls in place and followed',
        score: 3,
        answer: ''
      }
    ]
  },
  {
    id: 'financial_reporting',
    category: 'Financial Reporting & Compliance',
    objective: 'Accurate financial reporting and regulatory compliance',
    maxScore: 20,
    items: [
      {
        id: 'monthly_financial_statements',
        text: 'Monthly financial statements prepared accurately and timely',
        score: 4,
        answer: ''
      },
      {
        id: 'budget_variance_analysis',
        text: 'Budget vs actual variance analysis conducted',
        score: 3,
        answer: ''
      },
      {
        id: 'profit_loss_analysis',
        text: 'Profit and loss analysis by product/category performed',
        score: 3,
        answer: ''
      },
      {
        id: 'tax_compliance',
        text: 'All tax filings completed on time and accurately',
        score: 4,
        answer: ''
      },
      {
        id: 'financial_controls_documentation',
        text: 'Financial controls documented and regularly reviewed',
        score: 2,
        answer: ''
      },
      {
        id: 'audit_trail_maintenance',
        text: 'Proper audit trail maintained for all transactions',
        score: 2,
        answer: ''
      },
      {
        id: 'regulatory_compliance_monitoring',
        text: 'Regulatory compliance monitoring active and current',
        score: 2,
        answer: ''
      }
    ]
  },
  {
    id: 'expense_management',
    category: 'Expense Management',
    objective: 'Effective expense control and monitoring',
    maxScore: 16,
    items: [
      {
        id: 'operating_expense_tracking',
        text: 'Operating expenses tracked and categorized properly',
        score: 3,
        answer: ''
      },
      {
        id: 'expense_approval_workflow',
        text: 'Expense approval workflow followed for all expenditures',
        score: 3,
        answer: ''
      },
      {
        id: 'utility_cost_monitoring',
        text: 'Utility costs monitored and optimized',
        score: 2,
        answer: ''
      },
      {
        id: 'maintenance_cost_tracking',
        text: 'Maintenance and repair costs tracked by category',
        score: 2,
        answer: ''
      },
      {
        id: 'payroll_expense_verification',
        text: 'Payroll expenses verified against attendance and hours',
        score: 3,
        answer: ''
      },
      {
        id: 'contract_service_costs',
        text: 'Contract service costs reviewed and verified',
        score: 2,
        answer: ''
      },
      {
        id: 'expense_trend_analysis',
        text: 'Expense trend analysis conducted for cost optimization',
        score: 1,
        answer: ''
      }
    ]
  },
  {
    id: 'internal_controls',
    category: 'Internal Controls & Risk Management',
    objective: 'Strong internal controls and financial risk mitigation',
    maxScore: 14,
    items: [
      {
        id: 'segregation_of_duties',
        text: 'Proper segregation of duties in financial processes',
        score: 3,
        answer: ''
      },
      {
        id: 'authorization_limits',
        text: 'Authorization limits defined and enforced',
        score: 3,
        answer: ''
      },
      {
        id: 'financial_data_backup',
        text: 'Financial data backed up regularly and securely',
        score: 2,
        answer: ''
      },
      {
        id: 'fraud_prevention_measures',
        text: 'Fraud prevention measures implemented and monitored',
        score: 3,
        answer: ''
      },
      {
        id: 'document_retention_policy',
        text: 'Financial document retention policy followed',
        score: 2,
        answer: ''
      },
      {
        id: 'internal_audit_compliance',
        text: 'Internal audit recommendations implemented',
        score: 1,
        answer: ''
      }
    ]
  }
];

const FinanceChecklist: React.FC<FinanceChecklistProps> = ({ userRole, onStatsUpdate }) => {
  return (
    <BaseChecklist
      userRole={userRole}
      checklistType="finance"
      title="Finance Checklist"
      sections={FINANCE_CHECKLIST_SECTIONS}
      onStatsUpdate={onStatsUpdate}
    />
  );
};

export default FinanceChecklist;