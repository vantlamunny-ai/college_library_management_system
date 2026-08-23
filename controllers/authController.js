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
      req.user.id
    );

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
            await authService.forgotPassword(email);

        res.status(200).json({
            success: true,
            message: "Password reset link generated successfully",
            data: {
                resetLink: result.resetLink,
                expiresAt: result.expiresAt
            }
        });

    } catch (error) {
        next(error);
    }
}




async function resetPassword(req, res, next) {

    try {

        const { email } = req.body;

       
        if (!email) {

            return res.status(400).json({
                success: false,
                message: "Email is required"
            });

        }
        await authService.forgotPassword(email);
        return res.status(200).json({

            success: true,

            message:
                "If the email is registered, a password reset link has been sent."

        });

    } catch (error) {

        next(error);

    }
}
module.exports = {
  register,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword
  
};