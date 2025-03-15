import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const GetUser = createParamDecorator(
  (attribute: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: Record<PropertyKey, unknown> }>()
    if (attribute) {
      return request.user[attribute]
    }
    return request.user
  },
)
