// ============================================================
// Core Domain Entity: User
// ============================================================
export class User {
  constructor(data) {
    this.id = data.id;
    this.organizationId = data.organization_id || data.organizationId;
    this.employeeId = data.employee_id || data.employeeId;
    this.name = data.name;
    this.email = data.email;
    this.role = data.role;
    this.department = data.department;
    this.designation = data.designation;
    this.joiningDate = data.joining_date || data.joiningDate;
    this.mobileNumber = data.mobile_number || data.mobileNumber;
    this.profilePhoto = data.profile_photo || data.profilePhoto;
    this.skills = data.skills || [];
    this.permissions = data.permissions || {};
    this.isActive = data.is_active ?? data.isActive ?? true;
    this.isVerified = data.is_verified ?? data.isVerified ?? false;
    this.lastLoginAt = data.last_login_at || data.lastLoginAt;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // Sanitize: never expose password hash to client
  toPublicJSON() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      employeeId: this.employeeId,
      name: this.name,
      email: this.email,
      role: this.role,
      department: this.department,
      designation: this.designation,
      joiningDate: this.joiningDate,
      mobileNumber: this.mobileNumber,
      profilePhoto: this.profilePhoto,
      skills: this.skills,
      isActive: this.isActive,
      isVerified: this.isVerified,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt
    };
  }

  canAccessDepartment(department) {
    if (['SuperAdmin', 'EnterpriseAdmin'].includes(this.role)) return true;
    if (this.role === 'DepartmentManager') return this.department === department;
    return this.department === department;
  }

  hasPermission(permission) {
    if (this.role === 'SuperAdmin') return true;
    return this.permissions[permission] === true;
  }
}

export class Organization {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.slug = data.slug;
    this.companyType = data.company_type || data.companyType;
    this.industry = data.industry;
    this.gstNumber = data.gst_number || data.gstNumber;
    this.companyEmail = data.company_email || data.companyEmail;
    this.contactNumber = data.contact_number || data.contactNumber;
    this.address = data.address;
    this.city = data.city;
    this.state = data.state;
    this.country = data.country || 'India';
    this.numberOfEmployees = data.number_of_employees || data.numberOfEmployees;
    this.logoUrl = data.logo_url || data.logoUrl;
    this.isActive = data.is_active ?? true;
    this.subscriptionPlan = data.subscription_plan || data.subscriptionPlan || 'community';
    this.maxStorageGb = data.max_storage_gb || data.maxStorageGb || 10;
    this.maxUsers = data.max_users || data.maxUsers || 50;
    this.settings = data.settings || {};
    this.createdAt = data.created_at || data.createdAt;
  }
}
