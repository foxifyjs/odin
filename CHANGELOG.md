# Changelog

## Emojis

- New Features -> :zap:
- Enhancements -> :star2:
- Breaking Changes -> :boom:
- Bugs -> :beetle:
- Pull Requests -> :book:
- Documents -> :mortar_board:
- Tests -> :eyeglasses:

---

## [next](https://github.com/foxifyjs/odin/releases/tag/next) - *(2019-__-__)*

- :zap: Added `iterate` method to `DB`, `Odin` & relational methods
- :zap: Added `delete` method to `Odin` instance
- :zap: Added `withTrashed` method to relational methods
- :zap: Added `lean` method to relational methods
- :boom: Method `restore` in `Odin` instance returns `number` now (it was `boolean` before)

## [v0.8.0](https://github.com/foxifyjs/odin/releases/tag/v0.8.0) - *(2018-12-27)*

- :beetle: Fixed `embedMany` relation bug
- :beetle: Fixed not applying `withTrashed` to relations
- :boom: `Types` is now a peerDependency ([`@foxify/schema`](https://github.com/foxifyjs/schema)) which needs to be installed!
- :eyeglasses: Added `embedMany` tests
- :eyeglasses: Added `Node.js` version `11` to tests

## [v0.7.0](https://github.com/foxifyjs/odin/releases/tag/v0.7.0) - *(2018-12-14)*

- :zap: Added `whereHas` method to models
- :star2: Added deep relation compatibility to `has` & `whereHas`

## [v0.6.2](https://github.com/foxifyjs/odin/releases/tag/v0.6.2) - *(2018-12-07)*

- :star2: Added more compatibility with [`Foxify`](https://github.com/foxifyjs/foxify) error handling

## [v0.6.0](https://github.com/foxifyjs/odin/releases/tag/v0.6.0) - *(2018-12-04)*

- :zap: Added `has` to model queries (use with caution since it may have a negative impact on your performance)

## [v0.5.4](https://github.com/foxifyjs/odin/releases/tag/v0.5.4) - *(2018-12-03)*

- :zap: Added `Collection` to create collection and indexes

## [v0.5.0](https://github.com/foxifyjs/odin/releases/tag/v0.5.0) - *(2018-12-01)*

- :zap: Added deep relation loading ability
- :zap: Added `lean` method to model queries to skip creating model instances
- :star2: Improved model static method `toJsonSchema` functionality
- :star2: Improved model hook `created`

## [v0.4.0](https://github.com/foxifyjs/odin/releases/tag/v0.4.0) - *(2018-11-16)*

- :zap: Added `embedMany` relation
- :star2: Improved `toJsonSchema` functionality

## [v0.3.0](https://github.com/foxifyjs/odin/releases/tag/v0.3.0) - *(2018-11-16)*

- :zap: Added `toJsonSchema` static method to Model so you can easily use it with `Foxify` router schema option
- :star2: Improved throwing validation error for `Foxify` usage

## [v0.2.0](https://github.com/foxifyjs/odin/releases/tag/v0.2.0) - *(2018-11-14)*

- :zap: Added more advanced filtering ability to queries and joins
- :zap: Added `numeral` to `String` schema type
- :zap: Added `enum` to `String` schema type

## [v0.1.0](https://github.com/foxifyjs/odin/releases/tag/v0.1.0) - *(2018-10-20)*

- :zap: Added model hook `created`

## [v0.1.0-beta.16](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.16) - *(2018-10-12)*

- :beetle: Typescript bug fix
- :eyeglasses: Added windows os

## [v0.1.0-beta.15](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.15) - *(2018-08-22)*

- :beetle: `Model` schema bug fix

## [v0.1.0-beta.14](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.14) - *(2018-08-21)*

- :beetle: `Model` none safe delete models query bug fix
- :beetle: `GraphQL` error handling bug fix

## [v0.1.0-beta.13](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.13) - *(2018-08-21)*

- :beetle: `GraphQL` query bug fix

## [v0.1.0-beta.12](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.12) - *(2018-08-21)*

- :beetle: `Model` safe deleting bug fix

## [v0.1.0-beta.11](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.11) - *(2018-08-21)*

- :beetle: `GraphQL` mutations bug fix

## [v0.1.0-beta.10](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.10) - *(2018-08-21)*

- :beetle: `GraphQL` schema type `Date` bug fix

## [v0.1.0-beta.9](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.9) - *(2018-08-21)*

- :star2: `UPDATED_AT` and `DELETED_AT` is applied
- :beetle: `GraphQL` restore bug fix

## [v0.1.0-beta.8](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.8) - *(2018-08-21)*

- :beetle: `GraphQL` query bug fix

## [v0.1.0-beta.7](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.7) - *(2018-08-21)*

- :beetle: `GraphQL` query bug fix

## [v0.1.0-beta.6](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.6) - *(2018-08-21)*

- :boom: `GraphQL` change insert single to create single (eq. `insert_user` => `create_user`)
- :boom: `GraphQL` change `data` argument to `query`

## [v0.1.0-beta.5](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.5) - *(2018-08-16)*

- :star2: Some enhancements
- :eyeglasses: Added some tests

## [v0.1.0-beta.4](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.4) - *(2018-05-24)*

- :zap: Added `morphOne` relation
- :zap: Added `morphMany` relation
- :star2: Improved `join` operation ([#1](https://github.com/foxifyjs/odin/issues/1))
- :eyeglasses: Added some tests

## [v0.1.0-beta.2](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.2) - *(2018-05-18)*

- :zap: Added `create` operation to relations

## [v0.1.0-beta.1](https://github.com/foxifyjs/odin/releases/tag/v0.1.0-beta.1) - *(2018-05-17)*

- :tada: First Release
