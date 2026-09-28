import { NextRequest, NextResponse } from "next/server";

import {
  cmsAuthErrorResponse,
  requireCmsAuth,
  type CmsAuthContext,
} from "@/lib/cms-auth";
import type { CmsRole } from "@/lib/permissions";
import { StageExecutionForbiddenError } from "@/lib/content-pipeline/stage-execution-policy";

/**
 * Wraps a CMS route handler with server-side authz.
 */
export function withCmsAuth(
  requiredRole: CmsRole,
  handler: (request: NextRequest, auth: CmsAuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const auth = await requireCmsAuth(request, requiredRole);
      return await handler(request, auth);
    } catch (error) {
      const authResponse = cmsAuthErrorResponse(error);
      if (authResponse) return authResponse;
      throw error;
    }
  };
}

export function stageExecutionForbiddenResponse(): NextResponse {
  const error = new StageExecutionForbiddenError();
  return NextResponse.json(
    {
      success: false,
      error: error.message,
      code: error.code,
    },
    { status: 403 }
  );
}
