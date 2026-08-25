/**
 * Seeds ~77 real, published books (real titles/authors/ISBNs/publishers)
 * across a proper academic category spread, plus 2 physical copies each
 * and real cover image URLs — into the actual database, through nothing
 * but SQL. No frontend mock data involved.
 *
 * Cover strategy: no file-upload infrastructure exists in this backend
 * (no multer, no uploads dir, no cloud storage), and building one just for
 * this would be its own project. Instead each book's `cover_image` is set
 * to its real OpenLibrary cover URL (https://covers.openlibrary.org/b/isbn/
 * <isbn>-M.jpg) — a free, public, ISBN-keyed cover service built for
 * exactly this use case. It's computed here and stored on the book row,
 * so the frontend only ever reads `book.cover_image` from the API — never
 * a URL hardcoded in a component. Not every ISBN has a cover on file
 * there (it's crowd-sourced), which is exactly why the frontend also
 * implements a broken/missing-image fallback rather than assuming success.
 *
 * Idempotent: run it as many times as you want.
 *   - Categories/publishers/authors: INSERT IGNORE, matched by unique name.
 *   - Books: matched by ISBN; skipped if already present (title/metadata
 *     of an existing row is left untouched — the seed only fills in what's
 *     missing, it never overwrites real data you may have edited since).
 *   - Copies: only created up to COPIES_PER_BOOK per book, checking how
 *     many that book already has first — re-running never adds duplicates.
 *
 * Usage:  node db/seed-books.js
 */

require("dotenv").config();
const db = require("../config/db");

const COPIES_PER_BOOK = 2;

const CATEGORIES = [
  "Computer Science", "Programming", "Data Structures", "Algorithms",
  "Database Management", "Web Development", "Artificial Intelligence",
  "Machine Learning", "Data Science", "Mathematics", "Statistics",
  "Electronics", "Communication", "Engineering", "General Knowledge",
];

