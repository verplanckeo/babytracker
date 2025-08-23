using System.Net;
using HotChocolate.AspNetCore.Serialization;
using HotChocolate.Execution;

namespace BabyTracker.Infra;

//GraphQL doesn't return http error codes by default.
public sealed class StatusCodeHttpResponseFormatter : DefaultHttpResponseFormatter
{
    protected override HttpStatusCode OnDetermineStatusCode(
        IOperationResult result, FormatInfo format, HttpStatusCode? proposed)
    {
        if (result.Errors?.Count > 0)
        {
            var codes = result.Errors.Where(e => e.Code is not null).Select(e => e.Code!).ToHashSet();
            if (codes.Contains("NOT_FOUND"))   return HttpStatusCode.NotFound;    // 404
            if (codes.Contains("BAD_REQUEST")) return HttpStatusCode.BadRequest;  // 400
            if (codes.Contains("FORBIDDEN"))   return HttpStatusCode.Forbidden;   // 403
            if (codes.Contains("UNAUTHENTICATED")) return HttpStatusCode.Unauthorized; // 401
        }
        return base.OnDetermineStatusCode(result, format, proposed);
    }
}