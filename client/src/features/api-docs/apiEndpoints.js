export const apiSections = [
  {
    id: 'introduction',
    title: 'Introduction',
    description: 'Overview of the MediTrack API, authentication, and base URL configuration.',
  },
  {
    id: 'authentication',
    title: 'Authentication',
    description: 'User registration, login, OAuth, and session management endpoints.',
  },
  {
    id: 'appointments',
    title: 'Appointments',
    description: 'Manage medical appointments and doctor visits.',
  },
  {
    id: 'family',
    title: 'Family Members',
    description: 'Manage family member profiles and relationships.',
  },
  {
    id: 'medications',
    title: 'Medications',
    description: 'Manage medication database and medication records.',
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Upload and manage medical reports and documents.',
  },
  {
    id: 'health-data',
    title: 'Health Data',
    description: 'Record and retrieve health metrics and vital signs.',
  },
  {
    id: 'plans',
    title: 'Plans',
    description: 'Manage medication plans for family members.',
  },
  {
    id: 'purchase-list',
    title: 'Purchase List',
    description: 'Manage medication purchase lists and logs.',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Get AI-powered health analytics and insights.',
  },
  {
    id: 'ocr',
    title: 'OCR',
    description: 'Extract text from medical document images.',
  },
  {
    id: 'pdf',
    title: 'PDF Generation',
    description: 'Generate PDF reports from health data.',
  },
  {
    id: 'errors',
    title: 'Errors',
    description: 'Error response formats and status codes.',
  },
];

