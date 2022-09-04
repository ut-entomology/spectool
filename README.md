# spectool

Cross-platform app providing tools for managing Specify.

Written in TypeScript and Svelte for Node.js and Electron.

## Developer Installation

To install the source locally for development, you'll need to first install the following:

- Node.js
- The NPM package manager
- The yarn package manager (dependencies are maintained via yarn)
- TypeScript

Then git clone this repo and run `yarn`.

The program requires that you have access to a MySQL port and a login to the Specify database, the latter of which the program implements.

I have not built the program for platform distribution.

## How to Run the Tool

Run a web server locally with the following command in one shell:

```
yarn run server
```

And then run the client with the following command in another shell:

```
yarn run client
```

## Sample Snapshots

![Activity Menu](./samples/SpecTool%20Activity%20Menu.png)

![AVailable CSV Reports](./samples/SpecTool%20CSV%20Reports.png)

![Tool for purging unused taxa](./samples/SpecTool%20Purge%20Taxa.png)
