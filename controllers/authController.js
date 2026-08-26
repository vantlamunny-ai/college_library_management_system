const authService = require("../services/authService");


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



const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);

    res.status(200).json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};





const resetPassword = async (req, res, next) => {
    try {

        const { token } = req.params;
        const { password } = req.body;

        const result =
            await authService.resetPasswordWithToken(
                token,
                password
            );

        res.status(200).json(result);

    } catch (error) {

        next(error);
    }
};


module.exports = {
  register,
  login,
  getCurrentUser,
    forgotPassword,
    resetPassword
};