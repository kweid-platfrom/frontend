import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

const getSubscriptionPlans = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "subscriptions"));
        return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching subscription plans:", error);
        return [];
    }
}

export { getSubscriptionPlans };