export const apiEndpoints = {
  introduction: {
    content: `
# MediTrack API Documentation

Welcome to the MediTrack API documentation. This API allows you to manage family health records, medication schedules, and medical documents programmatically.

## Base URL

The API base URL depends on your environment:

- **Development**: \`http://localhost:5000/api\`
- **Production**: \`https://meditrack-server-alpha.vercel.app/api\`

You can configure the base URL using the \`VITE_API_URL\` environment variable.

## Authentication

Most endpoints require authentication using a Bearer token. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

Tokens are obtained through the authentication endpoints. See the Authentication section for details.

## Rate Limiting

API requests are rate-limited to prevent abuse. If you exceed the rate limit, you'll receive a \`429 Too Many Requests\` response.

## Response Format

All successful responses return JSON data. Error responses include a \`message\` field describing the error.

## Versioning

The current API version is **v1**. All endpoints are prefixed with \`/api\`.
    `,
  },
  authentication: {
    endpoints: [
      {
        method: 'POST',
        path: '/auth/register',
        title: 'Register New User',
        description: 'Create a new user account with email and password.',
        requiresAuth: false,
        parameters: [
          { name: 'email', type: 'string', required: true, description: 'User email address' },
          { name: 'password', type: 'string', required: true, description: 'Password (minimum 6 characters)' },
          { name: 'displayName', type: 'string', required: false, description: 'User display name' },
        ],
        exampleRequest: {
          email: 'user@example.com',
          password: 'password123',
          displayName: 'John Doe',
        },
        exampleResponse: {
          user: {
            id: 'usr_123',
            email: 'user@example.com',
            displayName: 'John Doe',
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          deviceToken: 'dev_123',
        },
      },
      {
        method: 'POST',
        path: '/auth/login',
        title: 'Login',
        description: 'Authenticate with email and password.',
        requiresAuth: false,
        parameters: [
          { name: 'email', type: 'string', required: true, description: 'User email address' },
          { name: 'password', type: 'string', required: true, description: 'User password' },
        ],
        exampleRequest: {
          email: 'user@example.com',
          password: 'password123',
        },
        exampleResponse: {
          user: {
            id: 'usr_123',
            email: 'user@example.com',
            displayName: 'John Doe',
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          deviceToken: 'dev_123',
        },
      },
      {
        method: 'GET',
        path: '/auth/me',
        title: 'Get Current User',
        description: 'Get the currently authenticated user information.',
        requiresAuth: true,
        exampleResponse: {
          user: {
            id: 'usr_123',
            email: 'user@example.com',
            displayName: 'John Doe',
            createdAt: '2024-01-01T00:00:00Z',
          },
        },
      },
      {
        method: 'POST',
        path: '/auth/refresh',
        title: 'Refresh Token',
        description: 'Refresh the access token using a refresh token.',
        requiresAuth: false,
        parameters: [
          { name: 'refreshToken', type: 'string', required: true, description: 'Refresh token' },
        ],
        exampleRequest: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        exampleResponse: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
      {
        method: 'POST',
        path: '/auth/logout',
        title: 'Logout',
        description: 'Logout the current user and invalidate the session.',
        requiresAuth: true,
        exampleResponse: {
          message: 'Logged out successfully',
        },
      },
      {
        method: 'GET',
        path: '/auth/devices',
        title: 'Get Devices',
        description: 'Get list of devices associated with the user.',
        requiresAuth: true,
        exampleResponse: {
          devices: [
            {
              id: 'dev_123',
              name: 'Chrome on Windows',
              lastActive: '2024-01-01T00:00:00Z',
            },
          ],
        },
      },
      {
        method: 'POST',
        path: '/auth/join-family',
        title: 'Join Family',
        description: 'Join a family group using a referral ID.',
        requiresAuth: true,
        parameters: [
          { name: 'referralId', type: 'string', required: true, description: 'Family referral ID' },
        ],
        exampleRequest: {
          referralId: 'fam_123',
        },
        exampleResponse: {
          message: 'Successfully joined family',
          familyId: 'fam_123',
        },
      },
      {
        method: 'GET',
        path: '/auth/linked-accounts',
        title: 'Get Linked Accounts',
        description: 'Get list of linked accounts (e.g., Google OAuth).',
        requiresAuth: true,
        exampleResponse: {
          accounts: [
            {
              id: 'acc_123',
              provider: 'google',
              email: 'user@gmail.com',
            },
          ],
        },
      },
      {
        method: 'DELETE',
        path: '/auth/data',
        title: 'Clear User Data',
        description: 'Delete all user data. This action cannot be undone.',
        requiresAuth: true,
        exampleResponse: {
          message: 'User data cleared successfully',
        },
      },
    ],
  },
  appointments: {
    endpoints: [
      {
        method: 'GET',
        path: '/appointments',
        title: 'Get Appointments',
        description: 'Get all appointments for the authenticated user.',
        requiresAuth: true,
        exampleResponse: {
          appointments: [
            {
              id: 'apt_123',
              doctor: 'Dr. Smith',
              specialty: 'Cardiology',
              location: 'City Hospital',
              date: '2024-01-15',
              time: '10:00',
              familyMemberId: 'fam_123',
              familyMemberName: 'John Doe',
            },
          ],
        },
      },
      {
        method: 'POST',
        path: '/appointments',
        title: 'Create Appointment',
        description: 'Create a new appointment.',
        requiresAuth: true,
        parameters: [
          { name: 'doctor', type: 'string', required: true, description: 'Doctor name' },
          { name: 'specialty', type: 'string', required: false, description: 'Medical specialty' },
          { name: 'location', type: 'string', required: false, description: 'Appointment location' },
          { name: 'date', type: 'string', required: true, description: 'Date in YYYY-MM-DD format' },
          { name: 'time', type: 'string', required: false, description: 'Appointment time' },
          { name: 'familyMemberId', type: 'string', required: false, description: 'Family member ID' },
          { name: 'familyMemberName', type: 'string', required: false, description: 'Family member name' },
        ],
        exampleRequest: {
          doctor: 'Dr. Smith',
          specialty: 'Cardiology',
          location: 'City Hospital',
          date: '2024-01-15',
          time: '10:00',
          familyMemberId: 'fam_123',
        },
        exampleResponse: {
          appointment: {
            id: 'apt_123',
            doctor: 'Dr. Smith',
            specialty: 'Cardiology',
            location: 'City Hospital',
            date: '2024-01-15',
            time: '10:00',
            familyMemberId: 'fam_123',
          },
        },
      },
      {
        method: 'PUT',
        path: '/appointments/:id',
        title: 'Update Appointment',
        description: 'Update an existing appointment.',
        requiresAuth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Appointment ID (URL parameter)' },
          { name: 'doctor', type: 'string', required: false, description: 'Doctor name' },
          { name: 'specialty', type: 'string', required: false, description: 'Medical specialty' },
          { name: 'location', type: 'string', required: false, description: 'Appointment location' },
          { name: 'date', type: 'string', required: false, description: 'Date in YYYY-MM-DD format' },
          { name: 'time', type: 'string', required: false, description: 'Appointment time' },
        ],
        exampleRequest: {
          doctor: 'Dr. Johnson',
          date: '2024-01-20',
        },
        exampleResponse: {
          appointment: {
            id: 'apt_123',
            doctor: 'Dr. Johnson',
            date: '2024-01-20',
          },
        },
      },
      {
        method: 'DELETE',
        path: '/appointments/:id',
        title: 'Delete Appointment',
        description: 'Delete an appointment.',
        requiresAuth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Appointment ID (URL parameter)' },
        ],
        exampleResponse: {
          message: 'Appointment deleted successfully',
        },
      },
    ],
  },
  family: {
    endpoints: [
      {
        method: 'GET',
        path: '/family',
        title: 'Get Family Members',
        description: 'Get all family members for the authenticated user.',
        requiresAuth: true,
        exampleResponse: {
          familyMembers: [
            {
              id: 'fam_123',
              name: 'John Doe',
              relation: 'Self',
              age: '30',
              lastDoctorVisit: '2024-01-01',
            },
          ],
        },
      },
      {
        method: 'POST',
        path: '/family',
        title: 'Create Family Member',
        description: 'Add a new family member.',
        requiresAuth: true,
        parameters: [
          { name: 'name', type: 'string', required: true, description: 'Family member name' },
          { name: 'relation', type: 'string', required: false, description: 'Relationship (e.g., Self, Spouse, Child)' },
          { name: 'age', type: 'string', required: false, description: 'Age' },
          { name: 'lastDoctorVisit', type: 'string', required: false, description: 'Last doctor visit date' },
        ],
        exampleRequest: {
          name: 'Jane Doe',
          relation: 'Spouse',
          age: '28',
        },
        exampleResponse: {
          familyMember: {
            id: 'fam_456',
            name: 'Jane Doe',
            relation: 'Spouse',
            age: '28',
          },
        },
      },
      {
        method: 'PUT',
        path: '/family/:id',
        title: 'Update Family Member',
        description: 'Update a family member\'s information.',
        requiresAuth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Family member ID (URL parameter)' },
          { name: 'name', type: 'string', required: false, description: 'Family member name' },
          { name: 'relation', type: 'string', required: false, description: 'Relationship' },
          { name: 'age', type: 'string', required: false, description: 'Age' },
          { name: 'lastDoctorVisit', type: 'string', required: false, description: 'Last doctor visit date' },
        ],
        exampleRequest: {
          age: '29',
        },
        exampleResponse: {
          familyMember: {
            id: 'fam_123',
            age: '29',
          },
        },
      },
      {
        method: 'DELETE',
        path: '/family/:id',
        title: 'Delete Family Member',
        description: 'Delete a family member.',
        requiresAuth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Family member ID (URL parameter)' },
        ],
        exampleResponse: {
          message: 'Family member deleted successfully',
        },
      },
    ],
  },
  medications: {
    endpoints: [
      {
        method: 'GET',
        path: '/medications',
        title: 'Get Medications',
        description: 'Get all medications for the authenticated user.',
        requiresAuth: true,
        exampleResponse: {
          medications: [
            {
              id: 'med_123',
              name: 'Aspirin',
              category: 'Pain Relief',
              genericName: 'Acetylsalicylic acid',
              brandName: 'Bayer Aspirin',
              strength: '100mg',
              price: 5.99,
              packSize: 30,
            },
          ],
        },
      },
      {
        method: 'POST',
        path: '/medications',
        title: 'Create Medication',
        description: 'Add a new medication to the database.',
        requiresAuth: true,
        parameters: [
          { name: 'name', type: 'string', required: true, description: 'Medication name' },
          { name: 'category', type: 'string', required: false, description: 'Medication category' },
          { name: 'genericName', type: 'string', required: false, description: 'Generic name' },
          { name: 'brandName', type: 'string', required: false, description: 'Brand name' },
          { name: 'strength', type: 'string', required: false, description: 'Medication strength' },
          { name: 'price', type: 'number', required: false, description: 'Price' },
          { name: 'packSize', type: 'number', required: false, description: 'Pack size' },
          { name: 'packSizeDescription', type: 'string', required: false, description: 'Pack size description' },
          { name: 'primaryUse', type: 'string', required: false, description: 'Primary use case' },
          { name: 'unit', type: 'string', required: false, description: 'Unit of measurement' },
        ],
        exampleRequest: {
          name: 'Aspirin',
          category: 'Pain Relief',
          genericName: 'Acetylsalicylic acid',
          strength: '100mg',
          price: 5.99,
          packSize: 30,
        },
        exampleResponse: {
          medication: {
            id: 'med_123',
            name: 'Aspirin',
            category: 'Pain Relief',
          },
        },
      },
      {
        method: 'POST',
        path: '/medications/load',
        title: 'Load Medicines',
        description: 'Load medicines from external database.',
        requiresAuth: true,
        exampleResponse: {
          message: 'Medicines loaded successfully',
          count: 1500,
        },
      },
      {
        method: 'PUT',
        path: '/medications/:id',
        title: 'Update Medication',
        description: 'Update medication information.',
        requiresAuth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Medication ID (URL parameter)' },
          { name: 'name', type: 'string', required: false, description: 'Medication name' },
          { name: 'price', type: 'number', required: false, description: 'Price' },
        ],
        exampleRequest: {
          price: 6.99,
        },
        exampleResponse: {
          medication: {
            id: 'med_123',
            price: 6.99,
          },
        },
      },
      {
        method: 'DELETE',
        path: '/medications/:id',
        title: 'Delete Medication',
        description: 'Delete a medication.',
        requiresAuth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Medication ID (URL parameter)' },
        ],
        exampleResponse: {
          message: 'Medication deleted successfully',
        },
      },
    ],
  },
  reports: {
    endpoints: [
      {
        method: 'GET',
        path: '/reports',
        title: 'Get Reports',
        description: 'Get all medical reports and documents.',
        requiresAuth: true,
        exampleResponse: {
          reports: [
            {
              id: 'rep_123',
              title: 'Blood Test Report',
              date: '2024-01-01T00:00:00Z',
              type: 'PDF',
              category: 'Report',
              fileUrl: 'https://example.com/report.pdf',
              familyMemberId: 'fam_123',
            },
          ],
        },
      },
      {
        method: 'POST',
        path: '/reports',
        title: 'Create Report',
        description: 'Upload a new medical report or document. Supports file upload via FormData.',
        requiresAuth: true,
        isFormData: true,
        parameters: [
          { name: 'title', type: 'string', required: true, description: 'Report title' },
          { name: 'date', type: 'string', required: false, description: 'Report date (ISO format)' },
          { name: 'type', type: 'string', required: false, enum: ['PDF', 'Scanned Image'], description: 'Report type' },
          { name: 'category', type: 'string', required: false, enum: ['Report', 'Prescription'], description: 'Report category' },
          { name: 'file', type: 'File', required: false, description: 'Report file (multipart/form-data)' },
          { name: 'familyMemberId', type: 'string', required: false, description: 'Family member ID' },
          { name: 'familyMemberName', type: 'string', required: false, description: 'Family member name' },
        ],
        exampleRequest: {
          title: 'Blood Test Report',
          date: '2024-01-01T00:00:00Z',
          type: 'PDF',
          category: 'Report',
          familyMemberId: 'fam_123',
        },
        exampleResponse: {
          report: {
            id: 'rep_123',
            title: 'Blood Test Report',
            fileUrl: 'https://example.com/report.pdf',
          },
        },
      },
      {
        method: 'PUT',
        path: '/reports/:id',
        title: 'Update Report',
        description: 'Update report information. Supports file upload via FormData.',
        requiresAuth: true,
        isFormData: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Report ID (URL parameter)' },
          { name: 'title', type: 'string', required: false, description: 'Report title' },
          { name: 'file', type: 'File', required: false, description: 'Report file (multipart/form-data)' },
        ],
        exampleRequest: {
          title: 'Updated Report Title',
        },
        exampleResponse: {
          report: {
            id: 'rep_123',
            title: 'Updated Report Title',
          },
        },
      },
      {
        method: 'DELETE',
        path: '/reports/:id',
        title: 'Delete Report',
        description: 'Delete a report.',
        requiresAuth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Report ID (URL parameter)' },
        ],
        exampleResponse: {
          message: 'Report deleted successfully',
        },
      },
    ],
  },
  'health-data': {
    endpoints: [
      {
        method: 'GET',
        path: '/health-data/:familyMemberId',
        title: 'Get Health Data',
        description: 'Get all health data for a specific family member.',
        requiresAuth: true,
        parameters: [
          { name: 'familyMemberId', type: 'string', required: true, description: 'Family member ID (URL parameter)' },
        ],
        exampleResponse: {
          healthData: [
            {
              id: 'hd_123',
              type: 'Blood Pressure',
              value: '120/80',
              unit: 'mmHg',
              date: '2024-01-01',
              time: '10:00',
            },
          ],
        },
      },
      {
        method: 'POST',
        path: '/health-data/:familyMemberId',
        title: 'Create Health Data',
        description: 'Record new health data for a family member.',
        requiresAuth: true,
        parameters: [
          { name: 'familyMemberId', type: 'string', required: true, description: 'Family member ID (URL parameter)' },
          { name: 'type', type: 'string', required: true, description: 'Health metric type (e.g., Blood Pressure, Weight)' },
          { name: 'value', type: 'string', required: true, description: 'Metric value' },
          { name: 'unit', type: 'string', required: false, description: 'Unit of measurement' },
          { name: 'date', type: 'string', required: true, description: 'Date in YYYY-MM-DD format' },
          { name: 'time', type: 'string', required: false, description: 'Time in HH:MM format' },
        ],
        exampleRequest: {
          type: 'Blood Pressure',
          value: '120/80',
          unit: 'mmHg',
          date: '2024-01-01',
          time: '10:00',
        },
        exampleResponse: {
          healthData: {
            id: 'hd_123',
            type: 'Blood Pressure',
            value: '120/80',
            date: '2024-01-01',
          },
        },
      },
      {
        method: 'PUT',
        path: '/health-data/:familyMemberId/:id',
        title: 'Update Health Data',
        description: 'Update existing health data.',
        requiresAuth: true,
        parameters: [
          { name: 'familyMemberId', type: 'string', required: true, description: 'Family member ID (URL parameter)' },
          { name: 'id', type: 'string', required: true, description: 'Health data ID (URL parameter)' },
          { name: 'value', type: 'string', required: false, description: 'Metric value' },
        ],
        exampleRequest: {
          value: '125/85',
        },
        exampleResponse: {
          healthData: {
            id: 'hd_123',
            value: '125/85',
          },
        },
      },
      {
        method: 'DELETE',
        path: '/health-data/:familyMemberId/:id',
        title: 'Delete Health Data',
        description: 'Delete health data record.',
        requiresAuth: true,
        parameters: [
          { name: 'familyMemberId', type: 'string', required: true, description: 'Family member ID (URL parameter)' },
          { name: 'id', type: 'string', required: true, description: 'Health data ID (URL parameter)' },
        ],
        exampleResponse: {
          message: 'Health data deleted successfully',
        },
      },
    ],
  },
  plans: {
    endpoints: [
      {
        method: 'GET',
        path: '/plans/:familyMemberId',
        title: 'Get Plans',
        description: 'Get all medication plans for a family member.',
        requiresAuth: true,
        parameters: [
          { name: 'familyMemberId', type: 'string', required: true, description: 'Family member ID (URL parameter)' },
        ],
        exampleResponse: {
          plans: [
            {
              id: 'plan_123',
              medicationId: 'med_123',
              medicationName: 'Aspirin',
              dosage: 1,
              frequency: 2,
              price: 5.99,
              packSize: 30,
            },
          ],
        },
      },
      {
        method: 'POST',
        path: '/plans/:familyMemberId',
        title: 'Create Plan',
        description: 'Create a new medication plan for a family member.',
        requiresAuth: true,
        parameters: [
          { name: 'familyMemberId', type: 'string', required: true, description: 'Family member ID (URL parameter)' },
          { name: 'medicationId', type: 'string', required: true, description: 'Medication ID' },
          { name: 'medicationName', type: 'string', required: true, description: 'Medication name' },
          { name: 'dosage', type: 'number', required: true, description: 'Dosage (minimum 0.1)' },
          { name: 'frequency', type: 'number', required: true, description: 'Frequency per day (minimum 1)' },
          { name: 'price', type: 'number', required: true, description: 'Price (minimum 0)' },
          { name: 'packSize', type: 'number', required: true, description: 'Pack size (minimum 1)' },
        ],
        exampleRequest: {
          medicationId: 'med_123',
          medicationName: 'Aspirin',
          dosage: 1,
          frequency: 2,
          price: 5.99,
          packSize: 30,
        },
        exampleResponse: {
          plan: {
            id: 'plan_123',
            medicationId: 'med_123',
            dosage: 1,
            frequency: 2,
          },
        },
      },
      {
        method: 'PUT',
        path: '/plans/:familyMemberId/:id',
        title: 'Update Plan',
        description: 'Update a medication plan.',
        requiresAuth: true,
        parameters: [
          { name: 'familyMemberId', type: 'string', required: true, description: 'Family member ID (URL parameter)' },
          { name: 'id', type: 'string', required: true, description: 'Plan ID (URL parameter)' },
          { name: 'dosage', type: 'number', required: false, description: 'Dosage' },
          { name: 'frequency', type: 'number', required: false, description: 'Frequency' },
        ],
        exampleRequest: {
          dosage: 2,
        },
        exampleResponse: {
          plan: {
            id: 'plan_123',
            dosage: 2,
          },
        },
      },
      {
        method: 'DELETE',
        path: '/plans/:familyMemberId/:id',
        title: 'Delete Plan',
        description: 'Delete a medication plan.',
        requiresAuth: true,
        parameters: [
          { name: 'familyMemberId', type: 'string', required: true, description: 'Family member ID (URL parameter)' },
          { name: 'id', type: 'string', required: true, description: 'Plan ID (URL parameter)' },
        ],
        exampleResponse: {
          message: 'Plan deleted successfully',
        },
      },
    ],
  },
  'purchase-list': {
    endpoints: [
      {
        method: 'GET',
        path: '/purchase-list',
        title: 'Get Purchase List',
        description: 'Get all items in the purchase list.',
        requiresAuth: true,
        exampleResponse: {
          purchaseListItems: [
            {
              id: 'pli_123',
              medicationId: 'med_123',
              medicationName: 'Aspirin',
              quantity: 2,
              price: 5.99,
              discount: 10,
            },
          ],
        },
      },
      {
        method: 'POST',
        path: '/purchase-list',
        title: 'Add to Purchase List',
        description: 'Add an item to the purchase list.',
        requiresAuth: true,
        parameters: [
          { name: 'medicationId', type: 'string', required: false, description: 'Medication ID' },
          { name: 'medicationName', type: 'string', required: true, description: 'Medication name' },
          { name: 'quantity', type: 'number', required: true, description: 'Quantity (minimum 1)' },
          { name: 'price', type: 'number', required: true, description: 'Price (minimum 0)' },
          { name: 'discount', type: 'number', required: false, description: 'Discount percentage (0-100)' },
        ],
        exampleRequest: {
          medicationName: 'Aspirin',
          quantity: 2,
          price: 5.99,
          discount: 10,
        },
        exampleResponse: {
          purchaseListItem: {
            id: 'pli_123',
            medicationName: 'Aspirin',
            quantity: 2,
          },
        },
      },
      {
        method: 'PUT',
        path: '/purchase-list/:id',
        title: 'Update Purchase List Item',
        description: 'Update a purchase list item.',
        requiresAuth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Purchase list item ID (URL parameter)' },
          { name: 'quantity', type: 'number', required: false, description: 'Quantity' },
          { name: 'price', type: 'number', required: false, description: 'Price' },
        ],
        exampleRequest: {
          quantity: 3,
        },
        exampleResponse: {
          purchaseListItem: {
            id: 'pli_123',
            quantity: 3,
          },
        },
      },
      {
        method: 'DELETE',
        path: '/purchase-list/:id',
        title: 'Remove from Purchase List',
        description: 'Remove an item from the purchase list.',
        requiresAuth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Purchase list item ID (URL parameter)' },
        ],
        exampleResponse: {
          message: 'Item removed from purchase list',
        },
      },
      {
        method: 'GET',
        path: '/purchase-list/logs',
        title: 'Get Purchase Logs',
        description: 'Get purchase history logs.',
        requiresAuth: true,
        exampleResponse: {
          logs: [
            {
              id: 'log_123',
              title: 'Monthly Purchase',
              totalItems: 5,
              totalQuantity: 10,
              totalCost: 50.99,
              discount: 10,
              createdAt: '2024-01-01T00:00:00Z',
            },
          ],
        },
      },
      {
        method: 'POST',
        path: '/purchase-list/logs',
        title: 'Create Purchase Log',
        description: 'Create a new purchase log entry.',
        requiresAuth: true,
        parameters: [
          { name: 'title', type: 'string', required: true, description: 'Log title' },
          { name: 'content', type: 'string', required: true, description: 'Log content' },
          { name: 'totalItems', type: 'number', required: true, description: 'Total items (minimum 0)' },
          { name: 'totalQuantity', type: 'number', required: true, description: 'Total quantity (minimum 0)' },
          { name: 'totalCost', type: 'number', required: true, description: 'Total cost (minimum 0)' },
          { name: 'discount', type: 'number', required: false, description: 'Discount percentage (0-100)' },
        ],
        exampleRequest: {
          title: 'Monthly Purchase',
          content: 'Purchased medications for January',
          totalItems: 5,
          totalQuantity: 10,
          totalCost: 50.99,
          discount: 10,
        },
        exampleResponse: {
          log: {
            id: 'log_123',
            title: 'Monthly Purchase',
          },
        },
      },
    ],
  },
  analytics: {
    endpoints: [
      {
        method: 'GET',
        path: '/analytics/ai',
        title: 'Get AI Analytics',
        description: 'Get AI-powered health analytics and insights.',
        requiresAuth: true,
        exampleResponse: {
          data: {
            insights: [
              'Blood pressure trending upward',
              'Medication adherence: 95%',
            ],
            recommendations: [
              'Consider increasing exercise',
              'Schedule follow-up appointment',
            ],
          },
        },
      },
    ],
  },
  ocr: {
    endpoints: [
      {
        method: 'POST',
        path: '/ocr/process',
        title: 'Process OCR',
        description: 'Extract text from a medical document image using OCR. Requires FormData with image file.',
        requiresAuth: true,
        isFormData: true,
        parameters: [
          { name: 'image', type: 'File', required: true, description: 'Image file (multipart/form-data)' },
        ],
        exampleRequest: {
          image: '[File upload]',
        },
        exampleResponse: {
          text: 'Extracted text from image...',
          confidence: 0.95,
        },
      },
    ],
  },
  pdf: {
    endpoints: [
      {
        method: 'GET',
        path: '/pdf/health-data/:familyMemberId/metric/:type',
        title: 'Generate Metric PDF',
        description: 'Generate a PDF report for a specific health metric type.',
        requiresAuth: true,
        parameters: [
          { name: 'familyMemberId', type: 'string', required: true, description: 'Family member ID (URL parameter)' },
          { name: 'type', type: 'string', required: true, description: 'Health metric type (URL parameter, URL encoded)' },
        ],
        exampleResponse: {
          contentType: 'application/pdf',
          message: 'PDF file returned as binary data',
        },
      },
      {
        method: 'GET',
        path: '/pdf/health-data/:familyMemberId/all',
        title: 'Generate All Vitals PDF',
        description: 'Generate a PDF report containing all vital signs for a family member.',
        requiresAuth: true,
        parameters: [
          { name: 'familyMemberId', type: 'string', required: true, description: 'Family member ID (URL parameter)' },
        ],
        exampleResponse: {
          contentType: 'application/pdf',
          message: 'PDF file returned as binary data',
        },
      },
    ],
  },
  errors: {
    content: `
# Error Responses

The API uses standard HTTP status codes to indicate success or failure of requests.

## Status Codes

- **200 OK** - Request succeeded
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid request parameters
- **401 Unauthorized** - Authentication required or invalid token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource conflict (e.g., duplicate email)
- **422 Unprocessable Entity** - Validation error
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error

## Error Response Format

All error responses follow this format:

\`\`\`json
{
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
\`\`\`

## Common Errors

### 401 Unauthorized
\`\`\`json
{
  "message": "Authentication required"
}
\`\`\`

### 400 Bad Request
\`\`\`json
{
  "message": "Invalid request parameters",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "message": "Resource not found"
}
\`\`\`

### 422 Unprocessable Entity
\`\`\`json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "date",
      "message": "Date must be in YYYY-MM-DD format"
    }
  ]
}
\`\`\`
    `,
  },
};
