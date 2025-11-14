import { useRouter } from "expo-router";
import { useEffect } from "react";
import Routes from "./constants/Routes";

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        // Skip the role-selection screen on startup and go to Login directly.
        // Do NOT auto-login based on stored role — user must explicitly login.
        const timeout = setTimeout(() => {
            router.replace(Routes.LOGIN() as any);
        }, 0);

        return () => clearTimeout(timeout);
    }, [router]);

    return null;
}
