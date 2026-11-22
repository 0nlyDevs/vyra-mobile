// L'adresse du site Vyra dont l'application lit l'API (`/api/v1`). Sur un téléphone branché à
// l'ordinateur : `adb reverse tcp:3000 tcp:3000` garde cette adresse locale valable.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
