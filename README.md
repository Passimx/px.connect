# @passimx/px.connect

Simple package for archiving Telegram bot events and chats using Telegraf.

## Installation

```bash
npm install @passimx/px.connect
```

## Usage

```ts
import { PxConnect } from '@passimx/px.connect';

const px = new PxConnect('url');

```

## Export chat

```ts
const chat = await archiver.exportChat(123456);

```


## What it does

* Forwards all incoming Telegram updates to your API
* Intercepts outgoing Telegram API calls (send*, edit*) by patching Telegraf internals
* Sends all events to your backend for storage or processing
* Provides chat export via API


## API

### `new Archiver(options)`

| Option   | Type   | Description             |
| -------- | ------ |-------------------------|
| apiKey   | string | Authorization key       |
| endpoint | string | API base URL (optional) |

If endpoint is not provided, a default value will be used.

---

### `archiver.listen(bot)`

Starts tracking:

* incoming updates
* outgoing messages

---

### `archiver.exportChat(id)`

Fetches chat data from API.

Returns:

```ts
Promise<ChatInterface | null>
```

## Notes

* This library patches Telegraf internally
* Errors are logged to console
* Make sure your API is available and accepts requests

## License

MIT
