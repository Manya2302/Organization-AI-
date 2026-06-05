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
  login: (role: User['role'], email: string, orgId?: string, empId?: string, password?: string, otpCode?: string) => Promise<boolean>;
  googleLogin: (email: string, name: string) => Promise<boolean>;
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

  login: async (role, email, orgId, empId, password, otpCode) => {
    // 1. Try to login via Backend API
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, organizationId: orgId, employeeId: empId, otp: otpCode })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (data.accessToken) {
          localStorage.setItem('sv_access_token', data.accessToken);
        }
        const userWithRole: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          department: data.user.department,
          designation: data.user.designation,
          employeeId: data.user.employeeId,
          profilePhoto: data.user.profilePhoto
        };
        set({ user: userWithRole });
        get().addAuditLog('Login Successful', `User ${data.user.name} logged in successfully via API.`);
        get().addNotification(`Welcome back, ${data.user.name}!`, 'success');
        return true;
      } else {
        get().addNotification(data.message || 'Login failed', 'error');
        return false;
      }
    } catch (apiErr) {
      // 2. Fallback to mock validation
      console.warn('Backend API offline. Falling back to local mock authentication...');
      await new Promise((resolve) => setTimeout(resolve, 800));

      let loggedInUser: User | null = null;
      const lowerEmail = email.toLowerCase();

      // Super Admin check
      if (lowerEmail === 'manyaparikh23@gmail.com') {
        if (password !== 'admin@123') {
          get().addNotification('Invalid credentials for Super Admin.', 'error');
          return false;
        }
        loggedInUser = {
          id: 'super-admin-0',
          name: 'Manya Parikh',
          email: email,
          role: 'SuperAdmin',
          designation: 'Global Platform Admin'
        };
      } else {
        const matched = get().employees.find(e => e.email.toLowerCase() === lowerEmail);
        if (matched) {
          // STRICT ROLE VALIDATION
          if (role === 'EnterpriseAdmin' && matched.role !== 'EnterpriseAdmin') {
            get().addNotification(`Login failed: ${email} is not authorized as an Enterprise Admin.`, 'error');
            return false;
          }
          if (role === 'Employee' && matched.role === 'EnterpriseAdmin') {
            get().addNotification(`Login failed: Enterprise Admin accounts must log in through the Admin Portal.`, 'error');
            return false;
          }

          // STRICT ORG ID VALIDATION FOR ADMIN
          if (role === 'EnterpriseAdmin' && orgId) {
            const orgClean = orgId.toLowerCase().trim();
            if (orgClean !== 'org-1001' && orgClean !== 'acme-tech-solutions' && orgClean !== 'acme-tech-solutions-pvt-ltd') {
              get().addNotification('Invalid Organization ID or slug.', 'error');
              return false;
            }
          }

          // STRICT EMPLOYEE ID VALIDATION
          if (role === 'Employee' && empId) {
            const empClean = empId.toLowerCase().trim();
            if ((matched.employeeId || '').toLowerCase().trim() !== empClean) {
              get().addNotification('Invalid Employee ID.', 'error');
              return false;
            }
          }

          loggedInUser = matched;
        } else {
          // If not matching seeded mock list, require correct orgId or empId format
          if (role === 'EnterpriseAdmin') {
            const orgClean = (orgId || '').toLowerCase().trim();
            if (orgClean !== 'org-1001' && orgClean !== 'acme-tech-solutions') {
              get().addNotification('Invalid Organization ID or slug.', 'error');
              return false;
            }
          } else {
            const empClean = (empId || '').toLowerCase().trim();
            if (!empClean.startsWith('emp')) {
              get().addNotification('Invalid Employee ID format (must start with EMP).', 'error');
              return false;
            }
          }

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
      get().addAuditLog('Login Successful', `User ${loggedInUser.name} logged in as ${role}. (Local Mode)`);
      get().addNotification(`Welcome back, ${loggedInUser.name}! (Local)`, 'success');
      return true;
    }
  },

  googleLogin: async (email, name) => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (data.accessToken) {
          localStorage.setItem('sv_access_token', data.accessToken);
        }
        const userWithRole: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          department: data.user.department,
          designation: data.user.designation,
          employeeId: data.user.employeeId,
          profilePhoto: data.user.profilePhoto
        };
        set({ user: userWithRole });
        get().addAuditLog('Login Successful', `User ${data.user.name} logged in via Google SSO.`);
        get().addNotification(`Welcome back, ${data.user.name}! (Google)`, 'success');
        return true;
      } else {
        get().addNotification(data.message || 'Google Login failed', 'error');
        return false;
      }
    } catch (apiErr) {
      console.warn('Backend API offline. Falling back to local Google login simulation...');
      const lowerEmail = email.toLowerCase();
      let role: 'Employee' | 'EnterpriseAdmin' | 'SuperAdmin' | 'DepartmentManager' = 'Employee';
      let designation = 'Software Developer';
      let department = 'Engineering';

      if (lowerEmail === 'manyaparikh23@gmail.com') {
        role = 'SuperAdmin';
        designation = 'Global Platform Admin';
        department = 'System Operations';
      } else {
        const matched = get().employees.find(e => e.email.toLowerCase() === lowerEmail);
        if (matched) {
          role = matched.role as any;
          designation = matched.designation || 'Consultant';
          department = matched.department || 'Engineering';
        } else if (lowerEmail.includes('admin') || lowerEmail.includes('alok')) {
          role = 'EnterpriseAdmin';
          designation = 'Director of IT';
          department = 'Management';
        }
      }

      const loggedInUser: User = {
        id: 'google-user-' + Date.now(),
        name: name || email.split('@')[0].toUpperCase(),
        email: email,
        role: role,
        department: department || undefined,
        designation: designation,
        joiningDate: new Date().toISOString().split('T')[0],
        mobileNumber: '+91 99999 88888',
        skills: ['Cloud', 'React']
      };
      set({ user: loggedInUser });
      get().addAuditLog('Login Successful', `User ${loggedInUser.name} logged in via Google (${role}) (Local Mode).`);
      get().addNotification(`Welcome back, ${loggedInUser.name}! (Google Local)`, 'success');
      return true;
    }
  },

  logout: () => {
    const currentUser = get().user;
    fetch('http://localhost:5000/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('sv_access_token')}`
      }
    }).catch(() => {});
    localStorage.removeItem('sv_access_token');
    if (currentUser) {
      get().addAuditLog('Logout Successful', `User ${currentUser.name} logged out.`);
    }
    set({ user: null });
  },

  registerOrganization: async (data) => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/register-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        get().addAuditLog('Organization Registered', `New enterprise "${data.companyName}" registered via API.`);
        get().addNotification(`Organization registered successfully!`, 'success');
        return true;
      } else {
        get().addNotification(resData.message || 'Registration failed', 'error');
        return false;
      }
    } catch (err) {
      console.warn('Backend API offline. Using mock registration...');
      await new Promise(r => setTimeout(r, 1200));
      get().addAuditLog('Organization Registered', `New enterprise "${data.companyName}" registered. Admin account created (Local Mode).`);
      get().addNotification(`Organization registered successfully! (Local)`, 'success');
      return true;
    }
  },

  registerEmployee: async (data) => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/register-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        get().addAuditLog('Employee Self-Registered', `Employee ${data.firstName} ${data.lastName} registered via API.`);
        get().addNotification(`Self-registered successfully!`, 'success');
        return true;
      } else {
        get().addNotification(resData.message || 'Registration failed', 'error');
        return false;
      }
    } catch (err) {
      console.warn('Backend API offline. Using mock registration...');
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
      get().addAuditLog('Employee Self-Registered', `Employee ${newEmp.name} registered and requested activation (Local Mode).`);
      get().addNotification(`Self-registered successfully! (Local)`, 'success');
      return true;
    }
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
