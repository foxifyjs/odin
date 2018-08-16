# Odin

Odin is an implementation of [**Active Record**](https://en.wikipedia.org/wiki/Active_record_pattern) pattern in [**TypeScript**](https://typescriptlang.com).

[![NPM Version](https://img.shields.io/npm/v/@foxify/odin.svg)](https://www.npmjs.com/package/@foxify/odin)
[![Node Version](https://img.shields.io/node/v/foxify.svg)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/npm/types/@foxify/odin.svg)](https://www.typescriptlang.org)
[![Tested With Jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)
[![Pull Requests](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](https://github.com/foxifyjs/odin/pulls)
[![License](https://img.shields.io/github/license/foxifyjs/odin.svg)](https://github.com/foxifyjs/odin/blob/master/LICENSE)
[![Build Status](https://api.travis-ci.com/foxifyjs/odin.svg?branch=master)](https://travis-ci.com/foxifyjs/odin)
[![Coverage Status](https://codecov.io/gh/foxifyjs/odin/branch/master/graph/badge.svg)](https://codecov.io/gh/foxifyjs/odin)
[![Package Quality](http://npm.packagequality.com/shield/%40foxify%2Fodin.svg)](http://packagequality.com/#?package=@foxify/odin)
[![Dependencies Status](https://david-dm.org/foxifyjs/odin.svg)](https://david-dm.org/foxifyjs/odin)
[![NPM Total Downloads](https://img.shields.io/npm/dt/@foxify/odin.svg)](https://www.npmjs.com/package/@foxify/odin)
[![NPM Monthly Downloads](https://img.shields.io/npm/dm/@foxify/odin.svg)](https://www.npmjs.com/package/@foxify/odin)
[![Open Issues](https://img.shields.io/github/issues-raw/foxifyjs/odin.svg)](https://github.com/foxifyjs/odin/issues?q=is%3Aopen+is%3Aissue)
[![Closed Issues](https://img.shields.io/github/issues-closed-raw/foxifyjs/odin.svg)](https://github.com/foxifyjs/odin/issues?q=is%3Aissue+is%3Aclosed)
[![known vulnerabilities](https://snyk.io/test/github/foxifyjs/odin/badge.svg?targetFile=package.json)](https://snyk.io/test/github/foxifyjs/odin?targetFile=package.json)
[![Github Stars](https://img.shields.io/github/stars/foxifyjs/odin.svg?style=social)](https://github.com/foxifyjs/odin)
[![Github Forks](https://img.shields.io/github/forks/foxifyjs/odin.svg?style=social&label=Fork)](https://github.com/foxifyjs/odin)

## Table of Content <!-- omit in toc -->

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [TODO](#todo)
- [Support](#support)

## Installation

Before installing, [download and install Node.js](https://nodejs.org/en/download).
Node.js 8 or higher is required.

```bash
npm i -s @foxify/odin
```

## Usage

```javascript
const Odin = require("@foxify/odin");

const { Types } = Odin;

class User extends Odin {
}

User.schema = {
  email: Types.String.email.required,
  name: {
    first: Types.String.min(3).required,
    last: Types.String.min(3),
  }
};
```

## Features

1. Cross DB
2. Written in `ES6`
3. `TypeScript` ready
4. `Active Record` pattern
5. `Schema` validation
6. `GraphQL Schema` generator (based on model schema)

## TODO

- [ ] Drivers
  - [x] `MongoDB`
  - [ ] `MySQL`
  - [ ] `MariaDB`
  - [ ] `PostgreSQL`
  - [ ] `SQLite`
  - [ ] `Redis`
  - [ ] `Memory`
- [ ] Relationships
  - [x] `hasMany`
  - [x] `hasOne`
  - [ ] `hasManyThrough`
  - [ ] `hasOneThrough`
  - [ ] `Polymorphic`
    - [x] `morphMany`
    - [x] `morphOne`
    - [ ] `morphTo`
    - [ ] `morphManyThrough`
    - [ ] `morphOneThrough`
    - [ ] `morphToThrough`
  - [x] CRUD operations
    - [x] Create operation
    - [x] Read operation
    - [x] Update operation
    - [x] Delete operation
- [x] `Schema` validation
- [x] `GraphQL` support
- [ ] Full test coverage
- [ ] Model hooks
- [ ] Migrations
- [ ] Seeding

## Support

If my work helps you, please consider

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/ardalanamini)
[![Become A Patron](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/ardalanamini)
