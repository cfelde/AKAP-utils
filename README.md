# AKAP utils

The [AKA protocol](https://akap.me) (AKAP) is an idea, a specification, and a set of smart contracts written for the Ethereum blockchain. It tackles a challenge seen on blockchains related to immutability and how you write code to handle such an environment.

In short the challenge facing blockchain developers is that when they deploy code others depend on, there's no easy upgrade path. The location of the code is tied in with the location of storage, and if you want to upgrade your code you can't easily take this storage with you. Deploying a new version would force everyone who depend on it to change their references, not to mention the pain of repopulating existing data.

Eternal storage is a pattern that AKAP can help you leverage, where the idea is to keep your storage separate from your code.

Please see the [documentation](https://akap.me/docs) for more in depth material.

## Repositories

This repository contains the AKAP utils source code. Other related repositories:

[AKAP](https://github.com/cfelde/AKAP) <br/>
[AKAP docs](https://github.com/cfelde/AKAP-docs) <br/>
[AKAP browser](https://github.com/cfelde/AKAP-browser) <br/>
[Using AKAP](https://github.com/cfelde/Using-AKAP) <br/>

## Dependencies

`npm install akap`

`npm install @openzeppelin/contracts`

`npm install @openzeppelin/test-helpers`
