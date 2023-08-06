import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { getNote } from "~/models/note.server";
import { requireUserId } from "~/session.server";
import converter from "swagger2openapi";
import { parse } from "@stoplight/yaml";
import * as jsf from "json-schema-faker";
// @ts-ignore no typings
import * as mergeAllOf from "@stoplight/json-schema-merge-allof";
import * as faker from "@faker-js/faker";

// necessary as workaround broken types in json-schema-faker
// @ts-ignore
jsf.extend("faker", () => faker);
// @ts-ignore
jsf.extend("date", () => new Date().toISOString());
// @ts-ignore
jsf.extend("datetime", () => new Date().toISOString());

// necessary as workaround broken types in json-schema-faker
// @ts-ignore
jsf.option({
  failOnInvalidTypes: false,
  failOnInvalidFormat: false,
  alwaysFakeOptionals: true,
  optionalsProbability: 1 as any,
  fixedProbabilities: true,
  ignoreMissingRefs: true,
  maxItems: 20,
  maxLength: 100,
});

export async function loader({ params, request }: LoaderArgs) {
  // ------------------------
  const userId = await requireUserId(request);
  invariant(params.noteId, "noteId not found");
  const note = await getNote({ id: params.noteId, userId });
  if (!note) {
    throw new Response("Not Found", { status: 404 });
  }

  const api = await converter.convertObj(parse(note.body), {});
  const apiPathMap = api.openapi.paths;
  const apiPathKeys = Object.keys(apiPathMap);

  console.log(apiPathKeys[0], apiPathMap[apiPathKeys[2]]);
  const allGetApis = Object.values(apiPathMap)
    .filter((api) => !!api && api.get)
    .map((api) => api?.get);

  let currentAPIPath = String(params["*"]);
  if (!currentAPIPath.startsWith("/")) {
    currentAPIPath = "/" + currentAPIPath;
  }
  const currentApi = apiPathMap[currentAPIPath];

  if (!currentApi || !currentApi.get) {
    throw new Response(`API ${currentAPIPath} not exist `, { status: 404 });
  }

  const currentApiGet = currentApi.get;
  const currentApiGetParams = currentApiGet.parameters;
  const currentApiGetResponses = currentApiGet.responses;
  const currentApiGetResponse200 = currentApiGetResponses["200"];

  if ("content" in currentApiGetResponse200) {
    const currentApiGetResponse200Content = currentApiGetResponse200.content;
    const currentApiGetResponse200ContentSchema =
      currentApiGetResponse200Content?.["application/json"].schema;

    const fakerData = jsf.JSONSchemaFaker.generate(
      // @ts-ignore
      currentApiGetResponse200ContentSchema
    );
    console.log("fakerData", fakerData);
  }

  // ------------------------
  return new Response("Hello World", {
    status: 200,
    // headers: {
    //   "Content-Type": "application/pdf",
    // },
  });
}

function withoutAllOf(s: JSONSchema): JSONSchema {
  try {
    return mergeAllOf(s, {
      // `deep` traverses the *whole* schema.  If this becomes a performance
      // problem, see the discussion and alternate implementation at
      // https://github.com/stoplightio/prism/pull/1957/files#r760950082
      deep: true,
      ignoreAdditionalProperties: true,
    });
  } catch {
    // BUG: If the supplied schema is impossible (e.g., contains allOf with
    // mutually exclusive children), we'll end up here.  We'd like to include an
    // IPrismDiagnostic error in the final result with the schema error, but the
    // result of this function is cached as a JSONSchema.
    return s;
  }
}

export async function action({ request, params }: ActionArgs) {
  // If method is post, return created world
  switch (request.method) {
    case "POST": {
      /* handle "POST" */
    }
    case "PUT": {
      /* handle "PUT" */
    }
    case "PATCH": {
      /* handle "PATCH" */
    }
    case "DELETE": {
      /* handle "DELETE" */
    }
  }
}