const BOOKS = [
  // Computer Science
  { isbn: "9780132350884", title: "Clean Code", authors: ["Robert C. Martin"], publisher: "Prentice Hall", year: 2008, category: "Computer Science", pages: 464, price: 899, description: "A practical guide to writing readable, maintainable, professional software." },
  { isbn: "9780135957059", title: "The Pragmatic Programmer", authors: ["David Thomas", "Andrew Hunt"], publisher: "Addison-Wesley", year: 2019, category: "Computer Science", pages: 352, price: 999, description: "Classic guide to pragmatic software craftsmanship, updated for modern practice." },
  { isbn: "9780735619678", title: "Code Complete", authors: ["Steve McConnell"], publisher: "Microsoft Press", year: 2004, category: "Computer Science", pages: 960, price: 1299, description: "A comprehensive handbook of software construction best practices." },
  { isbn: "9780262510875", title: "Structure and Interpretation of Computer Programs", authors: ["Harold Abelson", "Gerald Jay Sussman"], publisher: "MIT Press", year: 1996, category: "Computer Science", pages: 657, price: 1150, description: "The classic MIT text on programming fundamentals using Scheme." },
  { isbn: "9780201896831", title: "The Art of Computer Programming, Vol 1", authors: ["Donald E. Knuth"], publisher: "Addison-Wesley", year: 1997, category: "Computer Science", pages: 672, price: 1599, description: "Fundamental algorithms — the first volume of Knuth's landmark series." },
  { isbn: "9781119800361", title: "Operating System Concepts", authors: ["Abraham Silberschatz", "Peter B. Galvin", "Greg Gagne"], publisher: "Wiley", year: 2018, category: "Computer Science", pages: 1104, price: 1499, description: "The standard textbook on operating system design and implementation." },

  // Programming
  { isbn: "9780131103627", title: "The C Programming Language", authors: ["Brian W. Kernighan", "Dennis M. Ritchie"], publisher: "Prentice Hall", year: 1988, category: "Programming", pages: 272, price: 699, description: "The definitive reference for the C language, by its creators." },
  { isbn: "9781593279288", title: "Python Crash Course", authors: ["Eric Matthes"], publisher: "No Starch Press", year: 2019, category: "Programming", pages: 544, price: 899, description: "A hands-on, project-based introduction to Python programming." },
  { isbn: "9780134685991", title: "Effective Java", authors: ["Joshua Bloch"], publisher: "Addison-Wesley", year: 2018, category: "Programming", pages: 412, price: 1099, description: "Best practices for writing clear, correct, robust Java code." },
  { isbn: "9780596009205", title: "Head First Java", authors: ["Kathy Sierra", "Bert Bates"], publisher: "O'Reilly Media", year: 2005, category: "Programming", pages: 720, price: 999, description: "A visually rich, brain-friendly introduction to Java." },
  { isbn: "9780321563842", title: "Programming: Principles and Practice Using C++", authors: ["Bjarne Stroustrup"], publisher: "Addison-Wesley", year: 2013, category: "Programming", pages: 1236, price: 1399, description: "An introduction to programming and C++ by the language's creator." },
  { isbn: "9781449355739", title: "Learning Python", authors: ["Mark Lutz"], publisher: "O'Reilly Media", year: 2013, category: "Programming", pages: 1648, price: 1799, description: "An in-depth, comprehensive introduction to the Python language." },

  // Data Structures
  { isbn: "9780672324536", title: "Data Structures and Algorithms in Java", authors: ["Robert Lafore"], publisher: "Sams Publishing", year: 2002, category: "Data Structures", pages: 800, price: 899, description: "An accessible, example-driven introduction to core data structures." },
  { isbn: "9780198099307", title: "Data Structures Using C", authors: ["Reema Thareja"], publisher: "Oxford University Press", year: 2014, category: "Data Structures", pages: 656, price: 595, description: "A widely used undergraduate textbook on data structures in C." },
  { isbn: "9780929306073", title: "Fundamentals of Data Structures in C", authors: ["Ellis Horowitz", "Sartaj Sahni"], publisher: "Silicon Press", year: 2007, category: "Data Structures", pages: 624, price: 799, description: "A rigorous treatment of data structures and their C implementations." },
  { isbn: "9780132847377", title: "Data Structures and Algorithm Analysis in C++", authors: ["Mark Allen Weiss"], publisher: "Pearson", year: 2013, category: "Data Structures", pages: 608, price: 899, description: "Analyzes data structures with an emphasis on algorithmic efficiency." },
  { isbn: "9788120339282", title: "Classic Data Structures", authors: ["Debasis Samanta"], publisher: "PHI Learning", year: 2008, category: "Data Structures", pages: 876, price: 550, description: "A detailed exploration of data structures with algorithmic analysis." },

  // Algorithms
  { isbn: "9780262046305", title: "Introduction to Algorithms", authors: ["Thomas H. Cormen", "Charles E. Leiserson", "Ronald L. Rivest", "Clifford Stein"], publisher: "MIT Press", year: 2022, category: "Algorithms", pages: 1312, price: 1499, description: "The most widely used algorithms textbook in computer science education." },
  { isbn: "9780321573513", title: "Algorithms", authors: ["Robert Sedgewick", "Kevin Wayne"], publisher: "Addison-Wesley", year: 2011, category: "Algorithms", pages: 976, price: 1299, description: "A comprehensive, practical survey of the most important algorithms." },
  { isbn: "9781849967204", title: "The Algorithm Design Manual", authors: ["Steven S. Skiena"], publisher: "Springer", year: 2008, category: "Algorithms", pages: 736, price: 1399, description: "A practical guide to algorithm design with a catalog of problem types." },
  { isbn: "9781617292231", title: "Grokking Algorithms", authors: ["Aditya Bhargava"], publisher: "Manning Publications", year: 2016, category: "Algorithms", pages: 256, price: 799, description: "An illustrated, beginner-friendly guide to common algorithms." },
  { isbn: "9780262518802", title: "Algorithms Unlocked", authors: ["Thomas H. Cormen"], publisher: "MIT Press", year: 2013, category: "Algorithms", pages: 240, price: 699, description: "An accessible explanation of how and why algorithms work." },

  // Database Management
  { isbn: "9780078022159", title: "Database System Concepts", authors: ["Abraham Silberschatz", "Henry F. Korth", "S. Sudarshan"], publisher: "McGraw-Hill", year: 2019, category: "Database Management", pages: 1376, price: 1299, description: "A comprehensive introduction to database design and systems." },
  { isbn: "9780133970777", title: "Fundamentals of Database Systems", authors: ["Ramez Elmasri", "Shamkant B. Navathe"], publisher: "Pearson", year: 2015, category: "Database Management", pages: 1176, price: 1399, description: "A thorough treatment of database modeling, design, and implementation." },
  { isbn: "9783950307825", title: "SQL Performance Explained", authors: ["Markus Winand"], publisher: "Markus Winand", year: 2012, category: "Database Management", pages: 204, price: 599, description: "Explains SQL indexing and query performance across major databases." },
  { isbn: "9780596520830", title: "Learning SQL", authors: ["Alan Beaulieu"], publisher: "O'Reilly Media", year: 2009, category: "Database Management", pages: 336, price: 699, description: "A practical, example-driven introduction to SQL." },
  { isbn: "9780321884497", title: "Database Design for Mere Mortals", authors: ["Michael J. Hernandez"], publisher: "Addison-Wesley", year: 2013, category: "Database Management", pages: 653, price: 899, description: "A hands-on, accessible guide to relational database design." },

  // Web Development
  { isbn: "9781492051725", title: "Learning React", authors: ["Alex Banks", "Eve Porcello"], publisher: "O'Reilly Media", year: 2020, category: "Web Development", pages: 350, price: 999, description: "A practical introduction to building applications with React." },
  { isbn: "9781593279509", title: "Eloquent JavaScript", authors: ["Marijn Haverbeke"], publisher: "No Starch Press", year: 2018, category: "Web Development", pages: 472, price: 799, description: "A modern introduction to JavaScript and programming in general." },
  { isbn: "9781118008188", title: "HTML and CSS: Design and Build Websites", authors: ["Jon Duckett"], publisher: "Wiley", year: 2011, category: "Web Development", pages: 490, price: 999, description: "A richly illustrated guide to building websites with HTML and CSS." },
  { isbn: "9780596517748", title: "JavaScript: The Good Parts", authors: ["Douglas Crockford"], publisher: "O'Reilly Media", year: 2008, category: "Web Development", pages: 176, price: 599, description: "A focused look at the best features of the JavaScript language." },
  { isbn: "9780991344628", title: "Full Stack React", authors: ["Anthony Accomazzo", "Nate Murray"], publisher: "Fullstack.io", year: 2017, category: "Web Development", pages: 800, price: 1099, description: "A project-based guide to building complete applications with React." },

  // Artificial Intelligence
  { isbn: "9780134610993", title: "Artificial Intelligence: A Modern Approach", authors: ["Stuart Russell", "Peter Norvig"], publisher: "Pearson", year: 2020, category: "Artificial Intelligence", pages: 1136, price: 1599, description: "The leading, most widely adopted textbook on artificial intelligence." },
  { isbn: "9781408225745", title: "Artificial Intelligence: A Guide to Intelligent Systems", authors: ["Michael Negnevitsky"], publisher: "Addison-Wesley", year: 2011, category: "Artificial Intelligence", pages: 480, price: 999, description: "An accessible introduction to AI techniques and intelligent systems." },
  { isbn: "9781558601918", title: "Paradigms of Artificial Intelligence Programming", authors: ["Peter Norvig"], publisher: "Morgan Kaufmann", year: 1992, category: "Artificial Intelligence", pages: 946, price: 1299, description: "Case studies in AI programming using Common Lisp." },
  { isbn: "9781328545953", title: "AI Superpowers", authors: ["Kai-Fu Lee"], publisher: "Houghton Mifflin Harcourt", year: 2018, category: "Artificial Intelligence", pages: 272, price: 699, description: "An analysis of the global AI race and its societal impact." },
  { isbn: "9781493682225", title: "Artificial Intelligence for Humans", authors: ["Jeff Heaton"], publisher: "Heaton Research", year: 2013, category: "Artificial Intelligence", pages: 222, price: 599, description: "An approachable introduction to core AI algorithms and math." },

  // Machine Learning
  { isbn: "9780387310732", title: "Pattern Recognition and Machine Learning", authors: ["Christopher M. Bishop"], publisher: "Springer", year: 2006, category: "Machine Learning", pages: 738, price: 1499, description: "A graduate-level introduction to pattern recognition and ML theory." },
  { isbn: "9781492032649", title: "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow", authors: ["Aurélien Géron"], publisher: "O'Reilly Media", year: 2019, category: "Machine Learning", pages: 851, price: 1599, description: "A practical guide to building ML systems with popular Python tools." },
  { isbn: "9780387848570", title: "The Elements of Statistical Learning", authors: ["Trevor Hastie", "Robert Tibshirani", "Jerome Friedman"], publisher: "Springer", year: 2009, category: "Machine Learning", pages: 745, price: 1399, description: "A rigorous, widely cited text on statistical learning methods." },
  { isbn: "9780262035613", title: "Deep Learning", authors: ["Ian Goodfellow", "Yoshua Bengio", "Aaron Courville"], publisher: "MIT Press", year: 2016, category: "Machine Learning", pages: 800, price: 1599, description: "The definitive textbook on deep learning theory and practice." },
  { isbn: "9780999579500", title: "Machine Learning Yearning", authors: ["Andrew Ng"], publisher: "deeplearning.ai", year: 2018, category: "Machine Learning", pages: 118, price: 499, description: "Practical strategy advice for building effective ML systems." },

  // Data Science
  { isbn: "9781491957660", title: "Python for Data Analysis", authors: ["Wes McKinney"], publisher: "O'Reilly Media", year: 2017, category: "Data Science", pages: 550, price: 999, description: "A practical guide to data wrangling with pandas and Python." },
  { isbn: "9781492041139", title: "Data Science from Scratch", authors: ["Joel Grus"], publisher: "O'Reilly Media", year: 2019, category: "Data Science", pages: 406, price: 899, description: "Builds core data science tools and concepts from first principles." },
  { isbn: "9781119002253", title: "Storytelling with Data", authors: ["Cole Nussbaumer Knaflic"], publisher: "Wiley", year: 2015, category: "Data Science", pages: 288, price: 899, description: "A guide to effective, persuasive data visualization." },
  { isbn: "9781118530801", title: "The Data Warehouse Toolkit", authors: ["Ralph Kimball", "Margy Ross"], publisher: "Wiley", year: 2013, category: "Data Science", pages: 600, price: 1199, description: "The standard reference for dimensional modeling and data warehousing." },
  { isbn: "9780393347777", title: "Naked Statistics", authors: ["Charles Wheelan"], publisher: "W. W. Norton & Company", year: 2013, category: "Data Science", pages: 302, price: 599, description: "A witty, accessible introduction to statistical thinking." },

  // Mathematics
  { isbn: "9781259676512", title: "Discrete Mathematics and Its Applications", authors: ["Kenneth H. Rosen"], publisher: "McGraw-Hill", year: 2018, category: "Mathematics", pages: 1071, price: 999, description: "The standard undergraduate text on discrete mathematics." },
  { isbn: "9783319110790", title: "Linear Algebra Done Right", authors: ["Sheldon Axler"], publisher: "Springer", year: 2015, category: "Mathematics", pages: 340, price: 899, description: "A conceptual, proof-based introduction to linear algebra." },
  { isbn: "9781285740621", title: "Calculus", authors: ["James Stewart"], publisher: "Cengage Learning", year: 2015, category: "Mathematics", pages: 1368, price: 1299, description: "One of the most widely adopted calculus textbooks worldwide." },
  { isbn: "9780980232776", title: "Introduction to Linear Algebra", authors: ["Gilbert Strang"], publisher: "Wellesley-Cambridge Press", year: 2016, category: "Mathematics", pages: 584, price: 1099, description: "A clear, applied introduction to linear algebra by a renowned teacher." },
  { isbn: "9780201558029", title: "Concrete Mathematics", authors: ["Ronald L. Graham", "Donald E. Knuth", "Oren Patashnik"], publisher: "Addison-Wesley", year: 1994, category: "Mathematics", pages: 672, price: 1199, description: "A foundation for the mathematics underlying computer science." },

  // Statistics
  { isbn: "9780321629111", title: "Probability and Statistics for Engineers and Scientists", authors: ["Ronald E. Walpole", "Raymond H. Myers"], publisher: "Pearson", year: 2011, category: "Statistics", pages: 816, price: 999, description: "A comprehensive engineering-focused statistics textbook." },
  { isbn: "9780387402727", title: "All of Statistics", authors: ["Larry Wasserman"], publisher: "Springer", year: 2004, category: "Statistics", pages: 442, price: 1099, description: "A concise course covering statistics and statistical inference." },
  { isbn: "9780393929720", title: "Statistics", authors: ["David Freedman", "Robert Pisani", "Roger Purves"], publisher: "W. W. Norton & Company", year: 2007, category: "Statistics", pages: 720, price: 999, description: "A widely respected introductory statistics textbook." },
  { isbn: "9781461471370", title: "An Introduction to Statistical Learning", authors: ["Gareth James", "Daniela Witten", "Trevor Hastie", "Robert Tibshirani"], publisher: "Springer", year: 2013, category: "Statistics", pages: 426, price: 1299, description: "An accessible entry point into statistical and machine learning." },

  // Electronics
  { isbn: "9780521809269", title: "The Art of Electronics", authors: ["Paul Horowitz", "Winfield Hill"], publisher: "Cambridge University Press", year: 2015, category: "Electronics", pages: 1192, price: 1999, description: "A comprehensive, practically oriented electronics reference." },
  { isbn: "9780132774208", title: "Digital Design", authors: ["M. Morris Mano", "Michael D. Ciletti"], publisher: "Pearson", year: 2012, category: "Electronics", pages: 570, price: 899, description: "A foundational textbook on digital logic and design." },
  { isbn: "9780199339136", title: "Microelectronic Circuits", authors: ["Adel S. Sedra", "Kenneth C. Smith"], publisher: "Oxford University Press", year: 2014, category: "Electronics", pages: 1568, price: 1899, description: "The standard reference on analog and digital microelectronic circuits." },
  { isbn: "9780133923605", title: "Electronic Devices and Circuit Theory", authors: ["Robert L. Boylestad", "Louis Nashelsky"], publisher: "Pearson", year: 2013, category: "Electronics", pages: 912, price: 999, description: "A widely used introductory text on electronic devices and circuits." },
  { isbn: "9781259587542", title: "Practical Electronics for Inventors", authors: ["Paul Scherz", "Simon Monk"], publisher: "McGraw-Hill", year: 2016, category: "Electronics", pages: 1056, price: 1499, description: "A hands-on guide to electronics for hobbyists and engineers alike." },

  // Communication
  { isbn: "9780471697909", title: "Communication Systems", authors: ["Simon Haykin"], publisher: "Wiley", year: 2009, category: "Communication", pages: 936, price: 1299, description: "A comprehensive textbook on analog and digital communication systems." },
  { isbn: "9780072957167", title: "Digital Communications", authors: ["John G. Proakis"], publisher: "McGraw-Hill", year: 2007, category: "Communication", pages: 1150, price: 1399, description: "A rigorous graduate-level treatment of digital communication theory." },
  { isbn: "9780070633040", title: "Principles of Communication Systems", authors: ["Herbert Taub", "Donald Schilling"], publisher: "McGraw-Hill", year: 1986, category: "Communication", pages: 760, price: 899, description: "A classic introductory textbook on communication system principles." },
  { isbn: "9780521837163", title: "Wireless Communications", authors: ["Andrea Goldsmith"], publisher: "Cambridge University Press", year: 2005, category: "Communication", pages: 674, price: 1399, description: "A thorough treatment of wireless communication theory and systems." },

  // Engineering
  { isbn: "9780128122754", title: "Computer Organization and Design", authors: ["David A. Patterson", "John L. Hennessy"], publisher: "Morgan Kaufmann", year: 2017, category: "Engineering", pages: 712, price: 1499, description: "A hardware/software interface perspective on computer architecture." },
  { isbn: "9780133918922", title: "Engineering Mechanics: Statics", authors: ["Russell C. Hibbeler"], publisher: "Pearson", year: 2015, category: "Engineering", pages: 720, price: 1099, description: "A foundational engineering mechanics and statics textbook." },
  { isbn: "9780133943030", title: "Software Engineering", authors: ["Ian Sommerville"], publisher: "Pearson", year: 2015, category: "Engineering", pages: 816, price: 1199, description: "A broad, widely adopted introduction to software engineering practice." },
  { isbn: "9780133489798", title: "Introduction to Robotics: Mechanics and Control", authors: ["John J. Craig"], publisher: "Pearson", year: 2017, category: "Engineering", pages: 448, price: 1299, description: "A foundational textbook on robot kinematics, dynamics, and control." },
  { isbn: "9780132126953", title: "Computer Networks", authors: ["Andrew S. Tanenbaum", "David J. Wetherall"], publisher: "Pearson", year: 2010, category: "Engineering", pages: 960, price: 1299, description: "A classic, comprehensive textbook on computer networking." },

  // General Knowledge / Reference
  { isbn: "9780201633610", title: "Design Patterns: Elements of Reusable Object-Oriented Software", authors: ["Erich Gamma", "Richard Helm", "Ralph Johnson", "John Vlissides"], publisher: "Addison-Wesley", year: 1994, category: "General Knowledge", pages: 395, price: 1099, description: "The foundational catalog of object-oriented design patterns." },
  { isbn: "9780134757599", title: "Refactoring", authors: ["Martin Fowler"], publisher: "Addison-Wesley", year: 2018, category: "General Knowledge", pages: 448, price: 1099, description: "The definitive guide to improving the design of existing code." },
  { isbn: "9780201835953", title: "The Mythical Man-Month", authors: ["Frederick P. Brooks Jr."], publisher: "Addison-Wesley", year: 1995, category: "General Knowledge", pages: 322, price: 899, description: "Classic essays on software engineering and project management." },
  { isbn: "9780321934116", title: "Peopleware", authors: ["Tom DeMarco", "Timothy Lister"], publisher: "Addison-Wesley", year: 2013, category: "General Knowledge", pages: 264, price: 799, description: "A classic on the human side of software project management." },
  { isbn: "9780984782857", title: "Cracking the Coding Interview", authors: ["Gayle Laakmann McDowell"], publisher: "CareerCup", year: 2015, category: "General Knowledge", pages: 687, price: 999, description: "A widely used guide to technical interview preparation." },
  { isbn: "9781133187790", title: "Introduction to the Theory of Computation", authors: ["Michael Sipser"], publisher: "Cengage Learning", year: 2012, category: "General Knowledge", pages: 458, price: 1199, description: "The standard textbook on automata, computability, and complexity theory." },
  { isbn: "9780133594140", title: "Computer Networking: A Top-Down Approach", authors: ["James F. Kurose", "Keith W. Ross"], publisher: "Pearson", year: 2016, category: "General Knowledge", pages: 864, price: 1299, description: "An application-first approach to teaching computer networking." },
];

