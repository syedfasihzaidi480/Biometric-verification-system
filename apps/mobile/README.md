## Configure Sign-in (local dev)

1) Start the web app with host binding so devices can reach it:

```
cd ../web
npm run dev -- --host
```

Note the URL (e.g. http://192.168.1.100:5173). For Android emulator you can use http://10.0.2.2:5173.

2) Create a `.env` in `apps/mobile` (or copy `.env.example`) with:

```
EXPO_PUBLIC_BASE_URL=http://<LAN-IP>:5173
EXPO_PUBLIC_PROXY_BASE_URL=http://<LAN-IP>:5173
EXPO_PUBLIC_PROJECT_GROUP_ID=create-anything-dev
EXPO_PUBLIC_HOST=<LAN-IP>:5173
```

For Android emulator, use `10.0.2.2` instead of `<LAN-IP>`.

3) Restart Expo and clear cache:

```
npx expo start -c
```

Press `a` for Android emulator or use `--tunnel` for physical devices if needed.

4) On tap "Sign In" the auth modal opens and completes against the web app.

If the modal says “Sign-in is not configured”, one of the env vars is missing. Add it and restart Expo.
