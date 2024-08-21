import { useState, useEffect } from 'react'
import { auth } from '../firebase'

//TO USE THIS HOOK JUST CHECK IF "pending" IS FALSE. WHEN "pending" IS TRUE, JUST GET "isSignedIn" AND "user" TO KNOW IF
//THE USER IS LOGGED AND GET USER DATA

export function useAuth() {
  const [authState, setAuthState] = useState({
    isSignedIn: false,  //indicates if user is logged
    pending: true,   //indicates if the request to know if the user is logged is ended or not
    user: null,  //indicates all user data
  })

  useEffect(() => {
    //register a listener which is triggered when the auth changes
    //this way, on component load, we check if the user is authenticated
    const unregisterAuthObserver =auth.onAuthStateChanged(user =>
        //once get the auth response, store results in the state
      setAuthState({ user, pending: false, isSignedIn: !!user })
    )
    return () => unregisterAuthObserver()
  }, [])

  return { auth, ...authState }
}