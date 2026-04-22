import React, { useEffect, useState } from 'react'
import { auth } from '../firebase/init'
import {
  ActionCodeSettings,
  confirmPasswordReset,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
} from 'firebase/auth'

type ResetpassProps = {
  onClose: () => void;
  onSwitch?: () => void;
};

function Resetpass({ onClose, onSwitch }: ResetpassProps) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [oobCode, setOobCode] = useState("");
  const [continueUrl, setContinueUrl] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const resetCode = params.get("oobCode");
    const redirectUrl = params.get("continueUrl");
    const lang = params.get("lang") || "en";

    if (lang && auth.languageCode !== lang) {
      auth.languageCode = lang;
    }

    if (mode === "resetPassword" && resetCode) {
      setIsLinkMode(true);
      setOobCode(resetCode);
      setContinueUrl(redirectUrl);
      setIsVerifyingCode(true);

      verifyPasswordResetCode(auth, resetCode)
        .then((emailFromCode) => {
          setVerifiedEmail(emailFromCode);
        })
        .catch((error: any) => {
          setErrorMessage(
            error?.message || "This password reset link is invalid or has expired."
          );
        })
        .finally(() => {
          setIsVerifyingCode(false);
        });
    }
  }, []);

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email format.");
      return;
    }

    setIsLoading(true);

    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, trimmedEmail);

      if (signInMethods.length > 0 && !signInMethods.includes("password")) {
        setErrorMessage("This email is registered with social login. Please sign in with Google.");
        return;
      }

      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}${window.location.pathname}`,
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, trimmedEmail, actionCodeSettings);
      setSuccessMessage("Password reset link sent! Check your email.");
      setEmail("");
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        setErrorMessage("No account found with this email address.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMessage("Invalid email address.");
      } else if (error.code === "auth/too-many-requests") {
        setErrorMessage("Too many attempts. Please wait a few minutes and try again.");
      } else if (error.code === "auth/unauthorized-continue-uri") {
        setErrorMessage("Reset link domain is not authorized in Firebase settings.");
      } else {
        setErrorMessage(error.message || "Failed to send reset link. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasswordResetFromLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!oobCode) {
      setErrorMessage("Missing reset code. Please request a new password reset link.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccessMessage("Password reset successful. You can now log in with your new password.");
      setNewPassword("");
      setConfirmNewPassword("");

      const destination = continueUrl || `${window.location.origin}${window.location.pathname}`;
      setTimeout(() => {
        window.location.href = destination;
      }, 1200);
    } catch (error: any) {
      setErrorMessage(
        error?.message || "Unable to reset password. The link may be invalid or expired."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth__wrapper">
      <div className="auth">
        <div className="auth__content">
          <div className="auth__title">
            {isLinkMode ? "Choose a new password" : "Reset your password"}
          </div>

          {errorMessage && <div className="auth__error">{errorMessage}</div>}
          {successMessage && <div className="auth__success">{successMessage}</div>}

          {isLinkMode ? (
            isVerifyingCode ? (
              <div className="auth__main--form">Verifying reset link...</div>
            ) : (
              <form className="auth__main--form" onSubmit={handlePasswordResetFromLink}>
                {verifiedEmail && (
                  <div className="auth__success">Resetting password for {verifiedEmail}</div>
                )}
                <input
                  className="auth__main--input"
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.currentTarget.value);
                    if (errorMessage) setErrorMessage("");
                    if (successMessage) setSuccessMessage("");
                  }}
                />
                <input
                  className="auth__main--input"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.currentTarget.value);
                    if (errorMessage) setErrorMessage("");
                    if (successMessage) setSuccessMessage("");
                  }}
                />
                <button className="btn" type="submit" disabled={isLoading}>
                  <span>{isLoading ? "Updating..." : "Set new password"}</span>
                </button>
              </form>
            )
          ) : (
            <form className="auth__main--form" onSubmit={handleResetPassword}>
              <input
                className="auth__main--input"
                type="text"
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.currentTarget.value);
                  if (errorMessage) setErrorMessage("");
                  if (successMessage) setSuccessMessage("");
                }}
              />
              <button className="btn" type="submit" disabled={isLoading}>
                <span>{isLoading ? "Sending..." : "Send reset password link"}</span>
              </button>
            </form>
          )}
        </div>
        {!isLinkMode && (
          <button className="auth__switch--btn" onClick={onSwitch} type="button">
            Go to login
          </button>
        )}
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
  )
}

export default Resetpass