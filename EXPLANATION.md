# Was sich geändert hat (einfache Sprache)

1. **Neuer Chat-Endpunkt im Backend**  
   - Es gibt jetzt eine `chat`-Route in tRPC.  
   - Diese Route nimmt deine Nachricht, schickt sie an das KI-Modell (z. B. OpenAI) und gibt die Antwort zurück.  
   - Die Hono-App hat dafür neue Schutzschichten: CORS-Einstellungen und optionaler API-Schlüssel, damit nur erlaubte Clients senden dürfen.

2. **Kleiner Chat-Client in der App**  
   - In `lib/api/chat.ts` steckt jetzt eine Funktion `sendChatMessage`.  
   - Sie kümmert sich darum, wie der Request aussieht und wo die Antwort gespeichert wird.  
   - Dazu gibt es Tests (`lib/api/chat.test.ts`), die prüfen, dass die Daten richtig vorbereitet werden.

3. **Neue Chat-Erfahrung im Profil**  
   - Die Datei `app/profile-chat.tsx` nutzt React Query.  
   - Beim Absenden startet eine Mutation: Sie zeigt einen Ladezustand und Fehlermeldungen direkt im UI.  
   - Damit ersetzt sie die alte Demo-Antwort, sodass echte Nachrichten über den neuen Endpoint laufen.

So weißt du, welche Teile miteinander sprechen: UI → React Query → Chat-Client → Backend → KI-Modell → zurück zur UI.
