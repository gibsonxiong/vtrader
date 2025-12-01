
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Backtesting
 * 
 */
export type Backtesting = $Result.DefaultSelection<Prisma.$BacktestingPayload>
/**
 * Model Bar
 * 
 */
export type Bar = $Result.DefaultSelection<Prisma.$BarPayload>
/**
 * Model BarOverview
 * 
 */
export type BarOverview = $Result.DefaultSelection<Prisma.$BarOverviewPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Backtestings
 * const backtestings = await prisma.backtesting.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Backtestings
   * const backtestings = await prisma.backtesting.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.backtesting`: Exposes CRUD operations for the **Backtesting** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Backtestings
    * const backtestings = await prisma.backtesting.findMany()
    * ```
    */
  get backtesting(): Prisma.BacktestingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.bar`: Exposes CRUD operations for the **Bar** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Bars
    * const bars = await prisma.bar.findMany()
    * ```
    */
  get bar(): Prisma.BarDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.barOverview`: Exposes CRUD operations for the **BarOverview** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BarOverviews
    * const barOverviews = await prisma.barOverview.findMany()
    * ```
    */
  get barOverview(): Prisma.BarOverviewDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.10.1
   * Query Engine version: 9b628578b3b7cae625e8c927178f15a170e74a9c
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Backtesting: 'Backtesting',
    Bar: 'Bar',
    BarOverview: 'BarOverview'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "backtesting" | "bar" | "barOverview"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Backtesting: {
        payload: Prisma.$BacktestingPayload<ExtArgs>
        fields: Prisma.BacktestingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BacktestingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacktestingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BacktestingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacktestingPayload>
          }
          findFirst: {
            args: Prisma.BacktestingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacktestingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BacktestingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacktestingPayload>
          }
          findMany: {
            args: Prisma.BacktestingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacktestingPayload>[]
          }
          create: {
            args: Prisma.BacktestingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacktestingPayload>
          }
          createMany: {
            args: Prisma.BacktestingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.BacktestingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacktestingPayload>
          }
          update: {
            args: Prisma.BacktestingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacktestingPayload>
          }
          deleteMany: {
            args: Prisma.BacktestingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BacktestingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BacktestingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacktestingPayload>
          }
          aggregate: {
            args: Prisma.BacktestingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBacktesting>
          }
          groupBy: {
            args: Prisma.BacktestingGroupByArgs<ExtArgs>
            result: $Utils.Optional<BacktestingGroupByOutputType>[]
          }
          count: {
            args: Prisma.BacktestingCountArgs<ExtArgs>
            result: $Utils.Optional<BacktestingCountAggregateOutputType> | number
          }
        }
      }
      Bar: {
        payload: Prisma.$BarPayload<ExtArgs>
        fields: Prisma.BarFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BarFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BarFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarPayload>
          }
          findFirst: {
            args: Prisma.BarFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BarFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarPayload>
          }
          findMany: {
            args: Prisma.BarFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarPayload>[]
          }
          create: {
            args: Prisma.BarCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarPayload>
          }
          createMany: {
            args: Prisma.BarCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.BarDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarPayload>
          }
          update: {
            args: Prisma.BarUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarPayload>
          }
          deleteMany: {
            args: Prisma.BarDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BarUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BarUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarPayload>
          }
          aggregate: {
            args: Prisma.BarAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBar>
          }
          groupBy: {
            args: Prisma.BarGroupByArgs<ExtArgs>
            result: $Utils.Optional<BarGroupByOutputType>[]
          }
          count: {
            args: Prisma.BarCountArgs<ExtArgs>
            result: $Utils.Optional<BarCountAggregateOutputType> | number
          }
        }
      }
      BarOverview: {
        payload: Prisma.$BarOverviewPayload<ExtArgs>
        fields: Prisma.BarOverviewFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BarOverviewFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarOverviewPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BarOverviewFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarOverviewPayload>
          }
          findFirst: {
            args: Prisma.BarOverviewFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarOverviewPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BarOverviewFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarOverviewPayload>
          }
          findMany: {
            args: Prisma.BarOverviewFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarOverviewPayload>[]
          }
          create: {
            args: Prisma.BarOverviewCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarOverviewPayload>
          }
          createMany: {
            args: Prisma.BarOverviewCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.BarOverviewDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarOverviewPayload>
          }
          update: {
            args: Prisma.BarOverviewUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarOverviewPayload>
          }
          deleteMany: {
            args: Prisma.BarOverviewDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BarOverviewUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BarOverviewUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BarOverviewPayload>
          }
          aggregate: {
            args: Prisma.BarOverviewAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBarOverview>
          }
          groupBy: {
            args: Prisma.BarOverviewGroupByArgs<ExtArgs>
            result: $Utils.Optional<BarOverviewGroupByOutputType>[]
          }
          count: {
            args: Prisma.BarOverviewCountArgs<ExtArgs>
            result: $Utils.Optional<BarOverviewCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    backtesting?: BacktestingOmit
    bar?: BarOmit
    barOverview?: BarOverviewOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model Backtesting
   */

  export type AggregateBacktesting = {
    _count: BacktestingCountAggregateOutputType | null
    _avg: BacktestingAvgAggregateOutputType | null
    _sum: BacktestingSumAggregateOutputType | null
    _min: BacktestingMinAggregateOutputType | null
    _max: BacktestingMaxAggregateOutputType | null
  }

  export type BacktestingAvgAggregateOutputType = {
    id: number | null
    startBalance: Decimal | null
    endBalance: Decimal | null
    maxDrawdown: Decimal | null
    maxDrawdownPercent: Decimal | null
    totalNetPnl: Decimal | null
    totalReturnPercent: Decimal | null
  }

  export type BacktestingSumAggregateOutputType = {
    id: number | null
    startBalance: Decimal | null
    endBalance: Decimal | null
    maxDrawdown: Decimal | null
    maxDrawdownPercent: Decimal | null
    totalNetPnl: Decimal | null
    totalReturnPercent: Decimal | null
  }

  export type BacktestingMinAggregateOutputType = {
    id: number | null
    brokerId: string | null
    strategyName: string | null
    symbol: string | null
    interval: string | null
    startDate: string | null
    endDate: string | null
    startBalance: Decimal | null
    endBalance: Decimal | null
    maxDrawdown: Decimal | null
    maxDrawdownPercent: Decimal | null
    totalNetPnl: Decimal | null
    totalReturnPercent: Decimal | null
  }

  export type BacktestingMaxAggregateOutputType = {
    id: number | null
    brokerId: string | null
    strategyName: string | null
    symbol: string | null
    interval: string | null
    startDate: string | null
    endDate: string | null
    startBalance: Decimal | null
    endBalance: Decimal | null
    maxDrawdown: Decimal | null
    maxDrawdownPercent: Decimal | null
    totalNetPnl: Decimal | null
    totalReturnPercent: Decimal | null
  }

  export type BacktestingCountAggregateOutputType = {
    id: number
    brokerId: number
    strategyName: number
    symbol: number
    interval: number
    startDate: number
    endDate: number
    startBalance: number
    endBalance: number
    maxDrawdown: number
    maxDrawdownPercent: number
    totalNetPnl: number
    totalReturnPercent: number
    dailyResults: number
    trades: number
    _all: number
  }


  export type BacktestingAvgAggregateInputType = {
    id?: true
    startBalance?: true
    endBalance?: true
    maxDrawdown?: true
    maxDrawdownPercent?: true
    totalNetPnl?: true
    totalReturnPercent?: true
  }

  export type BacktestingSumAggregateInputType = {
    id?: true
    startBalance?: true
    endBalance?: true
    maxDrawdown?: true
    maxDrawdownPercent?: true
    totalNetPnl?: true
    totalReturnPercent?: true
  }

  export type BacktestingMinAggregateInputType = {
    id?: true
    brokerId?: true
    strategyName?: true
    symbol?: true
    interval?: true
    startDate?: true
    endDate?: true
    startBalance?: true
    endBalance?: true
    maxDrawdown?: true
    maxDrawdownPercent?: true
    totalNetPnl?: true
    totalReturnPercent?: true
  }

  export type BacktestingMaxAggregateInputType = {
    id?: true
    brokerId?: true
    strategyName?: true
    symbol?: true
    interval?: true
    startDate?: true
    endDate?: true
    startBalance?: true
    endBalance?: true
    maxDrawdown?: true
    maxDrawdownPercent?: true
    totalNetPnl?: true
    totalReturnPercent?: true
  }

  export type BacktestingCountAggregateInputType = {
    id?: true
    brokerId?: true
    strategyName?: true
    symbol?: true
    interval?: true
    startDate?: true
    endDate?: true
    startBalance?: true
    endBalance?: true
    maxDrawdown?: true
    maxDrawdownPercent?: true
    totalNetPnl?: true
    totalReturnPercent?: true
    dailyResults?: true
    trades?: true
    _all?: true
  }

  export type BacktestingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Backtesting to aggregate.
     */
    where?: BacktestingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Backtestings to fetch.
     */
    orderBy?: BacktestingOrderByWithRelationInput | BacktestingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BacktestingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Backtestings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Backtestings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Backtestings
    **/
    _count?: true | BacktestingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BacktestingAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BacktestingSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BacktestingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BacktestingMaxAggregateInputType
  }

  export type GetBacktestingAggregateType<T extends BacktestingAggregateArgs> = {
        [P in keyof T & keyof AggregateBacktesting]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBacktesting[P]>
      : GetScalarType<T[P], AggregateBacktesting[P]>
  }




  export type BacktestingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BacktestingWhereInput
    orderBy?: BacktestingOrderByWithAggregationInput | BacktestingOrderByWithAggregationInput[]
    by: BacktestingScalarFieldEnum[] | BacktestingScalarFieldEnum
    having?: BacktestingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BacktestingCountAggregateInputType | true
    _avg?: BacktestingAvgAggregateInputType
    _sum?: BacktestingSumAggregateInputType
    _min?: BacktestingMinAggregateInputType
    _max?: BacktestingMaxAggregateInputType
  }

  export type BacktestingGroupByOutputType = {
    id: number
    brokerId: string
    strategyName: string
    symbol: string
    interval: string
    startDate: string
    endDate: string
    startBalance: Decimal
    endBalance: Decimal
    maxDrawdown: Decimal
    maxDrawdownPercent: Decimal
    totalNetPnl: Decimal
    totalReturnPercent: Decimal
    dailyResults: JsonValue
    trades: JsonValue
    _count: BacktestingCountAggregateOutputType | null
    _avg: BacktestingAvgAggregateOutputType | null
    _sum: BacktestingSumAggregateOutputType | null
    _min: BacktestingMinAggregateOutputType | null
    _max: BacktestingMaxAggregateOutputType | null
  }

  type GetBacktestingGroupByPayload<T extends BacktestingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BacktestingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BacktestingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BacktestingGroupByOutputType[P]>
            : GetScalarType<T[P], BacktestingGroupByOutputType[P]>
        }
      >
    >


  export type BacktestingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    brokerId?: boolean
    strategyName?: boolean
    symbol?: boolean
    interval?: boolean
    startDate?: boolean
    endDate?: boolean
    startBalance?: boolean
    endBalance?: boolean
    maxDrawdown?: boolean
    maxDrawdownPercent?: boolean
    totalNetPnl?: boolean
    totalReturnPercent?: boolean
    dailyResults?: boolean
    trades?: boolean
  }, ExtArgs["result"]["backtesting"]>



  export type BacktestingSelectScalar = {
    id?: boolean
    brokerId?: boolean
    strategyName?: boolean
    symbol?: boolean
    interval?: boolean
    startDate?: boolean
    endDate?: boolean
    startBalance?: boolean
    endBalance?: boolean
    maxDrawdown?: boolean
    maxDrawdownPercent?: boolean
    totalNetPnl?: boolean
    totalReturnPercent?: boolean
    dailyResults?: boolean
    trades?: boolean
  }

  export type BacktestingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "brokerId" | "strategyName" | "symbol" | "interval" | "startDate" | "endDate" | "startBalance" | "endBalance" | "maxDrawdown" | "maxDrawdownPercent" | "totalNetPnl" | "totalReturnPercent" | "dailyResults" | "trades", ExtArgs["result"]["backtesting"]>

  export type $BacktestingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Backtesting"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      brokerId: string
      strategyName: string
      symbol: string
      interval: string
      startDate: string
      endDate: string
      startBalance: Prisma.Decimal
      endBalance: Prisma.Decimal
      maxDrawdown: Prisma.Decimal
      maxDrawdownPercent: Prisma.Decimal
      totalNetPnl: Prisma.Decimal
      totalReturnPercent: Prisma.Decimal
      dailyResults: Prisma.JsonValue
      trades: Prisma.JsonValue
    }, ExtArgs["result"]["backtesting"]>
    composites: {}
  }

  type BacktestingGetPayload<S extends boolean | null | undefined | BacktestingDefaultArgs> = $Result.GetResult<Prisma.$BacktestingPayload, S>

  type BacktestingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BacktestingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BacktestingCountAggregateInputType | true
    }

  export interface BacktestingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Backtesting'], meta: { name: 'Backtesting' } }
    /**
     * Find zero or one Backtesting that matches the filter.
     * @param {BacktestingFindUniqueArgs} args - Arguments to find a Backtesting
     * @example
     * // Get one Backtesting
     * const backtesting = await prisma.backtesting.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BacktestingFindUniqueArgs>(args: SelectSubset<T, BacktestingFindUniqueArgs<ExtArgs>>): Prisma__BacktestingClient<$Result.GetResult<Prisma.$BacktestingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Backtesting that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BacktestingFindUniqueOrThrowArgs} args - Arguments to find a Backtesting
     * @example
     * // Get one Backtesting
     * const backtesting = await prisma.backtesting.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BacktestingFindUniqueOrThrowArgs>(args: SelectSubset<T, BacktestingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BacktestingClient<$Result.GetResult<Prisma.$BacktestingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Backtesting that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacktestingFindFirstArgs} args - Arguments to find a Backtesting
     * @example
     * // Get one Backtesting
     * const backtesting = await prisma.backtesting.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BacktestingFindFirstArgs>(args?: SelectSubset<T, BacktestingFindFirstArgs<ExtArgs>>): Prisma__BacktestingClient<$Result.GetResult<Prisma.$BacktestingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Backtesting that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacktestingFindFirstOrThrowArgs} args - Arguments to find a Backtesting
     * @example
     * // Get one Backtesting
     * const backtesting = await prisma.backtesting.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BacktestingFindFirstOrThrowArgs>(args?: SelectSubset<T, BacktestingFindFirstOrThrowArgs<ExtArgs>>): Prisma__BacktestingClient<$Result.GetResult<Prisma.$BacktestingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Backtestings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacktestingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Backtestings
     * const backtestings = await prisma.backtesting.findMany()
     * 
     * // Get first 10 Backtestings
     * const backtestings = await prisma.backtesting.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const backtestingWithIdOnly = await prisma.backtesting.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BacktestingFindManyArgs>(args?: SelectSubset<T, BacktestingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BacktestingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Backtesting.
     * @param {BacktestingCreateArgs} args - Arguments to create a Backtesting.
     * @example
     * // Create one Backtesting
     * const Backtesting = await prisma.backtesting.create({
     *   data: {
     *     // ... data to create a Backtesting
     *   }
     * })
     * 
     */
    create<T extends BacktestingCreateArgs>(args: SelectSubset<T, BacktestingCreateArgs<ExtArgs>>): Prisma__BacktestingClient<$Result.GetResult<Prisma.$BacktestingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Backtestings.
     * @param {BacktestingCreateManyArgs} args - Arguments to create many Backtestings.
     * @example
     * // Create many Backtestings
     * const backtesting = await prisma.backtesting.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BacktestingCreateManyArgs>(args?: SelectSubset<T, BacktestingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Backtesting.
     * @param {BacktestingDeleteArgs} args - Arguments to delete one Backtesting.
     * @example
     * // Delete one Backtesting
     * const Backtesting = await prisma.backtesting.delete({
     *   where: {
     *     // ... filter to delete one Backtesting
     *   }
     * })
     * 
     */
    delete<T extends BacktestingDeleteArgs>(args: SelectSubset<T, BacktestingDeleteArgs<ExtArgs>>): Prisma__BacktestingClient<$Result.GetResult<Prisma.$BacktestingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Backtesting.
     * @param {BacktestingUpdateArgs} args - Arguments to update one Backtesting.
     * @example
     * // Update one Backtesting
     * const backtesting = await prisma.backtesting.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BacktestingUpdateArgs>(args: SelectSubset<T, BacktestingUpdateArgs<ExtArgs>>): Prisma__BacktestingClient<$Result.GetResult<Prisma.$BacktestingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Backtestings.
     * @param {BacktestingDeleteManyArgs} args - Arguments to filter Backtestings to delete.
     * @example
     * // Delete a few Backtestings
     * const { count } = await prisma.backtesting.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BacktestingDeleteManyArgs>(args?: SelectSubset<T, BacktestingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Backtestings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacktestingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Backtestings
     * const backtesting = await prisma.backtesting.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BacktestingUpdateManyArgs>(args: SelectSubset<T, BacktestingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Backtesting.
     * @param {BacktestingUpsertArgs} args - Arguments to update or create a Backtesting.
     * @example
     * // Update or create a Backtesting
     * const backtesting = await prisma.backtesting.upsert({
     *   create: {
     *     // ... data to create a Backtesting
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Backtesting we want to update
     *   }
     * })
     */
    upsert<T extends BacktestingUpsertArgs>(args: SelectSubset<T, BacktestingUpsertArgs<ExtArgs>>): Prisma__BacktestingClient<$Result.GetResult<Prisma.$BacktestingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Backtestings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacktestingCountArgs} args - Arguments to filter Backtestings to count.
     * @example
     * // Count the number of Backtestings
     * const count = await prisma.backtesting.count({
     *   where: {
     *     // ... the filter for the Backtestings we want to count
     *   }
     * })
    **/
    count<T extends BacktestingCountArgs>(
      args?: Subset<T, BacktestingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BacktestingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Backtesting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacktestingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BacktestingAggregateArgs>(args: Subset<T, BacktestingAggregateArgs>): Prisma.PrismaPromise<GetBacktestingAggregateType<T>>

    /**
     * Group by Backtesting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacktestingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BacktestingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BacktestingGroupByArgs['orderBy'] }
        : { orderBy?: BacktestingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BacktestingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBacktestingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Backtesting model
   */
  readonly fields: BacktestingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Backtesting.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BacktestingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Backtesting model
   */
  interface BacktestingFieldRefs {
    readonly id: FieldRef<"Backtesting", 'Int'>
    readonly brokerId: FieldRef<"Backtesting", 'String'>
    readonly strategyName: FieldRef<"Backtesting", 'String'>
    readonly symbol: FieldRef<"Backtesting", 'String'>
    readonly interval: FieldRef<"Backtesting", 'String'>
    readonly startDate: FieldRef<"Backtesting", 'String'>
    readonly endDate: FieldRef<"Backtesting", 'String'>
    readonly startBalance: FieldRef<"Backtesting", 'Decimal'>
    readonly endBalance: FieldRef<"Backtesting", 'Decimal'>
    readonly maxDrawdown: FieldRef<"Backtesting", 'Decimal'>
    readonly maxDrawdownPercent: FieldRef<"Backtesting", 'Decimal'>
    readonly totalNetPnl: FieldRef<"Backtesting", 'Decimal'>
    readonly totalReturnPercent: FieldRef<"Backtesting", 'Decimal'>
    readonly dailyResults: FieldRef<"Backtesting", 'Json'>
    readonly trades: FieldRef<"Backtesting", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * Backtesting findUnique
   */
  export type BacktestingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Backtesting
     */
    select?: BacktestingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Backtesting
     */
    omit?: BacktestingOmit<ExtArgs> | null
    /**
     * Filter, which Backtesting to fetch.
     */
    where: BacktestingWhereUniqueInput
  }

  /**
   * Backtesting findUniqueOrThrow
   */
  export type BacktestingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Backtesting
     */
    select?: BacktestingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Backtesting
     */
    omit?: BacktestingOmit<ExtArgs> | null
    /**
     * Filter, which Backtesting to fetch.
     */
    where: BacktestingWhereUniqueInput
  }

  /**
   * Backtesting findFirst
   */
  export type BacktestingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Backtesting
     */
    select?: BacktestingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Backtesting
     */
    omit?: BacktestingOmit<ExtArgs> | null
    /**
     * Filter, which Backtesting to fetch.
     */
    where?: BacktestingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Backtestings to fetch.
     */
    orderBy?: BacktestingOrderByWithRelationInput | BacktestingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Backtestings.
     */
    cursor?: BacktestingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Backtestings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Backtestings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Backtestings.
     */
    distinct?: BacktestingScalarFieldEnum | BacktestingScalarFieldEnum[]
  }

  /**
   * Backtesting findFirstOrThrow
   */
  export type BacktestingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Backtesting
     */
    select?: BacktestingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Backtesting
     */
    omit?: BacktestingOmit<ExtArgs> | null
    /**
     * Filter, which Backtesting to fetch.
     */
    where?: BacktestingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Backtestings to fetch.
     */
    orderBy?: BacktestingOrderByWithRelationInput | BacktestingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Backtestings.
     */
    cursor?: BacktestingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Backtestings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Backtestings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Backtestings.
     */
    distinct?: BacktestingScalarFieldEnum | BacktestingScalarFieldEnum[]
  }

  /**
   * Backtesting findMany
   */
  export type BacktestingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Backtesting
     */
    select?: BacktestingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Backtesting
     */
    omit?: BacktestingOmit<ExtArgs> | null
    /**
     * Filter, which Backtestings to fetch.
     */
    where?: BacktestingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Backtestings to fetch.
     */
    orderBy?: BacktestingOrderByWithRelationInput | BacktestingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Backtestings.
     */
    cursor?: BacktestingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Backtestings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Backtestings.
     */
    skip?: number
    distinct?: BacktestingScalarFieldEnum | BacktestingScalarFieldEnum[]
  }

  /**
   * Backtesting create
   */
  export type BacktestingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Backtesting
     */
    select?: BacktestingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Backtesting
     */
    omit?: BacktestingOmit<ExtArgs> | null
    /**
     * The data needed to create a Backtesting.
     */
    data: XOR<BacktestingCreateInput, BacktestingUncheckedCreateInput>
  }

  /**
   * Backtesting createMany
   */
  export type BacktestingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Backtestings.
     */
    data: BacktestingCreateManyInput | BacktestingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Backtesting update
   */
  export type BacktestingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Backtesting
     */
    select?: BacktestingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Backtesting
     */
    omit?: BacktestingOmit<ExtArgs> | null
    /**
     * The data needed to update a Backtesting.
     */
    data: XOR<BacktestingUpdateInput, BacktestingUncheckedUpdateInput>
    /**
     * Choose, which Backtesting to update.
     */
    where: BacktestingWhereUniqueInput
  }

  /**
   * Backtesting updateMany
   */
  export type BacktestingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Backtestings.
     */
    data: XOR<BacktestingUpdateManyMutationInput, BacktestingUncheckedUpdateManyInput>
    /**
     * Filter which Backtestings to update
     */
    where?: BacktestingWhereInput
    /**
     * Limit how many Backtestings to update.
     */
    limit?: number
  }

  /**
   * Backtesting upsert
   */
  export type BacktestingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Backtesting
     */
    select?: BacktestingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Backtesting
     */
    omit?: BacktestingOmit<ExtArgs> | null
    /**
     * The filter to search for the Backtesting to update in case it exists.
     */
    where: BacktestingWhereUniqueInput
    /**
     * In case the Backtesting found by the `where` argument doesn't exist, create a new Backtesting with this data.
     */
    create: XOR<BacktestingCreateInput, BacktestingUncheckedCreateInput>
    /**
     * In case the Backtesting was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BacktestingUpdateInput, BacktestingUncheckedUpdateInput>
  }

  /**
   * Backtesting delete
   */
  export type BacktestingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Backtesting
     */
    select?: BacktestingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Backtesting
     */
    omit?: BacktestingOmit<ExtArgs> | null
    /**
     * Filter which Backtesting to delete.
     */
    where: BacktestingWhereUniqueInput
  }

  /**
   * Backtesting deleteMany
   */
  export type BacktestingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Backtestings to delete
     */
    where?: BacktestingWhereInput
    /**
     * Limit how many Backtestings to delete.
     */
    limit?: number
  }

  /**
   * Backtesting without action
   */
  export type BacktestingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Backtesting
     */
    select?: BacktestingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Backtesting
     */
    omit?: BacktestingOmit<ExtArgs> | null
  }


  /**
   * Model Bar
   */

  export type AggregateBar = {
    _count: BarCountAggregateOutputType | null
    _avg: BarAvgAggregateOutputType | null
    _sum: BarSumAggregateOutputType | null
    _min: BarMinAggregateOutputType | null
    _max: BarMaxAggregateOutputType | null
  }

  export type BarAvgAggregateOutputType = {
    timestamp: number | null
    open: Decimal | null
    high: Decimal | null
    low: Decimal | null
    close: Decimal | null
    volume: Decimal | null
  }

  export type BarSumAggregateOutputType = {
    timestamp: bigint | null
    open: Decimal | null
    high: Decimal | null
    low: Decimal | null
    close: Decimal | null
    volume: Decimal | null
  }

  export type BarMinAggregateOutputType = {
    brokerName: string | null
    symbol: string | null
    interval: string | null
    timestamp: bigint | null
    open: Decimal | null
    high: Decimal | null
    low: Decimal | null
    close: Decimal | null
    volume: Decimal | null
  }

  export type BarMaxAggregateOutputType = {
    brokerName: string | null
    symbol: string | null
    interval: string | null
    timestamp: bigint | null
    open: Decimal | null
    high: Decimal | null
    low: Decimal | null
    close: Decimal | null
    volume: Decimal | null
  }

  export type BarCountAggregateOutputType = {
    brokerName: number
    symbol: number
    interval: number
    timestamp: number
    open: number
    high: number
    low: number
    close: number
    volume: number
    _all: number
  }


  export type BarAvgAggregateInputType = {
    timestamp?: true
    open?: true
    high?: true
    low?: true
    close?: true
    volume?: true
  }

  export type BarSumAggregateInputType = {
    timestamp?: true
    open?: true
    high?: true
    low?: true
    close?: true
    volume?: true
  }

  export type BarMinAggregateInputType = {
    brokerName?: true
    symbol?: true
    interval?: true
    timestamp?: true
    open?: true
    high?: true
    low?: true
    close?: true
    volume?: true
  }

  export type BarMaxAggregateInputType = {
    brokerName?: true
    symbol?: true
    interval?: true
    timestamp?: true
    open?: true
    high?: true
    low?: true
    close?: true
    volume?: true
  }

  export type BarCountAggregateInputType = {
    brokerName?: true
    symbol?: true
    interval?: true
    timestamp?: true
    open?: true
    high?: true
    low?: true
    close?: true
    volume?: true
    _all?: true
  }

  export type BarAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Bar to aggregate.
     */
    where?: BarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bars to fetch.
     */
    orderBy?: BarOrderByWithRelationInput | BarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bars.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Bars
    **/
    _count?: true | BarCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BarAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BarSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BarMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BarMaxAggregateInputType
  }

  export type GetBarAggregateType<T extends BarAggregateArgs> = {
        [P in keyof T & keyof AggregateBar]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBar[P]>
      : GetScalarType<T[P], AggregateBar[P]>
  }




  export type BarGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BarWhereInput
    orderBy?: BarOrderByWithAggregationInput | BarOrderByWithAggregationInput[]
    by: BarScalarFieldEnum[] | BarScalarFieldEnum
    having?: BarScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BarCountAggregateInputType | true
    _avg?: BarAvgAggregateInputType
    _sum?: BarSumAggregateInputType
    _min?: BarMinAggregateInputType
    _max?: BarMaxAggregateInputType
  }

  export type BarGroupByOutputType = {
    brokerName: string
    symbol: string
    interval: string
    timestamp: bigint
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: Decimal
    _count: BarCountAggregateOutputType | null
    _avg: BarAvgAggregateOutputType | null
    _sum: BarSumAggregateOutputType | null
    _min: BarMinAggregateOutputType | null
    _max: BarMaxAggregateOutputType | null
  }

  type GetBarGroupByPayload<T extends BarGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BarGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BarGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BarGroupByOutputType[P]>
            : GetScalarType<T[P], BarGroupByOutputType[P]>
        }
      >
    >


  export type BarSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    brokerName?: boolean
    symbol?: boolean
    interval?: boolean
    timestamp?: boolean
    open?: boolean
    high?: boolean
    low?: boolean
    close?: boolean
    volume?: boolean
  }, ExtArgs["result"]["bar"]>



  export type BarSelectScalar = {
    brokerName?: boolean
    symbol?: boolean
    interval?: boolean
    timestamp?: boolean
    open?: boolean
    high?: boolean
    low?: boolean
    close?: boolean
    volume?: boolean
  }

  export type BarOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"brokerName" | "symbol" | "interval" | "timestamp" | "open" | "high" | "low" | "close" | "volume", ExtArgs["result"]["bar"]>

  export type $BarPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Bar"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      brokerName: string
      symbol: string
      interval: string
      timestamp: bigint
      open: Prisma.Decimal
      high: Prisma.Decimal
      low: Prisma.Decimal
      close: Prisma.Decimal
      volume: Prisma.Decimal
    }, ExtArgs["result"]["bar"]>
    composites: {}
  }

  type BarGetPayload<S extends boolean | null | undefined | BarDefaultArgs> = $Result.GetResult<Prisma.$BarPayload, S>

  type BarCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BarFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BarCountAggregateInputType | true
    }

  export interface BarDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Bar'], meta: { name: 'Bar' } }
    /**
     * Find zero or one Bar that matches the filter.
     * @param {BarFindUniqueArgs} args - Arguments to find a Bar
     * @example
     * // Get one Bar
     * const bar = await prisma.bar.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BarFindUniqueArgs>(args: SelectSubset<T, BarFindUniqueArgs<ExtArgs>>): Prisma__BarClient<$Result.GetResult<Prisma.$BarPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Bar that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BarFindUniqueOrThrowArgs} args - Arguments to find a Bar
     * @example
     * // Get one Bar
     * const bar = await prisma.bar.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BarFindUniqueOrThrowArgs>(args: SelectSubset<T, BarFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BarClient<$Result.GetResult<Prisma.$BarPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Bar that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BarFindFirstArgs} args - Arguments to find a Bar
     * @example
     * // Get one Bar
     * const bar = await prisma.bar.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BarFindFirstArgs>(args?: SelectSubset<T, BarFindFirstArgs<ExtArgs>>): Prisma__BarClient<$Result.GetResult<Prisma.$BarPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Bar that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BarFindFirstOrThrowArgs} args - Arguments to find a Bar
     * @example
     * // Get one Bar
     * const bar = await prisma.bar.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BarFindFirstOrThrowArgs>(args?: SelectSubset<T, BarFindFirstOrThrowArgs<ExtArgs>>): Prisma__BarClient<$Result.GetResult<Prisma.$BarPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Bars that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BarFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Bars
     * const bars = await prisma.bar.findMany()
     * 
     * // Get first 10 Bars
     * const bars = await prisma.bar.findMany({ take: 10 })
     * 
     * // Only select the `brokerName`
     * const barWithBrokerNameOnly = await prisma.bar.findMany({ select: { brokerName: true } })
     * 
     */
    findMany<T extends BarFindManyArgs>(args?: SelectSubset<T, BarFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BarPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Bar.
     * @param {BarCreateArgs} args - Arguments to create a Bar.
     * @example
     * // Create one Bar
     * const Bar = await prisma.bar.create({
     *   data: {
     *     // ... data to create a Bar
     *   }
     * })
     * 
     */
    create<T extends BarCreateArgs>(args: SelectSubset<T, BarCreateArgs<ExtArgs>>): Prisma__BarClient<$Result.GetResult<Prisma.$BarPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Bars.
     * @param {BarCreateManyArgs} args - Arguments to create many Bars.
     * @example
     * // Create many Bars
     * const bar = await prisma.bar.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BarCreateManyArgs>(args?: SelectSubset<T, BarCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Bar.
     * @param {BarDeleteArgs} args - Arguments to delete one Bar.
     * @example
     * // Delete one Bar
     * const Bar = await prisma.bar.delete({
     *   where: {
     *     // ... filter to delete one Bar
     *   }
     * })
     * 
     */
    delete<T extends BarDeleteArgs>(args: SelectSubset<T, BarDeleteArgs<ExtArgs>>): Prisma__BarClient<$Result.GetResult<Prisma.$BarPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Bar.
     * @param {BarUpdateArgs} args - Arguments to update one Bar.
     * @example
     * // Update one Bar
     * const bar = await prisma.bar.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BarUpdateArgs>(args: SelectSubset<T, BarUpdateArgs<ExtArgs>>): Prisma__BarClient<$Result.GetResult<Prisma.$BarPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Bars.
     * @param {BarDeleteManyArgs} args - Arguments to filter Bars to delete.
     * @example
     * // Delete a few Bars
     * const { count } = await prisma.bar.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BarDeleteManyArgs>(args?: SelectSubset<T, BarDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Bars.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BarUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Bars
     * const bar = await prisma.bar.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BarUpdateManyArgs>(args: SelectSubset<T, BarUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Bar.
     * @param {BarUpsertArgs} args - Arguments to update or create a Bar.
     * @example
     * // Update or create a Bar
     * const bar = await prisma.bar.upsert({
     *   create: {
     *     // ... data to create a Bar
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Bar we want to update
     *   }
     * })
     */
    upsert<T extends BarUpsertArgs>(args: SelectSubset<T, BarUpsertArgs<ExtArgs>>): Prisma__BarClient<$Result.GetResult<Prisma.$BarPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Bars.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BarCountArgs} args - Arguments to filter Bars to count.
     * @example
     * // Count the number of Bars
     * const count = await prisma.bar.count({
     *   where: {
     *     // ... the filter for the Bars we want to count
     *   }
     * })
    **/
    count<T extends BarCountArgs>(
      args?: Subset<T, BarCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BarCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Bar.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BarAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BarAggregateArgs>(args: Subset<T, BarAggregateArgs>): Prisma.PrismaPromise<GetBarAggregateType<T>>

    /**
     * Group by Bar.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BarGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BarGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BarGroupByArgs['orderBy'] }
        : { orderBy?: BarGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BarGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBarGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Bar model
   */
  readonly fields: BarFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Bar.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BarClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Bar model
   */
  interface BarFieldRefs {
    readonly brokerName: FieldRef<"Bar", 'String'>
    readonly symbol: FieldRef<"Bar", 'String'>
    readonly interval: FieldRef<"Bar", 'String'>
    readonly timestamp: FieldRef<"Bar", 'BigInt'>
    readonly open: FieldRef<"Bar", 'Decimal'>
    readonly high: FieldRef<"Bar", 'Decimal'>
    readonly low: FieldRef<"Bar", 'Decimal'>
    readonly close: FieldRef<"Bar", 'Decimal'>
    readonly volume: FieldRef<"Bar", 'Decimal'>
  }
    

  // Custom InputTypes
  /**
   * Bar findUnique
   */
  export type BarFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bar
     */
    select?: BarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Bar
     */
    omit?: BarOmit<ExtArgs> | null
    /**
     * Filter, which Bar to fetch.
     */
    where: BarWhereUniqueInput
  }

  /**
   * Bar findUniqueOrThrow
   */
  export type BarFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bar
     */
    select?: BarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Bar
     */
    omit?: BarOmit<ExtArgs> | null
    /**
     * Filter, which Bar to fetch.
     */
    where: BarWhereUniqueInput
  }

  /**
   * Bar findFirst
   */
  export type BarFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bar
     */
    select?: BarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Bar
     */
    omit?: BarOmit<ExtArgs> | null
    /**
     * Filter, which Bar to fetch.
     */
    where?: BarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bars to fetch.
     */
    orderBy?: BarOrderByWithRelationInput | BarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Bars.
     */
    cursor?: BarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bars.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bars.
     */
    distinct?: BarScalarFieldEnum | BarScalarFieldEnum[]
  }

  /**
   * Bar findFirstOrThrow
   */
  export type BarFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bar
     */
    select?: BarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Bar
     */
    omit?: BarOmit<ExtArgs> | null
    /**
     * Filter, which Bar to fetch.
     */
    where?: BarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bars to fetch.
     */
    orderBy?: BarOrderByWithRelationInput | BarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Bars.
     */
    cursor?: BarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bars.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bars.
     */
    distinct?: BarScalarFieldEnum | BarScalarFieldEnum[]
  }

  /**
   * Bar findMany
   */
  export type BarFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bar
     */
    select?: BarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Bar
     */
    omit?: BarOmit<ExtArgs> | null
    /**
     * Filter, which Bars to fetch.
     */
    where?: BarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bars to fetch.
     */
    orderBy?: BarOrderByWithRelationInput | BarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Bars.
     */
    cursor?: BarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bars.
     */
    skip?: number
    distinct?: BarScalarFieldEnum | BarScalarFieldEnum[]
  }

  /**
   * Bar create
   */
  export type BarCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bar
     */
    select?: BarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Bar
     */
    omit?: BarOmit<ExtArgs> | null
    /**
     * The data needed to create a Bar.
     */
    data: XOR<BarCreateInput, BarUncheckedCreateInput>
  }

  /**
   * Bar createMany
   */
  export type BarCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Bars.
     */
    data: BarCreateManyInput | BarCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Bar update
   */
  export type BarUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bar
     */
    select?: BarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Bar
     */
    omit?: BarOmit<ExtArgs> | null
    /**
     * The data needed to update a Bar.
     */
    data: XOR<BarUpdateInput, BarUncheckedUpdateInput>
    /**
     * Choose, which Bar to update.
     */
    where: BarWhereUniqueInput
  }

  /**
   * Bar updateMany
   */
  export type BarUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Bars.
     */
    data: XOR<BarUpdateManyMutationInput, BarUncheckedUpdateManyInput>
    /**
     * Filter which Bars to update
     */
    where?: BarWhereInput
    /**
     * Limit how many Bars to update.
     */
    limit?: number
  }

  /**
   * Bar upsert
   */
  export type BarUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bar
     */
    select?: BarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Bar
     */
    omit?: BarOmit<ExtArgs> | null
    /**
     * The filter to search for the Bar to update in case it exists.
     */
    where: BarWhereUniqueInput
    /**
     * In case the Bar found by the `where` argument doesn't exist, create a new Bar with this data.
     */
    create: XOR<BarCreateInput, BarUncheckedCreateInput>
    /**
     * In case the Bar was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BarUpdateInput, BarUncheckedUpdateInput>
  }

  /**
   * Bar delete
   */
  export type BarDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bar
     */
    select?: BarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Bar
     */
    omit?: BarOmit<ExtArgs> | null
    /**
     * Filter which Bar to delete.
     */
    where: BarWhereUniqueInput
  }

  /**
   * Bar deleteMany
   */
  export type BarDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Bars to delete
     */
    where?: BarWhereInput
    /**
     * Limit how many Bars to delete.
     */
    limit?: number
  }

  /**
   * Bar without action
   */
  export type BarDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Bar
     */
    select?: BarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Bar
     */
    omit?: BarOmit<ExtArgs> | null
  }


  /**
   * Model BarOverview
   */

  export type AggregateBarOverview = {
    _count: BarOverviewCountAggregateOutputType | null
    _avg: BarOverviewAvgAggregateOutputType | null
    _sum: BarOverviewSumAggregateOutputType | null
    _min: BarOverviewMinAggregateOutputType | null
    _max: BarOverviewMaxAggregateOutputType | null
  }

  export type BarOverviewAvgAggregateOutputType = {
    id: number | null
  }

  export type BarOverviewSumAggregateOutputType = {
    id: number | null
  }

  export type BarOverviewMinAggregateOutputType = {
    id: number | null
    brokerName: string | null
    symbol: string | null
    interval: string | null
  }

  export type BarOverviewMaxAggregateOutputType = {
    id: number | null
    brokerName: string | null
    symbol: string | null
    interval: string | null
  }

  export type BarOverviewCountAggregateOutputType = {
    id: number
    brokerName: number
    symbol: number
    interval: number
    ranges: number
    _all: number
  }


  export type BarOverviewAvgAggregateInputType = {
    id?: true
  }

  export type BarOverviewSumAggregateInputType = {
    id?: true
  }

  export type BarOverviewMinAggregateInputType = {
    id?: true
    brokerName?: true
    symbol?: true
    interval?: true
  }

  export type BarOverviewMaxAggregateInputType = {
    id?: true
    brokerName?: true
    symbol?: true
    interval?: true
  }

  export type BarOverviewCountAggregateInputType = {
    id?: true
    brokerName?: true
    symbol?: true
    interval?: true
    ranges?: true
    _all?: true
  }

  export type BarOverviewAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BarOverview to aggregate.
     */
    where?: BarOverviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BarOverviews to fetch.
     */
    orderBy?: BarOverviewOrderByWithRelationInput | BarOverviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BarOverviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BarOverviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BarOverviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BarOverviews
    **/
    _count?: true | BarOverviewCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BarOverviewAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BarOverviewSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BarOverviewMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BarOverviewMaxAggregateInputType
  }

  export type GetBarOverviewAggregateType<T extends BarOverviewAggregateArgs> = {
        [P in keyof T & keyof AggregateBarOverview]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBarOverview[P]>
      : GetScalarType<T[P], AggregateBarOverview[P]>
  }




  export type BarOverviewGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BarOverviewWhereInput
    orderBy?: BarOverviewOrderByWithAggregationInput | BarOverviewOrderByWithAggregationInput[]
    by: BarOverviewScalarFieldEnum[] | BarOverviewScalarFieldEnum
    having?: BarOverviewScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BarOverviewCountAggregateInputType | true
    _avg?: BarOverviewAvgAggregateInputType
    _sum?: BarOverviewSumAggregateInputType
    _min?: BarOverviewMinAggregateInputType
    _max?: BarOverviewMaxAggregateInputType
  }

  export type BarOverviewGroupByOutputType = {
    id: number
    brokerName: string
    symbol: string
    interval: string
    ranges: JsonValue
    _count: BarOverviewCountAggregateOutputType | null
    _avg: BarOverviewAvgAggregateOutputType | null
    _sum: BarOverviewSumAggregateOutputType | null
    _min: BarOverviewMinAggregateOutputType | null
    _max: BarOverviewMaxAggregateOutputType | null
  }

  type GetBarOverviewGroupByPayload<T extends BarOverviewGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BarOverviewGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BarOverviewGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BarOverviewGroupByOutputType[P]>
            : GetScalarType<T[P], BarOverviewGroupByOutputType[P]>
        }
      >
    >


  export type BarOverviewSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    brokerName?: boolean
    symbol?: boolean
    interval?: boolean
    ranges?: boolean
  }, ExtArgs["result"]["barOverview"]>



  export type BarOverviewSelectScalar = {
    id?: boolean
    brokerName?: boolean
    symbol?: boolean
    interval?: boolean
    ranges?: boolean
  }

  export type BarOverviewOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "brokerName" | "symbol" | "interval" | "ranges", ExtArgs["result"]["barOverview"]>

  export type $BarOverviewPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BarOverview"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      brokerName: string
      symbol: string
      interval: string
      ranges: Prisma.JsonValue
    }, ExtArgs["result"]["barOverview"]>
    composites: {}
  }

  type BarOverviewGetPayload<S extends boolean | null | undefined | BarOverviewDefaultArgs> = $Result.GetResult<Prisma.$BarOverviewPayload, S>

  type BarOverviewCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BarOverviewFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BarOverviewCountAggregateInputType | true
    }

  export interface BarOverviewDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BarOverview'], meta: { name: 'BarOverview' } }
    /**
     * Find zero or one BarOverview that matches the filter.
     * @param {BarOverviewFindUniqueArgs} args - Arguments to find a BarOverview
     * @example
     * // Get one BarOverview
     * const barOverview = await prisma.barOverview.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BarOverviewFindUniqueArgs>(args: SelectSubset<T, BarOverviewFindUniqueArgs<ExtArgs>>): Prisma__BarOverviewClient<$Result.GetResult<Prisma.$BarOverviewPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one BarOverview that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BarOverviewFindUniqueOrThrowArgs} args - Arguments to find a BarOverview
     * @example
     * // Get one BarOverview
     * const barOverview = await prisma.barOverview.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BarOverviewFindUniqueOrThrowArgs>(args: SelectSubset<T, BarOverviewFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BarOverviewClient<$Result.GetResult<Prisma.$BarOverviewPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BarOverview that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BarOverviewFindFirstArgs} args - Arguments to find a BarOverview
     * @example
     * // Get one BarOverview
     * const barOverview = await prisma.barOverview.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BarOverviewFindFirstArgs>(args?: SelectSubset<T, BarOverviewFindFirstArgs<ExtArgs>>): Prisma__BarOverviewClient<$Result.GetResult<Prisma.$BarOverviewPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BarOverview that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BarOverviewFindFirstOrThrowArgs} args - Arguments to find a BarOverview
     * @example
     * // Get one BarOverview
     * const barOverview = await prisma.barOverview.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BarOverviewFindFirstOrThrowArgs>(args?: SelectSubset<T, BarOverviewFindFirstOrThrowArgs<ExtArgs>>): Prisma__BarOverviewClient<$Result.GetResult<Prisma.$BarOverviewPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more BarOverviews that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BarOverviewFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BarOverviews
     * const barOverviews = await prisma.barOverview.findMany()
     * 
     * // Get first 10 BarOverviews
     * const barOverviews = await prisma.barOverview.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const barOverviewWithIdOnly = await prisma.barOverview.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BarOverviewFindManyArgs>(args?: SelectSubset<T, BarOverviewFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BarOverviewPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a BarOverview.
     * @param {BarOverviewCreateArgs} args - Arguments to create a BarOverview.
     * @example
     * // Create one BarOverview
     * const BarOverview = await prisma.barOverview.create({
     *   data: {
     *     // ... data to create a BarOverview
     *   }
     * })
     * 
     */
    create<T extends BarOverviewCreateArgs>(args: SelectSubset<T, BarOverviewCreateArgs<ExtArgs>>): Prisma__BarOverviewClient<$Result.GetResult<Prisma.$BarOverviewPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many BarOverviews.
     * @param {BarOverviewCreateManyArgs} args - Arguments to create many BarOverviews.
     * @example
     * // Create many BarOverviews
     * const barOverview = await prisma.barOverview.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BarOverviewCreateManyArgs>(args?: SelectSubset<T, BarOverviewCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a BarOverview.
     * @param {BarOverviewDeleteArgs} args - Arguments to delete one BarOverview.
     * @example
     * // Delete one BarOverview
     * const BarOverview = await prisma.barOverview.delete({
     *   where: {
     *     // ... filter to delete one BarOverview
     *   }
     * })
     * 
     */
    delete<T extends BarOverviewDeleteArgs>(args: SelectSubset<T, BarOverviewDeleteArgs<ExtArgs>>): Prisma__BarOverviewClient<$Result.GetResult<Prisma.$BarOverviewPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one BarOverview.
     * @param {BarOverviewUpdateArgs} args - Arguments to update one BarOverview.
     * @example
     * // Update one BarOverview
     * const barOverview = await prisma.barOverview.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BarOverviewUpdateArgs>(args: SelectSubset<T, BarOverviewUpdateArgs<ExtArgs>>): Prisma__BarOverviewClient<$Result.GetResult<Prisma.$BarOverviewPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more BarOverviews.
     * @param {BarOverviewDeleteManyArgs} args - Arguments to filter BarOverviews to delete.
     * @example
     * // Delete a few BarOverviews
     * const { count } = await prisma.barOverview.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BarOverviewDeleteManyArgs>(args?: SelectSubset<T, BarOverviewDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BarOverviews.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BarOverviewUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BarOverviews
     * const barOverview = await prisma.barOverview.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BarOverviewUpdateManyArgs>(args: SelectSubset<T, BarOverviewUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one BarOverview.
     * @param {BarOverviewUpsertArgs} args - Arguments to update or create a BarOverview.
     * @example
     * // Update or create a BarOverview
     * const barOverview = await prisma.barOverview.upsert({
     *   create: {
     *     // ... data to create a BarOverview
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BarOverview we want to update
     *   }
     * })
     */
    upsert<T extends BarOverviewUpsertArgs>(args: SelectSubset<T, BarOverviewUpsertArgs<ExtArgs>>): Prisma__BarOverviewClient<$Result.GetResult<Prisma.$BarOverviewPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of BarOverviews.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BarOverviewCountArgs} args - Arguments to filter BarOverviews to count.
     * @example
     * // Count the number of BarOverviews
     * const count = await prisma.barOverview.count({
     *   where: {
     *     // ... the filter for the BarOverviews we want to count
     *   }
     * })
    **/
    count<T extends BarOverviewCountArgs>(
      args?: Subset<T, BarOverviewCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BarOverviewCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BarOverview.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BarOverviewAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BarOverviewAggregateArgs>(args: Subset<T, BarOverviewAggregateArgs>): Prisma.PrismaPromise<GetBarOverviewAggregateType<T>>

    /**
     * Group by BarOverview.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BarOverviewGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BarOverviewGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BarOverviewGroupByArgs['orderBy'] }
        : { orderBy?: BarOverviewGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BarOverviewGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBarOverviewGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BarOverview model
   */
  readonly fields: BarOverviewFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BarOverview.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BarOverviewClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BarOverview model
   */
  interface BarOverviewFieldRefs {
    readonly id: FieldRef<"BarOverview", 'Int'>
    readonly brokerName: FieldRef<"BarOverview", 'String'>
    readonly symbol: FieldRef<"BarOverview", 'String'>
    readonly interval: FieldRef<"BarOverview", 'String'>
    readonly ranges: FieldRef<"BarOverview", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * BarOverview findUnique
   */
  export type BarOverviewFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BarOverview
     */
    select?: BarOverviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BarOverview
     */
    omit?: BarOverviewOmit<ExtArgs> | null
    /**
     * Filter, which BarOverview to fetch.
     */
    where: BarOverviewWhereUniqueInput
  }

  /**
   * BarOverview findUniqueOrThrow
   */
  export type BarOverviewFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BarOverview
     */
    select?: BarOverviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BarOverview
     */
    omit?: BarOverviewOmit<ExtArgs> | null
    /**
     * Filter, which BarOverview to fetch.
     */
    where: BarOverviewWhereUniqueInput
  }

  /**
   * BarOverview findFirst
   */
  export type BarOverviewFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BarOverview
     */
    select?: BarOverviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BarOverview
     */
    omit?: BarOverviewOmit<ExtArgs> | null
    /**
     * Filter, which BarOverview to fetch.
     */
    where?: BarOverviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BarOverviews to fetch.
     */
    orderBy?: BarOverviewOrderByWithRelationInput | BarOverviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BarOverviews.
     */
    cursor?: BarOverviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BarOverviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BarOverviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BarOverviews.
     */
    distinct?: BarOverviewScalarFieldEnum | BarOverviewScalarFieldEnum[]
  }

  /**
   * BarOverview findFirstOrThrow
   */
  export type BarOverviewFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BarOverview
     */
    select?: BarOverviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BarOverview
     */
    omit?: BarOverviewOmit<ExtArgs> | null
    /**
     * Filter, which BarOverview to fetch.
     */
    where?: BarOverviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BarOverviews to fetch.
     */
    orderBy?: BarOverviewOrderByWithRelationInput | BarOverviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BarOverviews.
     */
    cursor?: BarOverviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BarOverviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BarOverviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BarOverviews.
     */
    distinct?: BarOverviewScalarFieldEnum | BarOverviewScalarFieldEnum[]
  }

  /**
   * BarOverview findMany
   */
  export type BarOverviewFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BarOverview
     */
    select?: BarOverviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BarOverview
     */
    omit?: BarOverviewOmit<ExtArgs> | null
    /**
     * Filter, which BarOverviews to fetch.
     */
    where?: BarOverviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BarOverviews to fetch.
     */
    orderBy?: BarOverviewOrderByWithRelationInput | BarOverviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BarOverviews.
     */
    cursor?: BarOverviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BarOverviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BarOverviews.
     */
    skip?: number
    distinct?: BarOverviewScalarFieldEnum | BarOverviewScalarFieldEnum[]
  }

  /**
   * BarOverview create
   */
  export type BarOverviewCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BarOverview
     */
    select?: BarOverviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BarOverview
     */
    omit?: BarOverviewOmit<ExtArgs> | null
    /**
     * The data needed to create a BarOverview.
     */
    data: XOR<BarOverviewCreateInput, BarOverviewUncheckedCreateInput>
  }

  /**
   * BarOverview createMany
   */
  export type BarOverviewCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BarOverviews.
     */
    data: BarOverviewCreateManyInput | BarOverviewCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BarOverview update
   */
  export type BarOverviewUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BarOverview
     */
    select?: BarOverviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BarOverview
     */
    omit?: BarOverviewOmit<ExtArgs> | null
    /**
     * The data needed to update a BarOverview.
     */
    data: XOR<BarOverviewUpdateInput, BarOverviewUncheckedUpdateInput>
    /**
     * Choose, which BarOverview to update.
     */
    where: BarOverviewWhereUniqueInput
  }

  /**
   * BarOverview updateMany
   */
  export type BarOverviewUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BarOverviews.
     */
    data: XOR<BarOverviewUpdateManyMutationInput, BarOverviewUncheckedUpdateManyInput>
    /**
     * Filter which BarOverviews to update
     */
    where?: BarOverviewWhereInput
    /**
     * Limit how many BarOverviews to update.
     */
    limit?: number
  }

  /**
   * BarOverview upsert
   */
  export type BarOverviewUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BarOverview
     */
    select?: BarOverviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BarOverview
     */
    omit?: BarOverviewOmit<ExtArgs> | null
    /**
     * The filter to search for the BarOverview to update in case it exists.
     */
    where: BarOverviewWhereUniqueInput
    /**
     * In case the BarOverview found by the `where` argument doesn't exist, create a new BarOverview with this data.
     */
    create: XOR<BarOverviewCreateInput, BarOverviewUncheckedCreateInput>
    /**
     * In case the BarOverview was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BarOverviewUpdateInput, BarOverviewUncheckedUpdateInput>
  }

  /**
   * BarOverview delete
   */
  export type BarOverviewDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BarOverview
     */
    select?: BarOverviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BarOverview
     */
    omit?: BarOverviewOmit<ExtArgs> | null
    /**
     * Filter which BarOverview to delete.
     */
    where: BarOverviewWhereUniqueInput
  }

  /**
   * BarOverview deleteMany
   */
  export type BarOverviewDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BarOverviews to delete
     */
    where?: BarOverviewWhereInput
    /**
     * Limit how many BarOverviews to delete.
     */
    limit?: number
  }

  /**
   * BarOverview without action
   */
  export type BarOverviewDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BarOverview
     */
    select?: BarOverviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BarOverview
     */
    omit?: BarOverviewOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const BacktestingScalarFieldEnum: {
    id: 'id',
    brokerId: 'brokerId',
    strategyName: 'strategyName',
    symbol: 'symbol',
    interval: 'interval',
    startDate: 'startDate',
    endDate: 'endDate',
    startBalance: 'startBalance',
    endBalance: 'endBalance',
    maxDrawdown: 'maxDrawdown',
    maxDrawdownPercent: 'maxDrawdownPercent',
    totalNetPnl: 'totalNetPnl',
    totalReturnPercent: 'totalReturnPercent',
    dailyResults: 'dailyResults',
    trades: 'trades'
  };

  export type BacktestingScalarFieldEnum = (typeof BacktestingScalarFieldEnum)[keyof typeof BacktestingScalarFieldEnum]


  export const BarScalarFieldEnum: {
    brokerName: 'brokerName',
    symbol: 'symbol',
    interval: 'interval',
    timestamp: 'timestamp',
    open: 'open',
    high: 'high',
    low: 'low',
    close: 'close',
    volume: 'volume'
  };

  export type BarScalarFieldEnum = (typeof BarScalarFieldEnum)[keyof typeof BarScalarFieldEnum]


  export const BarOverviewScalarFieldEnum: {
    id: 'id',
    brokerName: 'brokerName',
    symbol: 'symbol',
    interval: 'interval',
    ranges: 'ranges'
  };

  export type BarOverviewScalarFieldEnum = (typeof BarOverviewScalarFieldEnum)[keyof typeof BarOverviewScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const BacktestingOrderByRelevanceFieldEnum: {
    brokerId: 'brokerId',
    strategyName: 'strategyName',
    symbol: 'symbol',
    interval: 'interval',
    startDate: 'startDate',
    endDate: 'endDate'
  };

  export type BacktestingOrderByRelevanceFieldEnum = (typeof BacktestingOrderByRelevanceFieldEnum)[keyof typeof BacktestingOrderByRelevanceFieldEnum]


  export const BarOrderByRelevanceFieldEnum: {
    brokerName: 'brokerName',
    symbol: 'symbol',
    interval: 'interval'
  };

  export type BarOrderByRelevanceFieldEnum = (typeof BarOrderByRelevanceFieldEnum)[keyof typeof BarOrderByRelevanceFieldEnum]


  export const BarOverviewOrderByRelevanceFieldEnum: {
    brokerName: 'brokerName',
    symbol: 'symbol',
    interval: 'interval'
  };

  export type BarOverviewOrderByRelevanceFieldEnum = (typeof BarOverviewOrderByRelevanceFieldEnum)[keyof typeof BarOverviewOrderByRelevanceFieldEnum]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type BacktestingWhereInput = {
    AND?: BacktestingWhereInput | BacktestingWhereInput[]
    OR?: BacktestingWhereInput[]
    NOT?: BacktestingWhereInput | BacktestingWhereInput[]
    id?: IntFilter<"Backtesting"> | number
    brokerId?: StringFilter<"Backtesting"> | string
    strategyName?: StringFilter<"Backtesting"> | string
    symbol?: StringFilter<"Backtesting"> | string
    interval?: StringFilter<"Backtesting"> | string
    startDate?: StringFilter<"Backtesting"> | string
    endDate?: StringFilter<"Backtesting"> | string
    startBalance?: DecimalFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    endBalance?: DecimalFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    maxDrawdown?: DecimalFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    maxDrawdownPercent?: DecimalFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    totalNetPnl?: DecimalFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    totalReturnPercent?: DecimalFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    dailyResults?: JsonFilter<"Backtesting">
    trades?: JsonFilter<"Backtesting">
  }

  export type BacktestingOrderByWithRelationInput = {
    id?: SortOrder
    brokerId?: SortOrder
    strategyName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    startBalance?: SortOrder
    endBalance?: SortOrder
    maxDrawdown?: SortOrder
    maxDrawdownPercent?: SortOrder
    totalNetPnl?: SortOrder
    totalReturnPercent?: SortOrder
    dailyResults?: SortOrder
    trades?: SortOrder
    _relevance?: BacktestingOrderByRelevanceInput
  }

  export type BacktestingWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: BacktestingWhereInput | BacktestingWhereInput[]
    OR?: BacktestingWhereInput[]
    NOT?: BacktestingWhereInput | BacktestingWhereInput[]
    brokerId?: StringFilter<"Backtesting"> | string
    strategyName?: StringFilter<"Backtesting"> | string
    symbol?: StringFilter<"Backtesting"> | string
    interval?: StringFilter<"Backtesting"> | string
    startDate?: StringFilter<"Backtesting"> | string
    endDate?: StringFilter<"Backtesting"> | string
    startBalance?: DecimalFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    endBalance?: DecimalFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    maxDrawdown?: DecimalFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    maxDrawdownPercent?: DecimalFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    totalNetPnl?: DecimalFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    totalReturnPercent?: DecimalFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    dailyResults?: JsonFilter<"Backtesting">
    trades?: JsonFilter<"Backtesting">
  }, "id">

  export type BacktestingOrderByWithAggregationInput = {
    id?: SortOrder
    brokerId?: SortOrder
    strategyName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    startBalance?: SortOrder
    endBalance?: SortOrder
    maxDrawdown?: SortOrder
    maxDrawdownPercent?: SortOrder
    totalNetPnl?: SortOrder
    totalReturnPercent?: SortOrder
    dailyResults?: SortOrder
    trades?: SortOrder
    _count?: BacktestingCountOrderByAggregateInput
    _avg?: BacktestingAvgOrderByAggregateInput
    _max?: BacktestingMaxOrderByAggregateInput
    _min?: BacktestingMinOrderByAggregateInput
    _sum?: BacktestingSumOrderByAggregateInput
  }

  export type BacktestingScalarWhereWithAggregatesInput = {
    AND?: BacktestingScalarWhereWithAggregatesInput | BacktestingScalarWhereWithAggregatesInput[]
    OR?: BacktestingScalarWhereWithAggregatesInput[]
    NOT?: BacktestingScalarWhereWithAggregatesInput | BacktestingScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Backtesting"> | number
    brokerId?: StringWithAggregatesFilter<"Backtesting"> | string
    strategyName?: StringWithAggregatesFilter<"Backtesting"> | string
    symbol?: StringWithAggregatesFilter<"Backtesting"> | string
    interval?: StringWithAggregatesFilter<"Backtesting"> | string
    startDate?: StringWithAggregatesFilter<"Backtesting"> | string
    endDate?: StringWithAggregatesFilter<"Backtesting"> | string
    startBalance?: DecimalWithAggregatesFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    endBalance?: DecimalWithAggregatesFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    maxDrawdown?: DecimalWithAggregatesFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    maxDrawdownPercent?: DecimalWithAggregatesFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    totalNetPnl?: DecimalWithAggregatesFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    totalReturnPercent?: DecimalWithAggregatesFilter<"Backtesting"> | Decimal | DecimalJsLike | number | string
    dailyResults?: JsonWithAggregatesFilter<"Backtesting">
    trades?: JsonWithAggregatesFilter<"Backtesting">
  }

  export type BarWhereInput = {
    AND?: BarWhereInput | BarWhereInput[]
    OR?: BarWhereInput[]
    NOT?: BarWhereInput | BarWhereInput[]
    brokerName?: StringFilter<"Bar"> | string
    symbol?: StringFilter<"Bar"> | string
    interval?: StringFilter<"Bar"> | string
    timestamp?: BigIntFilter<"Bar"> | bigint | number
    open?: DecimalFilter<"Bar"> | Decimal | DecimalJsLike | number | string
    high?: DecimalFilter<"Bar"> | Decimal | DecimalJsLike | number | string
    low?: DecimalFilter<"Bar"> | Decimal | DecimalJsLike | number | string
    close?: DecimalFilter<"Bar"> | Decimal | DecimalJsLike | number | string
    volume?: DecimalFilter<"Bar"> | Decimal | DecimalJsLike | number | string
  }

  export type BarOrderByWithRelationInput = {
    brokerName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
    timestamp?: SortOrder
    open?: SortOrder
    high?: SortOrder
    low?: SortOrder
    close?: SortOrder
    volume?: SortOrder
    _relevance?: BarOrderByRelevanceInput
  }

  export type BarWhereUniqueInput = Prisma.AtLeast<{
    brokerName_symbol_timestamp_interval?: BarBrokerNameSymbolTimestampIntervalCompoundUniqueInput
    AND?: BarWhereInput | BarWhereInput[]
    OR?: BarWhereInput[]
    NOT?: BarWhereInput | BarWhereInput[]
    brokerName?: StringFilter<"Bar"> | string
    symbol?: StringFilter<"Bar"> | string
    interval?: StringFilter<"Bar"> | string
    timestamp?: BigIntFilter<"Bar"> | bigint | number
    open?: DecimalFilter<"Bar"> | Decimal | DecimalJsLike | number | string
    high?: DecimalFilter<"Bar"> | Decimal | DecimalJsLike | number | string
    low?: DecimalFilter<"Bar"> | Decimal | DecimalJsLike | number | string
    close?: DecimalFilter<"Bar"> | Decimal | DecimalJsLike | number | string
    volume?: DecimalFilter<"Bar"> | Decimal | DecimalJsLike | number | string
  }, "brokerName_symbol_timestamp_interval">

  export type BarOrderByWithAggregationInput = {
    brokerName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
    timestamp?: SortOrder
    open?: SortOrder
    high?: SortOrder
    low?: SortOrder
    close?: SortOrder
    volume?: SortOrder
    _count?: BarCountOrderByAggregateInput
    _avg?: BarAvgOrderByAggregateInput
    _max?: BarMaxOrderByAggregateInput
    _min?: BarMinOrderByAggregateInput
    _sum?: BarSumOrderByAggregateInput
  }

  export type BarScalarWhereWithAggregatesInput = {
    AND?: BarScalarWhereWithAggregatesInput | BarScalarWhereWithAggregatesInput[]
    OR?: BarScalarWhereWithAggregatesInput[]
    NOT?: BarScalarWhereWithAggregatesInput | BarScalarWhereWithAggregatesInput[]
    brokerName?: StringWithAggregatesFilter<"Bar"> | string
    symbol?: StringWithAggregatesFilter<"Bar"> | string
    interval?: StringWithAggregatesFilter<"Bar"> | string
    timestamp?: BigIntWithAggregatesFilter<"Bar"> | bigint | number
    open?: DecimalWithAggregatesFilter<"Bar"> | Decimal | DecimalJsLike | number | string
    high?: DecimalWithAggregatesFilter<"Bar"> | Decimal | DecimalJsLike | number | string
    low?: DecimalWithAggregatesFilter<"Bar"> | Decimal | DecimalJsLike | number | string
    close?: DecimalWithAggregatesFilter<"Bar"> | Decimal | DecimalJsLike | number | string
    volume?: DecimalWithAggregatesFilter<"Bar"> | Decimal | DecimalJsLike | number | string
  }

  export type BarOverviewWhereInput = {
    AND?: BarOverviewWhereInput | BarOverviewWhereInput[]
    OR?: BarOverviewWhereInput[]
    NOT?: BarOverviewWhereInput | BarOverviewWhereInput[]
    id?: IntFilter<"BarOverview"> | number
    brokerName?: StringFilter<"BarOverview"> | string
    symbol?: StringFilter<"BarOverview"> | string
    interval?: StringFilter<"BarOverview"> | string
    ranges?: JsonFilter<"BarOverview">
  }

  export type BarOverviewOrderByWithRelationInput = {
    id?: SortOrder
    brokerName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
    ranges?: SortOrder
    _relevance?: BarOverviewOrderByRelevanceInput
  }

  export type BarOverviewWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    brokerName_symbol_interval?: BarOverviewBrokerNameSymbolIntervalCompoundUniqueInput
    AND?: BarOverviewWhereInput | BarOverviewWhereInput[]
    OR?: BarOverviewWhereInput[]
    NOT?: BarOverviewWhereInput | BarOverviewWhereInput[]
    brokerName?: StringFilter<"BarOverview"> | string
    symbol?: StringFilter<"BarOverview"> | string
    interval?: StringFilter<"BarOverview"> | string
    ranges?: JsonFilter<"BarOverview">
  }, "id" | "brokerName_symbol_interval">

  export type BarOverviewOrderByWithAggregationInput = {
    id?: SortOrder
    brokerName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
    ranges?: SortOrder
    _count?: BarOverviewCountOrderByAggregateInput
    _avg?: BarOverviewAvgOrderByAggregateInput
    _max?: BarOverviewMaxOrderByAggregateInput
    _min?: BarOverviewMinOrderByAggregateInput
    _sum?: BarOverviewSumOrderByAggregateInput
  }

  export type BarOverviewScalarWhereWithAggregatesInput = {
    AND?: BarOverviewScalarWhereWithAggregatesInput | BarOverviewScalarWhereWithAggregatesInput[]
    OR?: BarOverviewScalarWhereWithAggregatesInput[]
    NOT?: BarOverviewScalarWhereWithAggregatesInput | BarOverviewScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"BarOverview"> | number
    brokerName?: StringWithAggregatesFilter<"BarOverview"> | string
    symbol?: StringWithAggregatesFilter<"BarOverview"> | string
    interval?: StringWithAggregatesFilter<"BarOverview"> | string
    ranges?: JsonWithAggregatesFilter<"BarOverview">
  }

  export type BacktestingCreateInput = {
    brokerId: string
    strategyName: string
    symbol: string
    interval: string
    startDate: string
    endDate: string
    startBalance: Decimal | DecimalJsLike | number | string
    endBalance: Decimal | DecimalJsLike | number | string
    maxDrawdown: Decimal | DecimalJsLike | number | string
    maxDrawdownPercent: Decimal | DecimalJsLike | number | string
    totalNetPnl: Decimal | DecimalJsLike | number | string
    totalReturnPercent: Decimal | DecimalJsLike | number | string
    dailyResults: JsonNullValueInput | InputJsonValue
    trades: JsonNullValueInput | InputJsonValue
  }

  export type BacktestingUncheckedCreateInput = {
    id?: number
    brokerId: string
    strategyName: string
    symbol: string
    interval: string
    startDate: string
    endDate: string
    startBalance: Decimal | DecimalJsLike | number | string
    endBalance: Decimal | DecimalJsLike | number | string
    maxDrawdown: Decimal | DecimalJsLike | number | string
    maxDrawdownPercent: Decimal | DecimalJsLike | number | string
    totalNetPnl: Decimal | DecimalJsLike | number | string
    totalReturnPercent: Decimal | DecimalJsLike | number | string
    dailyResults: JsonNullValueInput | InputJsonValue
    trades: JsonNullValueInput | InputJsonValue
  }

  export type BacktestingUpdateInput = {
    brokerId?: StringFieldUpdateOperationsInput | string
    strategyName?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    interval?: StringFieldUpdateOperationsInput | string
    startDate?: StringFieldUpdateOperationsInput | string
    endDate?: StringFieldUpdateOperationsInput | string
    startBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    endBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxDrawdown?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxDrawdownPercent?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalNetPnl?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalReturnPercent?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dailyResults?: JsonNullValueInput | InputJsonValue
    trades?: JsonNullValueInput | InputJsonValue
  }

  export type BacktestingUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    brokerId?: StringFieldUpdateOperationsInput | string
    strategyName?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    interval?: StringFieldUpdateOperationsInput | string
    startDate?: StringFieldUpdateOperationsInput | string
    endDate?: StringFieldUpdateOperationsInput | string
    startBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    endBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxDrawdown?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxDrawdownPercent?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalNetPnl?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalReturnPercent?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dailyResults?: JsonNullValueInput | InputJsonValue
    trades?: JsonNullValueInput | InputJsonValue
  }

  export type BacktestingCreateManyInput = {
    id?: number
    brokerId: string
    strategyName: string
    symbol: string
    interval: string
    startDate: string
    endDate: string
    startBalance: Decimal | DecimalJsLike | number | string
    endBalance: Decimal | DecimalJsLike | number | string
    maxDrawdown: Decimal | DecimalJsLike | number | string
    maxDrawdownPercent: Decimal | DecimalJsLike | number | string
    totalNetPnl: Decimal | DecimalJsLike | number | string
    totalReturnPercent: Decimal | DecimalJsLike | number | string
    dailyResults: JsonNullValueInput | InputJsonValue
    trades: JsonNullValueInput | InputJsonValue
  }

  export type BacktestingUpdateManyMutationInput = {
    brokerId?: StringFieldUpdateOperationsInput | string
    strategyName?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    interval?: StringFieldUpdateOperationsInput | string
    startDate?: StringFieldUpdateOperationsInput | string
    endDate?: StringFieldUpdateOperationsInput | string
    startBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    endBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxDrawdown?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxDrawdownPercent?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalNetPnl?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalReturnPercent?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dailyResults?: JsonNullValueInput | InputJsonValue
    trades?: JsonNullValueInput | InputJsonValue
  }

  export type BacktestingUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    brokerId?: StringFieldUpdateOperationsInput | string
    strategyName?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    interval?: StringFieldUpdateOperationsInput | string
    startDate?: StringFieldUpdateOperationsInput | string
    endDate?: StringFieldUpdateOperationsInput | string
    startBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    endBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxDrawdown?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxDrawdownPercent?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalNetPnl?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalReturnPercent?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dailyResults?: JsonNullValueInput | InputJsonValue
    trades?: JsonNullValueInput | InputJsonValue
  }

  export type BarCreateInput = {
    brokerName: string
    symbol: string
    interval: string
    timestamp: bigint | number
    open: Decimal | DecimalJsLike | number | string
    high: Decimal | DecimalJsLike | number | string
    low: Decimal | DecimalJsLike | number | string
    close: Decimal | DecimalJsLike | number | string
    volume: Decimal | DecimalJsLike | number | string
  }

  export type BarUncheckedCreateInput = {
    brokerName: string
    symbol: string
    interval: string
    timestamp: bigint | number
    open: Decimal | DecimalJsLike | number | string
    high: Decimal | DecimalJsLike | number | string
    low: Decimal | DecimalJsLike | number | string
    close: Decimal | DecimalJsLike | number | string
    volume: Decimal | DecimalJsLike | number | string
  }

  export type BarUpdateInput = {
    brokerName?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    interval?: StringFieldUpdateOperationsInput | string
    timestamp?: BigIntFieldUpdateOperationsInput | bigint | number
    open?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    high?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    low?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    close?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    volume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type BarUncheckedUpdateInput = {
    brokerName?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    interval?: StringFieldUpdateOperationsInput | string
    timestamp?: BigIntFieldUpdateOperationsInput | bigint | number
    open?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    high?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    low?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    close?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    volume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type BarCreateManyInput = {
    brokerName: string
    symbol: string
    interval: string
    timestamp: bigint | number
    open: Decimal | DecimalJsLike | number | string
    high: Decimal | DecimalJsLike | number | string
    low: Decimal | DecimalJsLike | number | string
    close: Decimal | DecimalJsLike | number | string
    volume: Decimal | DecimalJsLike | number | string
  }

  export type BarUpdateManyMutationInput = {
    brokerName?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    interval?: StringFieldUpdateOperationsInput | string
    timestamp?: BigIntFieldUpdateOperationsInput | bigint | number
    open?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    high?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    low?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    close?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    volume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type BarUncheckedUpdateManyInput = {
    brokerName?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    interval?: StringFieldUpdateOperationsInput | string
    timestamp?: BigIntFieldUpdateOperationsInput | bigint | number
    open?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    high?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    low?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    close?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    volume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type BarOverviewCreateInput = {
    brokerName: string
    symbol: string
    interval: string
    ranges: JsonNullValueInput | InputJsonValue
  }

  export type BarOverviewUncheckedCreateInput = {
    id?: number
    brokerName: string
    symbol: string
    interval: string
    ranges: JsonNullValueInput | InputJsonValue
  }

  export type BarOverviewUpdateInput = {
    brokerName?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    interval?: StringFieldUpdateOperationsInput | string
    ranges?: JsonNullValueInput | InputJsonValue
  }

  export type BarOverviewUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    brokerName?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    interval?: StringFieldUpdateOperationsInput | string
    ranges?: JsonNullValueInput | InputJsonValue
  }

  export type BarOverviewCreateManyInput = {
    id?: number
    brokerName: string
    symbol: string
    interval: string
    ranges: JsonNullValueInput | InputJsonValue
  }

  export type BarOverviewUpdateManyMutationInput = {
    brokerName?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    interval?: StringFieldUpdateOperationsInput | string
    ranges?: JsonNullValueInput | InputJsonValue
  }

  export type BarOverviewUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    brokerName?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    interval?: StringFieldUpdateOperationsInput | string
    ranges?: JsonNullValueInput | InputJsonValue
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type BacktestingOrderByRelevanceInput = {
    fields: BacktestingOrderByRelevanceFieldEnum | BacktestingOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type BacktestingCountOrderByAggregateInput = {
    id?: SortOrder
    brokerId?: SortOrder
    strategyName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    startBalance?: SortOrder
    endBalance?: SortOrder
    maxDrawdown?: SortOrder
    maxDrawdownPercent?: SortOrder
    totalNetPnl?: SortOrder
    totalReturnPercent?: SortOrder
    dailyResults?: SortOrder
    trades?: SortOrder
  }

  export type BacktestingAvgOrderByAggregateInput = {
    id?: SortOrder
    startBalance?: SortOrder
    endBalance?: SortOrder
    maxDrawdown?: SortOrder
    maxDrawdownPercent?: SortOrder
    totalNetPnl?: SortOrder
    totalReturnPercent?: SortOrder
  }

  export type BacktestingMaxOrderByAggregateInput = {
    id?: SortOrder
    brokerId?: SortOrder
    strategyName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    startBalance?: SortOrder
    endBalance?: SortOrder
    maxDrawdown?: SortOrder
    maxDrawdownPercent?: SortOrder
    totalNetPnl?: SortOrder
    totalReturnPercent?: SortOrder
  }

  export type BacktestingMinOrderByAggregateInput = {
    id?: SortOrder
    brokerId?: SortOrder
    strategyName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    startBalance?: SortOrder
    endBalance?: SortOrder
    maxDrawdown?: SortOrder
    maxDrawdownPercent?: SortOrder
    totalNetPnl?: SortOrder
    totalReturnPercent?: SortOrder
  }

  export type BacktestingSumOrderByAggregateInput = {
    id?: SortOrder
    startBalance?: SortOrder
    endBalance?: SortOrder
    maxDrawdown?: SortOrder
    maxDrawdownPercent?: SortOrder
    totalNetPnl?: SortOrder
    totalReturnPercent?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[]
    notIn?: bigint[] | number[]
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type BarOrderByRelevanceInput = {
    fields: BarOrderByRelevanceFieldEnum | BarOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type BarBrokerNameSymbolTimestampIntervalCompoundUniqueInput = {
    brokerName: string
    symbol: string
    timestamp: bigint | number
    interval: string
  }

  export type BarCountOrderByAggregateInput = {
    brokerName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
    timestamp?: SortOrder
    open?: SortOrder
    high?: SortOrder
    low?: SortOrder
    close?: SortOrder
    volume?: SortOrder
  }

  export type BarAvgOrderByAggregateInput = {
    timestamp?: SortOrder
    open?: SortOrder
    high?: SortOrder
    low?: SortOrder
    close?: SortOrder
    volume?: SortOrder
  }

  export type BarMaxOrderByAggregateInput = {
    brokerName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
    timestamp?: SortOrder
    open?: SortOrder
    high?: SortOrder
    low?: SortOrder
    close?: SortOrder
    volume?: SortOrder
  }

  export type BarMinOrderByAggregateInput = {
    brokerName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
    timestamp?: SortOrder
    open?: SortOrder
    high?: SortOrder
    low?: SortOrder
    close?: SortOrder
    volume?: SortOrder
  }

  export type BarSumOrderByAggregateInput = {
    timestamp?: SortOrder
    open?: SortOrder
    high?: SortOrder
    low?: SortOrder
    close?: SortOrder
    volume?: SortOrder
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[]
    notIn?: bigint[] | number[]
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type BarOverviewOrderByRelevanceInput = {
    fields: BarOverviewOrderByRelevanceFieldEnum | BarOverviewOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type BarOverviewBrokerNameSymbolIntervalCompoundUniqueInput = {
    brokerName: string
    symbol: string
    interval: string
  }

  export type BarOverviewCountOrderByAggregateInput = {
    id?: SortOrder
    brokerName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
    ranges?: SortOrder
  }

  export type BarOverviewAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type BarOverviewMaxOrderByAggregateInput = {
    id?: SortOrder
    brokerName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
  }

  export type BarOverviewMinOrderByAggregateInput = {
    id?: SortOrder
    brokerName?: SortOrder
    symbol?: SortOrder
    interval?: SortOrder
  }

  export type BarOverviewSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[]
    notIn?: bigint[] | number[]
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[]
    notIn?: bigint[] | number[]
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}