// A handful of ISBNs have no cover on file at OpenLibrary's ISBN-keyed
// endpoint at all (verified via HEAD requests — real 9-byte "no image"
// responses, not just low resolution). For those, OpenLibrary's own
// search index sometimes has a cover_i (cover ID) for the exact same
// edition under a different lookup path. Each override below was verified
// by title+author before being hardcoded — never picked by file size
// alone, since that previously matched a Turkish translation and a
// solutions-manual cover to the wrong books.
const COVER_ID_OVERRIDES = {
  "9780262046305": 2341462, // Introduction to Algorithms
  "9781119800361": 302591, // Operating System Concepts
  "9781449355739": 1312568, // Learning Python
  "9780929306073": 456023, // Fundamentals of Data Structures in C
  "9781408225745": 192999, // Artificial Intelligence: A Guide to Intelligent Systems
  "9781492041139": 12672936, // Data Science from Scratch
  "9780132774208": 83869, // Digital Design
  "9780070633040": 4142581, // Principles of Communication Systems
};

function coverUrlFor(isbn) {
  if (COVER_ID_OVERRIDES[isbn]) {
    return `https://covers.openlibrary.org/b/id/${COVER_ID_OVERRIDES[isbn]}-M.jpg`;
  }
  return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
}

async function run() {
  console.log(`Seeding ${BOOKS.length} books across ${CATEGORIES.length} categories...`);

  // 1. Categories (idempotent — matched by unique name)
  for (const name of CATEGORIES) {
    await db.query(
      `INSERT INTO categories (category_name, status) VALUES (?, 'Active')
       ON DUPLICATE KEY UPDATE category_name = category_name`,
      [name]
    );
  }
  const [categoryRows] = await db.query("SELECT category_id, category_name FROM categories");
  const categoryIdByName = new Map(categoryRows.map((c) => [c.category_name, c.category_id]));

  // 2. Publishers (idempotent — matched by unique name)
  const publisherNames = [...new Set(BOOKS.map((b) => b.publisher))];
  for (const name of publisherNames) {
    await db.query(
      `INSERT INTO publishers (publisher_name) VALUES (?)
       ON DUPLICATE KEY UPDATE publisher_name = publisher_name`,
      [name]
    );
  }
  const [publisherRows] = await db.query("SELECT publisher_id, publisher_name FROM publishers");
  const publisherIdByName = new Map(publisherRows.map((p) => [p.publisher_name, p.publisher_id]));

  // 3. Authors (idempotent — matched by name; authors table has no unique
  // constraint on name in the schema, so check-then-insert instead of
  // relying on ON DUPLICATE KEY).
  const authorNames = [...new Set(BOOKS.flatMap((b) => b.authors))];
  const authorIdByName = new Map();
  for (const name of authorNames) {
    const [existing] = await db.query("SELECT author_id FROM authors WHERE author_name = ?", [name]);
    if (existing.length > 0) {
      authorIdByName.set(name, existing[0].author_id);
    } else {
      const [result] = await db.query("INSERT INTO authors (author_name) VALUES (?)", [name]);
      authorIdByName.set(name, result.insertId);
    }
  }

  // 4. Books + authors + copies
  let inserted = 0, skipped = 0, copiesAdded = 0;
  for (let i = 0; i < BOOKS.length; i++) {
    const b = BOOKS[i];
    const categoryId = categoryIdByName.get(b.category);
    const publisherId = publisherIdByName.get(b.publisher);

    const [existingBook] = await db.query("SELECT book_id FROM books WHERE isbn = ?", [b.isbn]);
    let bookId;

    if (existingBook.length > 0) {
      bookId = existingBook[0].book_id;
      skipped++;
    } else {
      const [result] = await db.query(
        `INSERT INTO books
         (isbn, title, category_id, publisher_id, publication_year, language, pages, price, description, cover_image)
         VALUES (?, ?, ?, ?, ?, 'English', ?, ?, ?, ?)`,
        [b.isbn, b.title, categoryId, publisherId, b.year, b.pages, b.price, b.description, coverUrlFor(b.isbn)]
      );
      bookId = result.insertId;
      inserted++;
    }

    for (const authorName of b.authors) {
      await db.query(
        `INSERT IGNORE INTO book_authors (book_id, author_id) VALUES (?, ?)`,
        [bookId, authorIdByName.get(authorName)]
      );
    }

    const [existingCopies] = await db.query(
      "SELECT COUNT(*) AS count FROM book_copies WHERE book_id = ?",
      [bookId]
    );
    const have = existingCopies[0].count;
    const catCode = b.category.replace(/[^A-Z]/g, "").slice(0, 3) || "GEN";
    for (let c = have; c < COPIES_PER_BOOK; c++) {
      const accession = `ACC-${catCode}-${String(bookId).padStart(4, "0")}-${c + 1}`;
      await db.query(
        `INSERT IGNORE INTO book_copies
         (book_id, accession_number, shelf_location, condition_status, availability_status)
         VALUES (?, ?, ?, 'Good', 'Available')`,
        [bookId, accession, `${catCode}-${String((i % 20) + 1).padStart(2, "0")}`]
      );
      copiesAdded++;
    }
  }

  console.log(`Done. ${inserted} new books inserted, ${skipped} already existed, ${copiesAdded} copies added.`);
}

run()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
    process.exit(process.exitCode || 0);
  });
