# Kyte

[![Build Status](https://travis-ci.org/lostintangent/kyte.svg?branch=master)](https://travis-ci.org/lostintangent/kyte)
[![Greenkeeper badge](https://badges.greenkeeper.io/lostintangent/kyte.svg)](https://greenkeeper.io/)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Maintainability](https://api.codeclimate.com/v1/badges/84be0e61815a8fbd3aef/maintainability)](https://codeclimate.com/github/lostintangent/kyte/maintainability)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Kyte is a single-command Node.js CLI that allows easily sharing a local file with other developers, and then collaboratively editing it in real-time, directly from your browser (Google Docs style!).

<img width="750"  src="https://user-images.githubusercontent.com/116461/30508388-dc197cf6-9a4a-11e7-8f8e-2f03a6cd632d.png" />

## Getting Started

> Note: `Kyte` requires that you have Node.js v8.0.0+ installed, so if you're using an older version, you'll need to upgrade. I'd recommend using the awesome [`nvs`](github.com/jasongin/nvs) project for Node.js version management.

1. Install the `Kyte` CLI on your development machine, using your preferred NPM client

    ```shell
    npm install -g kyte
    yarn global add kyte
    ```

2. CD into the directory that contains the file you'd like to share

3. Start sharing it with `Kyte`, which will launch a new browser-based editor, containing the contents of the specified file

    ```shell
    kyte <filePath>
    ```

    > Note: You can omit the `filePath` argument in order to start a collaborative editing session on an empty file.

4. Send the share URL (that has been copied to your clipboard) to all of the developers that you'd like to collaborate with, and then begin editing the file in real-time!

As an alternative, if you'd prefer not to install the `kyte` CLI globally, you could use `npx` to share your file with a single command:

```shell
npx kyte <filePath>
```

## How does it work?

Under the covers, `Kyte` spins up an `express`-based server on your local machine, with a [ShareDB](https://github.com/share/sharedb/) server on top of it in order to provide the concurrent editing (OT) back-end for the specified file.

The web front-end uses the [Monaco](https://microsoft.github.io/monaco-editor) editor, and includes "bindings" to translate all of the editor actions into `ShareDB` operations, in order to keep all participating developers in sync.

In order to expose the server over the internet (and available to developers outside of your local subnet), it uses `ngrok` to create a public tunnel. This means that anyone with access to your share URL can access it, but the URL itself is "unguessable", and the tunnel will be immediately closed as soon as you terminate the `kyte` CLI process.
