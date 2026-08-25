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
```

---

# ⚙️ Getting Started

## Prerequisites

- Node.js (v18+)
- MySQL Server, running locally
- npm

## 1. Clone the repository

```bash
git clone https://github.com/vantlamunny-ai/college_library_management_system
cd college_library_management_system
```

## 2. Backend setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in your own values:

```env
PORT=3000
JWT_SECRET=your-secret-key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=college_library_system
```

`EMAIL_USER`, `EMAIL_APP_PASSWORD`, `RESET_PASSWORD_URL`, and `INITIAL_ADMIN_*` are optional, see the comments in `.env.example` for what each one does. Leave the email fields blank and the forgot-password flow still works, it just returns the reset link directly instead of emailing it.

Load the database schema (this creates the database and every table for you):

```bash
mysql -u root -p < db/schema.sql
```

Optional, seeds ~77 real books with real cover images:

```bash
node db/seed-books.js
```

Start the backend:

```bash
npm run dev
```

Runs on `http://localhost:3000` by default.

## 3. Frontend setup

```bash
cd frontend/frontend
npm install
```

Copy `.env.example` to `.env`, the default `VITE_API_BASE_URL=http://localhost:3000` is fine as long as the backend is running on port 3000.

Start the frontend:

```bash
npm run dev
```

Runs on `http://localhost:5173`.

## 4. Create an account

Open `http://localhost:5173`, click **Create an account**, and register as a Student, Librarian, or Admin, registration is self-service for all three roles.
