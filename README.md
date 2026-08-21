# 📚 College Library Management System

A web-based **College Library Management System** developed to digitally manage library operations such as authentication, students, books, book issues, returns, reservations, fines, notifications, and reports.

The system provides separate functionality for different user roles and uses a RESTful backend with a React + Vite frontend and MySQL database.

---

## 🚀 Project Overview

The College Library Management System helps automate the major activities of a college library.

Instead of maintaining library records manually, the system provides a centralized application for:

- Managing users and authentication
- Managing books and book copies
- Managing students
- Issuing books
- Returning books
- Reserving books
- Managing fines and notifications
- Generating library reports

---

# 🧩 Modules

The project contains the following **8 major modules**:

### 1. 🔐 Authentication

- User registration
- User login
- JWT authentication
- Password encryption using bcrypt
- Role-based authorization
- Admin, Librarian, and Student roles

---

### 2. 📚 Books

- Add books
- View books
- Update books
- Delete books
- Manage book copies
- Track book copy availability
- Track book condition

---

### 3. 👨‍🎓 Students

- Add students
- View students
- Update student information
- Delete students
- Manage student details
- View student library activities

---

### 4. 📖 Book Issues

- Issue books to students
- Record issue date
- Record due date
- Track issue status
- Track renewal count
- Associate books with students and librarians

---

### 5. 🔄 Book Returns

- Return issued books
- Record return date
- Record book condition
- Add return remarks
- Record the librarian who processed the return
- Update book availability after return

---

### 6. 📌 Reservations

- Students can reserve books
- Create reservations
- View reservations
- Approve reservations
- Complete reservations
- Cancel reservations
- Expire reservations

---

### 7. 💰🔔 Fines & Notifications

#### Fines

- Generate fines
- Track fine amount
- Track fine status
- Manage fine payments
- Record payment information

#### Notifications

- Due-date notifications
- Overdue notifications
- Reservation notifications
- Fine-related notifications
- General library notifications

---

### 8. 📊 Reports

The Report Module provides useful information about library activities.

Reports include:

- Library summary
- Book inventory report
- Book issue report
- Book return report
- Overdue report
- Reservation report
- Fine report
- Student borrowing report

---

# 🛠️ Technology Stack

## Frontend

- React.js
- Vite
- JavaScript
- HTML5
- CSS3

## Backend

- Node.js
- Express.js
- REST API
- JWT
- bcrypt
- nodemalier

## Database

- MySQL
- MySQL Workbench

## API Testing

- Postman

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      Frontend        │
                    │   React + Vite       │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               │
                    ┌──────────▼───────────┐
                    │       Backend        │
                    │   Node.js + Express  │
                    └──────────┬───────────┘
                               │
                               │ MySQL Queries
                               │
                    ┌──────────▼───────────┐
                    │       Database       │
                    │        MySQL         │
                    └──────────────────────┘
