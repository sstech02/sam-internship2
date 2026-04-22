import React, { useState } from "react";
import { auth } from "../firebase/init";
import { getAuth, GoogleAuthProvider, signInWithPopup, UserCredential, signInAnonymously, signInWithEmailAndPassword } from "firebase/auth";
import google from "../assets/google.png";
import Signup from "../components/Signup";
import Resetpass from "../components/Resetpass";

type LoginProps = {
  onClose: () => void;
  onSuccess?: () => void;
};

function Login({ onClose }: LoginProps) {
  const [showSignup, setShowSignup] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const provider = new GoogleAuthProvider()
  
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    const email = loginEmail.trim();
    const password = loginPassword;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (error: any) {
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        setErrorMessage("Invalid email or password.");
      } else {
        setErrorMessage(error.message || "Login failed. Please try again.");
      }
    }
  }

  async function handleGuestLogin() {
    setErrorMessage("");

    try {
      await signInAnonymously(auth);
      onClose();
    } catch (error: any) {
      if (error.code === "auth/operation-not-allowed") {
        setErrorMessage("Guest login is not enabled in Firebase Console.");
      } else {
        setErrorMessage(error.message || "Guest login failed. Please try again.");
      }
    }
  }

  async function signInWithGoogle(): Promise<void> {
  try {
    const result: UserCredential = await signInWithPopup(auth, provider);
    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    // The signed-in user info.
    const user = result.user;

    console.log("Successfully signed in with Google!", { user, token });
    // You can now access user.displayName, user.email, user.photoURL, etc.
    // Update your UI or navigate the user to another page.

  } catch (error: any) {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData?.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);

    console.error("Error during Google Sign-In:", { errorCode, errorMessage, email, credential });

    // Specific error handling examples:
    if (errorCode === 'auth/popup-closed-by-user') {
      console.warn("Sign-in popup was closed by the user.");
    } else if (errorCode === 'auth/cancelled-popup-request') {
      console.warn("Multiple popups were requested. Only one can be active at a time.");
    }
    // You might want to display an error message to the user
  }
}

  if (showSignup) {
    return <Signup onClose={onClose} onSwitch={() => setShowSignup(false)} />;
  }

  if (showReset) {
    return <Resetpass onClose={onClose} onSwitch={() => setShowReset(false)} />;
  }

  return (
    <div className="auth__wrapper">
      <div className="auth">
        <div className="auth__content">
          <div className="auth__title">Log in to Summarist</div>
          <div className="auth__error">{errorMessage}</div>

          <button className="btn guest__btn--wrapper" type="button" onClick={handleGuestLogin}>
            <figure className="guest__icon--mask">
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth={0}
                viewBox="0 0 448 512"
                height="18"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z" />
              </svg>
            </figure>
            <div>Login as a Guest</div>
          </button>

          <div className="auth__separator">
            <span className="auth__separator--text">or</span>
          </div>

          <button className="btn google__btn--wrapper" type="button" onClick={signInWithGoogle}>
            <figure className="google__icon--mask">
              <img
                alt="google"
                src={google.src}
                width={100}
                height={100}
                decoding="async"
                data-nimg={1}
                loading="lazy"
                style={{ color: "transparent" }}
              />
            </figure>
            <div>Login with Google</div>
          </button>

          <div className="auth__separator">
            <span className="auth__separator--text">or</span>
          </div>

          <form className="auth__main--form" onSubmit={login}>
            <input
              className="auth__main--input"
              type="text"
              placeholder="Email Address"
              onChange={(e) => {
                setLoginEmail(e.currentTarget.value);
                if (errorMessage) setErrorMessage("");
              }}
              value={loginEmail}
            />
            <input
              className="auth__main--input"
              type="password"
              placeholder="Password"
              onChange={(e) => {
                setLoginPassword(e.currentTarget.value);
                if (errorMessage) setErrorMessage("");
              }}
              value={loginPassword}
            />
            <button className="btn" type="submit">
              <span>Login</span>
            </button>
          </form>
        </div>

        <div className="auth__forgot--password" onClick={() => setShowReset(true)}>
          Forgot your password?
        </div>

        <button className="auth__switch--btn" onClick={() => setShowSignup(true)} type="button">
          Don&apos;t have an account?
        </button>

        <div className="auth__close--btn" onClick={onClose}>
          <svg
            stroke="currentColor"
            fill="none"
            strokeWidth={0}
            viewBox="0 0 24 24"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.2253 4.81108C5.83477 4.42056 5.20161 4.42056 4.81108 4.81108C4.42056 5.20161 4.42056 5.83477 4.81108 6.2253L10.5858 12L4.81114 17.7747C4.42062 18.1652 4.42062 18.7984 4.81114 19.1889C5.20167 19.5794 5.83483 19.5794 6.22535 19.1889L12 13.4142L17.7747 19.1889C18.1652 19.5794 18.7984 19.5794 19.1889 19.1889C19.5794 18.7984 19.5794 18.1652 19.1889 17.7747L13.4142 12L19.189 6.2253C19.5795 5.83477 19.5795 5.20161 19.189 4.81108C18.7985 4.42056 18.1653 4.42056 17.7748 4.81108L12 10.5858L6.2253 4.81108Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default Login;