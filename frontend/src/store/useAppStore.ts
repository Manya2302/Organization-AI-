import { create } from 'zustand'

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SuperAdmin' | 'EnterpriseAdmin' | 'DepartmentManager' | 'Employee';
  department?: string;
  designation?: string;
  employeeId?: string;
  joiningDate?: string;
  profilePhoto?: string;
  skills?: string[];
  mobileNumber?: string;
}

export interface DocumentVersion {
  version: number;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: string;
}

export interface Document {
  id: string;
  name: string;
  size: string;
  type: string;
  category: string;
  tags: string[];
  department: string;
  uploadedBy: string;
  uploadedAt: string;
  version: number;
  versions: DocumentVersion[];
  ocrText?: string;
  isDeleted: boolean;
  ownerId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

interface AppState {
  // Auth
  user: User | null;
  employees: User[];
  departments: string[];
  login: (role: User['role'], email: string, orgId?: string, empId?: string) => Promise<boolean>;
  logout: () => void;
  registerOrganization: (data: any) => Promise<boolean>;
  registerEmployee: (data: any) => Promise<boolean>;
  addEmployee: (employee: Omit<User, 'id'>) => void;
  updateEmployee: (id: string, updated: Partial<User>) => void;
  deleteEmployee: (id: string) => void;
  updateProfile: (updated: Partial<User>) => void;

  // Documents
  documents: Document[];
  uploadDocument: (file: { name: string; size: number; type: string }, category: string, tags: string[], department: string) => void;
  deleteDocument: (id: string) => void;
  restoreDocument: (id: string) => void;
  addNewVersion: (id: string, fileName: string, fileSize: string) => void;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string) => void;

