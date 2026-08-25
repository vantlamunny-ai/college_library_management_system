const authService = require("../Services/authService");

const register = async (req, res, next) => {
      try {
    const user = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {

    const result = await authService.login(req.body);
     

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(
      req.user.user_id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};




async function forgotPassword(req, res, next) {

    try {

        const { email } = req.body;


        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const result =
            await authService.requestPasswordReset(email);

        res.status(200).json({
            success: true,
            // Deliberately the same message whether or not the email
            // matched an account — never confirm/deny an email exists.
            message: "If that email is registered, a password reset link has been sent.",
            data: {
                emailSent: result.emailSent,
                // Only present when no real email was actually sent (no
                // EMAIL_USER/EMAIL_APP_PASSWORD configured, or the send
                // failed) — a working fallback instead of a dead end.
                resetLink: result.resetLink
            }
        });

    } catch (error) {
        next(error);
    }
}


async function resetPassword(req, res, next) {

    try {

        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "A new password is required"
            });
        }

        await authService.resetPasswordWithToken(token, password);

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can sign in with your new password now."
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
}
module.exports = {
  register,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword

};