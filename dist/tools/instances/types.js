import { z } from "zod";
export const objectSchema = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({
        value: z.string(),
        langTag: z.string().optional(),
        datatypeIri: z.string().optional(),
        typeIri: z.string().optional(),
    }),
]);
export const propertyValueSchema = z.object({
    predicateIri: z.string().describe("IRI of the property or relation"),
    object: objectSchema.describe("Value — plain string/number/boolean, or { value, langTag?, datatypeIri?, typeIri? }"),
});
