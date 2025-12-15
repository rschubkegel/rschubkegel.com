import { defineCollection, z } from "astro:content"

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    tags: z.array(z.string()),
    author: z.string(),
  }),
})

const slides = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    tags: z.array(z.string()),
    author: z.string(),
    /**
     * If `true`, the slide will not be shown on the slides page.
     */
    hidden: z.boolean().optional(),
  }),
})

export const collections = {
  blog,
  slides,
}