  // Notifications
  notifications: AppNotification[];
  addNotification: (message: string, type: AppNotification['type']) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const mockEmployees: User[] = [
  { id: '1', employeeId: 'EMP001', name: 'Alok Sharma', email: 'alok@cognivault.ai', role: 'EnterpriseAdmin', designation: 'Director of IT', joiningDate: '2025-01-10', mobileNumber: '+91 98765 43210', skills: ['Management', 'Cloud Security'] },
  { id: '2', employeeId: 'EMP002', name: 'Priya Patel', email: 'priya@cognivault.ai', role: 'DepartmentManager', department: 'Legal', designation: 'Lead Legal Counsel', joiningDate: '2025-03-15', mobileNumber: '+91 98765 43211', skills: ['Contract Law', 'Compliance'] },
  { id: '3', employeeId: 'EMP003', name: 'Rohan Verma', email: 'rohan@cognivault.ai', role: 'Employee', department: 'Finance', designation: 'Senior Accountant', joiningDate: '2025-05-20', mobileNumber: '+91 98765 43212', skills: ['Taxation', 'Excel', 'Audit'] },
  { id: '4', employeeId: 'EMP004', name: 'Neha Gupta', email: 'neha@cognivault.ai', role: 'Employee', department: 'HR', designation: 'Talent Acquisition', joiningDate: '2026-02-01', mobileNumber: '+91 98765 43213', skills: ['Recruiting', 'Onboarding'] }
];

const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    name: 'DPDP_Compliance_Framework_v1.pdf',
    size: '2.4 MB',
    type: 'application/pdf',
    category: 'Compliance',
    tags: ['DPDP', 'Policy', 'Regulations'],
    department: 'Legal',
    uploadedBy: 'Priya Patel',
    uploadedAt: '2026-05-10 14:32',
    version: 1,
    versions: [{ version: 1, fileName: 'DPDP_Compliance_Framework_v1.pdf', uploadedAt: '2026-05-10 14:32', uploadedBy: 'Priya Patel', fileSize: '2.4 MB' }],
    ocrText: 'Digital Personal Data Protection Act compliance framework details. Section 4: Notice and Consent. Under the DPDP Act 2023, data fiduciaries must provide clear notice to data principals explaining what data is collected and for what specific purposes. Section 8: Obligations of Data Fiduciaries including data accuracy, security safeguards, and deletion protocols.',
    isDeleted: false,
    ownerId: '2'
  },
  {
    id: 'doc-2',
    name: 'Q4_Financial_Audit_Report.xlsx',
    size: '1.8 MB',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'Finance',
    tags: ['Audit', 'Q4', 'Financials'],
    department: 'Finance',
    uploadedBy: 'Rohan Verma',
    uploadedAt: '2026-05-18 10:15',
    version: 2,
    versions: [
      { version: 1, fileName: 'Q4_Financial_Audit_Report_draft.xlsx', uploadedAt: '2026-05-15 09:00', uploadedBy: 'Rohan Verma', fileSize: '1.7 MB' },
      { version: 2, fileName: 'Q4_Financial_Audit_Report.xlsx', uploadedAt: '2026-05-18 10:15', uploadedBy: 'Rohan Verma', fileSize: '1.8 MB' }
    ],
    ocrText: 'Quarterly financial statements showing overall balance sheet, Profit and Loss statements, cash flow statement for FY 2025-2026. Total revenue reported at ₹45,20,00,000 with net margin of 18.5%. Operating costs reduced by 4%. Tax liabilities adjusted as per current norms.',
    isDeleted: false,
    ownerId: '3'
  },
  {
    id: 'doc-3',
    name: 'Employee_Onboarding_SOP.docx',
    size: '950 KB',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    category: 'HR',
    tags: ['SOP', 'Onboarding', 'HR'],
    department: 'HR',
    uploadedBy: 'Neha Gupta',
    uploadedAt: '2026-05-24 16:45',
    version: 1,
    versions: [{ version: 1, fileName: 'Employee_Onboarding_SOP.docx', uploadedAt: '2026-05-24 16:45', uploadedBy: 'Neha Gupta', fileSize: '950 KB' }],
    ocrText: 'Standard Operating Procedure for Employee Onboarding. Step 1: IT Asset allocation. Step 2: Policy acknowledgment and signing of NDA. Step 3: Verification of certificates. Step 4: CogniVault account creation and role assignment (Enterprise Admin must invite). Step 5: Department training.',
    isDeleted: false,
    ownerId: '4'
  }
];

const mockAuditLogs: AuditLog[] = [
  { id: 'l-1', timestamp: '2026-06-01 19:10:45', user: 'Alok Sharma', role: 'EnterpriseAdmin', action: 'User Created', details: 'Added new employee account EMP004 (Neha Gupta)', ipAddress: '192.168.1.15' },
  { id: 'l-2', timestamp: '2026-06-01 18:05:12', user: 'Priya Patel', role: 'DepartmentManager', action: 'Document Uploaded', details: 'Uploaded DPDP_Compliance_Framework_v1.pdf with OCR extract auto-completed', ipAddress: '192.168.1.45' },
  { id: 'l-3', timestamp: '2026-06-01 17:30:00', user: 'Rohan Verma', role: 'Employee', action: 'Document Version Added', details: 'Updated Q4_Financial_Audit_Report.xlsx to version 2', ipAddress: '192.168.1.28' },
  { id: 'l-4', timestamp: '2026-06-01 15:22:11', user: 'Alok Sharma', role: 'EnterpriseAdmin', action: 'Login Successful', details: 'Authorized via OTP validation', ipAddress: '192.168.1.15' }
];

