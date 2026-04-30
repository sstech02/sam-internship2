"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { auth } from "../firebase/init";
import SearchBar from "../components/SearchBar";
import { onAuthStateChanged, type User } from "firebase/auth";
import Login from "../components/Login";
import logo from "../assets/logo.png";

type BookData = {
  title?: string;
  author?: string;
  summary?: string;
  imageLink?: string;
  audioLink?: string;
};

function Player() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [bookData, setBookData] = useState<BookData | null>(null);
  const [summaryFontSize, setSummaryFontSize] = useState(16);
  const [showLogin, setShowLogin] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchBookById() {
      try {
        const response = await fetch(
          `https://us-central1-summaristt.cloudfunctions.net/getBook?id=${encodeURIComponent(id)}`
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        setBookData(data);
      } catch (error) {
        console.error("Failed to fetch player book data:", error);
      }
    }

    fetchBookById();
  }, [id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setAudioProgress(audio.currentTime);
    const onMetadata = () => setAudioDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [bookData?.audioLink]);

  const audioProgressPercent = audioDuration > 0 ? (audioProgress / audioDuration) * 100 : 0;

  const formatAudioTime = (seconds: number) => {
    const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const openLoginIfNeeded = () => {
    if (!currentUser) {
      setShowLogin(true);
      return true;
    }

    return false;
  };

  const togglePlay = async () => {
    if (openLoginIfNeeded()) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Play failed:", error);
      }
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  const seekBySeconds = (amount: number) => {
    if (openLoginIfNeeded()) return;
    const audio = audioRef.current;
    if (!audio) return;

    const nextTime = Math.min(Math.max(0, audio.currentTime + amount), audioDuration || 0);
    audio.currentTime = nextTime;
    setAudioProgress(nextTime);
  };

  const onSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (openLoginIfNeeded()) return;

    const next = Number.parseFloat(event.target.value) || 0;
    const audio = audioRef.current;
    if (audio) audio.currentTime = next;
    setAudioProgress(next);
  };

  const title = bookData?.title ?? "";
  const author = bookData?.author ?? "";
  const summary = bookData?.summary ?? "";
  const imageLink = bookData?.imageLink ?? "";
  const audioLink = bookData?.audioLink ?? "";

  return (
    <div id="__next">
      <div className="wrapper">
        {showLogin && <Login onClose={() => setShowLogin(false)} />}

        <div className="search__background">
          <div className="search__wrapper">
            <figure>
              <img src={logo.src} alt="logo" />
            </figure>
            <div className="search__content">
              <div className="search">
                <SearchBar />
              </div>
              <div className="sidebar__toggle--btn">
                <svg stroke="currentColor" fill="none" strokeWidth={0} viewBox="0 0 15 15" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar__overlay sidebar__overlay--hidden" />

        <div className="sidebar sidebar--closed">
          <div className="sidebar__logo">
            <img alt="logo" src={logo.src} />
          </div>
          <div className="sidebar__wrapper" style={{ height: "calc(-140px + 100vh)" }}>
            <div className="sidebar__top">
              <a className="sidebar__link--wrapper" href="/for-you">
                <div className="sidebar__link--line " />
                <div className="sidebar__icon--wrapper">
                  <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M946.5 505L560.1 118.8l-25.9-25.9a31.5 31.5 0 0 0-44.4 0L77.5 505a63.9 63.9 0 0 0-18.8 46c.4 35.2 29.7 63.3 64.9 63.3h42.5V940h691.8V614.3h43.4c17.1 0 33.2-6.7 45.3-18.8a63.6 63.6 0 0 0 18.7-45.3c0-17-6.7-33.1-18.8-45.2zM568 868H456V664h112v204zm217.9-325.7V868H632V640c0-22.1-17.9-40-40-40H432c-22.1 0-40 17.9-40 40v228H238.1V542.3h-96l370-369.7 23.1 23.1L882 542.3h-96.1z" /></svg>
                </div>
                <div className="sidebar__link--text">For you</div>
              </a>

              <a className="sidebar__link--wrapper" href="/library">
                <div className="sidebar__link--line " />
                <div className="sidebar__icon--wrapper">
                  <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z" /></svg>
                </div>
                <div className="sidebar__link--text">My Library</div>
              </a>

              <div className="sidebar__link--wrapper sidebar__link--not-allowed">
                <div className="sidebar__link--line " />
                <div className="sidebar__icon--wrapper">
                  <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><g><path fill="none" d="M0 0h24v24H0z" /><path d="M17.849 11.808l-.707-.707-9.9 9.9H3v-4.243L14.313 5.444l5.657 5.657a1 1 0 0 1 0 1.414l-7.07 7.071-1.415-1.414 6.364-6.364zm-2.121-2.121l-1.415-1.414L5 17.586v1.415h1.414l9.314-9.314zm2.828-7.071l2.829 2.828a1 1 0 0 1 0 1.414L19.97 8.273 15.728 4.03l1.414-1.414a1 1 0 0 1 1.414 0z" /></g></svg>
                </div>
                <div className="sidebar__link--text">Highlights</div>
              </div>

              <div className="sidebar__link--wrapper sidebar__link--not-allowed">
                <div className="sidebar__link--line " />
                <div className="sidebar__icon--wrapper">
                  <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0 0 11.6 0l43.6-43.5a8.2 8.2 0 0 0 0-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z" /></svg>
                </div>
                <div className="sidebar__link--text">Search</div>
              </div>

              <div className="sidebar__link--wrapper sidebar__font--size-wrapper">
                <div className={`sidebar__link--text sidebar__font--size-icon ${summaryFontSize === 16 ? "sidebar__font--size-icon--active" : ""}`} onClick={() => setSummaryFontSize(16)}>
                  <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" className="sidebar__font--size-icon-small" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><g><path fill="none" d="M0 0h24v24H0z" /><path d="M11.246 15H4.754l-2 5H.6L7 4h2l6.4 16h-2.154l-2-5zm-.8-2L8 6.885 5.554 13h4.892zM21 12.535V12h2v8h-2v-.535a4 4 0 1 1 0-6.93zM19 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></g></svg>
                </div>
                <div className={`sidebar__link--text sidebar__font--size-icon ${summaryFontSize === 18 ? "sidebar__font--size-icon--active" : ""}`} onClick={() => setSummaryFontSize(18)}>
                  <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" className="sidebar__font--size-icon-medium" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><g><path fill="none" d="M0 0h24v24H0z" /><path d="M11.246 15H4.754l-2 5H.6L7 4h2l6.4 16h-2.154l-2-5zm-.8-2L8 6.885 5.554 13h4.892zM21 12.535V12h2v8h-2v-.535a4 4 0 1 1 0-6.93zM19 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></g></svg>
                </div>
                <div className={`sidebar__link--text sidebar__font--size-icon ${summaryFontSize === 22 ? "sidebar__font--size-icon--active" : ""}`} onClick={() => setSummaryFontSize(22)}>
                  <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" className="sidebar__font--size-icon-large" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><g><path fill="none" d="M0 0h24v24H0z" /><path d="M11.246 15H4.754l-2 5H.6L7 4h2l6.4 16h-2.154l-2-5zm-.8-2L8 6.885 5.554 13h4.892zM21 12.535V12h2v8h-2v-.535a4 4 0 1 1 0-6.93zM19 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></g></svg>
                </div>
                <div className={`sidebar__link--text sidebar__font--size-icon ${summaryFontSize === 26 ? "sidebar__font--size-icon--active" : ""}`} onClick={() => setSummaryFontSize(26)}>
                  <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" className="sidebar__font--size-icon-xlarge" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><g><path fill="none" d="M0 0h24v24H0z" /><path d="M11.246 15H4.754l-2 5H.6L7 4h2l6.4 16h-2.154l-2-5zm-.8-2L8 6.885 5.554 13h4.892zM21 12.535V12h2v8h-2v-.535a4 4 0 1 1 0-6.93zM19 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></g></svg>
                </div>
              </div>
            </div>

            <div className="sidebar__bottom">
              <a className="sidebar__link--wrapper" href="/settings">
                <div className="sidebar__link--line " />
                <div className="sidebar__icon--wrapper">
                  <svg stroke="currentColor" fill="none" strokeWidth={0} viewBox="0 0 15 15" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M7.07095 0.650238C6.67391 0.650238 6.32977 0.925096 6.24198 1.31231L6.0039 2.36247C5.6249 2.47269 5.26335 2.62363 4.92436 2.81013L4.01335 2.23585C3.67748 2.02413 3.23978 2.07312 2.95903 2.35386L2.35294 2.95996C2.0722 3.2407 2.0232 3.6784 2.23493 4.01427L2.80942 4.92561C2.62307 5.2645 2.47227 5.62594 2.36216 6.00481L1.31209 6.24287C0.924883 6.33065 0.650024 6.6748 0.650024 7.07183V7.92897C0.650024 8.32601 0.924883 8.67015 1.31209 8.75794L2.36228 8.99603C2.47246 9.375 2.62335 9.73652 2.80979 10.0755L2.2354 10.9867C2.02367 11.3225 2.07267 11.7602 2.35341 12.041L2.95951 12.6471C3.24025 12.9278 3.67795 12.9768 4.01382 12.7651L4.92506 12.1907C5.26384 12.377 5.62516 12.5278 6.0039 12.6379L6.24198 13.6881C6.32977 14.0753 6.67391 14.3502 7.07095 14.3502H7.92809C8.32512 14.3502 8.66927 14.0753 8.75705 13.6881L8.99505 12.6383C9.37411 12.5282 9.73573 12.3773 10.0748 12.1909L10.986 12.7653C11.3218 12.977 11.7595 12.928 12.0403 12.6473L12.6464 12.0412C12.9271 11.7604 12.9761 11.3227 12.7644 10.9869L12.1902 10.076C12.3768 9.73688 12.5278 9.37515 12.638 8.99596L13.6879 8.75794C14.0751 8.67015 14.35 8.32601 14.35 7.92897V7.07183C14.35 6.6748 14.0751 6.33065 13.6879 6.24287L12.6381 6.00488C12.528 5.62578 12.3771 5.26414 12.1906 4.92507L12.7648 4.01407C12.9766 3.6782 12.9276 3.2405 12.6468 2.95975L12.0407 2.35366C11.76 2.07292 11.3223 2.02392 10.9864 2.23565L10.0755 2.80989C9.73622 2.62328 9.37437 2.47229 8.99505 2.36209L8.75705 1.31231C8.66927 0.925096 8.32512 0.650238 7.92809 0.650238H7.07095ZM4.92053 3.81251C5.44724 3.44339 6.05665 3.18424 6.71543 3.06839L7.07095 1.50024H7.92809L8.28355 3.06816C8.94267 3.18387 9.5524 3.44302 10.0794 3.81224L11.4397 2.9547L12.0458 3.56079L11.1882 4.92117C11.5573 5.44798 11.8164 6.0575 11.9321 6.71638L13.5 7.07183V7.92897L11.932 8.28444C11.8162 8.94342 11.557 9.55301 11.1878 10.0798L12.0453 11.4402L11.4392 12.0462L10.0787 11.1886C9.55192 11.5576 8.94241 11.8166 8.28355 11.9323L7.92809 13.5002H7.07095L6.71543 11.932C6.0569 11.8162 5.44772 11.5572 4.92116 11.1883L3.56055 12.046L2.95445 11.4399L3.81213 10.0794C3.4431 9.55266 3.18403 8.94326 3.06825 8.2845L1.50002 7.92897V7.07183L3.06818 6.71632C3.18388 6.05765 3.44283 5.44833 3.81171 4.92165L2.95398 3.561L3.56008 2.95491L4.92053 3.81251ZM9.02496 7.50008C9.02496 8.34226 8.34223 9.02499 7.50005 9.02499C6.65786 9.02499 5.97513 8.34226 5.97513 7.50008C5.97513 6.65789 6.65786 5.97516 7.50005 5.97516C8.34223 5.97516 9.02496 6.65789 9.02496 7.50008ZM9.92496 7.50008C9.92496 8.83932 8.83929 9.92499 7.50005 9.92499C6.1608 9.92499 5.07513 8.83932 5.07513 7.50008C5.07513 6.16084 6.1608 5.07516 7.50005 5.07516C8.83929 5.07516 9.92496 6.16084 9.92496 7.50008Z" fill="currentColor" /></svg>
                </div>
                <div className="sidebar__link--text">Settings</div>
              </a>

              <div className="sidebar__link--wrapper sidebar__link--not-allowed">
                <div className="sidebar__link--line " />
                <div className="sidebar__icon--wrapper">
                  <svg stroke="currentColor" fill="none" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx={12} cy={12} r={10} /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1={12} y1={17} x2="12.01" y2={17} /></svg>
                </div>
                <div className="sidebar__link--text">Help &amp; Support</div>
              </div>

              <div className="sidebar__link--wrapper" onClick={() => setShowLogin(true)}>
                <div className="sidebar__link--line " />
                <div className="sidebar__icon--wrapper">
                  <svg stroke="currentColor" fill="none" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1={21} y1={12} x2={9} y2={12} /></svg>
                </div>
                <div className="sidebar__link--text">Login</div>
              </div>
            </div>
          </div>
        </div>

        <div className="summary">
          <div className="audio__book--summary" style={{ fontSize: `${summaryFontSize}px` }}>
            <div className="audio__book--summary-title">
              <b>{title}</b>
            </div>

            {currentUser ? (
              <div className="audio__book--summary-text">{summary}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 8 }}>
                <img alt="login" src="https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/outline/login.svg" style={{ width: 54, height: 54, opacity: 0.9 }} />
                <div style={{ color: "#032b41", fontSize: 18, textAlign: "center" }}>
                  Log in to your account to read and listen to the book
                </div>
                <button className="btn" style={{ maxWidth: 220 }} onClick={() => setShowLogin(true)}>
                  Login
                </button>
              </div>
            )}
          </div>

          <div className="audio__wrapper">
            <audio ref={audioRef} src={audioLink} preload="metadata" />

            <div className="audio__track--wrapper">
              <figure className="audio__track--image-mask">
                <figure className="book__image--wrapper" style={{ height: "48px", width: "48px", minWidth: "48px" }}>
                  <img className="book__image" src={imageLink} alt="book" style={{ display: "block" }} />
                </figure>
              </figure>
              <div className="audio__track--details-wrapper">
                <div className="audio__track--title">{title}</div>
                <div className="audio__track--author">{author}</div>
              </div>
            </div>

            <div className="audio__controls--wrapper">
              <div className="audio__controls">
                <button className="audio__controls--btn" onClick={() => seekBySeconds(-10)}>
                  <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="#000" strokeWidth={2} d="M3.11111111,7.55555556 C4.66955145,4.26701301 8.0700311,2 12,2 C17.5228475,2 22,6.4771525 22,12 C22,17.5228475 17.5228475,22 12,22 L12,22 C6.4771525,22 2,17.5228475 2,12 M2,4 L2,8 L6,8 M9,16 L9,9 L7,9.53333333 M17,12 C17,10 15.9999999,8.5 14.5,8.5 C13.0000001,8.5 12,10 12,12 C12,14 13,15.5000001 14.5,15.5 C16,15.4999999 17,14 17,12 Z M14.5,8.5 C16.9253741,8.5 17,11 17,12 C17,13 17,15.5 14.5,15.5 C12,15.5 12,13 12,12 C12,11 12.059,8.5 14.5,8.5 Z" /></svg>
                </button>

                <button className="audio__controls--btn audio__controls--btn-play" onClick={togglePlay}>
                  {isPlaying ? (
                    <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 16 16" className="audio__controls--play-icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z" /></svg>
                  ) : (
                    <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 512 512" className="audio__controls--play-icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M96 448l320-192L96 64v384z" /></svg>
                  )}
                </button>

                <button className="audio__controls--btn" onClick={() => seekBySeconds(10)}>
                  <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="#000" strokeWidth={2} d="M20.8888889,7.55555556 C19.3304485,4.26701301 15.9299689,2 12,2 C6.4771525,2 2,6.4771525 2,12 C2,17.5228475 6.4771525,22 12,22 L12,22 C17.5228475,22 22,17.5228475 22,12 M22,4 L22,8 L18,8 M9,16 L9,9 L7,9.53333333 M17,12 C17,10 15.9999999,8.5 14.5,8.5 C13.0000001,8.5 12,10 12,12 C12,14 13,15.5000001 14.5,15.5 C16,15.4999999 17,14 17,12 Z M14.5,8.5 C16.9253741,8.5 17,11 17,12 C17,13 17,15.5 14.5,15.5 C12,15.5 12,13 12,12 C12,11 12.059,8.5 14.5,8.5 Z" /></svg>
                </button>
              </div>
            </div>

            <div className="audio__progress--wrapper">
              <div className="audio__time">{formatAudioTime(audioProgress)}</div>
              <input
                type="range"
                className="audio__progress--bar"
                value={audioProgress}
                max={audioDuration || 0}
                onChange={onSliderChange}
                style={{
                  background: `linear-gradient(to right, rgb(43, 217, 124) ${audioProgressPercent}%, rgb(109, 120, 125) ${audioProgressPercent}%)`,
                  ["--range-progress" as any]: `${audioProgressPercent}%`
                }}
              />
              <div className="audio__time">{formatAudioTime(audioDuration)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player;
