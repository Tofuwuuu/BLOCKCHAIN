import { DashboardStats, RecentOrder } from './api';

// Mock data for testing when backend is not available
export const mockDashboardStats: DashboardStats = {
  pending_orders: 5,
  approved_orders: 12,
  low_inventory: 3,
  recent_orders: [
    {
      id: 1,
      po_number: "PO-20250101-001",
      supplier: { name: "TechDistributors Inc" },
      date_created: "2025-01-01T10:30:00Z",
      status: "Draft",
      total_amount: 60000.00
    },
    {
      id: 2,
      po_number: "PO-20250101-002",
      supplier: { name: "ABC Supplies" },
      date_created: "2025-01-02T14:15:00Z",
      status: "Pending",
      total_amount: 45000.00
    },
    {
      id: 3,
      po_number: "PO-20250101-003",
      supplier: { name: "Metro Manila Electronics" },
      date_created: "2025-01-03T09:45:00Z",
      status: "Approved",
      total_amount: 75000.00
    },
    {
      id: 4,
      po_number: "PO-20250101-004",
      supplier: { name: "Philippine Office Solutions" },
      date_created: "2025-01-04T16:20:00Z",
      status: "Completed",
      total_amount: 32000.00
    }
  ]
};

export const mockUser = {
  id: 1,
  username: "admin",
  full_name: "Juan Dela Cruz",
  position: "Procurement Manager",
  department: "Procurement",
  is_admin: true
};
