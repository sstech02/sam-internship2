import {
  getFirestore,
  collection,
  doc,
  addDoc,
  onSnapshot
} from "firebase/firestore";
import { auth } from "../firebase/init";

export const startStripeCheckout = async (priceId: string) => {
  if (!priceId.startsWith("price_")) {
    throw new Error("Invalid Stripe price id. Use a value that starts with 'price_'.");
  }

  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in to subscribe.");
  }

  const db = getFirestore();
  const checkoutSessionsRef = collection(
    doc(collection(db, "customers"), currentUser.uid),
    "checkout_sessions"
  );

  const docRef = await addDoc(checkoutSessionsRef, {
    price: priceId,
    success_url: window.location.origin,
    cancel_url: window.location.href,
  });

  await new Promise<void>((resolve, reject) => {
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        const data = snap.data();
        if (!data) return;

        const { error, url } = data as { error?: { message?: string }; url?: string };

        if (error) {
          unsubscribe();
          reject(new Error(error.message || "Unable to start checkout."));
          return;
        }

        if (url) {
          unsubscribe();
          window.location.assign(url);
          resolve();
        }
      },
      (snapshotError) => {
        unsubscribe();
        reject(snapshotError);
      }
    );
  });
};