/**
 * Shared JSDoc type definitions describing the shapes returned by the
 * backend REST API (see repo root `controllers/` + `services/` for the
 * source of truth). These are documentation-only — plain JS at runtime.
 */

/**
 * @template T
 * @typedef {Object} ApiEnvelope
 * @property {boolean} success
 * @property {string} [message]
 * @property {number} [count]
 * @property {T} data
 */

/**
 * @typedef {'Admin'|'Librarian'|'Student'} Role
 */

/**
 * @typedef {Object} AuthUser
 * @property {number} user_id
 * @property {string} username
 * @property {string} email
 * @property {Role} role
 * @property {string} status
 */

/**
 * @typedef {Object} Student
 * @property {number} student_id
 * @property {number} user_id
 * @property {string} roll_number
 * @property {string} student_name
 * @property {string} department
 * @property {number} year
 * @property {number} semester
 * @property {string} [phone]
 * @property {string} [address]
 * @property {number} [admission_year]
 * @property {'Active'|'Inactive'|'Graduated'} status Academic/enrollment status.
 * @property {'Active'|'Inactive'|'Blocked'} [account_status] Login/access status, from the linked users row.
 * @property {string} [username]
 * @property {string} [email]
 */

/**
 * @typedef {Object} BookCopy
 * @property {number} copy_id
 * @property {number} [book_id]
 * @property {string} accession_number
 * @property {string} [barcode]
 * @property {string} [shelf_location]
 * @property {'New'|'Good'|'Damaged'|'Lost'} condition_status
 * @property {'Available'|'Issued'|'Reserved'|'Damaged'|'Lost'} availability_status
 */

/**
 * @typedef {Object} Book
 * @property {number} book_id
 * @property {string} isbn
 * @property {string} title
 * @property {string} [edition]
 * @property {number} [publication_year]
 * @property {string} [language]
 * @property {number} [pages]
 * @property {number} [price]
 * @property {string} [description]
 * @property {string} [cover_image]
 * @property {number} [category_id]
 * @property {string} [category_name]
 * @property {number} [publisher_id]
 * @property {string} [publisher_name]
 * @property {number} [total_copies]
 * @property {number} [available_copies]
 * @property {{author_id:number, author_name:string}[]} [authors]
 * @property {BookCopy[]} [copies]
 */

/**
 * @typedef {Object} Issue
 * @property {number} issue_id
 * @property {number} student_id
 * @property {string} roll_number
 * @property {string} student_name
 * @property {string} department
 * @property {number} copy_id
 * @property {string} accession_number
 * @property {string} condition_status
 * @property {number} book_id
 * @property {string} title
 * @property {string} isbn
 * @property {number} librarian_id
 * @property {string} librarian_name
 * @property {string} issue_date
 * @property {string} due_date
 * @property {'Issued'|'Returned'|'Overdue'} issue_status
 * @property {number} renewal_count
 * @property {number} [overdue_days]
 */

/**
 * @typedef {Object} ReturnRecord
 * @property {number} return_id
 * @property {number} issue_id
 * @property {string} return_date
 * @property {'New'|'Good'|'Damaged'|'Lost'} condition_status
 * @property {string} [remarks]
 * @property {number} processed_by
 */

/**
 * @typedef {Object} Reservation
 * @property {number} reservation_id
 * @property {number} book_id
 * @property {number} student_id
 * @property {string} reservation_date
 * @property {string} expiry_date
 * @property {'Pending'|'Approved'|'Completed'|'Cancelled'|'Expired'} status
 */

/**
 * @typedef {Object} Fine
 * @property {number} fine_id
 * @property {number} issue_id
 * @property {number} student_id
 * @property {string} fine_type
 * @property {number} amount
 * @property {string} [reason]
 * @property {'Pending'|'Paid'|'Waived'} payment_status
 * @property {string} [paid_date]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} Notification
 * @property {number} notification_id
 * @property {number} user_id
 * @property {string} title
 * @property {string} message
 * @property {string} notification_type
 * @property {boolean} is_read
 * @property {string} created_at
 */

/**
 * @typedef {Object} DashboardReport
 * @property {number} total_books
 * @property {number} total_copies
 * @property {number} available_copies
 * @property {number} issued_copies
 * @property {number} active_students
 * @property {number} active_issues
 * @property {number} overdue_books
 * @property {number} pending_reservations
 * @property {number} pending_fines
 */

export {};
