import * as DB from "../../DB";
import Query from "../../base/Query";
import ModelConstructor, { Model } from "../../index";
import * as utils from "../../utils";
import Driver from "../Driver";
import * as async from "async";

interface Relation<T = any> {
    /****************************** With Relations ******************************/

    with(...relations: string[]): Query<T>;

    /*********************************** Joins **********************************/

    join(table: string | ModelConstructor, localKey?: string, foreignKey?: string, as?: string): Query<T>;

    /******************************* Where Clauses ******************************/

    where(field: string, value: any): Query<T>;
    where(field: string, operator: Driver.Operator, value: any): Query<T>;

    whereIn(field: string, values: any[]): Query<T>;

    whereNotIn(field: string, values: any[]): Query<T>;

    whereBetween(field: string, start: any, end: any): Query<T>;

    whereNotBetween(field: string, start: any, end: any): Query<T>;

    whereNull(field: string): Query<T>;

    whereNotNull(field: string): Query<T>;

    /******************** Ordering, Grouping, Limit & Offset ********************/

    orderBy(field: string, order?: Driver.Order): Query<T>;

    skip(offset: number): Query<T>;

    offset(offset: number): Query<T>;

    limit(limit: number): Query<T>;

    take(limit: number): Query<T>;

    /*********************************** Read ***********************************/

    exists(): Promise<boolean>;
    exists(callback: Driver.Callback<boolean>): void;

    count(): Promise<number>;
    count(callback: Driver.Callback<number>): void;

    get(): Promise<Array<Model<T>>>;
    get(callback: Driver.Callback<Array<Model<T>>>): void;

    first(): Promise<Model<T>>;
    first(callback: Driver.Callback<Model<T>>): void;

    value(field: string): Promise<any>;
    value(field: string, callback: Driver.Callback<any>): void;

    pluck(field: string): Promise<any>;
    pluck(field: string, callback: Driver.Callback<any>): void;

    max(field: string): Promise<any>;
    max(field: string, callback: Driver.Callback<any>): void;

    min(field: string): Promise<any>;
    min(field: string, callback: Driver.Callback<any>): void;

    /********************************** Inserts *********************************/

    insert(items: T[]): Promise<number>;
    insert(items: T[], callback: Driver.Callback<number>): void;

    create(item: T): Promise<Model<T>>;
    create(item: T, callback: Driver.Callback<Model<T>>): void;

    save(model: Model<T>): Promise<Model<T>>;
    save(model: Model<T>, callback: Driver.Callback<Model<T>>): void;

    /********************************** Updates *********************************/

    update(update: T): Promise<number>;
    update(update: T, callback: Driver.Callback<number>): void;

    increment(field: string, count?: number): Promise<number>;
    increment(field: string, callback: Driver.Callback<number>): void;
    increment(field: string, count: number, callback: Driver.Callback<number>): void;

    decrement(field: string, count?: number): Promise<number>;
    decrement(field: string, callback: Driver.Callback<number>): void;
    decrement(field: string, count: number, callback: Driver.Callback<number>): void;

    /********************************** Deletes *********************************/

    delete(): Promise<number>;
    delete(callback: Driver.Callback<number>): void;
}

abstract class Relation<T = any> {
    private readonly _model: Model;
    private readonly _relation: ModelConstructor;
    private readonly _localKey: string;
    private readonly _foreignKey: string;
    private readonly _as: string;

    get model() {
        return this._model;
    }

    get relation() {
        return this._relation;
    }

    get localKey() {
        return this._localKey;
    }

    get foreignKey() {
        return this._foreignKey;
    }

    get as() {
        return this._as;
    }

    constructor(
        model: Model,
        relation: ModelConstructor,
        localKey: string,
        foreignKey: string,
        caller: (...args: any[]) => any,
    ) {
        this._model = model;
        this._relation = relation;
        this._localKey = localKey;
        this._foreignKey = foreignKey;
        this._as = utils.getCallerFunctionName(caller);
    }

    protected _query(relations?: string[]): Query {
        let query: ModelConstructor | Query = this.relation;

        if (relations) query = query.with(...relations);

        return query.where(
            this.foreignKey,
            this.model.getAttribute(this.localKey),
        );
    }

    abstract load(query: Query<T>): any;

    /****************************** With Relations ******************************/

    with(...relations: string[]) {
        return this._query(relations);
    }

