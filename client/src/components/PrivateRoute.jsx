import React from "react";
import { Navigate } from "react-router-dom";
import { UserAuth } from "../contexts/AuthContext";

/**
 * component wrapper that checks the user login status and redirects if the user is not logged in
  * @param children - component that needs to be shown if the user is authenticated
 * @returns {JSX.Element|*} - React component that needs to be shown if the user is authenticated
 * @constructor
 */
export default function PrivateRoute({ children }) {
  const { loggedInUser } = UserAuth();
    if(!loggedInUser){
      return <Navigate to="/login" />;
    }
    return children;  
}