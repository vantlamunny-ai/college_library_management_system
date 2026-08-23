const db = require("../config/db")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


async function register(userData) {
    const { username,email,password,role,status} = userData;
    
    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0){
        throw new Error("Email already exists! Please login.");
    }

    const hasedPassword = await bcrypt.hash(password, 10);

    const query =`
    INSERT INTO users(username,email,password,role,status)
    VALUES(?,?,?,?,?)
    `;

    const [result] = await db.query(query,[
        username,
        email,
       hasedPassword,
        role,
        status
    ]);
    const userId = result.insertId;

  return{
    user_id: userId,
    username,
    email,
    role,
    status

  };
    
    
}

async function login(userData) {
    const {email,password } = userData;

    const [rows] = await db.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
    );
    if (rows.length === 0){
         throw new Error("Invalid password");
    }

    const user = rows[0];

 if (user.status !== "Active") {
    throw new Error("Account is not active");
  }

    const isMatch = await bcrypt.compare(password, user.password);

   
        if (!isMatch) {
        throw new Error("Invalid email or password");
    }

  

const token = jwt.sign(
    {
        user_id: user.user_id,
        email: user.email,
        role: user.role
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "1d"
    }
);
    return {
        token,
        user:{
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
        }
    };
}
    

async function getCurrentUser(){
    const[rows] =await db.query("SELECT *FROM users");
    return rows;
};

const crypto = require("crypto");


function generateResetToken() {
    return crypto.randomBytes(32).toString("hex");
}

async function forgotPassword(email) {

    
    const [users] = await db.query(
        `SELECT user_id, email
         FROM users
         WHERE email = ?`,
        [email]
    );

    
    if (users.length === 0) {
        throw new Error("Email not found");
    }

    const user = users[0];

    const resetToken = generateResetToken();

   
    const expiresAt = new Date(
        Date.now() + 15 * 60 * 1000
    );

    
    await db.query(
        `UPDATE users
         SET reset_token = ?,
             reset_token_expires = ?
         WHERE user_id = ?`,
        [
            resetToken,
            expiresAt,
            user.user_id
        ]
    );

    
    const resetLink =
        `http://localhost:5173/reset-password/${resetToken}`;

    
    return {
        resetLink,
        expiresAt
    };
}


const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});


async function resetPassword(email) {

   
    const [users] = await db.query(
        `SELECT user_id, email
         FROM users
         WHERE email = ?`,
        [email]
    );

   
    if (users.length === 0) {
        return;
    }

    const user = users[0];

  
    const resetToken =
        crypto.randomBytes(32).toString("hex");

    
    const expiresAt =
        new Date(Date.now() + 15 * 60 * 1000);

  
    await db.query(
        `UPDATE users
         SET reset_token = ?,
             reset_token_expires = ?
         WHERE user_id = ?`,
        [
            resetToken,
            expiresAt,
            user.user_id
        ]
    );

  
    const resetLink =
        `${process.env.RESET_PASSWORD_URL}/${resetToken}`;

 
    const message = `
Hello,

We received a request to reset your password
for your College Library System account.

Click the link below to reset your password:

${resetLink}

This link will expire in 15 minutes.

If you did not request this password reset,
please ignore this email.

Regards,
College Library System
`;

    
    await transporter.sendMail({

        from: `"College Library System" <${process.env.EMAIL_USER}>`,

        to: user.email,

        subject: "Password Reset Request",

        text: message
    });
}



module.exports = {
    register,
    login,
    getCurrentUser,
    forgotPassword,
    resetPassword

};