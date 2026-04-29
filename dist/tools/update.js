import { z } from "zod";
// Four distinct operation shapes, discriminated by `kind`.
// The `kind` string values are defined by the OML REST server (e.g. "createNamedInstance").
const namedInstanceOp = z.object({
    kind: z.string().describe("Operation kind, e.g. createNamedInstance or deleteNamedInstance"),
    ontologyIri: z.string().describe("IRI of the ontology that owns the instance"),
    instanceName: z.string().describe("Local name of the named instance within the ontology"),
});
const instanceTypeOp = z.object({
    kind: z.string().describe("Operation kind, e.g. addConceptTypeAssertion or deleteConceptTypeAssertion"),
    ontologyIri: z.string(),
    instanceIri: z.string().describe("IRI of the instance being typed"),
    typeIri: z.string().describe("IRI of the concept type to assert"),
});
const assertionOp = z.object({
    kind: z.string().describe("Operation kind for property/link assertions, e.g. addScalarPropertyValue, deleteScalarPropertyValue, addLinkAssertion, deleteLinkAssertion"),
    ontologyIri: z.string(),
    subjectIri: z.string().describe("IRI of the subject instance"),
    predicateIri: z.string().describe("IRI of the property or relation being asserted"),
    object: z.string().describe("The asserted value or target IRI"),
});
const memberOp = z.object({
    kind: z.string().describe("Operation kind for member-level changes, e.g. deleteMember"),
    ontologyIri: z.string(),
    memberIri: z.string().describe("IRI of the ontology member to operate on"),
    typeIri: z.string().optional().describe("IRI of a classifier/type, required for typing operations"),
});
const operationSchema = z.union([namedInstanceOp, instanceTypeOp, assertionOp, memberOp]);
const updateArgsSchema = z.object({
    operations: z.array(operationSchema).min(1).describe("Ordered list of mutation operations to apply"),
    referencingUri: z.string().optional().describe("URI of the OML file making the change, used for cross-reference resolution"),
});
export function createUpdateToolHandler(restClient) {
    return async ({ operations, referencingUri }) => {
        const body = { operations };
        if (referencingUri)
            body.referencingUri = referencingUri;
        const result = await restClient.update(body);
        if (!result.ok) {
            return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    };
}
