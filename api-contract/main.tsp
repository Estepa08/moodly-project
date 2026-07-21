import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "./models.tsp";
import "./routes.tsp";

using TypeSpec.Http;

@service(#{
  title: "Mental Health Tracker API"
})
@useAuth(BearerAuth)
namespace MentalHealthTracker;
