CREATE DATABASE IF NOT EXISTS college_library_system;

USE college_library_system;
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Librarian', 'Student') NOT NULL,
    status ENUM('Active', 'Inactive', 'Blocked') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
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

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
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
    price DECIMAL(10,2),
    description TEXT,
    cover_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (publisher_id)
        REFERENCES publishers(publisher_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS book_authors (
    book_id INT NOT NULL,
    author_id INT NOT NULL,

    PRIMARY KEY (book_id, author_id),

    FOREIGN KEY (book_id)
        REFERENCES books(book_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (author_id)
        REFERENCES authors(author_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS book_copies (
    copy_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    accession_number VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    shelf_location VARCHAR(100),
    purchase_date DATE,
    price DECIMAL(10,2),
    condition_status ENUM(
        'New',
        'Good',
        'Damaged',
        'Lost'
    ) DEFAULT 'Good',
    availability_status ENUM(
        'Available',
        'Issued',
        'Reserved',
        'Lost',
        'Damaged'
    ) DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (book_id)
        REFERENCES books(book_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS book_issues (
    issue_id INT AUTO_INCREMENT PRIMARY KEY,
    copy_id INT NOT NULL,
    student_id INT NOT NULL,
    librarian_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status ENUM(
        'Issued',
        'Returned',
        'Overdue'
    ) DEFAULT 'Issued',
    renewal_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (copy_id)
        REFERENCES book_copies(copy_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (librarian_id)
        REFERENCES librarians(librarian_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS  book_returns (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL UNIQUE,
    return_date DATE NOT NULL,
    condition_status ENUM(
        'Good',
        'Damaged',
        'Lost'
    ) DEFAULT 'Good',
    remarks VARCHAR(255),
    processed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (issue_id)
        REFERENCES book_issues(issue_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (processed_by)
        REFERENCES librarians(librarian_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS  reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    student_id INT NOT NULL,
    reservation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME,
    status ENUM(
        'Pending',
        'Approved',
        'Completed',
        'Cancelled',
        'Expired'
    ) DEFAULT 'Pending',

    FOREIGN KEY (book_id)
        REFERENCES books(book_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS  fines (
    fine_id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    student_id INT NOT NULL,
    fine_type ENUM(
        'Late Return',
        'Damaged Book',
        'Lost Book'
    ) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    reason VARCHAR(255),
    payment_status ENUM(
        'Pending',
        'Paid',
        'Waived'
    ) DEFAULT 'Pending',
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (issue_id)
        REFERENCES book_issues(issue_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM(
        'Due Reminder',
        'Overdue',
        'Reservation',
        'Fine',
        'General'
    ) DEFAULT 'General',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    student_id INT NOT NULL,
    rating INT NOT NULL,
    review_text TEXT,
    status ENUM(
        'Pending',
        'Approved',
        'Rejected'
    ) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_rating
        CHECK (rating BETWEEN 1 AND 5),

    UNIQUE (book_id, student_id),

    FOREIGN KEY (book_id)
        REFERENCES books(book_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
CREATE TABLE digital_books (
    digital_book_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    access_type ENUM('Free', 'Students Only') DEFAULT 'Students Only',
    status ENUM('Available', 'Unavailable') DEFAULT 'Available',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (book_id) REFERENCES books(book_id)
);


INSERT IGNORE INTO categories
    (category_name, description, status)
VALUES
    (
        'Computer Science',
        'Books covering computer science fundamentals, programming, algorithms, data structures, and software development.',
        'Active'
    ),
    (
        'Information Technology',
        'Books related to information technology, networking, cloud computing, cybersecurity, and IT infrastructure.',
        'Active'
    ),
    (
        'Database Management',
        'Books covering database design, SQL, MySQL, PostgreSQL, database administration, and data management.',
        'Active'
    ),
    (
        'Artificial Intelligence',
        'Books covering artificial intelligence, machine learning, deep learning, natural language processing, and intelligent systems.',
        'Active'
    ),
    (
        'Web Development',
        'Books covering HTML, CSS, JavaScript, React, Node.js, web application development, and modern web technologies.',
        'Active'
    ),
    (
        'Data Science',
        'Books related to data analysis, statistics, data visualization, Python, R, and data science methodologies.',
        'Active'
    ),
    (
        'Cyber Security',
        'Books covering information security, ethical hacking, cryptography, network security, and cyber defense.',
        'Active'
    ),
    (
        'Electronics and Communication',
        'Books covering electronic circuits, communication systems, embedded systems, microprocessors, and digital electronics.',
        'Active'
    ),
    (
        'Engineering Mathematics',
        'Books covering engineering mathematics, calculus, linear algebra, probability, statistics, and numerical methods.',
        'Active'
    ),
    (
        'General Knowledge',
        'Books covering general knowledge, competitive examinations, current affairs, reference materials, and educational resources.',
        'Active'
    );
    INSERT IGNORE INTO publishers
(
    publisher_name,
    address,
    phone,
    email,
    website
)
VALUES
(
    'Pearson Education',
    '80 Strand, London, United Kingdom',
    '+44 20 7010 2000',
    'info@pearson.com',
    'https://www.pearson.com'
),
(
    'McGraw Hill Education',
    '1325 Avenue of the Americas, New York, USA',
    '+1 212 904 2000',
    'customerservice@mcgrawhill.com',
    'https://www.mheducation.com'
),
(
    'Oxford University Press',
    'Great Clarendon Street, Oxford, United Kingdom',
    '+44 1865 556767',
    'enquiries@oup.com',
    'https://academic.oup.com'
),
(
    'Cambridge University Press',
    'University Printing House, Cambridge, United Kingdom',
    '+44 1223 358331',
    'customer_services@cambridge.org',
    'https://www.cambridge.org'
),
(
    'Wiley',
    '111 River Street, Hoboken, New Jersey, USA',
    '+1 201 748 6000',
    'customerservice@wiley.com',
    'https://www.wiley.com'
),
(
    'Springer Nature',
    'Tiergartenstrasse 17, Berlin, Germany',
    '+49 30 82787 0',
    'contact@springernature.com',
    'https://www.springernature.com'
),
(
    'O''Reilly Media',
    '1005 Gravenstein Highway North, Sebastopol, California, USA',
    '+1 707 829 0515',
    'customerservice@oreilly.com',
    'https://www.oreilly.com'
),
(
    'Packt Publishing',
    'Livery Place, 35 Livery Street, Birmingham, United Kingdom',
    '+44 121 265 6484',
    'support@packt.com',
    'https://www.packtpub.com'
),
(
    'Tata McGraw Hill',
    '7 West Patel Nagar, New Delhi, India',
    '+91 11 4646 2000',
    'customerservice@tmh.com',
    'https://www.mheducation.co.in'
),
(
    'S. Chand Publishing',
    '7361, Ram Nagar, Qutub Road, New Delhi, India',
    '+91 11 23672080',
    'info@schandpublishing.com',
    'https://www.schandpublishing.com'
);
select * from publishers;
INSERT IGNORE INTO books
(
    isbn,
    title,
    category_id,
    publisher_id,
    edition,
    publication_year,
    language,
    pages,
    price,
    description,
    cover_image
)
VALUES
(
    '9780131103627',
    'The C Programming Language',
    1,
    1,
    '2nd Edition',
    1988,
    'English',
    272,
    699.00,
    'A classic reference covering the C programming language, programming fundamentals, functions, pointers, arrays, structures, and standard libraries.',
    'covers/c-programming.jpg'
),
(
    '9780132350884',
    'Clean Code',
    1,
    1,
    '1st Edition',
    2008,
    'English',
    464,
    899.00,
    'A practical guide to writing readable, maintainable, testable, and professional software code.',
    'covers/clean-code.jpg'
),
(
    '9780078022159',
    'Database System Concepts',
    3,
    2,
    '7th Edition',
    2019,
    'English',
    1376,
    1299.00,
    'Comprehensive coverage of database architecture, relational models, SQL, transactions, indexing, and database design.',
    'covers/database-system-concepts.jpg'
),
(
    '9780262046305',
    'Artificial Intelligence: A Modern Approach',
    4,
    3,
    '4th Edition',
    2020,
    'English',
    1168,
    1499.00,
    'A comprehensive introduction to artificial intelligence, intelligent agents, search, machine learning, reasoning, and modern AI techniques.',
    'covers/ai-modern-approach.jpg'
),
(
    '9781491950296',
    'Learning React',
    5,
    7,
    '2nd Edition',
    2020,
    'English',
    350,
    1099.00,
    'A practical introduction to building modern interactive web applications using React and component-based development.',
    'covers/learning-react.jpg'
),
(
    '9781492051367',
    'Python for Data Analysis',
    6,
    7,
    '3rd Edition',
    2022,
    'English',
    576,
    1199.00,
    'A practical guide to data manipulation, cleaning, analysis, visualization, and working with Python data science tools.',
    'covers/python-data-analysis.jpg'
),
(
    '9781119515862',
    'Computer Networking: A Top-Down Approach',
    2,
    5,
    '8th Edition',
    2021,
    'English',
    864,
    1399.00,
    'An application-oriented introduction to computer networking, protocols, network architecture, transport, security, and wireless communication.',
    'covers/computer-networking.jpg'
),
(
    '9780134444284',
    'Computer Organization and Design',
    8,
    1,
    '6th Edition',
    2020,
    'English',
    912,
    1299.00,
    'A detailed introduction to computer architecture, processor design, memory systems, performance, and digital computing.',
    'covers/computer-organization.jpg'
),
(
    '9781119634228',
    'Engineering Mathematics',
    9,
    5,
    '7th Edition',
    2021,
    'English',
    1056,
    999.00,
    'A comprehensive engineering mathematics reference covering calculus, differential equations, linear algebra, probability, and numerical methods.',
    'covers/engineering-mathematics.jpg'
),
(
    '9780199535569',
    'Oxford Guide to General Knowledge',
    10,
    3,
    '1st Edition',
    2021,
    'English',
    640,
    799.00,
    'A broad reference resource covering science, history, geography, technology, society, culture, and general awareness.',
    'covers/general-knowledge.jpg'
);
INSERT IGNORE INTO books
(
    isbn,
    title,
    category_id,
    publisher_id,
    edition,
    publication_year,
    language,
    pages,
    price,
    description,
    cover_image
)
VALUES
(
    '9780262033848',
    'Introduction to Algorithms',
    1,
    NULL,
    '3rd Edition',
    2009,
    'English',
    1312,
    1599.00,
    'A comprehensive reference on algorithms covering sorting, graph algorithms, dynamic programming, and algorithmic analysis.',
    'covers/intro-to-algorithms.jpg'
),
(
    '9781118063330',
    'Operating System Concepts',
    1,
    5,
    '10th Edition',
    2018,
    'English',
    976,
    1399.00,
    'A classic textbook covering operating system design, processes, memory management, file systems, and concurrency.',
    'covers/os-concepts.jpg'
),
(
    '9780132126953',
    'Computer Networks',
    2,
    1,
    '5th Edition',
    2010,
    'English',
    960,
    1299.00,
    'A foundational text covering network architecture, protocols, the internet, and data communication.',
    'covers/computer-networks-tanenbaum.jpg'
),
(
    '9780262035613',
    'Deep Learning',
    4,
    NULL,
    '1st Edition',
    2016,
    'English',
    800,
    1699.00,
    'An in-depth textbook covering deep learning fundamentals, neural networks, and modern AI research techniques.',
    'covers/deep-learning-goodfellow.jpg'
),
(
    '9781118008188',
    'HTML and CSS: Design and Build Websites',
    5,
    5,
    '1st Edition',
    2011,
    'English',
    490,
    899.00,
    'A visually engaging guide to building websites using HTML and CSS for beginners and practitioners.',
    'covers/html-css-duckett.jpg'
),
(
    '9781492032649',
    'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
    6,
    7,
    '2nd Edition',
    2019,
    'English',
    848,
    1499.00,
    'A practical, example-driven guide to building machine learning and deep learning systems in Python.',
    'covers/hands-on-ml.jpg'
),
(
    '9780134527338',
    'Network Security Essentials',
    7,
    1,
    '6th Edition',
    2016,
    'English',
    478,
    999.00,
    'A concise introduction to network security concepts, cryptography, authentication, and security protocols.',
    'covers/network-security-essentials.jpg'
),
(
    '9781118026472',
    'The Web Application Hacker''s Handbook',
    7,
    5,
    '2nd Edition',
    2011,
    'English',
    912,
    1299.00,
    'A detailed guide to discovering and exploiting security vulnerabilities in web applications.',
    'covers/web-app-hackers-handbook.jpg'
),
(
    '9780132622264',
    'Electronic Devices and Circuit Theory',
    8,
    1,
    '11th Edition',
    2012,
    'English',
    912,
    1199.00,
    'A comprehensive introduction to electronic devices, circuit analysis, and semiconductor theory.',
    'covers/electronic-devices-circuit-theory.jpg'
),
(
    '9780470458365',
    'Advanced Engineering Mathematics',
    9,
    5,
    '10th Edition',
    2011,
    'English',
    1280,
    1399.00,
    'A widely used engineering mathematics reference covering differential equations, linear algebra, and numerical methods.',
    'covers/advanced-engineering-mathematics.jpg'
),
(
    '9780073380650',
    'Computer Organization and Embedded Systems',
    1,
    2,
    '6th Edition',
    2011,
    'English',
    790,
    1099.00,
    'A detailed study of computer architecture, embedded systems design, and hardware organization.',
    'covers/computer-organization-embedded.jpg'
),
(
    '9781118771334',
    'Data Structures and Algorithms in Java',
    1,
    5,
    '6th Edition',
    2014,
    'English',
    736,
    1299.00,
    'A thorough introduction to data structures and algorithm design using Java.',
    'covers/data-structures-java.jpg'
),
(
    '9780133943030',
    'Software Engineering',
    1,
    1,
    '10th Edition',
    2015,
    'English',
    816,
    1199.00,
    'A comprehensive introduction to software engineering principles, processes, and project management.',
    'covers/software-engineering-sommerville.jpg'
),
(
    '9780321486813',
    'Compilers: Principles, Techniques, and Tools',
    1,
    1,
    '2nd Edition',
    2006,
    'English',
    1040,
    1499.00,
    'The classic "Dragon Book" covering compiler design, parsing, code generation, and optimization.',
    'covers/compilers-dragon-book.jpg'
),
(
    '9780133591620',
    'Modern Operating Systems',
    1,
    1,
    '4th Edition',
    2014,
    'English',
    1136,
    1399.00,
    'A detailed exploration of operating system design principles, processes, and distributed systems.',
    'covers/modern-operating-systems.jpg'
),
(
    '9781492078005',
    'Head First Design Patterns',
    1,
    7,
    '2nd Edition',
    2020,
    'English',
    720,
    1299.00,
    'An engaging, visually rich introduction to object-oriented design patterns in software development.',
    'covers/head-first-design-patterns.jpg'
),
(
    '9781492056355',
    'Fluent Python',
    1,
    7,
    '2nd Edition',
    2022,
    'English',
    1012,
    1499.00,
    'A deep dive into writing idiomatic, effective, and modern Python code.',
    'covers/fluent-python.jpg'
),
(
    '9780073383095',
    'Discrete Mathematics and Its Applications',
    9,
    2,
    '7th Edition',
    2011,
    'English',
    1071,
    1299.00,
    'A comprehensive introduction to discrete mathematics, logic, combinatorics, and graph theory.',
    'covers/discrete-mathematics.jpg'
),
(
    '9780134794105',
    'Computer Security: Principles and Practice',
    7,
    1,
    '4th Edition',
    2017,
    'English',
    944,
    1399.00,
    'A comprehensive overview of computer security principles, threats, and defense mechanisms.',
    'covers/computer-security-principles.jpg'
),
(
    '9780321629111',
    'Probability and Statistics for Engineers and Scientists',
    9,
    1,
    '9th Edition',
    2011,
    'English',
    816,
    1199.00,
    'A foundational text on probability, statistics, and their applications in engineering and science.',
    'covers/probability-statistics-engineers.jpg'
);

select * from books;
ALTER TABLE books ADD COLUMN pdf_url VARCHAR(255) DEFAULT NULL;
INSERT INTO authors
(author_name, biography, email)
VALUES
(
    'Thomas H. Cormen',
    'Computer scientist and co-author of the widely used textbook Introduction to Algorithms.',
    'thomas.cormen@example.com'
),
(
    'Andrew S. Tanenbaum',
    'Computer scientist known for influential textbooks on operating systems and computer networks.',
    'andrew.tanenbaum@example.com'
),
(
    'Abraham Silberschatz',
    'Computer scientist and author known for major textbooks on operating systems and database systems.',
    'abraham.silberschatz@example.com'
),
(
    'Ian Goodfellow',
    'Researcher and author known for major contributions to artificial intelligence and deep learning.',
    'ian.goodfellow@example.com'
),
(
    'Robert C. Martin',
    'Software engineer and author known for books and principles related to clean software architecture and development.',
    'robert.martin@example.com'
),
(
    'Jon Duckett',
    'Author known for accessible books covering HTML, CSS, JavaScript, and web development.',
    'jon.duckett@example.com'
),
(
    'Jake VanderPlas',
    'Author and educator specializing in Python programming, scientific computing, and data science.',
    'jake.vanderplas@example.com'
),
(
    'William Stallings',
    'Author and educator known for books covering computer networks, cybersecurity, and computer architecture.',
    'william.stallings@example.com'
),
(
    'Ramez Elmasri',
    'Computer scientist and author specializing in database systems and database design.',
    'ramez.elmasri@example.com'
),
(
    'Peter Norvig',
    'Computer scientist and author known for work in artificial intelligence, programming, and computational methods.',
    'peter.norvig@example.com'
);
INSERT IGNORE INTO books
(
    isbn,
    title,
    category_id,
    publisher_id,
    edition,
    publication_year,
    language,
    pages,
    price,
    description,
    cover_image
)
VALUES
(
    '9780596007126',
    'Head First Java',
    1,
    7,
    '2nd Edition',
    2005,
    'English',
    720,
    1099.00,
    'A visually engaging, example-driven introduction to Java programming and object-oriented concepts.',
    'covers/head-first-java.jpg'
),
(
    '9781449355739',
    'Learning JavaScript Design Patterns',
    5,
    7,
    '1st Edition',
    2012,
    'English',
    254,
    899.00,
    'A guide to applying proven design patterns to modern JavaScript development.',
    'covers/learning-js-design-patterns.jpg'
),
(
    '9780596517748',
    'JavaScript: The Good Parts',
    5,
    7,
    '1st Edition',
    2008,
    'English',
    176,
    699.00,
    'A concise guide highlighting the best features of JavaScript for writing reliable code.',
    'covers/javascript-good-parts.jpg'
),
(
    '9781491910740',
    'Designing Data-Intensive Applications',
    3,
    7,
    '1st Edition',
    2017,
    'English',
    616,
    1499.00,
    'An in-depth exploration of the architecture and design principles behind reliable, scalable data systems.',
    'covers/designing-data-intensive-apps.jpg'
),
(
    '9780134685991',
    'Effective Java',
    1,
    1,
    '3rd Edition',
    2017,
    'English',
    412,
    1199.00,
    'Best practices and practical advice for writing robust, efficient, and maintainable Java code.',
    'covers/effective-java.jpg'
),
(
    '9781449365035',
    'Learning Python',
    1,
    7,
    '5th Edition',
    2013,
    'English',
    1600,
    1599.00,
    'A comprehensive introduction to the Python programming language for beginners and experienced developers.',
    'covers/learning-python.jpg'
),
(
    '9780262533058',
    'Introduction to Machine Learning',
    4,
    NULL,
    '4th Edition',
    2020,
    'English',
    712,
    1399.00,
    'A foundational textbook covering supervised learning, neural networks, and statistical learning theory.',
    'covers/intro-machine-learning.jpg'
),
(
    '9780134093413',
    'Starting Out with Python',
    1,
    1,
    '4th Edition',
    2017,
    'English',
    792,
    999.00,
    'A beginner-friendly introduction to programming concepts and problem solving using Python.',
    'covers/starting-out-python.jpg'
),
(
    '9781593279288',
    'Automate the Boring Stuff with Python',
    1,
    NULL,
    '2nd Edition',
    2019,
    'English',
    592,
    899.00,
    'A practical guide to using Python to automate everyday tasks and improve productivity.',
    'covers/automate-boring-stuff.jpg'
),
(
    '9780470128728',
    'Computer Architecture: A Quantitative Approach',
    8,
    5,
    '5th Edition',
    2011,
    'English',
    856,
    1499.00,
    'A comprehensive study of computer architecture principles, performance analysis, and hardware design trade-offs.',
    'covers/computer-architecture-quantitative.jpg'
)
;
INSERT INTO authors
(author_name, biography, email)
VALUES
('Ian Sommerville', 'Author of the widely used Software Engineering textbook.', 'ian.sommerville@example.com'),
('Alfred V. Aho', 'Computer scientist and co-author of the classic compilers textbook known as the Dragon Book.', 'alfred.aho@example.com'),
('Erwin Kreyszig', 'Mathematician known for the widely used Advanced Engineering Mathematics textbook.', 'erwin.kreyszig@example.com'),
('Kenneth H. Rosen', 'Author of the widely used Discrete Mathematics and Its Applications textbook.', 'kenneth.rosen@example.com'),
('Robert L. Boylestad', 'Author known for textbooks on electronic devices and circuit theory.', 'robert.boylestad@example.com'),
('Michael T. Goodrich', 'Computer scientist and co-author of data structures and algorithms textbooks.', 'michael.goodrich@example.com'),
('Dafydd Stuttard', 'Security researcher and author of The Web Application Hacker''s Handbook.', 'dafydd.stuttard@example.com'),
('Eric Freeman', 'Co-author of the Head First series, including Head First Design Patterns.', 'eric.freeman@example.com'),
('Ronald E. Walpole', 'Author known for textbooks on probability and statistics for engineers.', 'ronald.walpole@example.com'),
('Carl Hamacher', 'Author known for textbooks on computer organization and embedded systems.', 'carl.hamacher@example.com');
select * from authors;
INSERT IGNORE INTO book_authors
(book_id, author_id)
VALUES
(5, 1),
(6, 2),
(7, 3),
(8, 4),
(9, 5),
(10, 6),
(11, 7),
(12, 8),
(13, 9),
(14, 10);
select * from book_authors;
INSERT  IGNORE INTO book_copies
(
    book_id,
    accession_number,
    barcode,
    shelf_location,
    purchase_date,
    price,
    condition_status,
    availability_status
)
VALUES
(
    5,
    'ACC-CS-0001',
    'LIB-BC-000001',
    'CS-A01-S01',
    '2025-06-15',
    899.00,
    'New',
    'Available'
),
(
    6,
    'ACC-OS-0002',
    'LIB-BC-000002',
    'CS-A02-S01',
    '2025-06-18',
    799.00,
    'Good',
    'Available'
),
(
    7,
    'ACC-DB-0003',
    'LIB-BC-000003',
    'DB-B01-S01',
    '2025-06-20',
    949.00,
    'New',
    'Available'
),
(
    8,
    'ACC-AI-0004',
    'LIB-BC-000004',
    'AI-C01-S01',
    '2025-07-02',
    999.00,
    'New',
    'Available'
),
(
    9,
    'ACC-SW-0005',
    'LIB-BC-000005',
    'SW-D01-S01',
    '2025-07-05',
    599.00,
    'Good',
    'Available'
),
(
    10,
    'ACC-WD-0006',
    'LIB-BC-000006',
    'WD-E01-S01',
    '2025-07-10',
    699.00,
    'Good',
    'Available'
),
(
    11,
    'ACC-DS-0007',
    'LIB-BC-000007',
    'DS-F01-S01',
    '2025-07-12',
    899.00,
    'New',
    'Available'
),
(
    12,
    'ACC-NW-0008',
    'LIB-BC-000008',
    'NW-G01-S01',
    '2025-07-15',
    849.00,
    'Good',
    'Available'
),
(
    13,
    'ACC-DB-0009',
    'LIB-BC-000009',
    'DB-B01-S02',
    '2025-07-18',
    929.00,
    'New',
    'Available'
),
(
    14,
    'ACC-AI-0010',
    'LIB-BC-000010',
    'AI-C01-S02',
    '2025-07-20',
    1099.00,
    'New',
    'Available'
);
select * from book_copies;

INSERT IGNORE INTO users
(username, email, password, role, status)
VALUES
('arjun.reddy', 'arjun.reddy@college.edu', 'Student@2026A1', 'Student', 'Active'),
('sneha.varma', 'sneha.varma@college.edu', 'Student@2026B2', 'Student', 'Active'),
('rahul.kumar', 'rahul.kumar@college.edu', 'Student@2026C3', 'Student', 'Active'),
('priya.sharma', 'priya.sharma@college.edu', 'Student@2026D4', 'Student', 'Active'),
('vishal.naidu', 'vishal.naidu@college.edu', 'Student@2026E5', 'Student', 'Active'),
('ananya.reddy', 'ananya.reddy@college.edu', 'Student@2026F6', 'Student', 'Active'),
('rohit.verma', 'rohit.verma@college.edu', 'Student@2026G7', 'Student', 'Active'),
('kavya.singh', 'kavya.singh@college.edu', 'Student@2026H8', 'Student', 'Active'),
('aditya.patel', 'aditya.patel@college.edu', 'Student@2026I9', 'Student', 'Active'),
('meghana.rao', 'meghana.rao@college.edu', 'Student@2026J0', 'Student', 'Active');

INSERT IGNORE INTO students
(
    user_id,
    roll_number,
    student_name,
    department,
    year,
    semester,
    phone,
    address,
    admission_year,
    status
)
VALUES
(
    1,
    'CSE2024A001',
    'Arjun Reddy',
    'Computer Science and Engineering',
    3,
    6,
    '9876543210',
    'Vijayawada, Andhra Pradesh',
    2024,
    'Active'
),
(
    2,
    'CSE2025A014',
    'Sneha Varma',
    'Computer Science and Engineering',
    2,
    4,
    '9865432101',
    'Guntur, Andhra Pradesh',
    2025,
    'Active'
),

(
    4,
    'IT2024C008',
    'Priya Sharma',
    'Information Technology',
    3,
    6,
    '9843210123',
    'Hyderabad, Telangana',
    2024,
    'Active'
),
(
    5,
    'CSE2023A037',
    'Vishal Naidu',
    'Computer Science and Engineering',
    4,
    8,
    '9832101234',
    'Nizamabad, Telangana',
    2023,
    'Active'
),
(
    6,
    'AIDS2025D006',
    'Ananya Reddy',
    'Artificial Intelligence and Data Science',
    2,
    4,
    '9821012345',
    'Warangal, Telangana',
    2025,
    'Active'
),
(
    7,
    'ECE2024B019',
    'Rohit Verma',
    'Electronics and Communication Engineering',
    3,
    6,
    '9810123456',
    'Rajahmundry, Andhra Pradesh',
    2024,
    'Active'
),
(
    8,
    'IT2023C031',
    'Kavya Singh',
    'Information Technology',
    4,
    8,
    '9801234567',
    'Kurnool, Andhra Pradesh',
    2023,
    'Active'
),
(
    9,
    'ME2024E011',
    'Aditya Patel',
    'Mechanical Engineering',
    3,
    6,
    '9792345678',
    'Tirupati, Andhra Pradesh',
    2024,
    'Active'
),
(
    10,
    'CSE2022A045',
    'Meghana Rao',
    'Computer Science and Engineering',
    4,
    8,
    '9783456789',
    'Nellore, Andhra Pradesh',
    2022,
    'Graduated'
);
UPDATE students SET roll_number = '25KN1A0501' WHERE student_id = 11;
UPDATE students SET roll_number = '21KN1A4227' WHERE student_id = 13;
UPDATE students SET roll_number = '24KN1A0519' WHERE student_id = 14;
UPDATE students SET roll_number = '23KN1A4414' WHERE student_id = 15;
UPDATE students SET roll_number = '25KN1A6136' WHERE student_id = 16;
UPDATE students SET roll_number = '24KN1A1217' WHERE student_id = 17;
UPDATE students SET roll_number = '22KN1A4223' WHERE student_id = 18;
UPDATE students SET roll_number = '25KN1A1228' WHERE student_id = 25;
select * from students;
select * from users;
INSERT IGNORE INTO users
(username, email, password, role, status)
VALUES
('library.admin', 'library.admin@college.edu', 'Librarian@2026A1', 'Librarian', 'Active'),
('meera.nair', 'meera.nair@college.edu', 'Librarian@2026B2', 'Librarian', 'Active'),
('suresh.reddy', 'suresh.reddy@college.edu', 'Librarian@2026C3', 'Librarian', 'Active'),
('lakshmi.rao', 'lakshmi.rao@college.edu', 'Librarian@2026D4', 'Librarian', 'Active'),
('kiran.kumar', 'kiran.kumar@college.edu', 'Librarian@2026E5', 'Librarian', 'Active'),
('deepa.sharma', 'deepa.sharma@college.edu', 'Librarian@2026F6', 'Librarian', 'Active'),
('anil.varma', 'anil.varma@college.edu', 'Librarian@2026G7', 'Librarian', 'Active'),
('pooja.singh', 'pooja.singh@college.edu', 'Librarian@2026H8', 'Librarian', 'Active'),
('ramesh.naidu', 'ramesh.naidu@college.edu', 'Librarian@2026I9', 'Librarian', 'Active'),
('swathi.reddy', 'swathi.reddy@college.edu', 'Librarian@2026J0', 'Librarian', 'Active');

select * from users;
INSERT INTO librarians
(
    user_id,
    employee_id,
    librarian_name,
    phone,
    designation,
    joining_date,
    status
)
VALUES
(25, 'LIB-EMP-001', 'Library Admin', '9876501001', 'Chief Librarian', '2018-06-15', 'Active'),
(26, 'LIB-EMP-002', 'Dr. Meera Nair', '9876501002', 'Senior Librarian', '2019-03-20', 'Active'),
(27, 'LIB-EMP-003', 'Suresh Reddy', '9876501003', 'Assistant Librarian', '2020-07-10', 'Active'),
(28, 'LIB-EMP-004', 'Lakshmi Rao', '9876501004', 'Digital Library Coordinator', '2021-01-18', 'Active'),
(29, 'LIB-EMP-005', 'Kiran Kumar', '9876501005', 'Technical Services Librarian', '2021-08-25', 'Active'),
(30, 'LIB-EMP-006', 'Deepa Sharma', '9876501006', 'Circulation Librarian', '2022-02-14', 'Active'),
(31, 'LIB-EMP-007', 'Anil Varma', '9876501007', 'Reference Librarian', '2022-09-05', 'Active'),
(32, 'LIB-EMP-008', 'Pooja Singh', '9876501008', 'Acquisition Librarian', '2023-04-12', 'Active'),
(33, 'LIB-EMP-009', 'Ramesh Naidu', '9876501009', 'Cataloguing Librarian', '2024-01-22', 'Active'),
(34, 'LIB-EMP-010', 'Swathi Reddy', '9876501010', 'Library Assistant', '2024-08-19', 'Active');
  SELECT
    librarian_id,
    user_id,
    employee_id,
    librarian_name,
    phone,
    designation,
    joining_date,
    status
FROM librarians
ORDER BY librarian_id;
   select * from librarians;
 SELECT issue_id, student_id, status
FROM book_issues
WHERE issue_id BETWEEN 12 AND 19;
    INSERT  IGNORE INTO book_issues
(
    copy_id,
    student_id,
    librarian_id,
    issue_date,
    due_date,
    status,
    renewal_count
)
VALUES
(291, 1, 11, '2026-08-01', '2026-08-15', 'Returned', 0),
(292, 2, 12, '2026-08-03', '2026-08-17', 'Returned', 1),
(293, 3, 13, '2026-08-05', '2026-08-19', 'Overdue', 0),
(294, 11, 14, '2026-08-08', '2026-08-22', 'Issued', 0),
(295, 12, 15, '2026-08-10', '2026-08-24', 'Issued', 1),
(296, 13, 16, '2026-08-11', '2026-08-25', 'Issued', 0),
(297, 14, 17, '2026-08-12', '2026-08-26', 'Issued', 0),
(298, 14, 18, '2026-08-13', '2026-08-27', 'Issued', 0),
(299, 15, 19, '2026-08-14', '2026-08-28', 'Issued', 0),
(300, 16, 20, '2026-08-15', '2026-08-29', 'Issued', 1);

INSERT IGNORE INTO book_returns
(
    issue_id,
    return_date,
    condition_status,
    remarks,
    processed_by
)
VALUES
(
    12,
    '2026-08-10',
    'Good',
    'Book returned on time and inspected successfully.',
    9
),
(
    13,
    '2026-08-12',
    'Good',
    'Book returned after renewal with no physical damage.',
    9
),
(
    14,
    '2026-08-14',
    'Damaged',
    'Minor damage observed on the front cover.',
    9
),
(
    15,
    '2026-08-15',
    'Good',
    'Book returned in excellent condition.',
    9
),
(
    16,
    '2026-08-16',
    'Good',
    'Book returned and barcode verified successfully.',
    9
),
(
    17,
    '2026-08-17',
    'Damaged',
    'Several pages had minor folding marks.',
    9
),
(
    18,
    '2026-08-18',
    'Good',
    'Book returned within the permitted period.',
    9
),
(
    19,
    '2026-08-19',
    'Good',
    'Book condition verified and returned to circulation.',
    9
);
SELECT * FROM book_returns;
INSERT IGNORE INTO fines
(
    issue_id,
    student_id,
    fine_type,
    amount,
    reason,
    payment_status,
    paid_date
)
VALUES
(12, 11, 'Late Return', 50.00,
 'Book returned late.', 'Paid', '2026-08-10'),

(13, 13, 'Late Return', 30.00,
 'Book returned after the due date.', 'Paid', '2026-08-12'),

(14, 14, 'Damaged Book', 150.00,
 'Minor damage to the front cover.', 'Pending', NULL),

(15, 15, 'Late Return', 75.00,
 'Book returned after the scheduled due date.', 'Paid', '2026-08-15'),

(16, 16, 'Damaged Book', 200.00,
 'Binding damage identified during inspection.', 'Pending', NULL),

(17, 17, 'Late Return', 40.00,
 'Book returned after the due date.', 'Paid', '2026-08-17'),

(18, 18, 'Damaged Book', 100.00,
 'Several pages were folded.', 'Waived', NULL),

(19, 11, 'Late Return', 60.00,
 'Book returned after the due date.', 'Pending', NULL);
 select * from fines;
INSERT IGNORE INTO notifications
(
    user_id,
    title,
    message,
    notification_type,
    is_read
)
VALUES
(
    1,
    'Book Due Reminder',
    'Your borrowed book is due soon. Please return or renew it before the due date.',
    'Due Reminder',
    FALSE
),
(
    2,
    'Overdue Book Alert',
    'Your borrowed book has exceeded the due date. Please return it immediately to avoid additional fines.',
    'Overdue',
    FALSE
),
(
    11,
    'Fine Generated',
    'A library fine of ₹150 has been generated for damage identified during book return.',
    'Fine',
    FALSE
),
(
    4,
    'Reservation Approved',
    'Your reservation for the requested library book has been approved. Please collect it within the reservation period.',
    'Reservation',
    TRUE
),
(
    5,
    'Due Date Reminder',
    'Your currently issued book is approaching its return deadline.',
    'Due Reminder',
    TRUE
),
(
    6,
    'Fine Payment Received',
    'Your library fine payment has been successfully recorded by the library.',
    'Fine',
    TRUE
),
(
    7,
    'Overdue Notification',
    'A borrowed book is overdue. Please contact the circulation desk if you require assistance.',
    'Overdue',
    FALSE
),
(
    8,
    'Reservation Available',
    'A book you previously requested is now available for collection from the library.',
    'Reservation',
    FALSE
),
(
    9,
    'Library Account Update',
    'Your library account has been updated successfully. You can now view your current borrowing history.',
    'General',
    TRUE
),
(
    10,
    'Important Library Notice',
    'Please review the latest library rules regarding borrowing periods, renewals, and overdue fines.',
    'General',
    FALSE
);
INSERT INTO notifications
(user_id, title, message, notification_type)
VALUES
(76, 'Test Notification', 'This is a test notification for Bindhu.', 'General');
INSERT INTO reservations
(
    book_id,
    student_id,
    reservation_date,
    expiry_date,
    status
)
VALUES
(1, 11, '2026-08-20 09:00:00', '2026-08-23 09:00:00', 'Pending'),

(2, 13, '2026-08-20 09:15:00', '2026-08-23 09:15:00', 'Approved'),

(3, 14, '2026-08-20 09:30:00', '2026-08-24 09:30:00', 'Completed'),

(4, 15, '2026-08-20 10:00:00', '2026-08-25 10:00:00', 'Pending'),

(5, 16, '2026-08-20 10:15:00', '2026-08-24 10:15:00', 'Cancelled'),

(6, 17, '2026-08-20 10:30:00', '2026-08-26 10:30:00', 'Approved'),

(7, 18, '2026-08-20 10:45:00', '2026-08-27 10:45:00', 'Pending'),

(9, 11, '2026-08-20 11:00:00', '2026-08-25 11:00:00', 'Expired'),

(10, 13, '2026-08-20 11:15:00', '2026-08-26 11:15:00', 'Completed'),

(12, 14, '2026-08-20 11:30:00', '2026-08-27 11:30:00', 'Pending');

INSERT INTO reviews
(
    book_id,
    student_id,
    rating,
    review_text,
    status
)
VALUES
(1, 11, 5, 'Excellent book for learning Java programming fundamentals.', 'Approved'),

(2, 14, 4, 'Very useful book for understanding clean coding practices.', 'Approved'),

(3, 14, 5, 'A very good reference for database management concepts.', 'Approved'),

(4, 15, 4, 'React concepts are explained clearly and practically.', 'Pending'),

(5, 16, 5, 'Very helpful for learning Python data analysis.', 'Approved'),

(6, 17, 4, 'A useful book for understanding C programming.', 'Approved'),

(7, 18, 5, 'Excellent introduction to artificial intelligence.', 'Pending'),

(9, 11, 4, 'Networking concepts are explained in a simple way.', 'Approved'),

(10, 13, 5, 'Good explanation of computer organization and design.', 'Pending'),

(12, 14, 4, 'Useful general knowledge reference book.', 'Approved');

ALTER TABLE users
ADD COLUMN reset_token VARCHAR(255) NULL,
ADD COLUMN reset_token_expires DATETIME NULL;
INSERT INTO book_issues
(
    copy_id,
    student_id,
    librarian_id,
    issue_date,
    due_date,
    status,
    renewal_count
)
VALUES
(1, 11, 9, '2026-08-01', '2026-08-15', 'Issued', 0),
(2, 13, 9, '2026-08-02', '2026-08-16', 'Issued', 0),
(3, 14, 9, '2026-08-03', '2026-08-17', 'Issued', 0),
(4, 15, 9, '2026-08-04', '2026-08-18', 'Issued', 0),
(5, 16, 9, '2026-08-05', '2026-08-19', 'Issued', 0),
(6, 17, 9, '2026-08-06', '2026-08-20', 'Issued', 0),
(7, 18, 9, '2026-08-07', '2026-08-21', 'Issued', 0),
(8, 11, 9, '2026-08-08', '2026-08-22', 'Issued', 0);
INSERT INTO book_issues
(copy_id, student_id, librarian_id, issue_date, due_date, status)
VALUES
(1, 38, 57, '2026-08-20', '2026-08-27', 'Issued'),
(2, 38, 57, '2026-08-22', '2026-08-29', 'Issued'),
(3, 38, 57, '2026-08-10', '2026-08-25', 'Overdue');
UPDATE book_copies
SET availability_status = 'Issued'
WHERE copy_id IN (1, 2, 3);
INSERT INTO fines
(issue_id, student_id, fine_type, amount, reason, payment_status)
VALUES
(51, 38, 'Late Return', 20.00, 'Book is overdue by 2 days', 'Pending');
INSERT INTO notifications
(user_id, title, message, notification_type, is_read)
VALUES
(113, 'Book Due Today', 'Your borrowed book is due today. Please return it to the library.', 'Due Reminder', 0),

(113, 'Book Due Soon', 'Your borrowed book is due on August 29, 2026.', 'Due Reminder', 0),

(113, 'Book Overdue', 'You have a book that is overdue. Please return it as soon as possible.', 'Overdue', 0),

(113, 'Pending Fine', 'You have a pending library fine of ₹20.00.', 'Fine', 0);
INSERT INTO notifications
(user_id, title, message, notification_type, is_read)
VALUES
(71, 'Book Due Today', 'A borrowed book is due for return today.', 'Due Reminder', 0),

(71, 'Book Due Soon', 'A borrowed book is due within the next 3 days.', 'Due Reminder', 0),

(71, 'Overdue Book Alert', 'A borrowed book has passed its due date.', 'Overdue', 0),

(71, 'Pending Fine', 'A pending library fine requires attention.', 'Fine', 0);
INSERT INTO notifications
(user_id, title, message, notification_type, is_read)
VALUES
(123, 'Book Due Today', 'A borrowed book is due for return today.', 'Due Reminder', 0),
(123, 'Book Due Soon', 'A borrowed book is due within the next 3 days.', 'Due Reminder', 0),
(123, 'Overdue Book Alert', 'A borrowed book has passed its due date.', 'Overdue', 0),
(123, 'Pending Fine', 'A pending library fine requires attention.', 'Fine', 0);