# Strava Webhooks Setup Guide

Denne guiden forklarer hvordan du setter opp Strava Webhooks for automatisk import av løpeaktiviteter.

## Hva gjør webhooks?

Når en bruker laster opp en løpeøkt på Strava, sender Strava automatisk en webhook-event til appen din. Appen sjekker om aktiviteten:
- Matcher brukerens nøkkelord (hvis satt)
- Er fra i dag
- Og oppdaterer automatisk brukerens logg i Firestore

Dette gjør at brukeren ikke trenger å trykke "Importer økt" - det skjer automatisk! 🎉

## Oppsett

### 1. Installer Firebase Admin SDK

Webhook-endpointet bruker Firebase Admin SDK for å omgå Security Rules (siden webhooks ikke har autentisering).

```bash
npm install firebase-admin
```

### 2. Konfigurer Firebase Admin SDK

Du trenger å sette opp Firebase Admin SDK. Det er flere måter å gjøre dette på:

#### Metode A: Service Account Key (Anbefalt for produksjon)

1. Gå til Firebase Console → Project Settings → Service Accounts
2. Klikk "Generate New Private Key"
3. Last ned JSON-filen
4. Legg til i `.env.local`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...",...}'
   ```
   (Hele JSON-objektet som en string)

#### Metode B: Individuelle Credentials (For Vercel, etc.)

Legg til i `.env.local`:
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
```

#### Metode C: Application Default Credentials (ADC)

Hvis du deployer på Google Cloud eller Vercel med Firebase integration, kan ADC brukes automatisk.

### 3. Generer webhook secrets

Du trenger to secrets:
- `STRAVA_WEBHOOK_VERIFY_TOKEN` - En tilfeldig streng for verifisering (f.eks. generer med `openssl rand -hex 32`)
- `STRAVA_WEBHOOK_SECRET` - En tilfeldig streng for signatur-verifisering (f.eks. generer med `openssl rand -hex 32`)

Legg disse til i `.env.local`:
```env
STRAVA_WEBHOOK_VERIFY_TOKEN=din_tilfeldige_verifiserings_token_her
STRAVA_WEBHOOK_SECRET=din_tilfeldige_secret_her
```

### 4. Deploy appen

Deploy appen din slik at webhook-endpointet er tilgjengelig på:
```
https://din-app.com/api/strava/webhook
```

### 5. Registrer webhook hos Strava

Du kan registrere webhook på to måter:

#### Metode A: Via Strava API (anbefalt)

Bruk Strava API for å registrere webhook:

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -d client_id=DIN_CLIENT_ID \
  -d client_secret=DIN_CLIENT_SECRET \
  -d callback_url=https://din-app.com/api/strava/webhook \
  -d verify_token=DIN_VERIFY_TOKEN
```

#### Metode B: Via Strava Developer Dashboard

1. Gå til https://www.strava.com/settings/api
2. Scroll ned til "Webhooks"
3. Klikk "Create Subscription"
4. Fyll inn:
   - **Callback URL**: `https://din-app.com/api/strava/webhook`
   - **Verify Token**: Din `STRAVA_WEBHOOK_VERIFY_TOKEN`
   - **Subscription**: Velg "activity:create" og "activity:update"

### 6. Test webhook

Strava vil automatisk sende en GET request for å verifisere webhook-endpointet. Sjekk loggene for å se om verifiseringen lyktes.

For å teste manuelt:
1. Last opp en test-økt på Strava med nøkkelordet ditt
2. Sjekk Firestore for å se om loggen er oppdatert automatisk
3. Sjekk server-loggene for webhook events

## Hvordan det fungerer

1. **Bruker laster opp økt på Strava** → Strava sender webhook event
2. **Webhook-endpoint mottar event** → Verifiserer signatur
3. **Finner bruker** → Søker etter bruker basert på Strava athlete ID
4. **Henter aktivitetsdetaljer** → Bruker access token til å hente full aktivitet
5. **Sjekker kriterier**:
   - Matcher nøkkelord? (hvis satt)
   - Er fra i dag?
6. **Oppdaterer Firestore** → Automatisk oppdatering av brukerens logg

## Feilsøking

### Webhook mottas ikke
- Sjekk at URL-en er riktig og tilgjengelig
- Sjekk at `STRAVA_WEBHOOK_VERIFY_TOKEN` matcher det du registrerte hos Strava
- Sjekk server-loggene for feilmeldinger

### Aktivitet importeres ikke
- Sjekk at aktiviteten matcher nøkkelordet (hvis satt)
- Sjekk at aktiviteten er fra i dag
- Sjekk at brukeren har gyldig Strava-tilgang
- Sjekk server-loggene for detaljerte feilmeldinger
- Sjekk at Firebase Admin SDK er riktig konfigurert (webhook-endpointet må kunne skrive til Firestore)

### Firebase Admin SDK feil
- Sjekk at `firebase-admin` er installert (`npm install firebase-admin`)
- Sjekk at service account credentials er riktig satt
- Sjekk at environment variables er tilgjengelige i produksjon
- Sjekk server-loggene for initialiseringsfeil

### Signatur-verifisering feiler
- Sjekk at `STRAVA_WEBHOOK_SECRET` er riktig
- Sjekk at secret matcher det Strava bruker

## Viktige notater

- Webhook-endpointet må svare innen 2 sekunder til Strava
- Vi håndterer events asynkront, så vi svarer raskt og prosesserer etterpå
- Hvis en aktivitet allerede er logget for i dag, oppdateres den kun hvis den nye er nyere
- Webhooks fungerer kun for aktiviteter som lastes opp ETTER at webhook er registrert

## Se også

- [Strava Webhooks Documentation](https://developers.strava.com/docs/webhooks/)
- [Strava API Documentation](https://developers.strava.com/docs/reference/)

