---
name: "api-post-only"
description: "Enforces all API endpoints use POST method when generating backend controller or frontend API client code. Invoke when creating new API endpoints, generating interface code, or adding new controller routes."
---

# API POST-Only Convention

All API endpoints in this project MUST use the POST method. GET, PUT, DELETE, PATCH methods are NOT allowed for new endpoints.

## Backend (NestJS Controller)

When creating a new controller or adding new endpoints:

1. Always use `@Post()` decorator, never `@Get()`, `@Put()`, `@Delete()`, or `@Patch()`
2. Pass parameters via `@Body()`, not `@Param()` or `@Query()`
3. All responses MUST be wrapped with the `response()` utility from `src/utils`
4. Response format must conform to `Response<T>` from `@vtrader/shared`: `{ code: number, msg: string, data: T }`

### Example

```ts
// Correct
@Controller('example')
export class ExampleController {
  @Post('list')
  async getList(@Body() body: { page: number; pageSize: number }) {
    const data = await this.service.getList(body);
    return response(data);
  }

  @Post('detail')
  async getDetail(@Body() body: { id: number }) {
    const data = await this.service.getDetail(body.id);
    return response(data);
  }
}

// Wrong - DO NOT use @Get, @Param, @Query
@Get('list')                    // ❌ Must use @Post
async getList(@Query() query)   // ❌ Must use @Body
@Get('detail/:id')              // ❌ Must use @Post with body
```

## Frontend (API Client)

When creating frontend API calls:

1. Always use `post()` from `@/http`, never `get()`, `put()`, or `del()`
2. Pass all parameters in the request body (second argument)
3. Frontend API module directories MUST NOT have an `index.ts` barrel file. Each consumer should import directly from the specific module file (e.g., `import { getBrokers } from '@/api/marketData/getBrokers'`)
4. Frontend API client functions MUST NOT include timeout wrappers or fallback default values. Let errors propagate naturally to the caller. Do not use patterns like `withTimeout(promise, ms, fallback)` or `.catch(() => defaultValue)` in API functions.
5. Frontend API modules MUST NOT call other backend modules' endpoints. Each API module (e.g., `api/backtesting/`) should only call its corresponding backend module (e.g., `/backtesting/*`). Cross-module orchestration should be done in the page/view layer, not in API client code.

### Example

```ts
// Correct
import { post } from '@/http'

export function getExampleList(params: { page: number; pageSize: number }) {
  return post<ExampleList>('/example/list', params).then(res => res.data)
}

export function getExampleDetail(id: number) {
  return post<ExampleDetail>('/example/detail', { id }).then(res => res.data)
}

// Wrong - DO NOT use get()
import { get } from '@/http'
export function getExampleList() {
  return get<ExampleList>('/example/list').then(res => res.data)  // ❌ Must use post()
}
```

## Route Naming

Since all methods are POST, route names should be descriptive nouns or verb phrases:

- `POST /example/list` instead of `GET /example`
- `POST /example/detail` instead of `GET /example/:id`
- `POST /example/create` instead of `POST /example`
- `POST /example/delete` instead of `DELETE /example/:id`
