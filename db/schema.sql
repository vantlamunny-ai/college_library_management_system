-- College Library Management System -- schema
--
-- This matches the real table definitions (exact column names, types, and
-- ENUM values) confirmed against the actual backend code -- not guessed.
-- Safe to re-run: every statement is `CREATE TABLE IF NOT EXISTS`.

CREATE DATABASE IF NOT EXISTS college_library_system
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE college_library_system;

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Librarian', 'Student') NOT NULL,
    status ENUM('Active', 'Inactive', 'Blocked') DEFAULT 'Active',
    reset_token VARCHAR(255) NULL,
    reset_token_expires DATETIME NULL,
    -- Self-service username changes are rate-limited to 7 per rolling year.
    -- period_start anchors the current window; the count resets to 1 (not 0)
    -- the moment a change happens more than 365 days after it.
    username_change_count INT NOT NULL DEFAULT 0,
    username_change_period_start DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    student_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    year INT,
    semester INT,
    phone VARCHAR(15),
    address VARCHAR(255),
    admission_year YEAR,
    status ENUM('Active', 'Inactive', 'Graduated') DEFAULT 'Active',
    bio TEXT NULL,
    interests VARCHAR(500) NULL,
    -- Either "avatar:<preset-id>" (a built-in illustrated avatar) or a
    -- data: URI (a photo uploaded from the gallery, resized client-side
    -- before it ever reaches the backend) — never a bare filesystem path,
    -- since this backend has no file-upload/static-serving infrastructure.
    profile_picture MEDIUMTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS librarians (
    librarian_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    librarian_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    designation VARCHAR(100),
    joining_date DATE,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS authors (
    author_id INT AUTO_INCREMENT PRIMARY KEY,
    author_name VARCHAR(150) NOT NULL,
    biography TEXT,
    email VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS publishers (
    publisher_id INT AUTO_INCREMENT PRIMARY KEY,
    publisher_name VARCHAR(150) NOT NULL UNIQUE,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(150),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    isbn VARCHAR(20) UNIQUE,
    title VARCHAR(200) NOT NULL,
    category_id INT NOT NULL,
    publisher_id INT,
    edition VARCHAR(50),
    publication_year YEAR,
    language VARCHAR(50) DEFAULT 'English',
    pages INT,
    price DECIMAL(10, 2),
    description TEXT,
    cover_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (publisher_id) REFERENCES publishers(publisher_id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS book_authors (
    book_id INT NOT NULL,
    author_id INT NOT NULL,
    PRIMARY KEY (book_id, author_id),
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS book_copies (
    copy_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    accession_number VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    shelf_location VARCHAR(100),
    purchase_date DATE,
    price DECIMAL(10, 2),
    condition_status ENUM('New', 'Good', 'Damaged', 'Lost') DEFAULT 'Good',
    availability_status ENUM('Available', 'Issued', 'Reserved', 'Lost', 'Damaged') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS book_issues (
    issue_id INT AUTO_INCREMENT PRIMARY KEY,
    copy_id INT NOT NULL,
    student_id INT NOT NULL,
    librarian_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('Issued', 'Returned', 'Overdue') DEFAULT 'Issued',
    renewal_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (copy_id) REFERENCES book_copies(copy_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (librarian_id) REFERENCES librarians(librarian_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS book_returns (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL UNIQUE,
    return_date DATE NOT NULL,
    condition_status ENUM('Good', 'Damaged', 'Lost') DEFAULT 'Good',
    remarks VARCHAR(255),
    processed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES book_issues(issue_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES librarians(librarian_id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    student_id INT NOT NULL,
    reservation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME,
    status ENUM('Pending', 'Approved', 'Completed', 'Cancelled', 'Expired') DEFAULT 'Pending',
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS fines (
    fine_id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    student_id INT NOT NULL,
    fine_type ENUM('Late Return', 'Damaged Book', 'Lost Book') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    reason VARCHAR(255),
    payment_status ENUM('Pending', 'Paid', 'Waived') DEFAULT 'Pending',
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES book_issues(issue_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('Due Reminder', 'Overdue', 'Reservation', 'Fine', 'General') DEFAULT 'General',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    student_id INT NOT NULL,
    rating INT NOT NULL,
    review_text TEXT,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
    UNIQUE (book_id, student_id),
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- Reference/taxonomy data only (categories, publishers) -- not fabricated
-- transactional records. No students/books/issues/fines are seeded here;
-- those come from real usage through the app.
-- ---------------------------------------------------------------------

INSERT IGNORE INTO categories (category_name, description, status) VALUES
('Computer Science', 'Programming, algorithms, data structures, and software development.', 'Active'),
('Information Technology', 'Networking, cloud computing, cybersecurity, and IT infrastructure.', 'Active'),
('Database Management', 'Database design, SQL, and database administration.', 'Active'),
('Artificial Intelligence', 'Machine learning, deep learning, and intelligent systems.', 'Active'),
('Web Development', 'HTML, CSS, JavaScript, and web application development.', 'Active'),
('Data Science', 'Data analysis, statistics, and data visualization.', 'Active'),
('Cyber Security', 'Information security, cryptography, and network security.', 'Active'),
('Electronics and Communication', 'Electronic circuits, communication systems, and embedded systems.', 'Active'),
('Engineering Mathematics', 'Calculus, linear algebra, probability, and numerical methods.', 'Active'),
('General Knowledge', 'Competitive examinations, current affairs, and reference materials.', 'Active');

-- ---------------------------------------------------------------------
-- No bootstrap accounts are created here on purpose -- no password
-- belongs committed to source control. To create the first Admin
-- account, set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in your
-- local .env (see .env.example) and run:
--
--   node db/seed-admin.js
--
-- Once logged in as that Admin, use the app itself (Student Management
-- -> Add Librarian) to create Librarian accounts -- there is no seeded
-- Librarian account either.
-- ---------------------------------------------------------------------