const mockNotifications: AppNotification[] = [
  { id: 'n-1', message: 'New employee Neha Gupta registered in HR department.', type: 'info', timestamp: '2026-06-01 19:10', read: false },
  { id: 'n-2', message: 'OCR Engine completed scanning "DPDP_Compliance_Framework_v1.pdf". 148 terms indexed.', type: 'success', timestamp: '2026-06-01 18:06', read: false },
  { id: 'n-3', message: 'Warning: Storage allocation has crossed 75% for Legal department.', type: 'warning', timestamp: '2026-06-01 12:00', read: true }
];

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  employees: mockEmployees,
  departments: ['Legal', 'Finance', 'HR', 'Engineering', 'Marketing'],
  documents: mockDocuments,
  auditLogs: mockAuditLogs,
  notifications: mockNotifications,
  searchQuery: '',
  theme: 'dark',
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    set({ theme: nextTheme });
  },

  login: async (role, email, _orgId, empId) => {
    // Mock login delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    let loggedInUser: User | null = null;

    if (role === 'SuperAdmin') {
      loggedInUser = {
        id: 'super-admin-0',
        name: 'Super Admin',
        email: email || 'admin@securevault.ai',
        role: 'SuperAdmin',
        designation: 'Global Platform Admin'
      };
    } else {
      // Try to find in mock list
      const matched = get().employees.find(e => e.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        loggedInUser = matched;
      } else {
        loggedInUser = {
          id: String(Date.now()),
          employeeId: empId || 'EMP' + Math.floor(Math.random() * 1000),
          name: email.split('@')[0].toUpperCase(),
          email: email,
          role: role,
          department: role === 'EnterpriseAdmin' ? undefined : 'Engineering',
          designation: role === 'EnterpriseAdmin' ? 'Administrator' : 'Consultant',
          joiningDate: new Date().toISOString().split('T')[0],
          mobileNumber: '+91 99999 88888',
          skills: ['Office', 'Security']
        };
      }
    }

    set({ user: loggedInUser });
    get().addAuditLog('Login Successful', `User ${loggedInUser.name} logged in as ${role}. IP Address verified.`);
    get().addNotification(`Welcome back, ${loggedInUser.name}!`, 'success');
    return true;
  },

  logout: () => {
    const currentUser = get().user;
    if (currentUser) {
      get().addAuditLog('Logout Successful', `User ${currentUser.name} logged out.`);
    }
    set({ user: null });
  },

  registerOrganization: async (data) => {
    await new Promise(r => setTimeout(r, 1200));
    // Scaffold audit log
    get().addAuditLog('Organization Registered', `New enterprise "${data.companyName}" registered. Admin account created.`);
    return true;
  },

  registerEmployee: async (data) => {
    await new Promise(r => setTimeout(r, 1000));
    const newEmp: User = {
      id: String(Date.now()),
      employeeId: data.employeeId,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      role: 'Employee',
      department: data.department,
      designation: data.designation,
      joiningDate: new Date().toISOString().split('T')[0],
      mobileNumber: data.mobileNumber,
      skills: []
    };
    set(state => ({ employees: [...state.employees, newEmp] }));
    get().addAuditLog('Employee Self-Registered', `Employee ${newEmp.name} registered and requested activation.`);
    return true;
  },

  addEmployee: (employee) => {
    const newEmp: User = {
      ...employee,
      id: String(Date.now())
    };
    set(state => ({ employees: [...state.employees, newEmp] }));
    get().addAuditLog('Employee Created', `Created account for ${newEmp.name} (${newEmp.role})`);
    get().addNotification(`New team member ${newEmp.name} added.`, 'info');
  },

  updateEmployee: (id, updated) => {
    set(state => ({
      employees: state.employees.map(e => e.id === id ? { ...e, ...updated } : e)
    }));
    get().addAuditLog('Employee Updated', `Modified settings for user ID ${id}`);
  },

  deleteEmployee: (id) => {
    const matched = get().employees.find(e => e.id === id);
    set(state => ({
      employees: state.employees.filter(e => e.id !== id)
    }));
    if (matched) {
      get().addAuditLog('Employee Deleted', `Removed employee account: ${matched.name}`);
      get().addNotification(`Employee ${matched.name} has been removed.`, 'warning');
    }
  },

  updateProfile: (updated) => {
    const current = get().user;
    if (current) {
      const newUser = { ...current, ...updated };
      set({ user: newUser });
      // Update in employee array too
      set(state => ({
        employees: state.employees.map(e => e.id === current.id ? { ...e, ...updated } : e)
      }));
      get().addAuditLog('Profile Updated', `User ${current.name} updated profile details.`);
      get().addNotification('Your profile has been updated.', 'success');
    }
  },

  uploadDocument: (file, category, tags, department) => {
    const current = get().user;
    const name = current ? current.name : 'System';
    const newDoc: Document = {
      id: 'doc-' + Date.now(),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type || 'application/octet-stream',
      category: category || 'General',
      tags: tags.length > 0 ? tags : ['General'],
      department: department || 'General',
      uploadedBy: name,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      version: 1,
      versions: [{
        version: 1,
        fileName: file.name,
        uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        uploadedBy: name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      }],
      isDeleted: false,
      ownerId: current ? current.id : '1',
      // Trigger dynamic mock OCR text based on document title
      ocrText: `Extracted content from ${file.name}. Invoice details, vendor reference code SV-${Math.floor(Math.random() * 9000 + 1000)}. This text has been successfully index by the PaddleOCR processing pipeline for full-text AI search capability. All parameters parsed.`
    };

    set(state => ({ documents: [newDoc, ...state.documents] }));
    get().addAuditLog('Document Uploaded', `Uploaded document: ${file.name}. OCR scanning completed.`);
    get().addNotification(`File "${file.name}" uploaded successfully. Text extracted.`, 'success');
  },

  deleteDocument: (id) => {
    const matched = get().documents.find(d => d.id === id);
    set(state => ({
      documents: state.documents.map(d => d.id === id ? { ...d, isDeleted: true } : d)
    }));
    if (matched) {
      get().addAuditLog('Document Deleted', `Moved document "${matched.name}" to trash.`);
      get().addNotification(`"${matched.name}" moved to Trash.`, 'warning');
    }
  },

  restoreDocument: (id) => {
    const matched = get().documents.find(d => d.id === id);
    set(state => ({
      documents: state.documents.map(d => d.id === id ? { ...d, isDeleted: false } : d)
    }));
    if (matched) {
      get().addAuditLog('Document Restored', `Restored document "${matched.name}" from trash.`);
      get().addNotification(`"${matched.name}" restored successfully.`, 'success');
    }
  },

  addNewVersion: (id, fileName, fileSize) => {
    const current = get().user;
    const name = current ? current.name : 'System';
    set(state => ({
      documents: state.documents.map(doc => {
        if (doc.id === id) {
          const nextVer = doc.version + 1;
          const newVInfo = {
            version: nextVer,
            fileName: fileName,
            uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
            uploadedBy: name,
            fileSize: fileSize
          };
          return {
            ...doc,
            name: fileName,
            size: fileSize,
            version: nextVer,
            versions: [newVInfo, ...doc.versions],
            ocrText: `Extracted content from new version ${nextVer} of document: ${fileName}. Updates parsed. New terms index for search.`
          };
        }
        return doc;
      })
    }));

    const doc = get().documents.find(d => d.id === id);
    if (doc) {
      get().addAuditLog('Document Version Added', `Added version ${doc.version + 1} to document "${doc.name}"`);
      get().addNotification(`New version of "${doc.name}" uploaded.`, 'success');
    }
  },

  addAuditLog: (action, details) => {
    const current = get().user;
    const newLog: AuditLog = {
      id: 'l-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: current ? current.name : 'System/Guest',
      role: current ? current.role : 'Guest',
      action: action,
      details: details,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 254 + 1)
    };
    set(state => ({ auditLogs: [newLog, ...state.auditLogs] }));
  },

  addNotification: (message, type) => {
    const newNotif: AppNotification = {
      id: 'n-' + Date.now(),
      message,
      type,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      read: false
    };
    set(state => ({ notifications: [newNotif, ...state.notifications] }));
  },

  markNotificationAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  }
}));
