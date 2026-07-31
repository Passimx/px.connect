![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-active-success)
![Contributions](https://img.shields.io/badge/contributions-welcome-brightgreen)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/passimx/px.connect/main.yml)
# @passimx/px.connect

> High-level WebSocket client with automatic reconnection, cross-tab connection sharing, and built-in RPC/event system.

## Overview

```PxConnect``` is a TypeScript library that simplifies building real-time applications over WebSocket.

Instead of manually implementing reconnection logic, heartbeat, tab synchronization, request-response handling, and room management, you work with a simple and consistent API.

## License

Passimx Chats Frontend is released under the terms of the MIT license.  
See https://opensource.org/license/MIT for more information.


## Technologies

| Area       | Technologies Used   |
|------------|---------------------|
| API        | WebSocket           |
| Encryption | SHA-512 / Ed25519   |


## Installation

```bash
npm install @passimx/px.connect
# or
yarn add @passimx/px.connect
```

## Creating instance

```ts
import { PxConnect } from '@passimx/px.connect';

const px = new PxConnect('url');

px.connect();
```

## Join channels

```ts
px.join('channel:1', 'channel:2', 'channel:3');
```

## Leave channels

```ts
px.leave('channel:1', 'channel:2', 'channel:3');
```

## Create new channel

```ts
const channel = px.createChannel({ 
  info?: {...}, 
  data?: {...} 
});
```

Creates a new cryptographically identifiable channel.

- **info** — immutable initialization metadata. It becomes part of the channel identity and cannot be changed after creation.
- **data** — mutable channel state that can be updated during the channel lifetime.

The channel identifier is deterministically derived from the hash of the initialization data (`info`). This means that any modification to `info` results in a different channel ID.

## Restore an existing channel

```ts
const channel = px.createChannel({ exportInit: {...} });
```
Restores an existing channel from a previously exported initialization object.

The imported `exportInit` contains all immutable initialization data required to reproduce the original channel, including its identifier. As long as `exportInit` remains unchanged, the restored channel will have the same channel ID.


## Call action
```ts
const result = await px.callAction<T>(
  { connectionId: "..." },   // or { channelId: "..." }
  {
    action: "get-user",
    payload: {...}
  }
);
```

Invokes a remote action and waits for its response.

The target may be:
- **```{ connectionId }```** — send the request directly to a specific connection.
- **```{ channelId }```** — send the request to the owner of the channel.

The returned promise resolves with the value passed to ```reply()``` on the remote side.

Actions can be addressed either to a specific connection or to a channel.

When a channel is the destination, the request is automatically routed to the channel owner—the connection that originally created the channel.

### Connection → Connection

Client A ──── callAction({ connectionId }) ───► Client B
<br>
Client B ──── reply(...) ───────────► Client A

### Connection → Channel

Client A ───────────── callAction({ channelId }) ───► Channel Owner Connection
<br>
Channel Owner Connection ──── reply(...) ──────────► Client A


[//]: # (Connection → Channel)

[//]: # (Client A ── callAction&#40;{ channelId }&#41; ───────────────► Channel)

[//]: # (│)

[//]: # (▼)

[//]: # (Channel Owner)

[//]: # (Client A ◄────────────────────── reply&#40;...&#41; ────────────────┘)

[//]: # ()
[//]: # (Regardless of whether the destination is a connection or a channel, the API remains identical. The routing is handled automatically by PxConnect.)

## Register action handlers
```ts
px.onAction((routes) => { 
  routes.on("get-user", async (ctx) => { 
    ctx.reply(user); 
  }); 
});
```
Registers one or more action handlers.

Each handler receives a context object containing:

- from — the sender connection.
- to — the original destination (connectionId or channelId).
- payload — request payload.
- date — request timestamp.
- reply() — sends the response back to the caller.

## Remove action handlers
```ts
px.offAction((routes) => {
  routes.off("get-user", handler);
});
```
Removes previously registered action handlers.