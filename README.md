# whiteboard-canvas

Local Docker version of the collaborative whiteboard app.

## Run Locally

Requirements: Git and Docker Desktop.

1. Copy the environment example:

```bash
cp .env.example .env
```

2. Set a local `JWT_SECRET` in `.env`.

3. Start the app:

```bash
docker compose up --build
```

Open `http://localhost:8080`.

Stop the app:

```bash
docker compose down
```

Reset local MongoDB data:

```bash
docker compose down -v
```
