import React, {useEffect} from 'react';
import {UserAuth} from "../contexts/AuthContext";
import {useNavigate} from "react-router-dom";

const Logout = (props) => {
  const { logout } = UserAuth();
  const navigate = useNavigate()
  useEffect(async () => {
    try {
      await logout();
      navigate("/");
    } catch(e) {
      alert(e.message)
    }
  }, [])
  return(<></>)
}

export default Logout;