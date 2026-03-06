import { Navigate } from "react-router-dom";

// Redirect old signup route to auth
const SignUp = () => <Navigate to="/auth" replace />;

export default SignUp;
