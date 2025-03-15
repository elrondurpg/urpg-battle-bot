# URPG Battle Bot

README UNDER CONSTRUCTION

## Running app locally

Before you start, you'll need to install [NodeJS](https://nodejs.org/en/download/) and [create a Discord app](https://discord.com/developers/applications) with the proper permissions:
- `applications.commands`
- `bot` (with Send Messages enabled)


Configuring the app is covered in detail in the [getting started guide](https://discord.com/developers/docs/getting-started).

### Setup project

First navigate to the directory where you will clone the project, e.g.: 
```
cd ~/git
```

First clone the project:
```
git clone https://github.com/elrondurpg/urpg-battle-bot.git
```

Then clone the companion project in the same directory:
```
git clone https://github.com/elrondurpg/urpg-battle-bot-calc.git
```

Then navigate to this project's directory and install dependencies:
```
cd urpg-battle-bot
npm install
```
### Get app credentials

Fetch the credentials from your app's settings and add them to a `.env` file (see `.env.sample` for an example). You'll need your app ID (`APP_ID`), bot token (`DISCORD_TOKEN`), and public key (`PUBLIC_KEY`).

Fetching credentials is covered in detail in the [getting started guide](https://discord.com/developers/docs/getting-started).

> 🔑 Environment variables can be added to the `.env` file in Glitch or when developing locally, and in the Secrets tab in Replit (the lock icon on the left).

### Install slash commands

The commands for the example app are set up in `commands.js`. All of the commands in the `commands` array in `commands.js` will be installed when you run the `register` command configured in `package.json`:

```
npm run register
```

### Run the app

After your credentials are added, go ahead and run the app:

```
npm run start
```
