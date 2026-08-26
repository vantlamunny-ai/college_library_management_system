// Centralized path constants mirroring the real Express mounts in server.js
// (app.use("/auth", ...), app.use("/books", ...), etc). No "/api" prefix —
// the backend mounts these routers directly on root.

export const ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    currentUser: '/auth/user',
    forgotPassword: '/auth/forgot-password',
    resetPassword: (token) => `/auth/reset-password/${token}`,
  },
  books: {
    list: '/books',
    byId: (id) => `/books/${id}`,
  },
  students: {
    list: '/students',
    byId: (id) => `/students/${id}`,
    me: '/students/me',
    meProfile: '/students/me/profile',
    meUsername: '/students/me/username',
    meAcademic: '/students/me/academic',
    accountStatus: (id) => `/students/${id}/account-status`,
  },
  issues: {
    list: '/issues',
    create: '/issues',
    statistics: '/issues/statistics',
    active: '/issues/active',
    overdue: '/issues/overdue',
    byStudent: (studentId) => `/issues/student/${studentId}`,
    activeByStudent: (studentId) => `/issues/student/${studentId}/active`,
    byCopy: (copyId) => `/issues/copy/${copyId}`,
    byId: (id) => `/issues/${id}`,
    // TODO(backend): no renew endpoint exists on issueRoutes yet.
    renew: (id) => `/issues/${id}/renew`,
  },
  returns: {
    list: '/returns',
    create: '/returns',
    byId: (id) => `/returns/${id}`,
  },
  reservations: {
    list: '/reservations',
    mine: '/reservations/my',
    create: '/reservations',
    byId: (id) => `/reservations/${id}`,
  },
  fines: {
    list: '/fines',
    mine: '/fines/my',
    create: '/fines',
    pay: (fineId) => `/fines/${fineId}`,
  },
  reports: {
    books: '/reports/books',
    issues: '/reports/issues',
    returns: '/reports/returns',
    students: '/reports/students',
    fines: '/reports/fines',
    reservations: '/reports/reservations',
    dashboard: '/reports/dashboard',
    copies: '/reports/copies',
  },
  notifications: {
    mine: '/notifications/my',
    markRead: (id) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
  },
  librarians: {
    list: '/librarians',
    create: '/librarians',
    me: '/librarians/me',
  },
};