    /*********************************** Joins **********************************/

    join(table: string | ModelConstructor, localKey?: string, foreignKey?: string, as?: string) {
        return this._query().join(table, localKey, foreignKey, as);
    }

    /******************************* Where Clauses ******************************/

    where(field: string, operator: Driver.Operator | any, value?: any) {
        return this._query().where(field, operator, value);
    }

    whereIn(field: string, values: any[]) {
        return this._query().whereIn(field, values);
    }

    whereNotIn(field: string, values: any[]) {
        return this._query().whereNotIn(field, values);
    }

    whereBetween(field: string, start: any, end: any) {
        return this._query().whereBetween(field, start, end);
    }

    whereNotBetween(field: string, start: any, end: any) {
        return this._query().whereNotBetween(field, start, end);
    }

    whereNull(field: string) {
        return this._query().whereNull(field);
    }

    whereNotNull(field: string) {
        return this._query().whereNotNull(field);
    }

    /******************** Ordering, Grouping, Limit & Offset ********************/

    orderBy(field: string, order?: Driver.Order) {
        return this._query().orderBy(field, order);
    }

    skip(offset: number) {
        return this._query().skip(offset);
    }

    offset(offset: number) {
        return this.skip(offset);
    }

    limit(limit: number) {
        return this._query().limit(limit);
    }

    take(limit: number) {
        return this.limit(limit);
    }

    /*********************************** Read ***********************************/

    exists(callback?: Driver.Callback<boolean>) {
        return this._query().exists(callback);
    }

    count(callback?: Driver.Callback<number>) {
        return this._query().count(callback);
    }

    get(callback?: Driver.Callback<any>) {
        return this._query().get(callback);
    }

    first(callback?: Driver.Callback<any>) {
        return this._query().first(callback);
    }

    value(field: string, callback?: Driver.Callback<any>) {
        return this._query().value(field, callback);
    }

    pluck(field: string, callback?: Driver.Callback<any>) {
        return this.value(field, callback);
    }

    max(field: string, callback?: Driver.Callback<any>) {
        return this._query().max(field, callback);
    }

    min(field: string, callback?: Driver.Callback<any>) {
        return this._query().min(field, callback);
    }

    /********************************** Inserts *********************************/

    async insert(items: T[], callback?: Driver.Callback<number>) {
        const foreignKey = this.foreignKey;
        const localAttribute = this.model.getAttribute(this.localKey);

        if (callback)
            return async.map(
                items,
                (item, cb1: (...args: any[]) => any) => ({
                    ...(item as any),
                    [foreignKey]: localAttribute,
                }),
                (err, newItems) => {
                    if (err) callback(err, undefined as any);

                    this._query().insert(newItems as T[], callback);
                },
            );

        async.map(
            items,
            (item, cb1: (...args: any[]) => any) => ({
                ...(item as any),
                [foreignKey]: localAttribute,
            }),
            (err, newItems) => {
                if (err) throw err;

                items = newItems as T[];
            },
        );

        return await this._query().insert(items);
    }

    async create(item: T, callback?: Driver.Callback<Model<T>>) {
        item = {
            ...(item as any),
            [this.foreignKey]: this.model.getAttribute(this.localKey),
        };

        if (callback)
            return this._query().insertGetId(item, (err, res) => {
                if (err) return callback(err, res as any);

                this.where("id", res).first(callback);
            });

        return await this.where("id", await this._query().insertGetId(item)).first();
    }

    save(model: Model<T>, callback?: Driver.Callback<Model<T>>) {
        model.setAttribute(
            this.foreignKey,
            this.model.getAttribute(this.localKey),
        );

        return model.save(callback as any) as Promise<Model<T>> | void;
    }

    /********************************** Updates *********************************/

    update(update: T, callback?: Driver.Callback<number>) {
        return this._query().update(update, callback);
    }

    increment(field: string, count?: number | Driver.Callback<number>, callback?: Driver.Callback<number>) {
        return this._query().increment(field, count, callback);
    }

    decrement(field: string, count?: number | Driver.Callback<number>, callback?: Driver.Callback<number>) {
        return this._query().decrement(field, count, callback);
    }

    /********************************** Deletes *********************************/

    delete(callback?: Driver.Callback<number>) {
        return this._query().delete(callback);
    }
}

export default Relation;
