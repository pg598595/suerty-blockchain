import React, {useContext, useEffect, useState} from 'react';

import {auth} from '../lib/firebase';

import {createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut} from 'firebase/auth';

const UserAuthContext = React.createContext();


export function UserAuth(){
    return useContext(UserAuthContext);
}

/**
 * Component that stores the current user authentication token,
 * needs to be a component wrapper to be accessible in the component
 * @param children - components that needs to access the authentication, all components needs to be within one
 * AuthProvider instance, so the context won't be lost when navigate between components
 * @returns {JSX.Element}
 * @constructor
 */
export function AuthProvider({children}) {
    const [loggedInUser, setloggedInUser] = useState({});
    const [loading, setLoading] = useState(true);

    function signup(email, password){
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password){
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout(){
        return signOut(auth);
    }

    useEffect(() => {
        return onAuthStateChanged(auth, (currentUser) => {
            console.log(currentUser);
            setloggedInUser(currentUser);
            setLoading(false);
        });
    }, [])
    

    const value = {
        loggedInUser,
        login,
        signup,
        logout
    }
    return (
        <UserAuthContext.Provider value={value}>
            {!loading && children}
        </UserAuthContext.Provider>
    )
}
